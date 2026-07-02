const policy = require('../src/services/agentRuntime/policy');
const inbox = require('../src/services/agentRuntime/inbox');
const limits = require('../src/services/agentRuntime/limits');

jest.mock('../db/core', () => {
    const rows = [];
    let nextId = 1;

    return {
        dbRun: jest.fn(async (sql, params = []) => {
            if (/INSERT INTO agent_runtime_inbox/i.test(sql)) {
                const row = {
                    id: nextId++,
                    userId: params[0],
                    jobId: params[1],
                    taskId: params[2],
                    msgType: params[3],
                    event: params[4],
                    senderRole: params[5],
                    status: params[6],
                    requiresDecision: params[7],
                    payload: params[8],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                rows.push(row);
                return { lastID: row.id };
            }

            if (/UPDATE agent_runtime_inbox/i.test(sql)) {
                const row = rows.find(item => String(item.id) === String(params[1]));
                if (row) row.status = params[0];
                return { changes: row ? 1 : 0 };
            }

            return {};
        }),
        dbAll: jest.fn(async (sql, params = []) => {
            let result = [...rows];

            if (/userId = \?/i.test(sql)) {
                const userId = params.shift();
                result = result.filter(row => row.userId === userId);
            }
            if (/status = \?/i.test(sql)) {
                const status = params.shift();
                result = result.filter(row => row.status === status);
            }
            if (/requiresDecision = 1/i.test(sql)) {
                result = result.filter(row => Number(row.requiresDecision) === 1);
            }

            return result.slice(0, Number(params[params.length - 1]) || 100);
        })
    };
});

describe('agentRuntime policy', () => {
    test('blocks protected actions in semi_auto mode without confirmation', () => {
        expect(() => policy.assertAllowed('task_accept', { mode: 'semi_auto' })).toThrow(/requires explicit user confirmation/);
    });

    test('allows protected actions with confirmation', () => {
        expect(policy.assertAllowed('task_accept', { mode: 'semi_auto', confirmed: true })).toEqual({
            allowed: true,
            mode: 'semi_auto'
        });
    });

    test('normalizes invalid runtime mode to semi_auto', () => {
        expect(policy.getBridgeMode('bad_mode')).toBe('semi_auto');
    });
});

describe('agentRuntime limits', () => {
    beforeEach(() => {
        limits.resetForTests();
        delete process.env.AGENT_RUNTIME_MAX_REQUESTS_PER_WINDOW;
    });

    test('tracks runtime sessions', () => {
        limits.recordChat('u1', { provider: '9router', model: 'auto' });
        limits.recordTool('u1', 'okxai_search_agents');
        limits.recordInbound('u1', 'decision_request');

        const session = limits.getSession('u1');
        expect(session.chatCount).toBe(1);
        expect(session.toolCount).toBe(1);
        expect(session.inboundCount).toBe(1);
        expect(session.lastProvider).toBe('9router');
        expect(session.lastTool).toBe('okxai_search_agents');
    });

    test('enforces chat quota window', () => {
        process.env.AGENT_RUNTIME_MAX_REQUESTS_PER_WINDOW = '1';
        expect(limits.assertChatQuota('u2').allowed).toBe(true);
        expect(() => limits.assertChatQuota('u2')).toThrow(/quota exceeded/);
    });
});

describe('agentRuntime inbox', () => {
    test('detects decision envelopes', () => {
        expect(inbox.inferDecision({ event: 'decision_request' })).toBe(true);
        expect(inbox.inferDecision({ msgType: 'a2a-agent-chat', event: 'message' })).toBe(false);
    });

    test('saves and lists inbound envelopes', async () => {
        const saved = await inbox.saveEnvelope({
            msgType: 'a2a-agent-chat',
            jobId: 'job_1',
            sender: { role: 'ASP' },
            event: 'decision_request',
            payload: { title: 'Review delivery' }
        }, { userId: 'u1' });

        expect(saved.id).toBeTruthy();
        expect(saved.requiresDecision).toBe(true);

        const decisions = await inbox.listDecisions({ userId: 'u1' });
        expect(decisions).toHaveLength(1);
        expect(decisions[0].jobId).toBe('job_1');

        await inbox.updateInboxStatus(saved.id, 'read');
        const unread = await inbox.listDecisions({ userId: 'u1' });
        expect(unread).toHaveLength(0);
    });
});