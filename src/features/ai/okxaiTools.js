/**
 * OKX.AI tool declarations and executor for AI providers.
 *
 * This keeps provider-specific function-calling lightweight: any model/provider
 * can ask xBot to execute these tools, while xBot remains the bridge to OKX.AI.
 */
const okxai = require('../../services/okxai');

const OKXAI_TOOL_NAMES = {
    SEARCH_AGENTS: 'okxai_search_agents',
    CREATE_TASK: 'okxai_create_task',
    GET_TASK: 'okxai_get_task',
    NEGOTIATE_TASK: 'okxai_negotiate_task',
    ACCEPT_TASK: 'okxai_accept_task',
    DELIVER_TASK: 'okxai_deliver_task',
    EVALUATE_TASK: 'okxai_evaluate_task',
    WALLET_STATUS: 'okxai_wallet_status',
    WALLET_BALANCES: 'okxai_wallet_balances'
};

const okxaiToolDeclarations = [
    {
        name: OKXAI_TOOL_NAMES.SEARCH_AGENTS,
        description: 'Search OKX.AI agents/providers by role, keyword or capability.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search keyword, e.g. trading bot, data analyst, image generator.' },
                role: { type: 'string', enum: ['user', 'asp', 'evaluator'], description: 'Agent role filter.' },
                limit: { type: 'number', description: 'Maximum number of agents to return.' }
            }
        }
    },
    {
        name: OKXAI_TOOL_NAMES.CREATE_TASK,
        description: 'Publish an OKX.AI A2A task to a selected ASP/provider agent.',
        parameters: {
            type: 'object',
            required: ['aspAgentId', 'prompt'],
            properties: {
                aspAgentId: { type: 'string', description: 'Target ASP/provider agent ID.' },
                title: { type: 'string', description: 'Short task title.' },
                prompt: { type: 'string', description: 'Task description and acceptance criteria.' },
                budget: { type: 'string', description: 'Optional task budget.' },
                currency: { type: 'string', description: 'Budget currency, usually USDT.' }
            }
        }
    },
    {
        name: OKXAI_TOOL_NAMES.GET_TASK,
        description: 'Get or sync an OKX.AI task by taskId/jobId.',
        parameters: {
            type: 'object',
            required: ['taskId'],
            properties: {
                taskId: { type: 'string', description: 'OKX.AI taskId or jobId.' }
            }
        }
    },
    {
        name: OKXAI_TOOL_NAMES.NEGOTIATE_TASK,
        description: 'Send negotiation terms or a clarification message for an OKX.AI A2A task.',
        parameters: {
            type: 'object',
            required: ['taskId', 'message'],
            properties: {
                taskId: { type: 'string', description: 'OKX.AI taskId or jobId.' },
                message: { type: 'string', description: 'Negotiation message to send.' },
                budget: { type: 'string', description: 'Optional proposed budget.' },
                currency: { type: 'string', description: 'Optional proposed budget currency.' },
                deadline: { type: 'string', description: 'Optional proposed deadline.' }
            }
        }
    },
    {
        name: OKXAI_TOOL_NAMES.ACCEPT_TASK,
        description: 'Accept an OKX.AI A2A task after agreement.',
        parameters: {
            type: 'object',
            required: ['taskId'],
            properties: {
                taskId: { type: 'string', description: 'OKX.AI taskId or jobId.' }
            }
        }
    },
    {
        name: OKXAI_TOOL_NAMES.DELIVER_TASK,
        description: 'Deliver the final result for an OKX.AI A2A task.',
        parameters: {
            type: 'object',
            required: ['taskId', 'result'],
            properties: {
                taskId: { type: 'string', description: 'OKX.AI taskId or jobId.' },
                result: { type: 'string', description: 'Final deliverable, summary, URL, or structured result text.' }
            }
        }
    },
    {
        name: OKXAI_TOOL_NAMES.EVALUATE_TASK,
        description: 'Evaluate or rate a completed OKX.AI A2A task.',
        parameters: {
            type: 'object',
            required: ['taskId', 'rating'],
            properties: {
                taskId: { type: 'string', description: 'OKX.AI taskId or jobId.' },
                rating: { type: 'number', description: 'Rating score, usually 1-5.' },
                comment: { type: 'string', description: 'Optional evaluation comment.' }
            }
        }
    },
    {
        name: OKXAI_TOOL_NAMES.WALLET_STATUS,
        description: 'Check OKX Agentic Wallet status for a user.',
        parameters: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: 'Application user ID. Defaults to Telegram user ID.' }
            }
        }
    },
    {
        name: OKXAI_TOOL_NAMES.WALLET_BALANCES,
        description: 'Read OKX Agentic Wallet balances for a user and optional chain.',
        parameters: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: 'Application user ID. Defaults to Telegram user ID.' },
                chainId: { type: 'string', description: 'Optional chain ID or network name.' }
            }
        }
    }
];

function toGeminiFunctionDeclarations() {
    return okxaiToolDeclarations.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
    }));
}

function toOpenAiTools() {
    return okxaiToolDeclarations.map((tool) => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }
    }));
}

async function executeOkxAiTool(name, args = {}, context = {}) {
    const localUserId = args.userId || context.userId || context.telegramUserId || 'server';

    switch (name) {
    case OKXAI_TOOL_NAMES.SEARCH_AGENTS:
        return okxai.agent.searchAgents({
            query: args.query,
            role: args.role,
            limit: args.limit || 10
        }, context.okxaiOptions);

    case OKXAI_TOOL_NAMES.CREATE_TASK:
        return okxai.taskManager.publishTask({
            localUserId,
            aspAgentId: args.aspAgentId,
            title: args.title || String(args.prompt || '').slice(0, 80),
            prompt: args.prompt,
            budget: args.budget,
            currency: args.currency || 'USDT',
            metadata: {
                source: 'ai_tool',
                telegramChatId: context.chatId,
                telegramMessageId: context.messageId
            }
        }, context.okxaiOptions);

    case OKXAI_TOOL_NAMES.GET_TASK:
        return okxai.taskManager.syncTask(args.taskId, context.okxaiOptions);

    case OKXAI_TOOL_NAMES.NEGOTIATE_TASK:
        return okxai.taskManager.negotiate(args.taskId, {
            message: args.message,
            budget: args.budget,
            currency: args.currency,
            deadline: args.deadline
        }, context.okxaiOptions);

    case OKXAI_TOOL_NAMES.ACCEPT_TASK:
        return okxai.taskManager.accept(args.taskId, context.okxaiOptions);

    case OKXAI_TOOL_NAMES.DELIVER_TASK:
        return okxai.taskManager.deliver(args.taskId, args.result, context.okxaiOptions);

    case OKXAI_TOOL_NAMES.EVALUATE_TASK:
        return okxai.taskManager.evaluate(args.taskId, args.rating, args.comment || '', context.okxaiOptions);

    case OKXAI_TOOL_NAMES.WALLET_STATUS:
        return okxai.wallet.getWalletStatus(localUserId, context.okxaiOptions);

    case OKXAI_TOOL_NAMES.WALLET_BALANCES:
        return okxai.wallet.getBalances(localUserId, args.chainId, context.okxaiOptions);

    default:
        throw new Error(`Unsupported OKX.AI tool: ${name}`);
    }
}

function isOkxAiToolName(name) {
    return Object.values(OKXAI_TOOL_NAMES).includes(name);
}

module.exports = {
    OKXAI_TOOL_NAMES,
    okxaiToolDeclarations,
    toGeminiFunctionDeclarations,
    toOpenAiTools,
    executeOkxAiTool,
    isOkxAiToolName
};