/**
 * DeFi Portfolio Skill — View DeFi Positions & Holdings
 * 
 * Based on onchainos okx-defi-portfolio spec v2.2.6:
 * - DeFi positions overview across protocols
 * - Per-protocol position detail
 * - Supports staking, lending, LP, farming positions
 */

// ═══════════════════════════════════════════════════════
// AI Tools
// ═══════════════════════════════════════════════════════

const DEFI_PORTFOLIO_TOOLS = [{
    functionDeclarations: [
        {
            name: 'defi_positions_overview',
            description: 'View all DeFi positions across protocols for a wallet address. Shows staking, lending, LP, and farming positions with values. Use when user asks "check my DeFi positions", "DeFi持仓", "show my DeFi portfolio", "what DeFi am I invested in".',
            parameters: {
                type: 'object',
                properties: {
                    address: { type: 'string', description: 'Wallet address to check DeFi positions for' },
                    chains: { type: 'string', description: 'Comma-separated chain IDs to filter (optional, defaults to all)' }
                },
                required: ['address']
            }
        },
        {
            name: 'defi_position_detail',
            description: 'Get detailed DeFi position info for a specific protocol. Shows individual positions, APY, rewards, and underlying assets. Use when user asks for details about a specific protocol position.',
            parameters: {
                type: 'object',
                properties: {
                    address: { type: 'string', description: 'Wallet address' },
                    chain_index: { type: 'string', description: 'Chain ID (e.g., 1 for ETH)' },
                    platform_id: { type: 'string', description: 'Protocol/platform ID from the overview results' }
                },
                required: ['address', 'chain_index', 'platform_id']
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

// ═══════════════════════════════════════════════════════
// Tool Handlers
// ═══════════════════════════════════════════════════════

const defiPortfolioHandlers = {
    async defi_positions_overview(args) {
        try {
            const onchainos = require('../../services/onchainos');
            const result = await onchainos.defiPositions(args.address, args.chains);
            const data = result?.data || result;

            if (!data) {
                return `📊 No DeFi positions found for ${shortAddr(args.address)}.`;
            }

            const parts = [`📊 DeFi Portfolio Overview\n👤 ${shortAddr(args.address)}\n`];

            // Total value
            if (data.totalValue || data.totalUsdValue) {
                parts.push(`💰 Total DeFi Value: ${fmtUsd(data.totalValue || data.totalUsdValue)}\n`);
            }

            // Positions by protocol
            const protocols = data.protocolList || data.protocols || data.platformList || [];
            if (protocols.length === 0) {
                // Try flat position list
                const positions = data.positionList || data.positions || [];
                if (positions.length === 0) {
                    parts.push('No active DeFi positions found.');
                    return parts.join('\n');
                }

                for (const pos of positions.slice(0, 20)) {
                    const protocol = pos.protocolName || pos.platformName || pos.protocol || 'Unknown';
                    const chain = pos.chainName || pos.chainIndex || '';
                    const type = pos.positionType || pos.type || '';
                    const value = pos.usdValue || pos.value || 0;
                    const apy = pos.apy ? `${(Number(pos.apy) * 100).toFixed(2)}%` : '';

                    parts.push(`  📌 ${protocol} ${chain ? `(${chain})` : ''} — ${type}`);
                    parts.push(`     💰 ${fmtUsd(value)} ${apy ? `| APY: ${apy}` : ''}`);
                }
            } else {
                for (const p of protocols.slice(0, 15)) {
                    const name = p.protocolName || p.platformName || p.name || 'Unknown';
                    const chain = p.chainName || p.chainIndex || '';
                    const value = p.totalUsdValue || p.usdValue || p.value || 0;
                    const posCount = p.positionCount || p.count || '';
                    const platformId = p.analysisPlatformId || p.platformId || p.id || '';

                    parts.push(`📌 ${name} ${chain ? `(${chain})` : ''}`);
                    parts.push(`   💰 ${fmtUsd(value)} ${posCount ? `| ${posCount} position(s)` : ''}`);
                    if (platformId) parts.push(`   🔗 ID: ${platformId}`);
                }
            }

            if (protocols.length > 15) {
                parts.push(`\n... and ${protocols.length - 15} more protocols`);
            }

            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to fetch DeFi positions: ${err.message}`;
        }
    },

    async defi_position_detail(args) {
        try {
            const onchainos = require('../../services/onchainos');
            const result = await onchainos.defiPositionDetail(args.address, args.chain_index, args.platform_id);
            const data = result?.data || result;

            if (!data) {
                return `📊 No position details found.`;
            }

            const parts = [`📊 DeFi Position Detail\n👤 ${shortAddr(args.address)} | Chain: ${args.chain_index}\n`];

            const positions = data.positionList || data.positions || data.investmentList || [];
            if (Array.isArray(positions) && positions.length > 0) {
                for (const pos of positions.slice(0, 10)) {
                    const type = pos.positionType || pos.type || pos.investmentName || 'Position';
                    const value = pos.usdValue || pos.value || 0;
                    const apy = pos.apy ? `${(Number(pos.apy) * 100).toFixed(2)}%` : '';

                    parts.push(`  📌 ${type}`);
                    parts.push(`     💰 ${fmtUsd(value)} ${apy ? `| APY: ${apy}` : ''}`);

                    // Underlying assets
                    const assets = pos.tokenList || pos.assets || pos.underlyingTokens || [];
                    if (assets.length > 0) {
                        for (const a of assets.slice(0, 5)) {
                            const sym = a.tokenSymbol || a.symbol || '???';
                            const amt = a.amount || a.balance || '';
                            const val = a.usdValue ? fmtUsd(a.usdValue) : '';
                            parts.push(`     • ${sym}: ${amt} ${val ? `(${val})` : ''}`);
                        }
                    }

                    // Rewards
                    const rewards = pos.rewardList || pos.rewards || [];
                    if (rewards.length > 0) {
                        parts.push(`     🎁 Rewards:`);
                        for (const r of rewards.slice(0, 3)) {
                            const sym = r.tokenSymbol || r.symbol || '???';
                            const amt = r.amount || r.balance || '';
                            parts.push(`        • ${sym}: ${amt}`);
                        }
                    }
                }
            } else {
                // Single position data
                if (data.protocolName || data.platformName) {
                    parts.push(`📌 Protocol: ${data.protocolName || data.platformName}`);
                }
                if (data.totalUsdValue || data.usdValue) {
                    parts.push(`💰 Total Value: ${fmtUsd(data.totalUsdValue || data.usdValue)}`);
                }
            }

            return parts.join('\n');
        } catch (err) {
            return `⚠️ Failed to fetch position detail: ${err.message}`;
        }
    }
};

// ═══════════════════════════════════════════════════════
// System Prompt
// ═══════════════════════════════════════════════════════

const DEFI_PORTFOLIO_SYSTEM_PROMPT = `
DEFI PORTFOLIO RULES:
1. Use defi_positions_overview for broad DeFi position viewing across all protocols
2. Use defi_position_detail for drilling into a specific protocol's positions
3. This skill is for VIEWING positions only — for deposit/redeem/claim, use the defi skill
4. This skill is for DeFi protocol positions — for wallet token balances, use wallet skill
5. If the user names a specific DApp (Aave, Lido, etc.), defer to the appropriate DApp skill
6. Always show total value prominently
7. Include APY when available

KEYWORD TRIGGERS:
- "DeFi positions" / "DeFi持仓" / "vị thế DeFi" → defi_positions_overview
- "DeFi portfolio" / "DeFi资产" → defi_positions_overview
- "staking positions" / "lending positions" → defi_positions_overview
- "position detail" / "持仓详情" → defi_position_detail`;

module.exports = {
    name: 'defi-portfolio',
    description: 'View DeFi positions and holdings across protocols — staking, lending, LP, farming positions overview and detail',
    enabled: true,
    tools: DEFI_PORTFOLIO_TOOLS,
    handlers: defiPortfolioHandlers,
    systemPrompt: DEFI_PORTFOLIO_SYSTEM_PROMPT
};