const sqlite3 = require('sqlite3').verbose();

const mockDb = new sqlite3.Database(':memory:');
const mockDbRun = (sql, params = []) => new Promise((resolve, reject) => {
    mockDb.run(sql, params, function onRun(error) {
        if (error) reject(error);
        else resolve(this);
    });
});
const mockDbGet = (sql, params = []) => new Promise((resolve, reject) => {
    mockDb.get(sql, params, (error, row) => error ? reject(error) : resolve(row));
});
const mockDbAll = (sql, params = []) => new Promise((resolve, reject) => {
    mockDb.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
});

jest.mock('../db/core', () => ({
    db: mockDb,
    dbRun: mockDbRun,
    dbGet: mockDbGet,
    dbAll: mockDbAll
}));

const repository = require('../db/welcomeAdmissions');

beforeAll(async () => {
    await mockDbRun(`CREATE TABLE welcome_admissions (
        chatId TEXT NOT NULL,
        userId TEXT NOT NULL,
        generation TEXT NOT NULL,
        state TEXT NOT NULL,
        token TEXT,
        correctIndex INTEGER,
        attempts INTEGER DEFAULT 0,
        maxAttempts INTEGER,
        expiresAt INTEGER,
        action TEXT,
        lang TEXT,
        displayName TEXT,
        challengeMessageId INTEGER,
        joinUpdateId TEXT,
        violationUpdateId TEXT,
        violationMessageId INTEGER,
        memberJson TEXT DEFAULT '{}',
        sourceMessageJson TEXT,
        settingsJson TEXT DEFAULT '{}',
        lastError TEXT,
        enforcementLeaseUntil INTEGER,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        PRIMARY KEY (chatId, userId)
    )`);
    await mockDbRun(`CREATE UNIQUE INDEX idx_welcome_admissions_token
        ON welcome_admissions(token) WHERE token IS NOT NULL`);
    await mockDbRun(`CREATE TABLE welcome_processed_updates (
        updateId TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        chatId TEXT,
        userId TEXT,
        createdAt INTEGER NOT NULL
    )`);
});

beforeEach(async () => {
    await mockDbRun('DELETE FROM welcome_processed_updates');
    await mockDbRun('DELETE FROM welcome_admissions');
});

afterAll((done) => {
    mockDb.close(done);
});

async function createPending({ generation = 'g1', token = 'tok1', joinUpdateId = 'join-1' } = {}) {
    await repository.createWelcomeAdmission({
        chatId: '-1001',
        userId: '42',
        generation,
        joinUpdateId,
        member: { id: 42, first_name: 'Member' },
        sourceMessage: { message_id: 9 },
        settings: { enabled: true, mode: 'reactive' }
    });
    return repository.markWelcomeAdmissionPending({
        chatId: '-1001',
        userId: '42',
        generation,
        token,
        correctIndex: 2,
        maxAttempts: 3,
        expiresAt: Date.now() + 60_000,
        action: 'kick',
        lang: 'en',
        displayName: 'Member',
        challengeMessageId: 10
    });
}

describe('persistent Reactive welcome admission repository', () => {
    test('keeps an active generation when a duplicate join arrives', async () => {
        await createPending();

        const duplicate = await repository.createWelcomeAdmission({
            chatId: '-1001',
            userId: '42',
            generation: 'g2',
            joinUpdateId: 'join-2',
            member: { id: 42 },
            settings: { enabled: true, mode: 'reactive' }
        });

        expect(duplicate.generation).toBe('g1');
        expect(duplicate.state).toBe('PENDING');
        expect(duplicate.token).toBe('tok1');
    });

    test('correct answer and violation have exactly one durable winner', async () => {
        await createPending();

        const [verified, violation] = await Promise.all([
            repository.verifyWelcomeAdmissionByToken('tok1', '42'),
            repository.claimWelcomeViolation({
                chatId: '-1001', userId: '42', generation: 'g1', updateId: 'update-1', messageId: 11
            })
        ]);
        const row = await repository.getWelcomeAdmissionByToken('tok1');

        expect(['VERIFIED', 'ENFORCING']).toContain(row.state);
        expect(Boolean(verified) + Boolean(violation.claimed)).toBe(1);
    });

    test('a duplicate violating update cannot claim enforcement twice', async () => {
        await createPending();
        const input = {
            chatId: '-1001', userId: '42', generation: 'g1', updateId: 'update-2', messageId: 12
        };

        const first = await repository.claimWelcomeViolation(input);
        const second = await repository.claimWelcomeViolation(input);

        expect(first).toEqual({ claimed: true, duplicate: false });
        expect(second).toEqual({ claimed: false, duplicate: true });
        expect(await repository.isWelcomeUpdateProcessed('update-2')).toBe(true);
    });

    test('failed enforcement is recoverable under a fresh lease', async () => {
        await createPending();
        await repository.claimWelcomeViolation({
            chatId: '-1001', userId: '42', generation: 'g1', updateId: 'update-3', messageId: 13
        });
        await repository.finishWelcomeEnforcement({
            chatId: '-1001', userId: '42', generation: 'g1', error: 'temporary Telegram failure'
        });

        const retry = await repository.claimWelcomeViolation({
            chatId: '-1001', userId: '42', generation: 'g1', updateId: 'update-3', messageId: 13
        });
        const row = await repository.getWelcomeAdmissionByToken('tok1');

        expect(retry.claimed).toBe(true);
        expect(row.state).toBe('ENFORCING');
        expect(row.enforcementLeaseUntil).toBeGreaterThan(Date.now());
    });

    test('an expired ENFORCING lease can be reclaimed after restart', async () => {
        await createPending();
        await repository.claimWelcomeViolation({
            chatId: '-1001', userId: '42', generation: 'g1', updateId: 'update-crash', messageId: 14
        });
        await mockDbRun(`UPDATE welcome_admissions SET enforcementLeaseUntil = ?
            WHERE chatId = ? AND userId = ?`, [Date.now() - 1, '-1001', '42']);

        const retry = await repository.claimWelcomeViolation({
            chatId: '-1001', userId: '42', generation: 'g1', updateId: 'update-crash', messageId: 14
        });

        expect(retry.claimed).toBe(true);
        expect((await repository.getWelcomeAdmissionByToken('tok1')).state).toBe('ENFORCING');
    });

    test('leave then rejoin creates a fresh generation and token', async () => {
        await createPending({ generation: 'g1', token: 'tok1', joinUpdateId: 'join-1' });
        await repository.markWelcomeAdmissionLeft({ chatId: '-1001', userId: '42' });

        const creating = await repository.createWelcomeAdmission({
            chatId: '-1001',
            userId: '42',
            generation: 'g2',
            joinUpdateId: 'join-2',
            member: { id: 42, first_name: 'Member' },
            settings: { enabled: true, mode: 'reactive' }
        });
        const pending = await repository.markWelcomeAdmissionPending({
            chatId: '-1001', userId: '42', generation: 'g2', token: 'tok2',
            correctIndex: 1, maxAttempts: 3, expiresAt: Date.now() + 60_000,
            action: 'kick', lang: 'en', displayName: 'Member', challengeMessageId: 20
        });

        expect(creating).toMatchObject({ generation: 'g2', state: 'CREATING', token: null });
        expect(pending).toMatchObject({ generation: 'g2', state: 'PENDING', token: 'tok2' });
        expect(await repository.getWelcomeAdmissionByToken('tok1')).toBeNull();
    });

    test('an enforced generation stays active until leave, then rejoin replaces it', async () => {
        await createPending({ generation: 'g1', token: 'tok1', joinUpdateId: 'join-1' });
        await repository.claimWelcomeViolation({
            chatId: '-1001', userId: '42', generation: 'g1', updateId: 'violation-1', messageId: 21
        });
        await repository.finishWelcomeEnforcement({
            chatId: '-1001', userId: '42', generation: 'g1', error: null
        });

        const duplicateJoin = await repository.createWelcomeAdmission({
            chatId: '-1001', userId: '42', generation: 'g2', joinUpdateId: 'join-2',
            member: { id: 42 }, settings: { enabled: true, mode: 'reactive' }
        });
        expect(duplicateJoin).toMatchObject({ generation: 'g1', state: 'ENFORCED' });

        await repository.markWelcomeAdmissionLeft({ chatId: '-1001', userId: '42' });
        await mockDbRun(`UPDATE welcome_admissions SET violationMessageId = ?, enforcementLeaseUntil = ?
            WHERE chatId = ? AND userId = ?`, [21, Date.now() + 60_000, '-1001', '42']);
        const rejoinStartedAt = Date.now();
        const rejoin = await repository.createWelcomeAdmission({
            chatId: '-1001', userId: '42', generation: 'g3', joinUpdateId: 'join-3',
            member: { id: 42 }, settings: { enabled: true, mode: 'reactive' }
        });
        expect(rejoin).toMatchObject({
            generation: 'g3', state: 'CREATING', token: null,
            violationUpdateId: null, violationMessageId: null, enforcementLeaseUntil: null
        });
        expect(rejoin.createdAt).toBeGreaterThanOrEqual(rejoinStartedAt);
    });
});
