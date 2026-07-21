const {
    canonicalTenantIdentity,
    classifyTenantChatError,
    completeTenantChat,
    selectTenantModel
} = require('../src/services/nineRouterTenantChat');

describe('shared tenant-aware 9Router Chat runtime', () => {
    test('derives both tenant and user identity from one canonical Telegram ID', () => {
        expect(canonicalTenantIdentity(10001)).toEqual({
            tenantId: '10001',
            userId: '10001'
        });
        expect(() => canonicalTenantIdentity('tenant-a')).toThrow(
            expect.objectContaining({ code: 'TENANT_INVALID' })
        );
    });

    test('model selection is fail-closed to the tenant catalog', () => {
        const discovery = { modelIds: ['tenant-a/model-one', 'tenant-a/model-two'] };
        expect(selectTenantModel(discovery, 'tenant-a/model-two')).toBe('tenant-a/model-two');
        expect(() => selectTenantModel(discovery, 'tenant-b/private-model')).toThrow(
            expect.objectContaining({ code: 'MODEL_NOT_ALLOWED' })
        );
        expect(() => selectTenantModel({ modelIds: [] })).toThrow(
            expect.objectContaining({ code: 'NO_ALLOWED_MODELS' })
        );
    });

    test('discovery and inference receive exactly the same canonical tenant identity', async () => {
        const connection = {
            discover: jest.fn(async identity => ({
                provider: { id: '9router', label: '9Router' },
                models: [{ id: `${identity.tenantId}/model`, provider: '9router' }],
                upstreams: []
            }))
        };
        const orchestrator = {
            streamChat: jest.fn(async input => ({
                completed: true,
                text: `reply-${input.tenantId}`,
                engine: '9router',
                usage: { total_tokens: 3 }
            }))
        };

        const result = await completeTenantChat({
            userId: '10001',
            messages: [{ role: 'user', content: 'hello' }],
            connection,
            orchestrator,
            requestId: 'request-a'
        });

        expect(connection.discover).toHaveBeenCalledWith(
            { tenantId: '10001', userId: '10001' },
            { signal: undefined }
        );
        expect(orchestrator.streamChat).toHaveBeenCalledWith(
            expect.objectContaining({
                tenantId: '10001',
                userId: '10001',
                model: '10001/model',
                requestId: 'request-a'
            }),
            expect.objectContaining({ signal: undefined })
        );
        expect(result).toMatchObject({
            completed: true,
            text: 'reply-10001',
            model: '10001/model',
            provider: '9router'
        });
    });

    test('concurrent tenant A/B discovery and inference do not cross identities or models', async () => {
        const seen = [];
        const connection = {
            discover: jest.fn(async identity => {
                await new Promise(resolve => setTimeout(resolve, identity.tenantId === '10001' ? 8 : 1));
                return {
                    provider: { id: '9router', label: '9Router' },
                    models: [{ id: `private/${identity.tenantId}`, provider: '9router' }],
                    upstreams: []
                };
            })
        };
        const orchestrator = {
            streamChat: jest.fn(async input => {
                seen.push({ tenantId: input.tenantId, userId: input.userId, model: input.model });
                return { completed: true, text: input.model, engine: '9router' };
            })
        };

        const [tenantA, tenantB] = await Promise.all([
            completeTenantChat({
                userId: '10001',
                messages: [{ role: 'user', content: 'A' }],
                connection,
                orchestrator
            }),
            completeTenantChat({
                userId: '20002',
                messages: [{ role: 'user', content: 'B' }],
                connection,
                orchestrator
            })
        ]);

        expect(tenantA.model).toBe('private/10001');
        expect(tenantB.model).toBe('private/20002');
        expect(seen).toEqual(expect.arrayContaining([
            { tenantId: '10001', userId: '10001', model: 'private/10001' },
            { tenantId: '20002', userId: '20002', model: 'private/20002' }
        ]));
    });

    test('maps upstream failures to bounded user-safe categories', () => {
        expect(classifyTenantChatError({ status: 401 })).toBe('TENANT_NOT_CONFIGURED');
        expect(classifyTenantChatError({ status: 429 })).toBe('QUOTA_EXHAUSTED');
        expect(classifyTenantChatError({ code: 'MODEL_NOT_ALLOWED' })).toBe('MODEL_NOT_ALLOWED');
        expect(classifyTenantChatError({ code: 'UPSTREAM_TIMEOUT' })).toBe('UPSTREAM_TIMEOUT');
        expect(classifyTenantChatError(new Error('raw provider secret details'))).toBe('SIDECAR_UNAVAILABLE');
    });
});