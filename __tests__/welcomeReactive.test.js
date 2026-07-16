const { createWelcomeReactiveController } = require('../src/features/welcomeReactive');
const { hasWelcomeBotPermissions } = require('../src/bot/handlers/welcomeAdminCallbacks');

function createAtomicRepository() {
    const rows = new Map();
    const byToken = new Map();
    const calls = [];
    const key = (chatId, userId) => `${chatId}:${userId}`;
    return {
        calls,
        rows,
        async createWelcomeAdmission(input) {
            calls.push(['create', input.userId]);
            const row = { ...input, state: 'CREATING' };
            rows.set(key(input.chatId, input.userId), row);
            return row;
        },
        async markWelcomeAdmissionLeft({ chatId, userId }) {
            calls.push(['left', userId]);
            const row = rows.get(key(chatId, userId));
            if (row) row.state = 'LEFT';
            return row || null;
        },
        async getActiveWelcomeAdmission(chatId, userId) {
            const row = rows.get(key(chatId, userId));
            return row && ['CREATING', 'PENDING', 'ENFORCING', 'ENFORCEMENT_FAILED', 'ENFORCED'].includes(row.state)
                ? { ...row }
                : null;
        },
        async isWelcomeUpdateProcessed(updateId) {
            return calls.some((call) => call[0] === 'processed' && call[1] === updateId);
        },
        async claimWelcomeViolation({ chatId, userId, updateId }) {
            const row = rows.get(key(chatId, userId));
            if (!row || !['CREATING', 'PENDING'].includes(row.state)) {
                return { claimed: false, duplicate: await this.isWelcomeUpdateProcessed(updateId) };
            }
            row.state = 'ENFORCING';
            calls.push(['claim-violation', userId]);
            if (updateId) calls.push(['processed', updateId]);
            return { claimed: true, row: { ...row } };
        },
        async finishWelcomeEnforcement({ chatId, userId, generation, error }) {
            const row = rows.get(key(chatId, userId));
            if (row && row.generation === generation && row.state === 'ENFORCING') {
                row.state = error ? 'ENFORCEMENT_FAILED' : 'ENFORCED';
            }
        },
        async verifyWelcomeAdmissionByToken(token, userId) {
            const row = byToken.get(token);
            if (!row || row.userId !== String(userId) || !['CREATING', 'PENDING'].includes(row.state)) return null;
            row.state = 'VERIFIED';
            return { ...row };
        },
        async listRecoverableWelcomeAdmissions() {
            return Array.from(rows.values()).filter((row) => ['CREATING', 'PENDING', 'ENFORCING', 'ENFORCEMENT_FAILED'].includes(row.state));
        },
        addPending(row) {
            const value = { state: 'PENDING', ...row };
            rows.set(key(value.chatId, value.userId), value);
            if (value.token) byToken.set(value.token, value);
            return value;
        }
    };
}

function groupMessage(overrides = {}) {
    return {
        message_id: 10,
        chat: { id: -1001, type: 'supergroup' },
        from: { id: 42, is_bot: false },
        ...overrides
    };
}

function createBot() {
    return {
        deleteMessage: jest.fn().mockResolvedValue(true),
        banChatMember: jest.fn().mockResolvedValue(true),
        unbanChatMember: jest.fn().mockResolvedValue(true)
    };
}

describe('Reactive welcome ingress', () => {
    test('enabling Reactive verification requires delete and restrict permissions', () => {
        expect(hasWelcomeBotPermissions({
            status: 'administrator',
            can_delete_messages: true,
            can_restrict_members: true
        })).toBe(true);
        expect(hasWelcomeBotPermissions({
            status: 'administrator',
            can_delete_messages: false,
            can_restrict_members: true
        })).toBe(false);
        expect(hasWelcomeBotPermissions({ status: 'member' })).toBe(false);
    });

    test('persists CREATING before dispatching a join update', async () => {
        const repository = createAtomicRepository();
        const order = [];
        const controller = createWelcomeReactiveController({
            repository,
            bot: {},
            getSettings: async () => ({ enabled: true }),
            createGeneration: () => 'gen-1',
            onAdmissionsCreated: async () => order.push('enqueue')
        });
        const original = jest.fn(() => order.push('dispatch'));
        repository.calls.push = (...args) => {
            order.push('persist');
            return Array.prototype.push.apply(repository.calls, args);
        };

        await controller.processUpdate({
            update_id: 100,
            message: groupMessage({ new_chat_members: [{ id: 77, first_name: 'New', is_bot: false }] })
        }, original);

        expect(order).toEqual(['persist', 'enqueue', 'dispatch']);
        expect(repository.rows.get('-1001:77').state).toBe('CREATING');
    });

    test('serializes a join before the next update from the same polling batch', async () => {
        const repository = createAtomicRepository();
        const originalCreate = repository.createWelcomeAdmission;
        repository.createWelcomeAdmission = async (input) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return originalCreate(input);
        };
        const bot = createBot();
        const controller = createWelcomeReactiveController({
            repository,
            bot,
            getSettings: async () => ({ enabled: true, mode: 'reactive' }),
            createGeneration: () => 'g-serial'
        });
        const join = controller.processUpdate({
            update_id: 901,
            message: {
                message_id: 90,
                chat: { id: -1001, type: 'supergroup' },
                from: { id: 7, is_bot: false },
                new_chat_members: [{ id: 77, is_bot: false, first_name: 'New' }]
            }
        }, jest.fn());
        const dispatch = jest.fn();
        const violation = controller.processUpdate({
            update_id: 902,
            message: {
                message_id: 91,
                chat: { id: -1001, type: 'supergroup' },
                from: { id: 77, is_bot: false },
                text: 'too soon'
            }
        }, dispatch);

        await Promise.all([join, violation]);

        expect(repository.rows.get('-1001:77').state).toBe('ENFORCED');
        expect(dispatch).not.toHaveBeenCalled();
    });

    test('chat_member leave terminates admission before dispatch', async () => {
        const repository = createAtomicRepository();
        repository.addPending({ chatId: '-1001', userId: '42', generation: 'g', token: 't' });
        const controller = createWelcomeReactiveController({
            repository,
            bot: {},
            getSettings: async () => ({ enabled: true, mode: 'reactive' })
        });
        const dispatch = jest.fn();

        await controller.processUpdate({
            update_id: 105,
            chat_member: {
                chat: { id: -1001, type: 'supergroup' },
                new_chat_member: { status: 'left', user: { id: 42, is_bot: false } }
            }
        }, dispatch);

        expect(repository.rows.get('-1001:42').state).toBe('LEFT');
        expect(dispatch).toHaveBeenCalledTimes(1);
    });

    test('non-reactive mode does not persist admission', async () => {
        const repository = createAtomicRepository();
        const controller = createWelcomeReactiveController({
            repository,
            bot: {},
            getSettings: async () => ({ enabled: true, mode: 'strict' })
        });

        await controller.processUpdate({
            update_id: 106,
            message: groupMessage({ new_chat_members: [{ id: 77, first_name: 'New', is_bot: false }] })
        }, jest.fn());

        expect(repository.rows.size).toBe(0);
    });

    test.each([
        ['text', { text: 'hello' }],
        ['command', { text: '/help' }],
        ['media', { photo: [{ file_id: 'p' }] }],
        ['caption', { video: { file_id: 'v' }, caption: 'hi' }],
        ['sticker', { sticker: { file_id: 's' } }],
        ['edited message', { text: 'edited' }],
        ['forum thread service message', { forum_topic_created: { name: 'topic' } }]
    ])('blocks %s before Telegram dispatch', async (name, payload) => {
        const repository = createAtomicRepository();
        repository.addPending({ chatId: '-1001', userId: '42', generation: 'g', token: 't' });
        const bot = {
            deleteMessage: jest.fn().mockResolvedValue(true),
            banChatMember: jest.fn().mockResolvedValue(true),
            unbanChatMember: jest.fn().mockResolvedValue(true)
        };
        const controller = createWelcomeReactiveController({ repository, bot, getSettings: async () => ({ enabled: true }) });
        const original = jest.fn();
        const updateKey = name === 'edited message' ? 'edited_message' : 'message';

        await controller.processUpdate({ update_id: 101, [updateKey]: groupMessage(payload) }, original);

        expect(original).not.toHaveBeenCalled();
        expect(bot.deleteMessage).toHaveBeenCalledWith(-1001, 10);
        expect(bot.banChatMember).toHaveBeenCalledTimes(1);
        expect(bot.unbanChatMember).toHaveBeenCalledTimes(1);
    });

    test('correct answer and violation race has exactly one terminal winner', async () => {
        const repository = createAtomicRepository();
        repository.addPending({ chatId: '-1001', userId: '42', generation: 'g', token: 'tok' });
        const bot = {
            deleteMessage: jest.fn().mockResolvedValue(true),
            banChatMember: jest.fn().mockResolvedValue(true),
            unbanChatMember: jest.fn().mockResolvedValue(true)
        };
        const controller = createWelcomeReactiveController({ repository, bot, getSettings: async () => ({ enabled: true }) });

        const [verified, blocked] = await Promise.all([
            controller.verifyByToken('tok', '42'),
            controller.processUpdate({ update_id: 102, message: groupMessage({ text: 'race' }) }, jest.fn())
        ]);

        const state = repository.rows.get('-1001:42').state;
        expect(['VERIFIED', 'ENFORCED']).toContain(state);
        expect(Boolean(verified) + Boolean(blocked)).toBeGreaterThanOrEqual(1);
        expect(bot.banChatMember.mock.calls.length).toBe(state === 'ENFORCED' ? 1 : 0);
    });

    test('duplicate violating update is idempotent', async () => {
        const repository = createAtomicRepository();
        repository.addPending({ chatId: '-1001', userId: '42', generation: 'g', token: 't' });
        const bot = {
            deleteMessage: jest.fn().mockResolvedValue(true),
            banChatMember: jest.fn().mockResolvedValue(true),
            unbanChatMember: jest.fn().mockResolvedValue(true)
        };
        const controller = createWelcomeReactiveController({ repository, bot, getSettings: async () => ({ enabled: true }) });
        const update = { update_id: 103, message: groupMessage({ text: 'duplicate' }) };

        await controller.processUpdate(update, jest.fn());
        await controller.processUpdate(update, jest.fn());

        expect(bot.banChatMember).toHaveBeenCalledTimes(1);
        expect(bot.unbanChatMember).toHaveBeenCalledTimes(1);
    });

    test('blocks a later queued update after enforcement without kicking twice', async () => {
        const repository = createAtomicRepository();
        repository.addPending({ chatId: '-1001', userId: '42', generation: 'g', token: 't' });
        const bot = createBot();
        const controller = createWelcomeReactiveController({ repository, bot, getSettings: async () => ({ enabled: true }) });
        const firstDispatch = jest.fn();
        const secondDispatch = jest.fn();

        await controller.processUpdate({ update_id: 201, message: groupMessage({ message_id: 20, text: 'first' }) }, firstDispatch);
        await controller.processUpdate({ update_id: 202, message: groupMessage({ message_id: 21, text: 'queued' }) }, secondDispatch);

        expect(firstDispatch).not.toHaveBeenCalled();
        expect(secondDispatch).not.toHaveBeenCalled();
        expect(bot.deleteMessage).toHaveBeenNthCalledWith(1, -1001, 20);
        expect(bot.deleteMessage).toHaveBeenNthCalledWith(2, -1001, 21);
        expect(bot.banChatMember).toHaveBeenCalledTimes(1);
        expect(bot.unbanChatMember).toHaveBeenCalledTimes(1);
    });

    test('restart recovery exposes all non-terminal admissions', async () => {
        const repository = createAtomicRepository();
        repository.addPending({ chatId: '-1001', userId: '42', generation: 'g1', token: 't1' });
        await repository.createWelcomeAdmission({ chatId: '-1001', userId: '43', generation: 'g2' });
        const recovered = [];
        const controller = createWelcomeReactiveController({ repository, bot: {}, getSettings: async () => ({ enabled: true }) });

        await controller.recover((row) => recovered.push(`${row.userId}:${row.state}`));

        expect(recovered.sort()).toEqual(['42:PENDING', '43:CREATING']);
    });

    test('delete failure still kicks and enforcement failure is recorded', async () => {
        const repository = createAtomicRepository();
        repository.addPending({ chatId: '-1001', userId: '42', generation: 'g', token: 't' });
        const bot = {
            deleteMessage: jest.fn().mockRejectedValue(new Error('no delete permission')),
            banChatMember: jest.fn().mockResolvedValue(true),
            unbanChatMember: jest.fn().mockRejectedValue(new Error('no unban permission'))
        };
        const controller = createWelcomeReactiveController({ repository, bot, getSettings: async () => ({ enabled: true }) });

        await controller.processUpdate({ update_id: 104, message: groupMessage({ text: 'violation' }) }, jest.fn());

        expect(bot.banChatMember).toHaveBeenCalledTimes(1);
        expect(bot.unbanChatMember).toHaveBeenCalledTimes(1);
        expect(repository.rows.get('-1001:42').state).toBe('ENFORCEMENT_FAILED');
    });
});
