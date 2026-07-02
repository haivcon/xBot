/**
 * xBot Agent Runtime.
 *
 * Public bridge layer between OKX.AI/A2A envelopes, xBot tools and external AI
 * providers (9Router, Gemini, OpenAI-compatible providers, Groq, ...).
 */
const aiRouter = require('../aiRouter');
const okxai = require('../okxai');
const inbox = require('./inbox');
const audit = require('./audit');
const policy = require('./policy');
const toolRegistry = require('./toolRegistry');
const limits = require('./limits');
const { okxaiToolDeclarations } = require('../../features/ai/okxaiTools');

function normalizeRuntimeMessages(input = {}) {
    if (Array.isArray(input.messages)) return input.messages;
    if (input.message) {
        return [{
            role: input.role || 'user',
            content: typeof input.message === 'string' ? input.message : JSON.stringify(input.message)
        }];
    }
    if (input.prompt) {
        return [{ role: 'user', content: String(input.prompt) }];
    }
    return [];
}

function parseToolArguments(raw) {
    if (!raw) return {};
    if (typeof raw === 'string') return JSON.parse(raw || '{}');
    return raw;
}

function createConfirmationError(name, args, context = {}) {
    const tool = toolRegistry.getTool(name);
    const err = new Error(`Tool ${name} requires explicit user confirmation in ${policy.getBridgeMode(context.mode)} mode`);
    err.code = 'CONFIRMATION_REQUIRED';
    err.action = tool?.action || name;
    err.mode = policy.getBridgeMode(context.mode);
    err.toolCall = { name, arguments: args, riskLevel: tool?.riskLevel || 'unknown' };
    return err;
}

function assertToolAllowed(name, args = {}, context = {}) {
    const tool = toolRegistry.getTool(name);
    if (!tool) {
        throw new Error(`Unsupported runtime tool: ${name}`);
    }

    const allowed = policy.assertAllowed(tool.action || name, {
        ...context,
        ...(args || {})
    });

    if (tool.protected && allowed.mode !== 'auto' && context.confirmed !== true && context.userConfirmed !== true) {
        throw createConfirmationError(name, args, { ...context, mode: allowed.mode });
    }

    return allowed;
}

async function runToolCalls(toolCalls = [], context = {}) {
    const results = [];
    for (const call of toolCalls || []) {
        const fn = call.function || call;
        const name = fn.name || call.name;
        const args = parseToolArguments(fn.arguments || call.arguments);
        try {
            limits.assertToolQuota(context.userId);
            assertToolAllowed(name, args, context);
            const result = await toolRegistry.executeTool(name, args, context);
            limits.recordTool(context.userId, name);
            results.push({ name, arguments: args, result });
        } catch (error) {
            if (error.code === 'CONFIRMATION_REQUIRED') throw error;
            results.push({ name, arguments: args, error: error.message, code: error.code });
        }
    }
    return results;
}

async function chat(input = {}, context = {}) {
    const userId = String(context.userId || input.userId || 'server');
    const provider = input.provider || context.provider || 'auto';
    const model = input.model || context.model || 'auto';
    const tools = input.tools || (input.enableOkxAiTools === false ? [] : okxaiToolDeclarations);

    limits.assertChatQuota(userId);

    const response = await aiRouter.chat({
        userId,
        provider,
        model,
        messages: normalizeRuntimeMessages(input),
        tools,
        temperature: input.temperature,
        baseURL: input.baseURL
    });

    let toolResults = [];
    if (input.autoExecuteTools !== false && response.toolCalls?.length) {
        toolResults = await runToolCalls(response.toolCalls, {
            ...context,
            userId,
            okxaiOptions: input.okxaiOptions,
            confirmed: input.confirmed === true
        });
    }

    limits.recordChat(userId, {
        provider: response.provider,
        model: response.model
    });

    await audit.recordAudit({
        userId,
        action: 'runtime_chat',
        provider: response.provider,
        model: response.model,
        status: 'ok',
        metadata: {
            source: response.source,
            toolCalls: response.toolCalls?.length || 0,
            toolResults: toolResults.map(item => ({ name: item.name, hasError: Boolean(item.error) }))
        }
    });

    return {
        ...response,
        toolResults
    };
}

async function executeTool(input = {}, context = {}) {
    const userId = String(context.userId || input.userId || 'server');
    const name = input.name || input.toolName;
    if (!name) throw new Error('tool name is required');

    const args = input.arguments || input.args || {};
    const executionContext = {
        ...context,
        userId,
        confirmed: input.confirmed === true || context.confirmed === true,
        okxaiOptions: input.okxaiOptions
    };
    limits.assertToolQuota(userId);
    assertToolAllowed(name, args, executionContext);

    const result = await toolRegistry.executeTool(name, args, executionContext);
    limits.recordTool(userId, name);

    await audit.recordAudit({
        userId,
        action: `tool:${name}`,
        status: 'ok',
        metadata: { hasResult: Boolean(result) }
    });

    return result;
}

function getInboundSecret() {
    return process.env.AGENT_RUNTIME_INBOUND_SECRET || process.env.OKXAI_A2A_WEBHOOK_SECRET || '';
}

function verifyInboundSecret(secret) {
    const expected = getInboundSecret();
    if (!expected) return true;
    return Boolean(secret) && String(secret) === String(expected);
}

async function handleEnvelope(envelope = {}, context = {}) {
    if (!verifyInboundSecret(context.inboundSecret)) {
        const err = new Error('Invalid or missing Agent Runtime inbound secret');
        err.code = 'UNAUTHORIZED_INBOUND';
        throw err;
    }

    const userId = context.userId || envelope.userId || envelope.localUserId || null;
    limits.assertInboundQuota(userId);
    await okxai.a2a.recordEnvelope(envelope, 'inbound').catch(() => {});
    const saved = await inbox.saveEnvelope(envelope, { userId });

    const taskId = envelope.taskId || envelope.jobId || envelope.message?.taskId || envelope.message?.jobId;
    const event = envelope.event || envelope.message?.event || envelope.payload?.event;
    if (taskId) {
        const metadata = {
            source: 'inbound_a2a',
            event,
            envelopeId: saved.id
        };
        const existing = await okxai.taskManager.getLocalTask(taskId).catch(() => null);
        if (existing) {
            await okxai.taskManager.updateLocalTask(taskId, {
                status: event || existing.status,
                metadata: {
                    ...(existing.metadata || {}),
                    lastInboundEnvelope: metadata
                }
            }).catch(() => {});
        } else if (['task_created', 'task_updated', 'decision_request'].includes(event)) {
            await okxai.taskManager.saveTask({
                localUserId: userId,
                taskId,
                jobId: taskId,
                title: envelope.title || envelope.payload?.title || 'Inbound OKX.AI task',
                prompt: envelope.content || envelope.payload?.prompt || envelope.payload?.description || '',
                status: event || 'inbound',
                metadata
            }).catch(() => {});
        }
    }

    limits.recordInbound(userId, event);

    await audit.recordAudit({
        userId,
        action: 'inbound_envelope',
        status: 'ok',
        metadata: { event, taskId, inboxId: saved.id }
    });

    return saved;
}

async function status(userId = null) {
    const [aiStatus, inboxItems, decisions, auditItems] = await Promise.all([
        aiRouter.getStatus(userId),
        inbox.listInbox({ userId, limit: 20 }).catch(() => []),
        inbox.listDecisions({ userId, limit: 20 }).catch(() => []),
        audit.listAudit({ userId, limit: 20 }).catch(() => [])
    ]);

    return {
        ai: aiStatus,
        policy: policy.runtimeConfig(),
        inbox: inboxItems,
        decisions,
        audit: auditItems,
        tools: toolRegistry.listTools(),
        quota: limits.getQuotaConfig(),
        sessions: userId ? [limits.getSession(userId)].filter(Boolean) : limits.listSessions(20)
    };
}

async function decide(input = {}, context = {}) {
    const decision = String(input.decision || input.action || '').toLowerCase();
    const inboxId = input.inboxId || input.id;
    if (!['approve', 'reject'].includes(decision)) {
        throw new Error('decision must be approve or reject');
    }

    const updated = inboxId
        ? await inbox.updateInboxStatus(inboxId, decision === 'approve' ? 'approved' : 'rejected')
        : null;

    await audit.recordAudit({
        userId: context.userId || input.userId || null,
        action: `decision:${decision}`,
        status: 'ok',
        metadata: {
            inboxId,
            reason: input.reason || null,
            executeTool: Boolean(input.toolName || input.name)
        }
    });

    let execution = null;
    if (decision === 'approve' && (input.toolName || input.name)) {
        execution = await executeTool({
            name: input.toolName || input.name,
            arguments: input.arguments || input.args || {},
            confirmed: true,
            okxaiOptions: input.okxaiOptions
        }, context);
    }

    return { decision, updated, execution };
}

module.exports = {
    chat,
    executeTool,
    handleEnvelope,
    runToolCalls,
    status,
    decide,
    inbox,
    audit,
    policy,
    toolRegistry,
    limits
};
