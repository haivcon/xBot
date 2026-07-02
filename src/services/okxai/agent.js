/**
 * OKX.AI Agent Identity Manager
 *
 * Provides a pragmatic bridge layer for xBot to manage OKX.AI agent identity.
 * The module is intentionally endpoint-configurable because OKX.AI/A2A runtime
 * deployments may expose different gateway base URLs.
 */
const axios = require('axios');
const logger = require('../../core/logger');

const log = logger.child('OKXAI:Agent');
const DEFAULT_BASE_URL = process.env.OKXAI_API_URL || process.env.OKX_AI_API_URL || 'https://okx.ai';
const DEFAULT_TIMEOUT = Number(process.env.OKXAI_TIMEOUT_MS || 30000);

let initialized = false;

async function initDb() {
    if (initialized) return;
    const { dbRun } = require('../../../db/core');
    await dbRun(`CREATE TABLE IF NOT EXISTS okxai_agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        localUserId TEXT DEFAULT 'server',
        agentId TEXT UNIQUE,
        role TEXT DEFAULT 'user',
        name TEXT NOT NULL,
        description TEXT,
        endpoint TEXT,
        avatarUrl TEXT,
        metadata TEXT,
        status TEXT DEFAULT 'draft',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
    )`);
    initialized = true;
}

function authHeaders(options = {}) {
    const token = options.token || process.env.OKXAI_API_KEY || process.env.OKX_AI_API_KEY;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

function normalizeBaseUrl(baseUrl = DEFAULT_BASE_URL) {
    return String(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
}

async function request(method, path, data, options = {}) {
    const url = `${normalizeBaseUrl(options.baseUrl)}${path}`;
    try {
        const response = await axios({
            method,
            url,
            data,
            headers: { ...authHeaders(options), ...(options.headers || {}) },
            timeout: options.timeout || DEFAULT_TIMEOUT
        });
        return response.data;
    } catch (err) {
        const status = err.response?.status;
        const body = err.response?.data;
        const message = body?.error || body?.message || err.message;
        const error = new Error(`OKX.AI agent request failed${status ? ` (${status})` : ''}: ${message}`);
        error.status = status;
        error.data = body;
        throw error;
    }
}

async function saveLocalAgent(agent) {
    await initDb();
    const { dbRun } = require('../../../db/core');
    const metadata = JSON.stringify(agent.metadata || {});
    await dbRun(`INSERT INTO okxai_agents
        (localUserId, agentId, role, name, description, endpoint, avatarUrl, metadata, status, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(agentId) DO UPDATE SET
            localUserId=excluded.localUserId,
            role=excluded.role,
            name=excluded.name,
            description=excluded.description,
            endpoint=excluded.endpoint,
            avatarUrl=excluded.avatarUrl,
            metadata=excluded.metadata,
            status=excluded.status,
            updatedAt=datetime('now')`,
    [
        agent.localUserId || 'server',
        agent.agentId,
        agent.role || 'user',
        agent.name,
        agent.description || '',
        agent.endpoint || '',
        agent.avatarUrl || '',
        metadata,
        agent.status || 'active'
    ]);
}

async function registerAgent(params = {}, options = {}) {
    if (!params.name) throw new Error('name is required');
    const payload = {
        role: params.role || 'user',
        name: params.name,
        description: params.description || 'xBot OKX.AI bridge agent',
        endpoint: params.endpoint || process.env.OKXAI_AGENT_ENDPOINT || process.env.PUBLIC_BASE_URL,
        avatarUrl: params.avatarUrl,
        services: params.services || [
            'ai-router',
            'onchainos-tools',
            'a2a-task-bridge',
            'x402-payment-bridge'
        ],
        metadata: {
            project: 'xBot',
            bridge: true,
            aiProviders: ['9router', 'gemini', 'openai', 'groq'],
            ...(params.metadata || {})
        }
    };

    let remote;
    if (options.dryRun || String(process.env.OKXAI_DRY_RUN || '').toLowerCase() === 'true') {
        remote = {
            agentId: `local_${Date.now()}`,
            status: 'draft',
            ...payload
        };
    } else {
        remote = await request('POST', '/api/agent/register', payload, options);
    }

    const agent = {
        ...payload,
        ...remote,
        agentId: remote.agentId || remote.id || payload.agentId,
        localUserId: params.localUserId || 'server',
        status: remote.status || 'active'
    };
    await saveLocalAgent(agent);
    log.info(`Registered OKX.AI agent identity: ${agent.agentId}`);
    return agent;
}

async function updateAgent(agentId, updates = {}, options = {}) {
    if (!agentId) throw new Error('agentId is required');
    const remote = options.localOnly
        ? { agentId, ...updates }
        : await request('PUT', `/api/agent/${encodeURIComponent(agentId)}`, updates, options);
    const existing = await getLocalAgent(agentId);
    const merged = { ...(existing || {}), ...updates, ...remote, agentId };
    await saveLocalAgent(merged);
    return merged;
}

async function setAgentStatus(agentId, status, options = {}) {
    if (!['active', 'inactive', 'draft'].includes(status)) throw new Error('invalid status');
    return updateAgent(agentId, { status }, status === 'draft' ? { ...options, localOnly: true } : options);
}

async function getLocalAgent(agentIdOrUser = 'server') {
    await initDb();
    const { dbGet } = require('../../../db/core');
    const row = await dbGet(
        'SELECT * FROM okxai_agents WHERE agentId = ? OR localUserId = ? ORDER BY updatedAt DESC LIMIT 1',
        [agentIdOrUser, agentIdOrUser]
    );
    if (!row) return null;
    return {
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {}
    };
}

async function getAgentInfo(agentId, options = {}) {
    if (!agentId) return getLocalAgent(options.localUserId || 'server');
    if (options.localOnly) return getLocalAgent(agentId);
    try {
        return await request('GET', `/api/agent/${encodeURIComponent(agentId)}`, null, options);
    } catch (err) {
        log.warn(`Remote agent lookup failed, falling back to local DB: ${err.message}`);
        return getLocalAgent(agentId);
    }
}

async function searchAgents(query = {}, options = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    }
    return request('GET', `/api/agent/search${params.toString() ? `?${params}` : ''}`, null, options);
}

async function listLocalAgents() {
    await initDb();
    const { dbAll } = require('../../../db/core');
    const rows = await dbAll('SELECT * FROM okxai_agents ORDER BY updatedAt DESC');
    return rows.map(row => ({ ...row, metadata: row.metadata ? JSON.parse(row.metadata) : {} }));
}

module.exports = {
    registerAgent,
    updateAgent,
    setAgentStatus,
    getAgentInfo,
    getLocalAgent,
    searchAgents,
    listLocalAgents,
    request
};