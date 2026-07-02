/**
 * Lightweight in-memory quota/session guards for Agent Runtime.
 *
 * These guards are intentionally dependency-free so the bridge remains usable
 * without Redis/BullMQ. Deployments that need distributed limits can replace
 * this module with a shared store later.
 */
const DEFAULT_WINDOW_MS = 60_000;

const buckets = new Map();
const sessions = new Map();

function nowMs() {
    return Date.now();
}

function getLimit(name, fallback) {
    const value = Number(process.env[name] || fallback);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getWindowMs() {
    return getLimit('AGENT_RUNTIME_QUOTA_WINDOW_MS', DEFAULT_WINDOW_MS);
}

function getMaxRequestsPerWindow() {
    return getLimit('AGENT_RUNTIME_MAX_REQUESTS_PER_WINDOW', 60);
}

function getMaxToolCallsPerWindow() {
    return getLimit('AGENT_RUNTIME_MAX_TOOL_CALLS_PER_WINDOW', 30);
}

function getMaxInboundPerWindow() {
    return getLimit('AGENT_RUNTIME_MAX_INBOUND_PER_WINDOW', 120);
}

function bucketKey(scope, userId) {
    return `${scope}:${String(userId || 'anonymous')}`;
}

function consume(scope, userId, max, windowMs = getWindowMs()) {
    const key = bucketKey(scope, userId);
    const now = nowMs();
    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
        bucket = { count: 0, resetAt: now + windowMs };
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > max) {
        const err = new Error(`Agent Runtime quota exceeded for ${scope}`);
        err.code = 'AGENT_RUNTIME_QUOTA_EXCEEDED';
        err.scope = scope;
        err.retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
        throw err;
    }

    return {
        allowed: true,
        scope,
        remaining: Math.max(0, max - bucket.count),
        resetAt: bucket.resetAt
    };
}

function assertChatQuota(userId) {
    return consume('chat', userId, getMaxRequestsPerWindow());
}

function assertToolQuota(userId) {
    return consume('tool', userId, getMaxToolCallsPerWindow());
}

function assertInboundQuota(userId) {
    return consume('inbound', userId, getMaxInboundPerWindow());
}

function touchSession(userId, patch = {}) {
    const key = String(userId || 'anonymous');
    const existing = sessions.get(key) || {
        userId: key,
        chatCount: 0,
        toolCount: 0,
        inboundCount: 0,
        createdAt: new Date().toISOString()
    };

    const updated = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString()
    };

    sessions.set(key, updated);
    return updated;
}

function recordChat(userId, meta = {}) {
    const existing = sessions.get(String(userId || 'anonymous')) || {};
    return touchSession(userId, {
        chatCount: Number(existing.chatCount || 0) + 1,
        lastProvider: meta.provider || existing.lastProvider || null,
        lastModel: meta.model || existing.lastModel || null
    });
}

function recordTool(userId, toolName) {
    const existing = sessions.get(String(userId || 'anonymous')) || {};
    return touchSession(userId, {
        toolCount: Number(existing.toolCount || 0) + 1,
        lastTool: toolName || existing.lastTool || null
    });
}

function recordInbound(userId, event) {
    const existing = sessions.get(String(userId || 'anonymous')) || {};
    return touchSession(userId, {
        inboundCount: Number(existing.inboundCount || 0) + 1,
        lastInboundEvent: event || existing.lastInboundEvent || null
    });
}

function getSession(userId) {
    return sessions.get(String(userId || 'anonymous')) || null;
}

function listSessions(limit = 100) {
    return Array.from(sessions.values())
        .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
        .slice(0, Math.max(1, Number(limit) || 100));
}

function getQuotaConfig() {
    return {
        windowMs: getWindowMs(),
        maxRequestsPerWindow: getMaxRequestsPerWindow(),
        maxToolCallsPerWindow: getMaxToolCallsPerWindow(),
        maxInboundPerWindow: getMaxInboundPerWindow()
    };
}

function resetForTests() {
    buckets.clear();
    sessions.clear();
}

module.exports = {
    assertChatQuota,
    assertToolQuota,
    assertInboundQuota,
    recordChat,
    recordTool,
    recordInbound,
    getSession,
    listSessions,
    getQuotaConfig,
    resetForTests
};