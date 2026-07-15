/**
 * DEX Signal Skill — Smart Money / KOL / Whale Tracking
 * 
 * Based on onchainos okx-dex-signal spec v2.2.6:
 * - Address tracker: raw DEX transaction feed for smart money, KOL, or custom wallets
 * - Aggregated buy signals: tokens bought collectively by smart money/KOL/whales
 * - Leaderboard: top traders by PnL, win rate, volume, ROI
 */

// ═══════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════

const TRACKER_TYPES = {
    smart_money: '1',
    kol: '2',
    whale: '3',
    multi_address: '4'
};

const SIGNAL_WALLET_TYPES = {
    smart_money: '1',
    kol: '2',
    whale: '3'
};

const LEADERBOARD_SORT = {
    pnl: '1',
    win_rate: '2',
    tx_count: '3',
    volume: '4',
    roi: '5'
};

const LEADERBOARD_TIME_FRAMES = {
    '24h': '1',
    '7d': '2',
    '30d': '3'
};

// ═══════════════════════════════════════════════════════
// AI Tools
// ═══════════════════════════════════════════════════════

const DEX_SIGNAL_TOOLS = [{
    functionDeclarations: [
        {
            name: 'track_smart_money',
            description: 'Track smart money, KOL, or whale DEX transaction feed. Shows real-time buy/sell activities of notable wallets. Use when user asks "what are smart money buying", "KOL trades", "track whale activity", "聪明钱在买什么", "追踪KOL".',
            parameters: {
                type: 'object',
                properties: {
                    tracker_type: {
                        type: 'string',
                        description: 'Type of tracker: "smart_money", "kol", "whale", or "multi_address" for custom wallets',
                        enum: ['smart_money', 'kol', 'whale', 'multi_address']
                    },
                    chain_index: { type: 'string', description: 'Chain ID (e.g., 1 for ETH, 501 for Solana). Optional — defaults to all chains.' },
                    trade_type: { type: 'string', description: '"1" for buy only, "2" for sell only, omit for all', enum: ['1', '2'] },
                    addresses: { type: 'string', description: 'Comma-separated wallet addresses (required only for multi_address type)' },
                    limit: { type: 'string', description: 'Number of results (default: 10, max: 50)' }
                },
                required: ['tracker_type']
            }
        },
        {
            name: 'get_buy_signals',
            description: 'Get aggregated buy signal alerts — tokens being bought collectively by smart money, KOL, or whales. Shows consensus buying activity. Use when user asks "buy signals", "大户信号", "what tokens are whales buying together", "聪明钱信号".',
            parameters: {
                type: 'object',
                properties: {
                    wallet_type: {
                        type: 'string',
                        description: 'Signal source: "smart_money", "kol", or "whale"',
                        enum: ['smart_money', 'kol', 'whale']
                    },
                    chain_index: { type: 'string', description: 'Chain ID (optional, defaults to all chains)' },
                    limit: { type: 'string', description: 'Number of results (default: 10)' }
                },
                required: []
            }
        },
        {
            name: 'get_trader_leaderboard',
            description: 'Get top trader leaderboard rankings. Shows best performers by PnL, win rate, volume, or ROI. Use when user asks "top traders", "牛人榜", "best traders", "who profits most", "leaderboard".',
            parameters: {
                type: 'object',
                properties: {
                    chain_index: { type: 'string', description: 'Chain ID (optional, defaults to all chains)' },
                    sort_by: {
                        type: 'string',
                        description: 'Sort criterion: "pnl", "win_rate", "tx_count", "volume", or "roi"',
                        enum: ['pnl', 'win_rate', 'tx_count', 'volume', 'roi']
                    },
                    time_frame: {
                        type: 'string',
                        description: 'Time window: "24h", "7d", or "30d"',
                        enum: ['24h', '7d', '30d']
                    },
                    limit: { type: 'string', description: 'Number of results (default: 10)' }
                },
                required: []
            }
        },
        {
            name: 'get_signal_chains',
            description: 'List all chains supported for smart money signal tracking.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        },
        {
            name: 'get_leaderboard_chains',
            description: 'List all chains supported for the trader leaderboard.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    ]
}];

// ═══════════════════════════════════════════════════════
// Formatters
// ═══════════════════════════════════════════════════════

function formatUsd(value) {
    const n = Number(value);
    if (isNaN(n)) return '$0';
    if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
}

function formatPercent(value) {
    const n = Number(value);
    if (isNaN(n)) return '0%';
    return `${(n * 100).toFixed(1)}%`;
}

function shortenAddr(addr) {
    if (!addr || addr.length < 10) return addr || 'N/A';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimestamp(ts) {
    if (!ts) return '';
    const d = new Date(Number(ts) * 1000);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ═══════════════════════════════════════════════════════
// Tool Handlers
// ═══════════════════════════════════════════════════════

const signalHandlers = {
    async track_smart_money(args) {
        try {
            const onchainos = require('../../services/onchainos');
            const trackerType = TRACKER_TYPES[args.tracker_type] || '1';
            
            const params = {
                trackerType,
                chainIndex: args.chain_index,
                tradeType: args.trade_type,
                limit: args.limit || '10'
            };

            if (args.tracker_type === 'multi_address' && args.addresses) {
                params.addresses = args.addresses;
            }

            const result = await onchainos.getAddressTrackerActivities(params);
            const data = result?.data || result;
            const activities = data?.activityList || data?.data || [];

            if (!activities || activities.length === 0) {
                return `📡 No recent ${args.tracker_type.replace('_', ' ')} activity found. Try a different chain or tracker type.`;
            }

            const typeLabel = {
                smart_money: '🧠 Smart Money',
                kol: '🎯 KOL',
                whale: '🐋 Whale',
                multi_address: '📍 Custom Address'
            }[args.tracker_type] || '📡 Tracker';

            const tradeLabel = args.trade_type === '2' ? ' (Sells)' : args.trade_type === '1' ? ' (Buys)' : '';
            const chainLabel = args.chain_index ? ` | Chain ${args.chain_index}` : '';

            const parts = [`${typeLabel} Activity Feed${tradeLabel}${chainLabel}\n`];

            for (const act of activities.slice(0, 15)) {
                const side = act.tradeType === '2' || act.side === 'sell' ? '🔴 SELL' : '🟢 BUY';
                const symbol = act.tokenSymbol || act.symbol || 'Unknown';
                const amount = act.amount ? formatUsd(act.amount) : '';
                const price = act.price ? `@ $${Number(act.price).toPrecision(4)}` : '';
                const wallet = shortenAddr(act.walletAddress || act.address);
                const time = formatTimestamp(act.timestamp || act.time);

                parts.push(`${side} ${symbol} ${amount} ${price}`);
                parts.push(`  👤 ${wallet} ${time ? `| ${time}` : ''}`);
            }

            if (activities.length > 15) {
                parts.push(`\n... and ${activities.length - 15} more activities`);
            }

            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to fetch tracker data: ${err.message}`;
        }
    },

    async get_buy_signals(args) {
        try {
            const onchainos = require('../../services/onchainos');
            const walletType = SIGNAL_WALLET_TYPES[args.wallet_type] || undefined;

            const result = await onchainos.getSignalList(args.chain_index, {
                walletType,
                limit: args.limit || '10'
            });
            const data = result?.data || result;
            const signals = data?.signalList || data?.data || [];

            if (!signals || signals.length === 0) {
                return `📡 No active buy signals found. Try a different chain or wallet type.`;
            }

            const typeLabel = {
                smart_money: '🧠 Smart Money',
                kol: '🎯 KOL',
                whale: '🐋 Whale'
            }[args.wallet_type] || '📡 All';

            const parts = [`${typeLabel} Buy Signals\n`];

            for (const sig of signals.slice(0, 15)) {
                const symbol = sig.tokenSymbol || sig.symbol || 'Unknown';
                const chain = sig.chainIndex || sig.chainId || '?';
                const buyCount = sig.buyCount || sig.count || 0;
                const totalAmount = sig.totalAmount ? formatUsd(sig.totalAmount) : '';
                const price = sig.price ? `$${Number(sig.price).toPrecision(4)}` : '';
                const change = sig.priceChange24h ? ` (${Number(sig.priceChange24h) >= 0 ? '+' : ''}${(Number(sig.priceChange24h) * 100).toFixed(1)}%)` : '';

                parts.push(`🔔 ${symbol} — ${buyCount} buys ${totalAmount ? `| ${totalAmount}` : ''}`);
                parts.push(`   ${price}${change} | Chain: ${chain}`);
                if (sig.tokenContractAddress) {
                    parts.push(`   📋 ${shortenAddr(sig.tokenContractAddress)}`);
                }
            }

            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to fetch buy signals: ${err.message}`;
        }
    },

    async get_trader_leaderboard(args) {
        try {
            const onchainos = require('../../services/onchainos');
            const sortBy = LEADERBOARD_SORT[args.sort_by] || '1';
            const timeFrame = LEADERBOARD_TIME_FRAMES[args.time_frame] || '2';

            const result = await onchainos.getLeaderboardList({
                chainIndex: args.chain_index,
                sortBy,
                timeFrame,
                limit: args.limit || '10'
            });
            const data = result?.data || result;
            const traders = data?.traderList || data?.data || [];

            if (!traders || traders.length === 0) {
                return `🏆 No leaderboard data found. Try a different chain or time frame.`;
            }

            const sortLabel = {
                pnl: 'PnL', win_rate: 'Win Rate', tx_count: 'TX Count',
                volume: 'Volume', roi: 'ROI'
            }[args.sort_by] || 'PnL';
            const timeLabel = args.time_frame || '7d';

            const parts = [`🏆 Top Traders by ${sortLabel} (${timeLabel})\n`];

            for (let i = 0; i < Math.min(traders.length, 15); i++) {
                const t = traders[i];
                const rank = i + 1;
                const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`;
                const addr = shortenAddr(t.walletAddress || t.address);
                const pnl = t.pnl ? formatUsd(t.pnl) : 'N/A';
                const winRate = t.winRate ? formatPercent(t.winRate) : '';
                const vol = t.volume ? formatUsd(t.volume) : '';
                const roi = t.roi ? `${(Number(t.roi) * 100).toFixed(1)}%` : '';
                const txCount = t.txCount || t.transactionCount || '';

                parts.push(`${medal} ${addr}`);
                const stats = [];
                if (pnl !== 'N/A') stats.push(`PnL: ${pnl}`);
                if (winRate) stats.push(`WR: ${winRate}`);
                if (roi) stats.push(`ROI: ${roi}`);
                if (vol) stats.push(`Vol: ${vol}`);
                if (txCount) stats.push(`TXs: ${txCount}`);
                parts.push(`   ${stats.join(' | ')}`);
            }

            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to fetch leaderboard: ${err.message}`;
        }
    },

    async get_signal_chains() {
        try {
            const onchainos = require('../../services/onchainos');
            const result = await onchainos.getSignalChains();
            const data = result?.data || result;
            const chains = Array.isArray(data) ? data : data?.chains || [];

            if (!chains || chains.length === 0) {
                return '📡 No supported signal chains data available.';
            }

            const parts = ['📡 Supported Chains for Signal Tracking\n'];
            for (const c of chains) {
                const name = c.chainName || c.name || `Chain ${c.chainIndex || c.chainId}`;
                const id = c.chainIndex || c.chainId;
                parts.push(`  • ${name} (${id})`);
            }
            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to fetch signal chains: ${err.message}`;
        }
    },

    async get_leaderboard_chains() {
        try {
            const onchainos = require('../../services/onchainos');
            const result = await onchainos.getLeaderboardChains();
            const data = result?.data || result;
            const chains = Array.isArray(data) ? data : data?.chains || [];

            if (!chains || chains.length === 0) {
                return '🏆 No supported leaderboard chains data available.';
            }

            const parts = ['🏆 Supported Chains for Trader Leaderboard\n'];
            for (const c of chains) {
                const name = c.chainName || c.name || `Chain ${c.chainIndex || c.chainId}`;
                const id = c.chainIndex || c.chainId;
                parts.push(`  • ${name} (${id})`);
            }
            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to fetch leaderboard chains: ${err.message}`;
        }
    }
};

// ═══════════════════════════════════════════════════════
// System Prompt
// ═══════════════════════════════════════════════════════

const DEX_SIGNAL_SYSTEM_PROMPT = `
DEX SIGNAL & LEADERBOARD RULES:
1. When user asks about smart money, KOL, or whale activity → use track_smart_money
2. When user asks about buy signals or what notable wallets are buying together → use get_buy_signals
3. When user asks about top traders or leaderboard → use get_trader_leaderboard
4. Default tracker_type to "smart_money" if user doesn't specify
5. Default leaderboard sort to "pnl" and time_frame to "7d" if not specified
6. Signal data is aggregated — it shows tokens with collective buying activity
7. Tracker data is raw — it shows individual transaction-level activity
8. Always mention the chain if the user specified one

KEYWORD TRIGGERS:
- "smart money" / "聪明钱" / "tin tay to" → tracker smart_money
- "KOL" / "网红" → tracker kol  
- "whale" / "大户" / "巨鲸" / "cá voi" → tracker whale or signal whale
- "signal" / "信号" / "tín hiệu" → get_buy_signals
- "leaderboard" / "牛人榜" / "top traders" / "bảng xếp hạng" → get_trader_leaderboard
- "win rate" / "胜率" / "tỷ lệ thắng" → leaderboard sort by win_rate
- "PnL" / "盈亏" / "lợi nhuận" → leaderboard sort by pnl
- "ROI" / "收益率" → leaderboard sort by roi`;

module.exports = {
    name: 'dex-signal',
    description: 'Smart money / KOL / whale DEX signal tracking, aggregated buy alerts, and trader leaderboard rankings',
    enabled: true,
    tools: DEX_SIGNAL_TOOLS,
    handlers: signalHandlers,
    systemPrompt: DEX_SIGNAL_SYSTEM_PROMPT
};