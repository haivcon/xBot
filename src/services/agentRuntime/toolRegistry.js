/**
 * Agent Runtime tool registry.
 *
 * Provides MCP/OpenAI-style tool metadata with risk levels and protected flags.
 */
const { okxaiToolDeclarations, executeOkxAiTool, isOkxAiToolName } = require('../../features/ai/okxaiTools');

const TOOL_POLICIES = {
    okxai_search_agents: { riskLevel: 'low', protected: false, action: 'agent_search' },
    okxai_create_task: { riskLevel: 'medium', protected: true, action: 'task_create' },
    okxai_get_task: { riskLevel: 'low', protected: false, action: 'task_read' },
    okxai_negotiate_task: { riskLevel: 'medium', protected: false, action: 'task_negotiate' },
    okxai_accept_task: { riskLevel: 'high', protected: true, action: 'task_accept' },
    okxai_deliver_task: { riskLevel: 'high', protected: true, action: 'task_deliver' },
    okxai_evaluate_task: { riskLevel: 'high', protected: true, action: 'task_evaluate' },
    okxai_wallet_status: { riskLevel: 'low', protected: false, action: 'wallet_status' },
    okxai_wallet_balances: { riskLevel: 'low', protected: false, action: 'wallet_read' }
};

function listTools() {
    return okxaiToolDeclarations.map((tool) => ({
        ...tool,
        inputSchema: tool.parameters,
        ...(TOOL_POLICIES[tool.name] || { riskLevel: 'unknown', protected: true, action: tool.name })
    }));
}

function getTool(name) {
    return listTools().find((tool) => tool.name === name) || null;
}

function isProtectedTool(name) {
    return Boolean(getTool(name)?.protected);
}

function getToolAction(name) {
    return getTool(name)?.action || name;
}

async function executeTool(name, args = {}, context = {}) {
    if (!isOkxAiToolName(name)) {
        throw new Error(`Unsupported runtime tool: ${name}`);
    }
    return executeOkxAiTool(name, args, context);
}

module.exports = {
    TOOL_POLICIES,
    listTools,
    getTool,
    isProtectedTool,
    getToolAction,
    executeTool
};