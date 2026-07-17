'use strict';

jest.mock('../src/skills/audit-log', () => ({ recordAuditEntry: jest.fn() }));

const {
    beginChatRequest,
    recordChatOutcome,
    resetChatTelemetry,
    snapshotChatTelemetry,
    renderChatMetrics
} = require('../src/services/chatOrchestrator/telemetry');
const { recordAuditEntry } = require('../src/skills/audit-log');
const { recordChatAudit } = require('../src/services/chatOrchestrator/audit');

describe('Chat AI telemetry', () => {
    beforeEach(() => {
        resetChatTelemetry();
        recordAuditEntry.mockClear();
    });

    test('uses bounded labels and exports outcomes without tenant or credential data', () => {
        beginChatRequest()();
        recordChatOutcome({ engine: '9router', outcome: 'completed', tenantId: 'tenant-secret' });
        beginChatRequest()();
        recordChatOutcome({ engine: 'unexpected-provider', outcome: 'failed', code: 'UPSTREAM_TIMEOUT' });

        expect(snapshotChatTelemetry()).toEqual({
            requests: 2,
            active: 0,
            outcomes: {
                '9router:completed:OK': 1,
                'unknown:failed:UPSTREAM_TIMEOUT': 1
            }
        });
        const metrics = renderChatMetrics();
        expect(metrics).toContain('chat_ai_requests_total 2');
        expect(metrics).toContain('engine="9router",outcome="completed",code="OK"');
        expect(metrics).not.toContain('tenant-secret');
    });

    test('appends bounded routing metadata without prompts, arguments, or secrets', () => {
        recordChatAudit({
            tenantId: 'tenant/a',
            userId: '../user-a',
            requestId: 'request-a',
            action: 'tool_completed',
            engine: '9router',
            tool: 'get_wallet_balance',
            outcome: 'completed',
            code: 'ok',
            prompt: 'must not be recorded',
            apiKey: 'must not be recorded'
        });

        expect(recordAuditEntry).toHaveBeenCalledWith({
            tenantId: 'tenant_a',
            userId: 'user-a',
            requestId: 'request-a',
            action: 'tool_completed',
            engine: '9router',
            tool: 'get_wallet_balance',
            outcome: 'completed',
            code: 'OK'
        });
        expect(JSON.stringify(recordAuditEntry.mock.calls[0][0])).not.toContain('must not be recorded');
    });
});