'use strict';

const crypto = require('crypto');

function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === 'object') {
        return Object.keys(value).sort().reduce((out, key) => {
            out[key] = stableValue(value[key]);
            return out;
        }, {});
    }
    return value;
}

function envelopeBinding(envelope) {
    const fields = {
        tenantId: envelope.tenantId,
        userId: envelope.userId,
        runId: envelope.runId,
        toolCallId: envelope.toolCallId,
        toolName: envelope.toolName,
        args: stableValue(envelope.args || {})
    };
    return crypto.createHash('sha256').update(JSON.stringify(fields)).digest('hex');
}

class MemoryApprovalStore {
    constructor() {
        this.approvals = new Map();
    }

    issue(envelope, ttlMs = 5 * 60 * 1000) {
        const token = crypto.randomBytes(32).toString('base64url');
        this.approvals.set(token, { binding: envelopeBinding(envelope), expiresAt: Date.now() + ttlMs });
        return token;
    }

    consume(token, envelope) {
        if (!token) return false;
        const approval = this.approvals.get(token);
        if (!approval) return false;
        this.approvals.delete(token);
        if (approval.expiresAt <= Date.now()) return false;
        const actual = Buffer.from(envelopeBinding(envelope));
        const expected = Buffer.from(approval.binding);
        return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
    }
}

class MemoryIdempotencyStore {
    constructor() {
        this.entries = new Map();
    }

    claim(scope, key, binding) {
        const composite = `${scope}:${key}`;
        if (this.entries.has(composite)) return { claimed: false, entry: this.entries.get(composite) };
        const entry = { status: 'executing', binding, waiters: [] };
        this.entries.set(composite, entry);
        return { claimed: true, composite, entry };
    }

    complete(composite, result) {
        const entry = this.entries.get(composite);
        if (!entry) return;
        entry.status = 'executed';
        entry.result = result;
        for (const waiter of entry.waiters.splice(0)) waiter.resolve(result);
    }

    release(composite, error) {
        const entry = this.entries.get(composite);
        this.entries.delete(composite);
        if (entry && error) for (const waiter of entry.waiters.splice(0)) waiter.reject(error);
    }

    wait(entry) {
        if (entry.status === 'executed') return Promise.resolve(entry.result);
        return new Promise((resolve, reject) => entry.waiters.push({ resolve, reject }));
    }
}

function createToolPolicy(options = {}) {
    const tools = options.tools || {};
    const approvalStore = options.approvalStore || new MemoryApprovalStore();
    const idempotencyStore = options.idempotencyStore || new MemoryIdempotencyStore();

    async function execute(envelope, executor) {
        const required = ['tenantId', 'userId', 'runId', 'toolCallId', 'toolName', 'idempotencyKey'];
        if (required.some(field => !envelope?.[field])) return { status: 'denied', reason: 'invalid_envelope' };
        const tool = tools[envelope.toolName];
        if (!tool) return { status: 'denied', reason: 'tool_not_allowed' };

        const scope = `${envelope.tenantId}:${envelope.userId}:${envelope.toolName}`;
        const binding = envelopeBinding(envelope);
        const existing = idempotencyStore.claim(scope, envelope.idempotencyKey, binding);
        if (!existing.claimed) {
            if (existing.entry.binding !== binding) return { status: 'denied', reason: 'idempotency_conflict' };
            const result = existing.entry.status === 'executed'
                ? existing.entry.result
                : await idempotencyStore.wait(existing.entry);
            return { status: 'duplicate', result };
        }

        if (tool.risk === 'high' && !approvalStore.consume(envelope.approvalToken, envelope)) {
            idempotencyStore.release(existing.composite);
            return { status: 'approval_required', binding: envelopeBinding(envelope) };
        }

        try {
            const result = await executor(envelope.args || {}, envelope);
            idempotencyStore.complete(existing.composite, result);
            return { status: 'executed', result };
        } catch (error) {
            idempotencyStore.release(existing.composite, error);
            throw error;
        }
    }

    return { execute, approvalStore, idempotencyStore };
}

module.exports = { createToolPolicy, MemoryApprovalStore, MemoryIdempotencyStore, envelopeBinding };
