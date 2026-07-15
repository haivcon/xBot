# XBot Skills — OnchainOS Integration Reference

> Last updated: 2026-07-02 | Based on onchainos-skills-main v2.2.6

## Overview

XBot uses a plug-and-play **Skill Engine** that auto-discovers skill modules from `src/skills/*/index.js`. Each skill exports:
- `name` — unique identifier
- `description` — human-readable purpose
- `tools` — Gemini Function Calling declarations
- `handlers` — async functions that execute tool calls
- `systemPrompt` — AI context for routing
- `enabled` — toggle on/off

The engine (`src/skills/engine.js`) maintains a global `SkillRegistry` that indexes all tool names to their parent skill for O(1) dispatch.

---

## Skill Inventory

| # | Skill | Tools | Source Spec | Status |
|---|-------|-------|-------------|--------|
| 1 | **security** | 6 | okx-security v2.2.6 | ✅ Upgraded |
| 2 | **dex-signal** | 5 | okx-dex-signal v2.2.6 | ✅ New |
| 3 | **dex-trenches** | 7 | okx-dex-trenches v2.2.6 | ✅ New |
| 4 | **defi-portfolio** | 2 | okx-defi-portfolio v2.2.6 | ✅ New |
| 5 | **audit-log** | 3 | okx-audit-log v2.2.6 | ✅ New |
| 6 | **onchain** | 11 | okx-dex-swap/market/token/bridge | ✅ Existing |
| 7 | **scheduler** | 3 | internal | ✅ Existing |
| 8 | **memory** | 3 | internal | ✅ Existing |

**Total: 8 skills, 40 tools**

---

## 1. Security Skill (`src/skills/security/`)

Token, DApp, transaction, approval, and signature security scanning.

### Tools

| Tool | Description |
|------|-------------|
| `token_security_check` | Honeypot detection, rug-pull risk, contract analysis |
| `dapp_security_check` | URL phishing detection, DApp safety verification |
| `tx_security_scan` | Pre-execution transaction simulation (EVM + Solana) |
| `approval_security_check` | ERC-20/Permit2 allowance risk scanner |
| `revoke_approval` | Build revoke calldata for risky approvals |
| `sig_scan_safety` | EIP-712 / personal_sign message safety analysis |

### Upgrade Notes (v2.2.6)
- Added `sig_scan_safety` tool for message signing security
- Enhanced keyword triggers (EN/ZH/VI)
- Risk level tagging (high/medium/low/safe)

---

## 2. DEX Signal Skill (`src/skills/dex-signal/`)

Smart money / whale / KOL activity tracking and aggregated buy signals.

### Tools

| Tool | Description |
|------|-------------|
| `smart_money_tracker` | Raw DEX transaction feed for smart money / KOL / custom addresses |
| `smart_money_signals` | Aggregated buy-only signal alerts — tokens collectively bought |
| `kol_tracker` | KOL-specific trading activity with PnL context |
| `whale_signals` | Large-wallet aggregated buy signals |
| `trader_leaderboard` | Top traders ranked by PnL, win rate, volume, or ROI |

### Key Features
- Filters: time range, chain, sort criteria
- Smart money type classification
- Token aggregation across multiple wallets
- PnL and win-rate context per address

---

## 3. DEX Trenches Skill (`src/skills/dex-trenches/`)

Meme token launchpad research (pump.fun, Raydium, Moonshot).

### Tools

| Tool | Description |
|------|-------------|
| `meme_new_launches` | Scan latest meme token launches across launchpads |
| `meme_dev_reputation` | Developer rug history, launch count, success rate |
| `meme_bundle_sniper_detection` | Detect bundled snipers and suspicious early buyers |
| `meme_bonding_curve` | Bonding curve progress and migration status |
| `meme_similar_tokens` | Find tokens by same dev or similar metadata |
| `meme_co_investors` | "Who aped" — wallets that bought the same tokens |
| `meme_token_analysis` | Combined analysis: dev + sniper + curve + holders |

### Supported Chains
Solana, BSC, X Layer, TRON

### Read vs Write Gate
- **Read** (this skill): dev reputation, sniper detection (noun), bonding curve analytics
- **Write** (→ dapp-discovery): `snipe + token` action verb routes elsewhere

---

## 4. DeFi Portfolio Skill (`src/skills/defi-portfolio/`)

View DeFi positions and holdings across protocols.

### Tools

| Tool | Description |
|------|-------------|
| `defi_positions_overview` | All DeFi positions across protocols (staking, lending, LP, farming) |
| `defi_position_detail` | Drill into specific protocol positions with APY and rewards |

### Key Features
- Aggregated view across all protocols
- Per-protocol drill-down
- APY, rewards, underlying asset breakdown
- Multi-chain support

### Boundaries
- **View only** — deposit/redeem/claim → use defi skill
- **Protocol positions** — wallet token balances → use wallet skill
- **Named DApp** (Aave, Lido) → use respective DApp skill

---

## 5. Audit Log Skill (`src/skills/audit-log/`)

Operation logging, command history, and log export.

### Tools

| Tool | Description |
|------|-------------|
| `view_audit_log` | View recent command/operation history with filtering |
| `export_audit_log` | Export logs to JSON or CSV files |
| `audit_log_path` | Show the file system path where logs are stored |

### Storage
- In-memory ring buffer (1000 entries)
- Persistent JSONL files at `data/audit-logs/audit_{userId}_{date}.jsonl`
- CSV export option

### API for Other Modules
```javascript
const { recordAuditEntry } = require('../skills/audit-log');
recordAuditEntry({ userId: '123', tool: 'swap', action: 'dex_swap', result: 'success', details: 'Swapped 1 ETH → USDC' });
```

---

## 6. Onchain Skill (`src/skills/onchain/`)

Core DEX operations — swap, market data, token info, bridge. (Pre-existing, unchanged in this upgrade.)

### Tools (11)
`get_token_price`, `get_token_detail`, `get_trending_tokens`, `get_supported_chains`, `get_swap_quote`, `execute_swap`, `get_dex_liquidity`, `get_cross_chain_quote`, `execute_bridge`, `get_token_by_address`, `search_token`

---

## 7. Scheduler Skill (`src/skills/scheduler/`)

Scheduled tasks and reminders. (Pre-existing, unchanged.)

### Tools (3)
`schedule_reminder`, `list_schedules`, `cancel_schedule`

---

## 8. Memory Skill (`src/skills/memory/`)

Conversational memory and context persistence. (Pre-existing, unchanged.)

### Tools (3)
`save_memory`, `recall_memory`, `forget_memory`

---

## Architecture

```
src/skills/
├── engine.js              ← SkillRegistry + auto-loader
├── index.js               ← Init entry point (initSkills)
├── security/index.js      ← 6 tools  (UPGRADED)
├── dex-signal/index.js    ← 5 tools  (NEW)
├── dex-trenches/index.js  ← 7 tools  (NEW)
├── defi-portfolio/index.js← 2 tools  (NEW)
├── audit-log/index.js     ← 3 tools  (NEW)
├── onchain/index.js       ← 11 tools (existing)
├── scheduler/index.js     ← 3 tools  (existing)
└── memory/index.js        ← 3 tools  (existing)
```

### How auto-discovery works

1. `initSkills()` is called once at bot startup
2. `loadSkillsFromDirectory()` scans `src/skills/` for subdirectories
3. Each subdirectory with an `index.js` is `require()`'d
4. If the export has `.name`, it's registered in the global `SkillRegistry`
5. All tool names are indexed for O(1) dispatch

### Adding a new skill

1. Create `src/skills/<name>/index.js`
2. Export: `{ name, description, enabled, tools, handlers, systemPrompt }`
3. Restart the bot — auto-discovered automatically
4. No changes to `engine.js` or `index.js` needed

---

## OnchainOS Spec Coverage

Skills from `onchainos-skills-main` that are now integrated:

| OnchainOS Skill | XBot Status | Notes |
|-----------------|-------------|-------|
| okx-security | ✅ Integrated | Full 6-tool coverage |
| okx-dex-signal | ✅ Integrated | Tracker, signals, leaderboard |
| okx-dex-trenches | ✅ Integrated | 7-tool meme research |
| okx-defi-portfolio | ✅ Integrated | Positions overview + detail |
| okx-audit-log | ✅ Integrated | View, export, path |
| okx-dex-swap | ✅ Pre-existing | In onchain skill |
| okx-dex-market | ✅ Pre-existing | In onchain skill |
| okx-dex-token | ✅ Pre-existing | In onchain skill |
| okx-dex-bridge | ✅ Pre-existing | In onchain skill |
| okx-dex-social | 🔲 Future | News, sentiment, vibe |
| okx-dex-strategy | 🔲 Future | Limit orders, take-profit |
| okx-dex-ws | 🔲 Future | WebSocket channels |
| okx-defi-invest | 🔲 Future | DeFi deposit/redeem/claim |
| okx-agent-identity | 🔲 Future | ERC-8004 agent registry |
| okx-agent-task | 🔲 Future | A2A task lifecycle |
| okx-agent-payments | 🔲 Future | x402 / MPP payments |
| okx-agentic-wallet | 🔲 Future | Full wallet operations |
| okx-growth-competition | 🔲 Future | Trading competitions |
| okx-onchain-gateway | 🔲 Future | Raw tx broadcast |
| okx-wallet-portfolio | 🔲 Future | Public address lookup |
| okx-dapp-discovery | 🔲 Future | 20 DeFi protocol router |