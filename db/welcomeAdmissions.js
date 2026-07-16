const { dbRun, dbGet, dbAll } = require('./core');

// ENFORCED remains blocking until Telegram delivers a leave/rejoin transition;
// this also covers user messages that were already queued before the kick completed.
const ACTIVE_STATES = ['CREATING', 'PENDING', 'ENFORCING', 'ENFORCEMENT_FAILED', 'ENFORCED'];
const RECOVERABLE_STATES = ['CREATING', 'PENDING', 'ENFORCING', 'ENFORCEMENT_FAILED'];

function parseJson(value, fallback = null) {
    if (!value) return fallback;
    try { return JSON.parse(value); } catch (_) { return fallback; }
}

function hydrate(row) {
    if (!row) return null;
    return {
        ...row,
        member: parseJson(row.memberJson, {}),
        sourceMessage: parseJson(row.sourceMessageJson, null),
        settings: parseJson(row.settingsJson, {})
    };
}

async function createWelcomeAdmission(input) {
    const now = Date.now();
    const params = [
        String(input.chatId), String(input.userId), input.generation, input.joinUpdateId,
        JSON.stringify(input.member || {}), JSON.stringify(input.sourceMessage || null),
        JSON.stringify(input.settings || {}), now, now
    ];
    await dbRun(`INSERT INTO welcome_admissions (
        chatId, userId, generation, state, joinUpdateId, memberJson,
        sourceMessageJson, settingsJson, createdAt, updatedAt
    ) VALUES (?, ?, ?, 'CREATING', ?, ?, ?, ?, ?, ?)
    ON CONFLICT(chatId, userId) DO UPDATE SET
        generation = excluded.generation,
        state = 'CREATING', token = NULL, correctIndex = NULL, attempts = 0,
        maxAttempts = NULL, expiresAt = NULL, action = NULL, lang = NULL,
        displayName = NULL, challengeMessageId = NULL,
        joinUpdateId = excluded.joinUpdateId, violationUpdateId = NULL,
        violationMessageId = NULL, enforcementLeaseUntil = NULL,
        memberJson = excluded.memberJson, sourceMessageJson = excluded.sourceMessageJson,
        settingsJson = excluded.settingsJson, lastError = NULL,
        createdAt = excluded.createdAt, updatedAt = excluded.updatedAt
    WHERE welcome_admissions.state NOT IN ('CREATING', 'PENDING', 'ENFORCING', 'ENFORCEMENT_FAILED', 'ENFORCED')
      AND (welcome_admissions.joinUpdateId IS NULL
       OR excluded.joinUpdateId IS NULL
       OR welcome_admissions.joinUpdateId != excluded.joinUpdateId)`, params);
    return hydrate(await dbGet(
        `SELECT * FROM welcome_admissions WHERE chatId = ? AND userId = ?`,
        [String(input.chatId), String(input.userId)]
    ));
}

async function getActiveWelcomeAdmission(chatId, userId) {
    const placeholders = ACTIVE_STATES.map(() => '?').join(',');
    return hydrate(await dbGet(
        `SELECT * FROM welcome_admissions WHERE chatId = ? AND userId = ? AND state IN (${placeholders})`,
        [String(chatId), String(userId), ...ACTIVE_STATES]
    ));
}

async function getWelcomeAdmissionByToken(token) {
    return hydrate(await dbGet(`SELECT * FROM welcome_admissions WHERE token = ?`, [token]));
}

async function markWelcomeAdmissionPending(input) {
    const now = Date.now();
    const result = await dbRun(`UPDATE welcome_admissions SET
        state = 'PENDING', token = ?, correctIndex = ?, attempts = 0,
        maxAttempts = ?, expiresAt = ?, action = ?, lang = ?, displayName = ?,
        challengeMessageId = ?, updatedAt = ?
        WHERE chatId = ? AND userId = ? AND generation = ? AND state = 'CREATING'`, [
        input.token, Number(input.correctIndex), Number(input.maxAttempts), Number(input.expiresAt),
        input.action || 'kick', input.lang || 'en', input.displayName || 'member',
        input.challengeMessageId || null, now, String(input.chatId), String(input.userId), input.generation
    ]);
    if (!result.changes) return null;
    return getWelcomeAdmissionByToken(input.token);
}

async function markWelcomeAdmissionLeft({ chatId, userId }) {
    await dbRun(`UPDATE welcome_admissions SET state = 'LEFT', updatedAt = ?
        WHERE chatId = ? AND userId = ? AND state NOT IN ('LEFT', 'VERIFIED')`,
    [Date.now(), String(chatId), String(userId)]);
    return hydrate(await dbGet(`SELECT * FROM welcome_admissions WHERE chatId = ? AND userId = ?`,
        [String(chatId), String(userId)]));
}

async function isWelcomeUpdateProcessed(updateId) {
    if (updateId === null || updateId === undefined) return false;
    return Boolean(await dbGet(`SELECT updateId FROM welcome_processed_updates WHERE updateId = ?`, [String(updateId)]));
}

async function claimWelcomeViolation({ chatId, userId, generation, updateId, messageId }) {
    const now = Date.now();
    const result = await dbRun(`UPDATE welcome_admissions SET state = 'ENFORCING',
        violationUpdateId = ?, violationMessageId = ?, enforcementLeaseUntil = ?, updatedAt = ?
        WHERE chatId = ? AND userId = ? AND generation = ?
          AND (state IN ('CREATING', 'PENDING', 'ENFORCEMENT_FAILED')
            OR (state = 'ENFORCING' AND COALESCE(enforcementLeaseUntil, 0) <= ?))`,
    [updateId === undefined ? null : String(updateId), messageId || null, now + 60000, now,
        String(chatId), String(userId), generation, now]);
    if (!result.changes) {
        return {
            claimed: false,
            duplicate: updateId !== null && updateId !== undefined
                ? await isWelcomeUpdateProcessed(updateId)
                : false
        };
    }
    if (updateId !== null && updateId !== undefined) {
        await dbRun(`INSERT OR IGNORE INTO welcome_processed_updates
            (updateId, kind, chatId, userId, createdAt) VALUES (?, 'violation', ?, ?, ?)`,
        [String(updateId), String(chatId), String(userId), now]);
    }
    return { claimed: true, duplicate: false };
}

async function finishWelcomeEnforcement({ chatId, userId, generation, error }) {
    const result = await dbRun(`UPDATE welcome_admissions SET state = ?, lastError = ?,
        enforcementLeaseUntil = NULL, updatedAt = ?
        WHERE chatId = ? AND userId = ? AND generation = ? AND state = 'ENFORCING'`,
    [error ? 'ENFORCEMENT_FAILED' : 'ENFORCED', error || null, Date.now(),
        String(chatId), String(userId), generation]);
    return result.changes === 1;
}

async function verifyWelcomeAdmissionByToken(token, userId) {
    const result = await dbRun(`UPDATE welcome_admissions SET state = 'VERIFIED', updatedAt = ?
        WHERE token = ? AND userId = ? AND state = 'PENDING'`, [Date.now(), token, String(userId)]);
    if (!result.changes) return null;
    return getWelcomeAdmissionByToken(token);
}

async function incrementWelcomeAttempts(token, userId) {
    const result = await dbRun(`UPDATE welcome_admissions SET attempts = attempts + 1, updatedAt = ?
        WHERE token = ? AND userId = ? AND state = 'PENDING'`, [Date.now(), token, String(userId)]);
    if (!result.changes) return null;
    return getWelcomeAdmissionByToken(token);
}

async function claimWelcomeEnforcementByToken(token, reason = 'timeout') {
    const now = Date.now();
    const result = await dbRun(`UPDATE welcome_admissions SET state = 'ENFORCING',
        lastError = ?, enforcementLeaseUntil = ?, updatedAt = ?
        WHERE token = ? AND (
            state IN ('CREATING', 'PENDING', 'ENFORCEMENT_FAILED')
            OR (state = 'ENFORCING' AND COALESCE(enforcementLeaseUntil, 0) <= ?)
        )`,
    [reason, now + 60000, now, token, now]);
    if (!result.changes) return null;
    return getWelcomeAdmissionByToken(token);
}

async function listRecoverableWelcomeAdmissions() {
    const placeholders = RECOVERABLE_STATES.map(() => '?').join(',');
    return (await dbAll(`SELECT * FROM welcome_admissions WHERE state IN (${placeholders}) ORDER BY createdAt`,
        RECOVERABLE_STATES)).map(hydrate);
}

async function deleteOldWelcomeProcessedUpdates(beforeTimestamp) {
    const result = await dbRun(`DELETE FROM welcome_processed_updates WHERE createdAt < ?`, [beforeTimestamp]);
    return result.changes || 0;
}

module.exports = {
    createWelcomeAdmission,
    getActiveWelcomeAdmission,
    getWelcomeAdmissionByToken,
    markWelcomeAdmissionPending,
    markWelcomeAdmissionLeft,
    isWelcomeUpdateProcessed,
    claimWelcomeViolation,
    finishWelcomeEnforcement,
    verifyWelcomeAdmissionByToken,
    incrementWelcomeAttempts,
    claimWelcomeEnforcementByToken,
    listRecoverableWelcomeAdmissions,
    deleteOldWelcomeProcessedUpdates
};
