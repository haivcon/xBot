'use strict';

const crypto = require('crypto');

const WRITE_ACCESS = new Set(['write', 'onchain-write']);
const SECRET_KEY_PATTERN = /^(private[_-]?key|mnemonic|seed(?:[_-]?phrase)?|wallet[_-]?secret|signing[_-]?key)$/i;
const REQUIRED_CONTEXT = ['tenantId', 'userId', 'runId', 'toolCallId', 'idempotencyKey'];

function policyError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function canonicalize(value) {
    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }
    if (value && typeof value === 'object') {
        return Object.keys(value).sort().reduce((result, key) => {
            result[key] = canonicalize(value[key]);
            return result;
        }, {});
    }
    return value;
}

function hashArgs(args) {
    return crypto.createHash('sha256')
        .update(JSON.stringify(canonicalize(args === undefined ? {} : args)))
        .digest('hex');
}

function assertNoWalletSecrets(value, seen = new Set()) {
    if (!value || typeof value !== 'object') return;
    if (seen.has(value)) return;
    seen.add(value);

    for (const [key, child] of Object.entries(value)) {
        if (SECRET_KEY_PATTERN.test(key)) {
            throw policyError('WALLET_SECRET_REJECTED', `Wallet secret field is not accepted: ${key}`);
        }
        assertNoWalletSecrets(child, seen);
    }
}

function assertContext(context) {
    for (const field of REQUIRED_CONTEXT) {
        if (typeof context[field] !== 'string' || !context[field]) {
            throw policyError('INVALID_TOOL_CONTEXT', `Missing required tool context: ${field}`);
        }
    }
}

function assertConfirmation(tool, args, context, now, maxConfirmationTtlMs) {
    const confirmation = context.confirmation;
    if (!confirmation || confirmation.confirmed !== true) {
        throw policyError('CONFIRMATION_REQUIRED', `Onchain write ${tool} requires explicit confirmation`);
    }

    const expiresAt = Date.parse(confirmation.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= now) {
        throw policyError('CONFIRMATION_EXPIRED', 'Onchain write confirmation has expired');
    }
    if (expiresAt - now > maxConfirmationTtlMs) {
        throw policyError('CONFIRMATION_TTL_INVALID', 'Onchain write confirmation expiry exceeds policy');
    }

    const expected = {
        tenantId: context.tenantId,
        userId: context.userId,
        runId: context.runId,
        toolCallId: context.toolCallId,
        idempotencyKey: context.idempotencyKey,
        tool,
        argsHash: hashArgs(args)
    };
    for (const [field, value] of Object.entries(expected)) {
        if (confirmation[field] !== value) {
            throw policyError('CONFIRMATION_MISMATCH', `Confirmation is not bound to this ${field}`);
        }
    }
    if (!confirmation.simulation || confirmation.simulation.success !== true) {
        throw policyError('SIMULATION_REQUIRED', 'A successful simulation is required before confirmation');
    }
}

function fallbackArguments(args) {
    if (Array.isArray(args)) return args;
    if (!args || typeof args !== 'object') return [args];
    const values = Object.values(args);
    return values.length === 1 ? values : [args];
}

function createHttpTransport(options = {}) {
    const endpoint = options.endpoint || process.env.ONCHAINOS_MCP_URL;
    let url;
    try { url = new URL(endpoint); } catch {
        throw policyError('MCP_ENDPOINT_INVALID', 'OnchainOS MCP endpoint must be a private HTTPS URL');
    }
    const host = url.hostname.toLowerCase();
    const privateHost = host === 'localhost' || host === '[::1]' ||
        /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
        /^\[(?:fc|fd|fe8|fe9|fea|feb)/.test(host) ||
        !host.includes('.') || host.endsWith('.internal') || host.endsWith('.local');
    if (url.protocol !== 'https:' || url.username || url.password || !privateHost) {
        throw policyError('MCP_ENDPOINT_INVALID', 'OnchainOS MCP endpoint must be a private HTTPS URL');
    }
    const timeoutMs = options.timeoutMs || 10_000;
    let requestId = 0;

    return {
        async callTool(name, args, context) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            const apiKey = options.apiKey || process.env.ONCHAINOS_MCP_API_KEY;
            const headers = { 'content-type': 'application/json' };
            if (apiKey) headers['OK-ACCESS-KEY'] = apiKey;

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers,
                    signal: controller.signal,
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: ++requestId,
                        method: 'tools/call',
                        params: {
                            name,
                            arguments: args,
                            _meta: {
                                tenantId: context.tenantId,
                                userId: context.userId,
                                runId: context.runId,
                                toolCallId: context.toolCallId,
                                idempotencyKey: context.idempotencyKey
                            }
                        }
                    })
                });
                if (!response.ok) {
                    throw policyError('MCP_UPSTREAM_ERROR', `OnchainOS MCP returned HTTP ${response.status}`);
                }
                const payload = await response.json();
                if (payload.error) {
                    throw policyError('MCP_TOOL_ERROR', payload.error.message || 'OnchainOS MCP tool failed');
                }
                return payload.result;
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw policyError('MCP_TIMEOUT', `OnchainOS MCP timed out after ${timeoutMs}ms`);
                }
                throw error;
            } finally {
                clearTimeout(timer);
            }
        }
    };
}

function createOnchainosMcp(options = {}) {
    const enabled = options.enabled === undefined
        ? process.env.ONCHAINOS_MCP_ENABLED === 'true'
        : options.enabled === true;
    const allowWrites = options.allowWrites === undefined
        ? process.env.ONCHAINOS_MCP_WRITES_ENABLED === 'true'
        : options.allowWrites === true;
    let fallback = options.fallback;
    const tools = new Map((options.tools || []).map((tool) => [tool.name, tool]));
    const maxConfirmationTtlMs = options.maxConfirmationTtlMs || 5 * 60 * 1000;
    const now = options.now || Date.now;
    const executions = options.idempotencyStore || new Map();
    let transport = options.transport;

    async function callFallback(name, args) {
        if (!fallback) fallback = require('./onchainos');
        if (!fallback || typeof fallback[name] !== 'function') {
            throw policyError('FALLBACK_TOOL_UNAVAILABLE', `Existing OnchainOS service has no tool ${name}`);
        }
        return fallback[name](...fallbackArguments(args));
    }

    async function callTool(name, args = {}, context = {}) {
        assertNoWalletSecrets(args);
        if (!enabled) return callFallback(name, args);

        assertContext(context);
        const tool = tools.get(name);
        if (!tool || !['read', 'write', 'onchain-write'].includes(tool.access)) {
            throw policyError('TOOL_NOT_ALLOWED', `OnchainOS MCP tool is not allowlisted: ${name}`);
        }

        const isWrite = WRITE_ACCESS.has(tool.access);
        if (isWrite) {
            if (!allowWrites) {
                throw policyError('MCP_WRITE_DISABLED', 'OnchainOS MCP is read-only by default');
            }
            assertConfirmation(name, args, context, now(), maxConfirmationTtlMs);
        }

        if (!transport) transport = createHttpTransport(options);
        if (!isWrite) return transport.callTool(name, args, context);

        const idempotencyScope = [context.tenantId, context.userId, context.runId, name, context.idempotencyKey].join(':');
        const argsHash = hashArgs(args);
        if (executions.has(idempotencyScope)) {
            const existing = executions.get(idempotencyScope);
            if (existing.argsHash !== argsHash) {
                throw policyError('IDEMPOTENCY_CONFLICT', 'Idempotency key was already used with different arguments');
            }
            return existing.result;
        }

        const execution = Promise.resolve().then(() => transport.callTool(name, args, context));
        executions.set(idempotencyScope, { argsHash, result: execution });
        try {
            return await execution;
        } catch (error) {
            executions.delete(idempotencyScope);
            throw error;
        }
    }

    return {
        enabled,
        readOnly: !allowWrites,
        callTool,
        listTools: () => Array.from(tools.values()).map((tool) => ({ ...tool }))
    };
}

module.exports = {
    createOnchainosMcp,
    createHttpTransport,
    hashArgs,
    assertNoWalletSecrets
};
