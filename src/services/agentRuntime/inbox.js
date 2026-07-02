/**
 * Agent Runtime inbox for inbound OKX.AI/A2A envelopes and decisions.
 */
const logger = require('../../core/logger');

const log = logger.child('AgentRuntime:Inbox');
let initialized = false;

async function initDb() {
    if (initialized) return;
    const { dbRun } = require('../../../db/core');
    await dbRun(`CREATE TABLE IF NOT EXISTS agent_runtime_inbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        jobId TEXT,
        taskId TEXT,
        msgType TEXT,
        event TEXT,
        senderRole TEXT,
        status TEXT DEFAULT 'unread',
        requiresDecision INTEGER DEFAULT 0,
        payload TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    )`);
    initialized = true;
}

function inferDecision(envelope = {}) {
    const event = envelope.event || envelope.message?.event || envelope.payload?.event;
    const msgType = envelope.msgType || envelope.message?.source;
    return Boolean(
        envelope.requiresDecision
        || envelope.decision
        || envelope.decisionRequest
        || msgType === 'decision_request'
        || ['decision_request', 'payment_required', 'delivery_requested', 'acceptance_required', 'approval_required'].includes(event)
    );
}

async function saveEnvelope(envelope = {}, { userId = null, status = 'unread' } = {}) {
    await initDb();
    const { dbRun } = require('../../../db/core');
    const jobId = envelope.jobId || envelope.taskId || envelope.message?.jobId || null;
    const taskId = envelope.taskId || envelope.jobId || envelope.message?.taskId || null;
    const msgType = envelope.msgType || envelope.message?.source || null;
    const event = envelope.event || envelope.message?.event || envelope.payload?.event || null;
    const senderRole = envelope.sender?.role || envelope.message?.sender?.role || null;
    const requiresDecision = inferDecision(envelope) ? 1 : 0;

    const result = await dbRun(`INSERT INTO agent_runtime_inbox
        (userId, jobId, taskId, msgType, event, senderRole, status, requiresDecision, payload, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
        userId ? String(userId) : null,
        jobId,
        taskId,
        msgType,
        event,
        senderRole,
        status,
        requiresDecision,
        JSON.stringify(envelope)
    ]);

    log.info(`Inbound envelope saved: ${event || msgType || 'unknown'} ${taskId || jobId || ''}`);
    return {
        id: result?.lastID,
        userId,
        jobId,
        taskId,
        msgType,
        event,
        senderRole,
        status,
        requiresDecision: Boolean(requiresDecision),
        payload: envelope
    };
}

async function listInbox({ userId = null, status = null, decisionsOnly = false, limit = 100 } = {}) {
    await initDb();
    const { dbAll } = require('../../../db/core');
    const clauses = [];
    const values = [];

    if (userId) {
        clauses.push('userId = ?');
        values.push(String(userId));
    }
    if (status) {
        clauses.push('status = ?');
        values.push(status);
    }
    if (decisionsOnly) {
        clauses.push('requiresDecision = 1');
    }

    values.push(Math.max(1, Math.min(Number(limit) || 100, 500)));
    const rows = await dbAll(`SELECT * FROM agent_runtime_inbox
        ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
        ORDER BY id DESC LIMIT ?`, values);

    return rows.map(row => ({
        ...row,
        requiresDecision: Boolean(row.requiresDecision),
        payload: row.payload ? JSON.parse(row.payload) : {}
    }));
}

async function updateInboxStatus(id, status = 'read') {
    await initDb();
    const { dbRun } = require('../../../db/core');
    await dbRun('UPDATE agent_runtime_inbox SET status = ?, updatedAt = datetime(\'now\') WHERE id = ?', [status, id]);
    return { id, status };
}

async function listDecisions(options = {}) {
    return listInbox({ ...options, decisionsOnly: true, status: options.status || 'unread' });
}

module.exports = {
    initDb,
    inferDecision,
    saveEnvelope,
    listInbox,
    listDecisions,
    updateInboxStatus
};