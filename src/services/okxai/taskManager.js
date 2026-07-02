/**
 * High-level OKX.AI Task Manager for xBot.
 *
 * Combines local task persistence with the endpoint-configurable A2A client.
 */
const a2a = require('./a2a');
const logger = require('../../core/logger');

const log = logger.child('OKXAI:TaskManager');
let initialized = false;

async function initDb() {
    if (initialized) return;
    const { dbRun } = require('../../../db/core');
    await dbRun(`CREATE TABLE IF NOT EXISTS okxai_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        localUserId TEXT,
        taskId TEXT UNIQUE,
        jobId TEXT,
        aspAgentId TEXT,
        title TEXT,
        prompt TEXT,
        status TEXT DEFAULT 'draft',
        budget TEXT,
        currency TEXT DEFAULT 'USDT',
        result TEXT,
        metadata TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    )`);
    initialized = true;
}

async function saveTask(task) {
    await initDb();
    const { dbRun } = require('../../../db/core');
    await dbRun(`INSERT INTO okxai_tasks
        (localUserId, taskId, jobId, aspAgentId, title, prompt, status, budget, currency, result, metadata, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(taskId) DO UPDATE SET
            localUserId=excluded.localUserId,
            jobId=excluded.jobId,
            aspAgentId=excluded.aspAgentId,
            title=excluded.title,
            prompt=excluded.prompt,
            status=excluded.status,
            budget=excluded.budget,
            currency=excluded.currency,
            result=excluded.result,
            metadata=excluded.metadata,
            updatedAt=datetime('now')`,
    [
        task.localUserId || task.userId || null,
        task.taskId || task.jobId,
        task.jobId || task.taskId,
        task.aspAgentId || null,
        task.title || '',
        task.prompt || '',
        task.status || 'draft',
        task.budget === undefined ? null : String(task.budget),
        task.currency || 'USDT',
        task.result ? JSON.stringify(task.result) : null,
        JSON.stringify(task.metadata || {})
    ]);
}

async function publishTask(params = {}, options = {}) {
    if (!params.aspAgentId) throw new Error('aspAgentId is required');
    if (!params.prompt && !params.description) throw new Error('prompt or description is required');

    const remote = await a2a.createTask(params.aspAgentId, params, options);
    const task = {
        ...params,
        ...remote,
        localUserId: params.localUserId || params.userId,
        taskId: remote.taskId || remote.jobId || params.taskId,
        jobId: remote.jobId || remote.taskId || params.jobId,
        status: remote.status || 'published'
    };
    await saveTask(task);
    log.info(`Published OKX.AI task: ${task.taskId}`);
    return task;
}

async function draftTask(params = {}) {
    const task = {
        ...params,
        taskId: params.taskId || `draft_${Date.now()}`,
        status: 'draft'
    };
    await saveTask(task);
    return task;
}

async function updateLocalTask(taskId, updates = {}) {
    const existing = await getLocalTask(taskId);
    if (!existing) throw new Error('task not found');
    const merged = { ...existing, ...updates, taskId };
    await saveTask(merged);
    return merged;
}

async function getLocalTask(taskId) {
    await initDb();
    const { dbGet } = require('../../../db/core');
    const row = await dbGet('SELECT * FROM okxai_tasks WHERE taskId = ? OR jobId = ? LIMIT 1', [taskId, taskId]);
    if (!row) return null;
    return {
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        result: row.result ? JSON.parse(row.result) : null
    };
}

async function listLocalTasks(localUserId = null, limit = 20) {
    await initDb();
    const { dbAll } = require('../../../db/core');
    const rows = localUserId
        ? await dbAll('SELECT * FROM okxai_tasks WHERE localUserId = ? ORDER BY updatedAt DESC LIMIT ?', [localUserId, limit])
        : await dbAll('SELECT * FROM okxai_tasks ORDER BY updatedAt DESC LIMIT ?', [limit]);
    return rows.map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        result: row.result ? JSON.parse(row.result) : null
    }));
}

async function syncTask(taskId, options = {}) {
    const existing = await getLocalTask(taskId);
    try {
        const remote = await a2a.getTask(taskId, options);
        const merged = { ...(existing || {}), ...remote, taskId: remote.taskId || taskId };
        await saveTask(merged);
        return merged;
    } catch (err) {
        if (existing) {
            log.warn(`Remote OKX.AI task sync failed, returning local task ${taskId}: ${err.message}`);
            return {
                ...existing,
                syncError: err.message
            };
        }
        throw err;
    }
}

async function negotiate(taskId, terms = {}, options = {}) {
    const remote = await a2a.negotiateTask(taskId, terms, options);
    const existing = await getLocalTask(taskId);
    if (!existing) {
        return {
            taskId,
            jobId: taskId,
            status: remote.status || 'negotiating',
            negotiation: terms,
            remote
        };
    }
    return updateLocalTask(taskId, {
        status: remote.status || existing.status || 'negotiating',
        metadata: {
            ...(existing.metadata || {}),
            lastNegotiation: {
                ...terms,
                updatedAt: new Date().toISOString()
            },
            lastRemoteResponse: remote
        }
    });
}

async function accept(taskId, options = {}) {
    const remote = await a2a.acceptTask(taskId, options);
    const existing = await getLocalTask(taskId);
    if (!existing) {
        return {
            taskId,
            jobId: taskId,
            status: remote.status || 'accepted',
            remote
        };
    }
    return updateLocalTask(taskId, {
        status: remote.status || 'accepted',
        metadata: {
            ...(existing.metadata || {}),
            acceptedAt: new Date().toISOString(),
            lastRemoteResponse: remote
        }
    });
}

async function deliver(taskId, result, options = {}) {
    const remote = await a2a.deliverTask(taskId, result, options);
    return updateLocalTask(taskId, {
        status: remote.status || 'delivered',
        result,
        metadata: {
            ...((await getLocalTask(taskId))?.metadata || {}),
            deliveredAt: new Date().toISOString(),
            lastRemoteResponse: remote
        }
    });
}

async function evaluate(taskId, rating, comment = '', options = {}) {
    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
        throw new Error('rating must be a number from 1 to 5');
    }
    const remote = await a2a.evaluateTask(taskId, numericRating, comment, options);
    const existing = await getLocalTask(taskId);
    if (!existing) {
        return {
            taskId,
            jobId: taskId,
            status: remote.status || 'evaluated',
            rating: numericRating,
            comment,
            remote
        };
    }
    return updateLocalTask(taskId, {
        status: remote.status || existing.status || 'evaluated',
        metadata: {
            ...(existing.metadata || {}),
            evaluation: {
                rating: numericRating,
                comment,
                evaluatedAt: new Date().toISOString()
            },
            lastRemoteResponse: remote
        }
    });
}

module.exports = {
    publishTask,
    draftTask,
    saveTask,
    updateLocalTask,
    getLocalTask,
    listLocalTasks,
    syncTask,
    negotiate,
    accept,
    deliver,
    evaluate
};