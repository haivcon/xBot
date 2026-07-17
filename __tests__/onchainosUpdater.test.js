'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const updater = require('../scripts/update-onchainos-skills');
const {
    createOnchainosMcp,
    createHttpTransport,
    hashArgs
} = require('../src/services/onchainosMcp');

const COMMIT_A = 'a'.repeat(40);
const COMMIT_B = 'b'.repeat(40);

function makeTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'xbot-onchainos-'));
}

function writeArtifact(root, { commit = COMMIT_A, schemaVersion = 1, version = '2.2.6', tools } = {}) {
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'onchainos-skills.manifest.json'), JSON.stringify({
        schemaVersion,
        version,
        commit,
        tools: tools || [
            { name: 'market_price', access: 'read' },
            { name: 'send_transaction', access: 'write' }
        ]
    }));
    fs.writeFileSync(path.join(root, 'skill.md'), '# Safe fixture\nNo credentials.\n');
    return root;
}

function approvedLock(artifactPath, overrides = {}) {
    return {
        lockVersion: 1,
        repository: 'https://github.com/okx/onchainos-skills',
        commit: COMMIT_A,
        artifact: {
            source: artifactPath,
            sha256: updater.hashDirectory(artifactPath)
        },
        compatibility: {
            schemaVersion: 1,
            artifactVersion: '2.2.6',
            adapterVersion: '1.0.0'
        },
        licenseReview: {
            approved: true,
            redistributionApproved: true,
            license: 'Apache-2.0',
            reviewer: 'security@example.test',
            reviewedAt: '2026-07-17T00:00:00.000Z'
        },
        ...overrides
    };
}

function confirmationFor(context, tool, args, now = Date.now()) {
    return {
        confirmed: true,
        tenantId: context.tenantId,
        userId: context.userId,
        runId: context.runId,
        toolCallId: context.toolCallId,
        tool,
        argsHash: hashArgs(args),
        idempotencyKey: context.idempotencyKey,
        expiresAt: new Date(now + 30_000).toISOString(),
        simulation: { success: true }
    };
}

describe('OnchainOS safe updater', () => {
    let temp;

    beforeEach(() => {
        temp = makeTempDir();
    });

    afterEach(() => {
        fs.rmSync(temp, { recursive: true, force: true });
    });

    test('rejects an unpinned ref before staging', async () => {
        const artifact = writeArtifact(path.join(temp, 'artifact'));
        const lock = approvedLock(artifact, { commit: 'main' });

        await expect(updater.update({ lock, root: path.join(temp, 'store') }))
            .rejects.toMatchObject({ code: 'INVALID_COMMIT_PIN' });
        expect(fs.existsSync(path.join(temp, 'store', 'current.json'))).toBe(false);
    });

    test('rejects symbolic and hard-link archive entries before extraction', () => {
        expect(() => updater.validateArchiveEntries(
            'bundle/link\n',
            'lrwxrwxrwx owner/group 0 2026-01-01 00:00 bundle/link -> ../../outside\n'
        )).toThrow(expect.objectContaining({ code: 'ARTIFACT_LINK_REJECTED' }));
        expect(() => updater.validateArchiveEntries(
            'bundle/hardlink\n',
            'hrw-r--r-- owner/group 0 2026-01-01 00:00 bundle/hardlink link to bundle/file\n'
        )).toThrow(expect.objectContaining({ code: 'ARTIFACT_LINK_REJECTED' }));
    });

    test('fails closed when license review or redistribution approval is absent', async () => {
        const artifact = writeArtifact(path.join(temp, 'artifact'));
        const lock = approvedLock(artifact, {
            licenseReview: { approved: false, redistributionApproved: false }
        });

        await expect(updater.update({ lock, root: path.join(temp, 'store') }))
            .rejects.toMatchObject({ code: 'LICENSE_REVIEW_REQUIRED' });
    });

    test('rejects artifact checksum mismatch and incompatible schema', async () => {
        const artifact = writeArtifact(path.join(temp, 'artifact'));
        const badChecksum = approvedLock(artifact);
        badChecksum.artifact.sha256 = '0'.repeat(64);
        await expect(updater.update({ lock: badChecksum, root: path.join(temp, 'store-a') }))
            .rejects.toMatchObject({ code: 'ARTIFACT_CHECKSUM_MISMATCH' });

        const incompatible = approvedLock(artifact);
        incompatible.compatibility.schemaVersion = 2;
        await expect(updater.update({ lock: incompatible, root: path.join(temp, 'store-b') }))
            .rejects.toMatchObject({ code: 'SCHEMA_INCOMPATIBLE' });

        const incompatibleVersion = approvedLock(artifact);
        incompatibleVersion.compatibility.artifactVersion = '2.3.0';
        await expect(updater.update({ lock: incompatibleVersion, root: path.join(temp, 'store-c') }))
            .rejects.toMatchObject({ code: 'ARTIFACT_VERSION_MISMATCH' });
    });

    test('static scan rejects wallet secrets and does not promote staging', async () => {
        const artifact = writeArtifact(path.join(temp, 'artifact'));
        fs.writeFileSync(path.join(artifact, 'unsafe.js'), 'const privateKey = "0x123";');
        const lock = approvedLock(artifact);
        const root = path.join(temp, 'store');

        await expect(updater.update({ lock, root }))
            .rejects.toMatchObject({ code: 'WALLET_SECRET_DETECTED' });
        expect(fs.existsSync(path.join(root, 'current.json'))).toBe(false);
    });

    test('stages, atomically promotes, verifies current, and rolls back previous', async () => {
        const root = path.join(temp, 'store');
        const artifactA = writeArtifact(path.join(temp, 'artifact-a'));
        const first = await updater.update({ lock: approvedLock(artifactA), root });
        expect(first.status).toBe('promoted');
        await expect(updater.verifyCurrent({ root })).resolves.toMatchObject({
            status: 'verified',
            commit: COMMIT_A
        });

        const artifactB = writeArtifact(path.join(temp, 'artifact-b'), { commit: COMMIT_B, version: '2.3.0' });
        const lockB = approvedLock(artifactB, {
            commit: COMMIT_B,
            compatibility: { schemaVersion: 1, artifactVersion: '2.3.0', adapterVersion: '1.0.0' }
        });
        const second = await updater.update({ lock: lockB, root });
        expect(second.commit).toBe(COMMIT_B);
        expect(JSON.parse(fs.readFileSync(path.join(root, 'previous.json'))).commit).toBe(COMMIT_A);

        const rolledBack = await updater.rollback({ root });
        expect(rolledBack.commit).toBe(COMMIT_A);
        await expect(updater.verifyCurrent({ root })).resolves.toMatchObject({ commit: COMMIT_A });
        expect(fs.readdirSync(path.join(root, '.staging'))).toHaveLength(0);
    });

    test('a failing staging canary blocks promotion and leaves the current pointer unchanged', async () => {
        const root = path.join(temp, 'store');
        const artifact = writeArtifact(path.join(temp, 'artifact'));
        const canary = jest.fn().mockResolvedValue({ passed: false, reason: 'contract probe failed' });

        await expect(updater.update({ lock: approvedLock(artifact), root, canary }))
            .rejects.toMatchObject({ code: 'CANARY_FAILED' });
        expect(canary).toHaveBeenCalledWith(expect.objectContaining({
            commit: COMMIT_A,
            version: '2.2.6',
            directory: expect.any(String)
        }));
        expect(fs.existsSync(path.join(root, 'current.json'))).toBe(false);
    });

    test('verify-current detects modified promoted content', async () => {
        const root = path.join(temp, 'store');
        const artifact = writeArtifact(path.join(temp, 'artifact'));
        await updater.update({ lock: approvedLock(artifact), root });
        const pointer = JSON.parse(fs.readFileSync(path.join(root, 'current.json')));
        fs.appendFileSync(path.join(root, pointer.directory, 'skill.md'), 'tampered');

        await expect(updater.verifyCurrent({ root }))
            .rejects.toMatchObject({ code: 'CURRENT_CONTENT_MISMATCH' });
    });
});

describe('OnchainOS MCP adapter policy', () => {
    const context = {
        tenantId: 'tenant-a',
        userId: 'user-a',
        runId: 'run-a',
        toolCallId: 'call-a',
        idempotencyKey: 'idem-a'
    };

    test('rejects public or credential-bearing MCP endpoints before sending context or credentials', () => {
        for (const endpoint of [
            'https://api.example.com/mcp',
            'https://user:password@mcp.internal/rpc',
            'http://mcp.internal/rpc'
        ]) {
            expect(() => createHttpTransport({ endpoint }))
                .toThrow(expect.objectContaining({ code: 'MCP_ENDPOINT_INVALID' }));
        }
        expect(() => createHttpTransport({ endpoint: 'https://mcp.internal/rpc' })).not.toThrow();
    });

    test('is read-only by default and executes declared read tools', async () => {
        const callTool = jest.fn().mockResolvedValue({ price: '1.00' });
        const adapter = createOnchainosMcp({
            enabled: true,
            transport: { callTool },
            tools: [{ name: 'market_price', access: 'read' }]
        });

        await expect(adapter.callTool('market_price', { token: 'OKB' }, context))
            .resolves.toEqual({ price: '1.00' });
        await expect(adapter.callTool('unknown_tool', {}, context))
            .rejects.toMatchObject({ code: 'TOOL_NOT_ALLOWED' });
    });

    test('feature flag off uses the existing service and never returns fake success', async () => {
        const fallback = { getGasPrice: jest.fn().mockResolvedValue([{ gas: '1' }]) };
        const adapter = createOnchainosMcp({ enabled: false, fallback });

        await expect(adapter.callTool('getGasPrice', { chainIndex: '196' }, context))
            .resolves.toEqual([{ gas: '1' }]);
        expect(fallback.getGasPrice).toHaveBeenCalledWith('196');
        await expect(adapter.callTool('missing', {}, context))
            .rejects.toMatchObject({ code: 'FALLBACK_TOOL_UNAVAILABLE' });
    });

    test('write tools require opt-in and exact, unexpired explicit confirmation', async () => {
        const callTool = jest.fn().mockResolvedValue({ txHash: '0xabc' });
        const args = { chain: '196', to: '0xabc', amount: '1' };
        const readOnly = createOnchainosMcp({
            enabled: true,
            transport: { callTool },
            tools: [{ name: 'send_transaction', access: 'write' }]
        });
        await expect(readOnly.callTool('send_transaction', args, context))
            .rejects.toMatchObject({ code: 'MCP_WRITE_DISABLED' });

        const adapter = createOnchainosMcp({
            enabled: true,
            allowWrites: true,
            transport: { callTool },
            tools: [{ name: 'send_transaction', access: 'write' }]
        });
        await expect(adapter.callTool('send_transaction', args, context))
            .rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' });

        const mismatched = confirmationFor(context, 'send_transaction', args);
        mismatched.userId = 'other-user';
        await expect(adapter.callTool('send_transaction', args, { ...context, confirmation: mismatched }))
            .rejects.toMatchObject({ code: 'CONFIRMATION_MISMATCH' });

        const expired = confirmationFor(context, 'send_transaction', args, Date.now() - 60_000);
        await expect(adapter.callTool('send_transaction', args, { ...context, confirmation: expired }))
            .rejects.toMatchObject({ code: 'CONFIRMATION_EXPIRED' });
    });

    test('a confirmed write is idempotent and wallet secrets are rejected', async () => {
        const callTool = jest.fn().mockResolvedValue({ txHash: '0xabc' });
        const args = { chain: '196', to: '0xabc', amount: '1' };
        const adapter = createOnchainosMcp({
            enabled: true,
            allowWrites: true,
            transport: { callTool },
            tools: [{ name: 'send_transaction', access: 'write' }]
        });
        const confirmedContext = {
            ...context,
            confirmation: confirmationFor(context, 'send_transaction', args)
        };

        const first = await adapter.callTool('send_transaction', args, confirmedContext);
        const replay = await adapter.callTool('send_transaction', args, confirmedContext);
        expect(first).toEqual(replay);
        expect(callTool).toHaveBeenCalledTimes(1);

        const conflictingArgs = { ...args, amount: '2' };
        await expect(adapter.callTool('send_transaction', conflictingArgs, {
            ...context,
            confirmation: confirmationFor(context, 'send_transaction', conflictingArgs)
        })).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
        expect(callTool).toHaveBeenCalledTimes(1);

        await expect(adapter.callTool('send_transaction', {
            ...args,
            privateKey: 'do-not-accept'
        }, confirmedContext)).rejects.toMatchObject({ code: 'WALLET_SECRET_REJECTED' });
    });
});
