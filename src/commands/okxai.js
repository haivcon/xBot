const { sendReply } = require('../utils/chat');
const okxai = require('../services/okxai');

function parseArgs(text = '') {
    const parts = text.trim().split(/\s+/);
    parts.shift();
    return parts;
}

function helpText() {
    return [
        '<b>OKX.AI xBot Bridge</b>',
        '',
        'Dùng xBot như cầu nối OKX.AI ↔ AI provider của server/người dùng (9router, Gemini, OpenAI, Groq).',
        '',
        '<b>Lệnh nhanh</b>',
        '/okxai status - xem agent cục bộ',
        '/okxai register <tên agent> - tạo agent identity draft/local',
        '/okxai task <aspAgentId> | <nội dung> - publish task A2A',
        '/okxai tasks - danh sách task local',
        '',
        'Cấu hình env chính: OKXAI_API_URL, OKXAI_A2A_URL, OKXAI_API_KEY, OKXAI_AGENT_ID, OKXAI_DRY_RUN=true.'
    ].join('\n');
}

module.exports = {
    command: /^\/okxai(?:@[^\s]+)?(?:\s|$)/i,
    handler: async (msg) => {
        const text = msg.text || msg.caption || '';
        const args = parseArgs(text);
        const sub = (args.shift() || 'help').toLowerCase();
        const userId = msg.from?.id?.toString();

        try {
            if (sub === 'help') {
                await sendReply(msg, helpText(), { parse_mode: 'HTML' });
                return;
            }

            if (sub === 'status') {
                const agent = await okxai.agent.getLocalAgent(userId || 'server') || await okxai.agent.getLocalAgent('server');
                if (!agent) {
                    await sendReply(msg, 'Chưa có OKX.AI agent local. Dùng /okxai register <tên agent>.', { parse_mode: 'HTML' });
                    return;
                }
                await sendReply(msg, [
                    '<b>OKX.AI Agent</b>',
                    `ID: <code>${agent.agentId}</code>`,
                    `Role: <code>${agent.role}</code>`,
                    `Status: <code>${agent.status}</code>`,
                    `Name: ${agent.name}`,
                    agent.endpoint ? `Endpoint: <code>${agent.endpoint}</code>` : ''
                ].filter(Boolean).join('\n'), { parse_mode: 'HTML' });
                return;
            }

            if (sub === 'register') {
                const name = args.join(' ').trim() || `xBot Agent ${userId || 'server'}`;
                const agent = await okxai.agent.registerAgent({
                    localUserId: userId || 'server',
                    role: process.env.OKXAI_AGENT_ROLE || 'user',
                    name,
                    endpoint: process.env.OKXAI_AGENT_ENDPOINT || process.env.PUBLIC_BASE_URL,
                    metadata: { telegramUserId: userId }
                }, { dryRun: String(process.env.OKXAI_DRY_RUN || 'true').toLowerCase() !== 'false' });

                await sendReply(msg, [
                    'Đã tạo OKX.AI agent identity.',
                    `ID: <code>${agent.agentId}</code>`,
                    `Status: <code>${agent.status}</code>`,
                    'Đặt OKXAI_DRY_RUN=false khi đã có OKX.AI endpoint/API key thật.'
                ].join('\n'), { parse_mode: 'HTML' });
                return;
            }

            if (sub === 'task') {
                const payload = args.join(' ');
                const [aspAgentId, prompt] = payload.split('|').map((v) => v?.trim());
                if (!aspAgentId || !prompt) {
                    await sendReply(msg, 'Cú pháp: /okxai task <aspAgentId> | <nội dung task>', { parse_mode: 'HTML' });
                    return;
                }
                const task = await okxai.taskManager.publishTask({
                    localUserId: userId,
                    aspAgentId,
                    title: prompt.slice(0, 80),
                    prompt,
                    metadata: { telegramChatId: msg.chat?.id, telegramMessageId: msg.message_id }
                });
                await sendReply(msg, `Đã publish OKX.AI task: <code>${task.taskId}</code>\nStatus: <code>${task.status}</code>`, { parse_mode: 'HTML' });
                return;
            }

            if (sub === 'tasks') {
                const tasks = await okxai.taskManager.listLocalTasks(userId, 10);
                if (!tasks.length) {
                    await sendReply(msg, 'Chưa có task OKX.AI local.', { parse_mode: 'HTML' });
                    return;
                }
                const lines = tasks.map((task) => `• <code>${task.taskId}</code> — ${task.status} — ${task.title || task.prompt || ''}`);
                await sendReply(msg, ['<b>OKX.AI tasks</b>', ...lines].join('\n'), { parse_mode: 'HTML' });
                return;
            }

            await sendReply(msg, helpText(), { parse_mode: 'HTML' });
        } catch (error) {
            await sendReply(msg, `OKX.AI error: <code>${error.message}</code>`, { parse_mode: 'HTML' });
        }
    }
};