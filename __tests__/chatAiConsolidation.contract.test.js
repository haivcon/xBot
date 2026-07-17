const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

const removedFiles = [
    'dashboard/xBot/src/pages/user/AiTraderPage.jsx',
    'dashboard/xBot/src/components/AiTraderPanel.jsx',
    'dashboard/xBot/src/pages/user/SmartCopyPage.jsx',
    'dashboard/xBot/src/pages/user/OKXAIPage.jsx',
    'src/features/autoTrading.js',
    'src/features/tradeExecutionEngine.js',
    'src/features/smartCopyEngine.js',
    'src/features/ai/onchain/smartCopyTools.js',
    'src/commands/okxai.js',
    'src/features/ai/okxaiTools.js',
    'src/services/okxai/index.js',
    'src/services/okxai/agent.js',
    'src/services/okxai/taskManager.js',
    'src/services/okxai/a2a.js',
    'src/services/okxai/wallet.js',
    'src/services/okxai/x402Enhanced.js',
    'src/services/agentRuntime/index.js',
    'src/services/agentRuntime/policy.js',
    'src/services/agentRuntime/limits.js',
    'src/services/agentRuntime/toolRegistry.js',
    'src/services/agentRuntime/inbox.js',
    'src/services/agentRuntime/audit.js',
    '__tests__/agentRuntime.test.js',
    'docs/OKXAI_AGENT_RUNTIME.md',
    'docs/XBOT_OKXAI_BRIDGE_SETUP_MULTILANGUAGE.md',
    'src/features/copyTrading.js',
    'src/features/smartOrderExecutor.js',
];

describe('legacy AI and copy surfaces are retired', () => {
    test('legacy implementation files are deleted', () => {
        for (const relativePath of removedFiles) {
            expect(fs.existsSync(path.join(ROOT, relativePath))).toBe(false);
        }
    });

    test('old dashboard URLs intentionally redirect to Chat AI without old imports', () => {
        const app = read('dashboard/xBot/src/App.jsx');
        expect(app).not.toMatch(/AiTraderPage|SmartCopyPage|OKXAIPage/);
        for (const route of ['ai-trader', 'smart-copy', 'okx-ai']) {
            expect(app).toContain(`<Route path="${route}" element={<Navigate to="/chat" />} />`);
        }
    });

    test('AI & Chat navigation contains Chat AI only', () => {
        const sidebar = read('dashboard/xBot/src/components/layout/Sidebar.jsx');
        const aiGroup = sidebar.match(/key: 'ai',[\s\S]*?\n\s*},\n\s*{\n\s*key: 'finance'/)?.[0] || '';
        expect(aiGroup).toContain("to: '/chat'");
        expect(aiGroup).not.toMatch(/ai-trader|smart-copy|okx-ai|AI Trader|Smart Copy|OKX\.AI/);
    });

    test('Chat AI has no legacy trading panel or copy/auto-trading prompts', () => {
        expect(read('dashboard/xBot/src/pages/user/ChatPage.jsx')).not.toMatch(
            /AiTraderPanel|showAiTrader|\/copy-trade|\/auto-trade|Copy trading|AI Auto Trading/
        );
    });

    test('old private APIs and custom OKX AI tools are unreachable', () => {
        expect(read('src/server/dashboardRoutes.js')).not.toMatch(/['"]\/(?:smart-copy|okxai|agent-runtime)(?:\/|['"])/);
        expect(read('src/server/chatRoutes.js')).not.toMatch(/okxaiTools|OkxAi|okxaiDecls|isOkxAiToolName/);
    });

    test('Chat routes preserve the web-tool executor call contract', () => {
        const routes = read('src/server/chatRoutes.js');
        expect(routes).toContain('executeWebToolCall(functionCall, ctx)');
        expect(routes).toContain('executeWebToolCall({ name: tc.name, args }, ctx)');
        expect(routes).toContain('executeToolCall(functionCall, ctx)');
        expect(routes).toContain('executeToolCall({ name: tc.name, args }, ctx)');
        expect(routes).not.toMatch(/execute(?:Web)?ToolCall\(\{ functionCall/);
    });

    test('Chat V2 does not persist or emit done for a cancelled upstream run', () => {
        const routes = read('src/server/chatRoutes.js');
        expect(routes).toMatch(/if \(!result\.completed\) \{[\s\S]*?res\.end\(\);[\s\S]*?return;/);
    });

    test('Hermes approvals are exposed through a tenant-bound Node route and all chat surfaces handle them', () => {
        const routes = read('src/server/chatRoutes.js');
        const api = read('dashboard/xBot/src/api/client.js');
        expect(routes).toContain("router.post('/chat/hermes/:runId/approval'");
        expect(routes).toContain('tenantId: String(req.dashboardUser?.tenantId || userId)');
        expect(routes).toContain("if (!['once', 'deny'].includes(choice))");
        expect(api).toContain("currentEvent === 'approval-required'");
        expect(api).toContain("approved ? 'once' : 'deny'");
        for (const file of [
            'dashboard/xBot/src/pages/user/ChatPage.jsx',
            'dashboard/xBot/src/components/ChatWidget.jsx',
            'dashboard/xBot/src/components/chat/FloatingChat.jsx'
        ]) {
            expect(read(file)).toContain('onApprovalRequired: data => api.confirmHermesApproval(data)');
        }
    });

    test('old onchain tool handlers and declarations are gone', () => {
        expect(read('src/features/ai/ai-onchain.js')).not.toMatch(/smartCopyTools/);
        expect(read('src/features/ai/onchain/marketTools.js')).not.toMatch(/manage_auto_trading|manage_copy_trading|copyTrading|autoTrading/);
        expect(read('src/features/ai/onchain/declarations.js')).not.toMatch(/manage_auto_trading|manage_copy_trading|name: 'smart_copy'/);
        expect(read('src/app/coreCommands.js')).not.toMatch(/copy\|(?:yes|no|unfollow)\||features\/copyTrading/);
    });

    test('legacy SKUs and runtime configuration are removed', () => {
        expect(read('src/services/x402PaymentService.js')).not.toMatch(/['"](?:auto_trading|copy_trading)['"]/);
        expect(read('.env.example')).not.toMatch(/^(?:OKXAI|OKX_AI|AGENT_RUNTIME)_[A-Z0-9_]+=/m);
        expect(read('.env.example')).not.toMatch(/^(?:AI_ROUTER_DEFAULT_PROVIDER|AI_ROUTER_ALLOW_USER_KEYS|AI_ROUTER_USER_KEYS_SECRET|AI_ROUTER_USER_KEYS_FILE|OPENROUTER_API_KEY|OPENROUTER_BASE_URL|OPENROUTER_MODEL)=/m);
        expect(read('.env.example')).toContain('DEFAULT_AI_PROVIDER=9router');
        expect(read('src/services/aiRouter/providers.js')).toContain('Boolean(NINEROUTER_CHAT_COMPLETIONS_URL)');
    });

    test('OnchainOS never falls back to repository-embedded credentials', () => {
        const service = read('src/services/onchainos.js');
        expect(service).not.toMatch(/SANDBOX_(?:API_KEY|SECRET_KEY|PASSPHRASE)/);
        expect(service).toMatch(/ONCHAINOS_CREDENTIALS_REQUIRED/);
    });

    test('dashboard catalog and translations do not advertise removed pages', () => {
        expect(read('dashboard/xBot/src/pages/LandingPage.jsx')).not.toMatch(/pageAiTraderDesc|pageSmartCopyDesc|AI Trader|Smart Copy/);
        expect(read('dashboard/xBot/src/i18n/index.js')).not.toMatch(/smartCopyPage|aiTraderPage|pageAiTraderDesc|pageSmartCopyDesc|suggestCopy|suggestAutoTrading/);
    });
});
