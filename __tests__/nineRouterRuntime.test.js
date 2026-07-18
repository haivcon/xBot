'use strict';

const { createNineRouterRuntime } = require('../src/services/nineRouterRuntime');

describe('9Router runtime connection lifecycle', () => {
    test('fails closed when the integration feature flag is disabled', async () => {
        const runtime = createNineRouterRuntime({ enabled: false });

        expect(runtime.getStatus()).toMatchObject({
            provider: '9router',
            featureEnabled: false,
            connected: false,
            code: 'FEATURE_DISABLED'
        });
        expect(() => runtime.assertConnected()).toThrow(expect.objectContaining({ code: 'FEATURE_DISABLED' }));
        await expect(runtime.connect({ probe: jest.fn() }))
            .rejects.toMatchObject({ code: 'FEATURE_DISABLED' });
    });

    test('connects only after a successful private model-discovery probe', async () => {
        const runtime = createNineRouterRuntime({ enabled: true });
        expect(runtime.getStatus()).toMatchObject({ connected: false, code: 'DISCONNECTED' });
        const probe = jest.fn().mockResolvedValue({
            models: [{ id: 'route-safe' }, { id: 'route-fast' }],
            upstreams: [{ id: 'claude' }]
        });

        await expect(runtime.connect({ probe })).resolves.toMatchObject({
            connected: true,
            modelCount: 2,
            upstreamCount: 1,
            code: 'CONNECTED'
        });
        expect(probe).toHaveBeenCalledTimes(1);
        expect(() => runtime.assertConnected()).not.toThrow();

        const failing = createNineRouterRuntime({ enabled: true, connected: false });
        await expect(failing.connect({ probe: jest.fn().mockRejectedValue(Object.assign(new Error('private details'), { code: 'DISCOVERY_UPSTREAM_ERROR' })) }))
            .rejects.toMatchObject({ code: 'DISCOVERY_UPSTREAM_ERROR' });
        expect(failing.getStatus()).toMatchObject({ connected: false, code: 'DISCONNECTED' });
    });

    test('disconnect wins if a connection probe is still in flight', async () => {
        const runtime = createNineRouterRuntime({ enabled: true });
        let finishProbe;
        const probe = new Promise(resolve => { finishProbe = resolve; });
        let probeSignal;
        const connecting = runtime.connect({
            probe: ({ signal }) => {
                probeSignal = signal;
                return probe;
            }
        });

        runtime.disconnect();
        expect(probeSignal.aborted).toBe(true);
        finishProbe({ models: [{ id: 'route-safe' }] });

        await expect(connecting).rejects.toMatchObject({ code: 'CONNECTION_DISABLED' });
        expect(runtime.getStatus()).toMatchObject({ connected: false, code: 'DISCONNECTED' });
    });

    test('a newer connection probe supersedes an older pending probe', async () => {
        const runtime = createNineRouterRuntime({ enabled: true });
        let finishFirst;
        const firstProbe = new Promise(resolve => { finishFirst = resolve; });
        const first = runtime.connect({ probe: () => firstProbe });
        const second = runtime.connect({
            probe: jest.fn().mockResolvedValue({ models: [{ id: 'new-route' }, { id: 'new-fast' }] })
        });

        await expect(second).resolves.toMatchObject({ connected: true, modelCount: 2 });
        finishFirst({ models: [{ id: 'stale-route' }] });
        await expect(first).rejects.toMatchObject({ code: 'CONNECTION_SUPERSEDED' });
        expect(runtime.getStatus()).toMatchObject({ connected: true, modelCount: 2 });
    });

    test('disconnect aborts active streams and keeps cancellation idempotent', () => {
        const runtime = createNineRouterRuntime({ enabled: true, connected: true });
        const first = new AbortController();
        const second = new AbortController();
        const unregisterFirst = runtime.register(first);
        runtime.register(second);
        unregisterFirst();

        expect(runtime.disconnect()).toMatchObject({ connected: false, cancelledRequests: 1 });
        expect(first.signal.aborted).toBe(false);
        expect(second.signal.aborted).toBe(true);
        expect(runtime.disconnect()).toMatchObject({ connected: false, cancelledRequests: 0 });
        expect(() => runtime.assertConnected()).toThrow(expect.objectContaining({ code: 'CONNECTION_DISABLED' }));
    });

    test('reports bounded aggregate usage without secrets or tenant identifiers', () => {
        const runtime = createNineRouterRuntime({ enabled: true, connected: true });
        runtime.recordUsage({ prompt_tokens: 12, completion_tokens: 3, total_tokens: 15, apiKey: 'must-not-leak', tenantId: 'tenant-a' });
        runtime.recordUsage({ prompt_tokens: -5, completion_tokens: 'bad', total_tokens: 2 });

        const status = runtime.getStatus({ configured: true });
        expect(status.usage).toEqual({ requests: 2, promptTokens: 12, completionTokens: 3, totalTokens: 17 });
        expect(JSON.stringify(status)).not.toMatch(/must-not-leak|tenant-a|apiKey/i);
    });
});
