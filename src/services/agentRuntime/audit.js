/**
 * Agent Runtime audit log.
 *
 * Stores bridge/runtime actions without exposing raw API keys or secrets.
 */
const logger = require('../../core/logger');

const log = logger.child('AgentRuntime:Audit');
let initialized = false;

async function initDb() {
    if (initialized) return;
    const { dbRun } = require('../../../db/core');
    await dbRun(`CREATE TABLE IF NOT EXISTS agent_runtime_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        action TEXT,
        provider TEXT,
        model TEXT,
        status TEXT,
        metadata TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
    )`);
    initialized = true;
}

function redact(value) {
    if (value === null || value === undefined) return value;
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    return text
        .replace(/(sk-[A-Za-z0-9_-]{8,})/g, 'sk-***')
        .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1***')
        .replace(/("apiKey"\s*:\s*")[^"]+"/gi, '$1***"')
        .slice(0, 20000);
}

async function recordAudit(entry = {}) {
    await initDb();
    const { dbRun } = require('../../../db/core');
    const metadata = entry.metadata ? JSON.parse(redact(entry.metadata)) : {};
    await dbRun(`INSERT INTO agent_runtime_audit
        (userId, action, provider, model, status, metadata)
        VALUES (?, ?, ?, ?, ?, ?)`,
    [
        entry.userId || null,
        entry.action || 'unknown',
        entry.provider || null,
        entry.model || null,
        entry.status || 'ok',
        JSON.stringify(metadata)
    ]);
    log.debug(`${entry.action || 'unknown'} ${entry.status || 'ok'}`);
}

async function listAudit({ userId = null, limit = 100 } = {}) {
    await initDb();
    const { dbAll } = require('../../../db/core');
    const cappedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    const rows = userId
        ? await dbAll('SELECT * FROM agent_runtime_audit WHERE userId = ? ORDER BY id DESC LIMIT ?', [String(userId), cappedLimit])
        : await dbAll('SELECT * FROM agent_runtime_audit ORDER BY id DESC LIMIT ?', [cappedLimit]);
    return rows.map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }));
}

module.exports = {
    recordAudit,
    listAudit,
    redact
};