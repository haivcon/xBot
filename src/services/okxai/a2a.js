/**
 * OKX.AI A2A Protocol Client
 *
 * Endpoint-configurable Agent-to-Agent client used by xBot to create tasks,
 * exchange negotiation messages, deliver results, and consume task events.
 */
const axios = require('axios');
const { EventEmitter } = require('events');
const WebSocket = require('ws');
const logger = require('../../core/logger');

const log = logger.child('OKXAI:A2A');
const DEFAULT_BASE_URL = process.env.OKXAI_A2A_URL || process.env.OKXAI_API_URL || process.env.OKX_AI_API_URL || 'https://okx.ai';
const DEFAULT_WS_URL = process.env.OKXAI_A2A_WS_URL || '';
const DEFAULT_TIMEOUT = Number(process.env.OKXAI_TIMEOUT_MS || 30000);

let initialized = false;

async function initDb() {
    if (initialized) return;
    const { dbRun } = require('../../../db/core');
    await dbRun(`CREATE TABLE IF NOT EXISTS okxai_a2a_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jobId TEXT,
        taskId TEXT,
        direction TEXT,
        senderRole TEXT,
        msgType TEXT,
        event TEXT,
        payload TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
    )`);
    initialized = true;
}

function normalizeBaseUrl(baseUrl = DEFAULT_BASE_URL) {
    return String(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function authHeaders(options = {}) {
    const token = options.token || process.env.OKXAI_API_KEY || process.env.OKX_AI_API_KEY;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

async function request(method, path, data, options = {}) {
    try {
        const response = await axios({
            method,
            url: `${normalizeBaseUrl(options.baseUrl)}${path}`,
            data,
            headers: { ...authHeaders(options), ...(options.headers || {}) },
            timeout: options.timeout || DEFAULT_TIMEOUT
        });
        return response.data;
    } catch (err) {
        const status = err.response?.status;
        const body = err.response?.data;
        const message = body?.error || body?.message || err.message;
        const error = new Error(`OKX.AI A2A request failed${status ? ` (${status})` : ''}: ${message}`);
        error.status = status;
        error.data = body;
        throw error;
    }
}

async function recordEnvelope(envelope, direction = 'outbound') {
    await initDb();
    const { dbRun } = require('../../../db/core');
    await dbRun(`INSERT INTO okxai_a2a_messages
        (jobId, taskId, direction, senderRole, msgType, event, payload)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
        envelope.jobId || envelope.taskId || null,
        envelope.taskId || envelope.jobId || null,
        direction,
        envelope.sender?.role || null,
        envelope.msgType || envelope.message?.source || null,
        envelope.event || envelope.message?.event || null,
        JSON.stringify(envelope)
    ]);
}

function createEnvelope({ jobId, taskId, senderRole = 'USER_AGENT', content, event, payload = {}, msgType = 'a2a-agent-chat' }) {
    return {
        msgType,
        jobId: jobId || taskId,
        taskId: taskId || jobId,
        sender: {
            role: senderRole,
            agentId: process.env.OKXAI_AGENT_ID || undefined
        },
        event,
        content,
        payload,
        ts: new Date().toISOString()
    };
}

async function createTask(aspAgentId, taskParams = {}, options = {}) {
    if (!aspAgentId) throw new Error('aspAgentId is required');
    const payload = {
        aspAgentId,
        title: taskParams.title || taskParams.prompt || 'xBot OKX.AI task',
        prompt: taskParams.prompt || taskParams.description,
        budget: taskParams.budget,
        currency: taskParams.currency || 'USDT',
        deadline: taskParams.deadline,
        metadata: {
            source: 'xBot',
            userId: taskParams.userId,
            ...(taskParams.metadata || {})
        }
    };
    const dryRun = options.dryRun ?? (String(process.env.OKXAI_DRY_RUN || '').toLowerCase() === 'true');
    const data = dryRun
        ? {
            taskId: `local_task_${Date.now()}`,
            jobId: `local_job_${Date.now()}`,
            status: 'draft',
            dryRun: true,
            ...payload
        }
        : await request('POST', '/api/a2a/tasks', payload, options);
    await recordEnvelope(createEnvelope({
        jobId: data.jobId || data.taskId,
        taskId: data.taskId || data.jobId,
        event: 'task_created',
        content: payload.prompt,
        payload
    }));
    return data;
}

async function sendMessage(taskId, content, payload = {}, options = {}) {
    if (!taskId) throw new Error('taskId is required');
    const envelope = createEnvelope({ taskId, content, payload, event: payload.event || 'message' });
    const data = await request('POST', `/api/a2a/tasks/${encodeURIComponent(taskId)}/messages`, envelope, options);
    await recordEnvelope(envelope);
    return data;
}

async function negotiateTask(taskId, terms = {}, options = {}) {
    return sendMessage(taskId, terms.message || 'Negotiation update', { event: 'negotiate', terms }, options);
}

async function acceptTask(taskId, options = {}) {
    const data = await request('POST', `/api/a2a/tasks/${encodeURIComponent(taskId)}/accept`, {}, options);
    await recordEnvelope(createEnvelope({ taskId, event: 'accepted', payload: data }));
    return data;
}

async function deliverTask(taskId, result, options = {}) {
    const payload = { result, deliveredAt: new Date().toISOString() };
    const data = await request('POST', `/api/a2a/tasks/${encodeURIComponent(taskId)}/deliver`, payload, options);
    await recordEnvelope(createEnvelope({ taskId, event: 'delivered', payload }));
    return data;
}

async function evaluateTask(taskId, rating, comment = '', options = {}) {
    const payload = { rating, comment };
    const data = await request('POST', `/api/a2a/tasks/${encodeURIComponent(taskId)}/evaluate`, payload, options);
    await recordEnvelope(createEnvelope({ taskId, event: 'evaluated', payload }));
    return data;
}

async function getTask(taskId, options = {}) {
    if (!taskId) throw new Error('taskId is required');
    if (options.localOnly || String(process.env.OKXAI_DRY_RUN || '').toLowerCase() === 'true') {
        return {
            taskId,
            jobId: taskId,
            status: 'local_only',
            dryRun: true
        };
    }
    return request('GET', `/api/a2a/tasks/${encodeURIComponent(taskId)}`, null, options);
}

async function listTasks(query = {}, options = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    }
    return request('GET', `/api/a2a/tasks${params.toString() ? `?${params}` : ''}`, null, options);
}

function createTaskEventListener(options = {}) {
    const emitter = new EventEmitter();
    const wsUrl = options.wsUrl || DEFAULT_WS_URL;
    if (!wsUrl) {
        process.nextTick(() => emitter.emit('error', new Error('OKXAI_A2A_WS_URL is not configured')));
        return emitter;
    }

    let ws;
    let closed = false;
    const connect = () => {
        ws = new WebSocket(wsUrl, { headers: authHeaders(options) });
        ws.on('open', () => emitter.emit('open'));
        ws.on('message', async (raw) => {
            try {
                const envelope = JSON.parse(raw.toString());
                await recordEnvelope(envelope, 'inbound');
                emitter.emit('envelope', envelope);
                if (envelope.event || envelope.message?.event) {
                    emitter.emit(envelope.event || envelope.message.event, envelope);
                }
            } catch (err) {
                emitter.emit('error', err);
            }
        });
        ws.on('error', (err) => emitter.emit('error', err));
        ws.on('close', () => {
            emitter.emit('close');
            if (!closed && options.reconnect !== false) {
                setTimeout(connect, options.reconnectDelayMs || 3000);
            }
        });
    };

    emitter.close = () => {
        closed = true;
        if (ws) ws.close();
    };
    connect();
    return emitter;
}

module.exports = {
    createEnvelope,
    createTask,
    sendMessage,
    negotiateTask,
    acceptTask,
    deliverTask,
    evaluateTask,
    getTask,
    listTasks,
    createTaskEventListener,
    recordEnvelope,
    request
};