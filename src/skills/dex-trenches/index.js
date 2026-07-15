/**
 * DEX Trenches Skill — Meme Token / Pump.fun Scanner
 * 
 * Based on onchainos okx-dex-trenches spec v2.2.6:
 * - New meme launches scanning (pump.fun, Raydium, etc.)
 * - Developer reputation & rug history
 * - Bundle/sniper detection (analytical)
 * - Bonding curve progress & migration status
 * - Similar tokens by same dev
 * - Co-investor / who-aped wallets
 */

// ═══════════════════════════════════════════════════════
// AI Tools
// ═══════════════════════════════════════════════════════

const DEX_TRENCHES_TOOLS = [{
    functionDeclarations: [
        {
            name: 'meme_scan_new_launches',
            description: 'Scan for new meme token launches on pump.fun and other launchpads (Solana, BSC, X Layer, TRON). Filter by stage (in bonding curve, migrated, graduated). Use when user asks "new meme launches", "新盘", "扫链", "打狗", "pump.fun alpha".',
            parameters: {
                type: 'object',
                properties: {
                    chain_index: { type: 'string', description: 'Chain ID (501 for Solana, 56 for BSC, 196 for XLayer). Default: 501' },
                    stage: { type: 'string', description: 'Token stage: "bonding" (in bonding curve), "migrated" (migrated to DEX), "all"', enum: ['bonding', 'migrated', 'all'] },
                    sort_by: { type: 'string', description: 'Sort: "newest", "volume", "holders", "marketCap"', enum: ['newest', 'volume', 'holders', 'marketCap'] },
                    limit: { type: 'string', description: 'Number of results (default: 10)' }
                },
                required: []
            }
        },
        {
            name: 'meme_token_details',
            description: 'Get detailed info about a specific meme token including bonding curve progress, market cap, holders, and dev info. Use for deep-diving into a specific meme token.',
            parameters: {
                type: 'object',
                properties: {
                    chain_index: { type: 'string', description: 'Chain ID (default: 501 for Solana)' },
                    token_address: { type: 'string', description: 'Token contract address' },
                    wallet_address: { type: 'string', description: 'Optional wallet address to check personal position' }
                },
                required: ['token_address']
            }
        },
        {
            name: 'meme_dev_reputation',
            description: 'Check developer reputation and rug pull history. Shows how many tokens the dev has launched and how many were rug pulls. Use when user asks "开发者信息", "dev reputation", "rug history", "is this dev safe".',
            parameters: {
                type: 'object',
                properties: {
                    chain_index: { type: 'string', description: 'Chain ID (default: 501)' },
                    token_address: { type: 'string', description: 'Token contract address to look up developer' }
                },
                required: ['token_address']
            }
        },
        {
            name: 'meme_bundle_detection',
            description: 'Detect bundled/sniper wallets for a meme token. Shows if early buyers used coordinated bundles to accumulate. Use when user asks "捆绑狙击者", "bundle detection", "sniper detection", "is this token bundled".',
            parameters: {
                type: 'object',
                properties: {
                    chain_index: { type: 'string', description: 'Chain ID (default: 501)' },
                    token_address: { type: 'string', description: 'Token contract address' }
                },
                required: ['token_address']
            }
        },
        {
            name: 'meme_similar_tokens',
            description: 'Find similar tokens launched by the same developer. Helps identify serial launchers and potential rug patterns. Use when user asks "相似代币", "similar tokens", "other tokens by this dev".',
            parameters: {
                type: 'object',
                properties: {
                    chain_index: { type: 'string', description: 'Chain ID (default: 501)' },
                    token_address: { type: 'string', description: 'Token contract address' }
                },
                required: ['token_address']
            }
        },
        {
            name: 'meme_aped_wallets',
            description: 'Find co-investor wallets — who else aped into this token. Shows notable wallets (smart money, KOL, whales) that bought. Use when user asks "同车", "who aped", "co-investors", "who else bought".',
            parameters: {
                type: 'object',
                properties: {
                    chain_index: { type: 'string', description: 'Chain ID (default: 501)' },
                    token_address: { type: 'string', description: 'Token contract address' },
                    wallet_address: { type: 'string', description: 'Optional wallet to check relationship' }
                },
                required: ['token_address']
            }
        },
        {
            name: 'meme_supported_chains',
            description: 'List all chains and protocols supported for meme token scanning.',
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

function fmtUsd(v) {
    const n = Number(v);
    if (isNaN(n) || n === 0) return '$0';
    if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
}

function shortAddr(a) {
    if (!a || a.length < 10) return a || 'N/A';
    return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

function pct(v) {
    const n = Number(v);
    if (isNaN(n)) return '0%';
    return `${(n * 100).toFixed(1)}%`;
}

// ═══════════════════════════════════════════════════════
// Tool Handlers
// ═══════════════════════════════════════════════════════

const trenchesHandlers = {
    async meme_scan_new_launches(args) {
        try {
            const onchainos = require('../../services/onchainos');
            const chain = args.chain_index || '501';
            const stage = args.stage || 'all';
            
            const stageMap = { bonding: '1', migrated: '2', all: undefined };
            
            const result = await onchainos.getMemePumpTokenList(chain, stageMap[stage], {
                sortBy: args.sort_by || 'newest',
                limit: args.limit || '10'
            });
            const data = result?.data || result;
            const tokens = Array.isArray(data) ? data : data?.tokenList || data?.data || [];

            if (!tokens || tokens.length === 0) {
                return `🔫 No meme tokens found on chain ${chain}. Try a different chain or stage filter.`;
            }

            const parts = [`🔫 Meme Token Scanner — Chain ${chain} | Stage: ${stage}\n`];

            for (const t of tokens.slice(0, 15)) {
                const symbol = t.tokenSymbol || t.symbol || '???';
                const name = t.tokenName || t.name || '';
                const mc = t.marketCap ? fmtUsd(t.marketCap) : '';
                const vol = t.volume24h ? fmtUsd(t.volume24h) : '';
                const holders = t.holderCount || t.holders || '';
                const progress = t.bondingCurveProgress ? `${(Number(t.bondingCurveProgress) * 100).toFixed(0)}%` : '';
                const migrated = t.isMigrated === true || t.stage === '2' ? '✅ Migrated' : progress ? `📊 ${progress} filled` : '';

                parts.push(`🪙 ${symbol} ${name ? `(${name})` : ''}`);
                const stats = [];
                if (mc) stats.push(`MC: ${mc}`);
                if (vol) stats.push(`Vol: ${vol}`);
                if (holders) stats.push(`Holders: ${holders}`);
                if (migrated) stats.push(migrated);
                if (stats.length > 0) parts.push(`   ${stats.join(' | ')}`);
                if (t.tokenContractAddress) parts.push(`   📋 ${shortAddr(t.tokenContractAddress)}`);
            }

            return parts.join('\n');
        } catch (err) {
            return `⚠️ Meme scan failed: ${err.message}`;
        }
    },

    async meme_token_details(args) {
        try {
            const onchainos = require('../../services/onchainos');
            const chain = args.chain_index || '501';
            
            const result = await onchainos.getMemePumpTokenDetails(chain, args.token_address, args.wallet_address);
            const d = result?.data || result;

            if (!d) return `⚠️ No details found for ${shortAddr(args.token_address)}`;

            const parts = [`🔫 Meme Token Details\n`];
            parts.push(`🪙 ${d.tokenSymbol || d.symbol || '???'} ${d.tokenName ? `(${d.tokenName})` : ''}`);
            parts.push(`📋 ${args.token_address}`);
            parts.push(`⛓️ Chain: ${chain}`);
            
            if (d.marketCap) parts.push(`💰 Market Cap: ${fmtUsd(d.marketCap)}`);
            if (d.price) parts.push(`💲 Price: $${Number(d.price).toPrecision(4)}`);
            if (d.holderCount) parts.push(`👥 Holders: ${d.holderCount}`);
            if (d.volume24h) parts.push(`📊 24h Volume: ${fmtUsd(d.volume24h)}`);
            
            // Bonding curve
            if (d.bondingCurveProgress !== undefined) {
                const prog = (Number(d.bondingCurveProgress) * 100).toFixed(1);
                parts.push(`\n📈 Bonding Curve: ${prog}% filled`);
                if (Number(prog) >= 100) parts.push(`✅ Graduated — migrated to DEX`);
            }
            if (d.isMigrated) parts.push(`✅ Migrated to DEX`);
            
            // Dev info inline
            if (d.devAddress) parts.push(`\n👨‍💻 Dev: ${shortAddr(d.devAddress)}`);
            if (d.devHoldPercent) parts.push(`📊 Dev holds: ${pct(d.devHoldPercent)}`);

            // User position
            if (args.wallet_address && d.userBalance) {
                parts.push(`\n👤 Your position: ${d.userBalance} ${d.tokenSymbol || ''}`);
                if (d.userPnl) parts.push(`📊 PnL: ${fmtUsd(d.userPnl)}`);
            }

            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to get token details: ${err.message}`;
        }
    },

    async meme_dev_reputation(args) {
        try {
            const onchainos = require('../../services/onchainos');
            const chain = args.chain_index || '501';
            
            const result = await onchainos.getMemePumpDevInfo(chain, args.token_address);
            const d = result?.data || result;

            if (!d) return `⚠️ No developer info found for ${shortAddr(args.token_address)}`;

            const parts = [`👨‍💻 Developer Reputation\n`];
            parts.push(`🪙 Token: ${shortAddr(args.token_address)} (Chain ${chain})`);
            
            if (d.devAddress) parts.push(`📋 Dev Address: ${shortAddr(d.devAddress)}`);
            if (d.tokenLaunchCount !== undefined) parts.push(`🚀 Tokens Launched: ${d.tokenLaunchCount}`);
            if (d.rugPullCount !== undefined) {
                const rugCount = Number(d.rugPullCount);
                if (rugCount > 0) {
                    parts.push(`🚨 Rug Pulls: ${rugCount} — HIGH RISK DEVELOPER`);
                } else {
                    parts.push(`✅ Rug Pulls: 0 — Clean history`);
                }
            }
            if (d.successRate !== undefined) parts.push(`📊 Success Rate: ${pct(d.successRate)}`);
            if (d.avgHolderCount) parts.push(`👥 Avg Holders per Token: ${d.avgHolderCount}`);
            if (d.devHoldPercent) parts.push(`📊 Dev Hold %: ${pct(d.devHoldPercent)}`);

            // Risk assessment
            const rugCount = Number(d.rugPullCount || 0);
            const launchCount = Number(d.tokenLaunchCount || 0);
            if (rugCount > 2 || (launchCount > 5 && rugCount > 0)) {
                parts.push(`\n🔴 RISK: Serial launcher with rug history. Exercise extreme caution.`);
            } else if (launchCount > 10 && rugCount === 0) {
                parts.push(`\n🟢 Experienced developer with clean track record.`);
            }

            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to get dev info: ${err.message}`;
        }
    },

    async meme_bundle_detection(args) {
        try {
            const onchainos = require('../../services/onchainos');
            const chain = args.chain_index || '501';
            
            const result = await onchainos.getMemePumpBundleInfo(chain, args.token_address);
            const d = result?.data || result;

            if (!d) return `⚠️ No bundle data found for ${shortAddr(args.token_address)}`;

            const parts = [`🎯 Bundle / Sniper Detection\n`];
            parts.push(`🪙 Token: ${shortAddr(args.token_address)} (Chain ${chain})`);
            
            if (d.bundleCount !== undefined) parts.push(`📦 Bundle Groups: ${d.bundleCount}`);
            if (d.sniperCount !== undefined) parts.push(`🎯 Snipers Detected: ${d.sniperCount}`);
            if (d.bundleHoldPercent !== undefined) parts.push(`📊 Bundle Holding %: ${pct(d.bundleHoldPercent)}`);
            if (d.sniperHoldPercent !== undefined) parts.push(`📊 Sniper Holding %: ${pct(d.sniperHoldPercent)}`);
            
            if (d.bundleWallets?.length > 0) {
                parts.push(`\n📦 Top Bundle Wallets:`);
                for (const w of d.bundleWallets.slice(0, 5)) {
                    parts.push(`  • ${shortAddr(w.address)} — ${w.holdPercent ? pct(w.holdPercent) : ''} ${w.amount ? `(${w.amount})` : ''}`);
                }
            }

            // Risk assessment
            const bundlePct = Number(d.bundleHoldPercent || 0);
            const sniperPct = Number(d.sniperHoldPercent || 0);
            if (bundlePct > 0.3 || sniperPct > 0.2) {
                parts.push(`\n🔴 HIGH RISK: Significant bundle/sniper concentration. Likely coordinated.`);
            } else if (bundlePct > 0.1 || sniperPct > 0.1) {
                parts.push(`\n🟡 MODERATE RISK: Some bundle/sniper activity detected.`);
            } else {
                parts.push(`\n🟢 LOW RISK: Minimal bundle/sniper activity.`);
            }

            return parts.join('\n');
        } catch (err) {
            return `⚠️ Bundle detection failed: ${err.message}`;
        }
    },

    async meme_similar_tokens(args) {
        try {
            const onchainos = require('../../services/onchainos');
            const chain = args.chain_index || '501';
            
            const result = await onchainos.getMemePumpSimilarTokens(chain, args.token_address);
            const data = result?.data || result;
            const tokens = Array.isArray(data) ? data : data?.tokenList || data?.data || [];

            if (!tokens || tokens.length === 0) {
                return `📋 No similar tokens found by the same developer.`;
            }

            const parts = [`🔗 Similar Tokens (Same Dev)\n🪙 Reference: ${shortAddr(args.token_address)}\n`];

            for (const t of tokens.slice(0, 10)) {
                const symbol = t.tokenSymbol || t.symbol || '???';
                const mc = t.marketCap ? fmtUsd(t.marketCap) : '';
                const status = t.isRugPull ? '🔴 Rugged' : t.isMigrated ? '✅ Migrated' : '📊 Active';
                parts.push(`  • ${symbol} ${mc ? `| MC: ${mc}` : ''} | ${status}`);
                if (t.tokenContractAddress) parts.push(`    📋 ${shortAddr(t.tokenContractAddress)}`);
            }

            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to find similar tokens: ${err.message}`;
        }
    },

    async meme_aped_wallets(args) {
        try {
            const onchainos = require('../../services/onchainos');
            const chain = args.chain_index || '501';
            
            const result = await onchainos.getMemePumpApedWallets(chain, args.token_address, args.wallet_address);
            const data = result?.data || result;
            const wallets = Array.isArray(data) ? data : data?.walletList || data?.data || [];

            if (!wallets || wallets.length === 0) {
                return `👥 No notable co-investors found for ${shortAddr(args.token_address)}.`;
            }

            const parts = [`👥 Co-Investors / Who Aped\n🪙 Token: ${shortAddr(args.token_address)}\n`];

            for (const w of wallets.slice(0, 15)) {
                const addr = shortAddr(w.walletAddress || w.address);
                const tag = w.tag || w.walletType || '';
                const amount = w.amount ? fmtUsd(w.amount) : '';
                const tagEmoji = tag.includes('smart') ? '🧠' : tag.includes('kol') ? '🎯' : tag.includes('whale') ? '🐋' : '👤';
                parts.push(`  ${tagEmoji} ${addr} ${tag ? `[${tag}]` : ''} ${amount ? `| ${amount}` : ''}`);
            }

            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to get co-investors: ${err.message}`;
        }
    },

    async meme_supported_chains() {
        try {
            const onchainos = require('../../services/onchainos');
            const result = await onchainos.getMemePumpChains();
            const data = result?.data || result;
            const chains = Array.isArray(data) ? data : data?.chains || [];

            if (!chains || chains.length === 0) {
                return '🔫 No meme scanner chain data available.';
            }

            const parts = ['🔫 Supported Meme Scanner Chains\n'];
            for (const c of chains) {
                const name = c.chainName || c.name || `Chain ${c.chainIndex || c.chainId}`;
                const id = c.chainIndex || c.chainId;
                const protocols = c.protocols?.join(', ') || c.protocolName || '';
                parts.push(`  • ${name} (${id}) ${protocols ? `— ${protocols}` : ''}`);
            }
            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to fetch supported chains: ${err.message}`;
        }
    }
};

// ═══════════════════════════════════════════════════════
// System Prompt
// ═══════════════════════════════════════════════════════

const DEX_TRENCHES_SYSTEM_PROMPT = `
MEME TOKEN / PUMP.FUN SCANNER RULES:
1. meme_scan_new_launches: scan for new meme token launches (default: Solana chain 501)
2. meme_token_details: deep-dive into a specific meme token's bonding curve, holders, dev
3. meme_dev_reputation: check dev rug history — ALWAYS check before recommending any meme token
4. meme_bundle_detection: analytical bundle/sniper detection (NOT sniping action)
5. meme_similar_tokens: find other tokens by same dev — pattern detection
6. meme_aped_wallets: who else bought this token (smart money, KOL, whale)
7. For BUYING/SELLING/SNIPING meme tokens, defer to the dex-swap skill
8. Default chain to Solana (501) for meme tokens unless specified otherwise

KEYWORD TRIGGERS:
- "new meme" / "新盘" / "扫链" / "打狗" / "pump.fun" → meme_scan_new_launches
- "dev info" / "开发者" / "rug history" → meme_dev_reputation
- "bundle" / "sniper detection" / "捆绑" / "狙击者" → meme_bundle_detection
- "similar token" / "相似代币" → meme_similar_tokens
- "who aped" / "同车" / "co-investor" → meme_aped_wallets
- "bonding curve" / token details → meme_token_details`;

module.exports = {
    name: 'dex-trenches',
    description: 'Meme token / pump.fun scanner — new launches, dev reputation, bundle detection, similar tokens, co-investors',
    enabled: true,
    tools: DEX_TRENCHES_TOOLS,
    handlers: trenchesHandlers,
    systemPrompt: DEX_TRENCHES_SYSTEM_PROMPT
};