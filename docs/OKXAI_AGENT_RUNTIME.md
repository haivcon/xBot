# xBot OKX.AI Agent Runtime Bridge

This document describes the xBot bridge layer designed to replace an OpenClaw/Hermes-style local agent runtime for OKX.AI usage.

## Goal

The runtime lets xBot act as a controllable bridge between:

- OKX.AI Agent-to-Agent task flows.
- xBot users in Telegram / dashboard.
- Server-side AI providers such as OpenRouter, Gemini, OpenAI, Groq.
- Optional user-supplied AI API keys.
- xBot tool execution, wallet helpers, OKX.AI task operations, and x402 helpers.

## Main modules

| Module | Purpose |
| --- | --- |
| `src/services/aiRouter/` | Provider-agnostic AI routing. Chooses user key first, then server key. |
| `src/services/okxai/` | OKX.AI agent, A2A, x402, wallet, and task manager integration. |
| `src/features/ai/okxaiTools.js` | Tool registry exposed to the AI/runtime layer. |
| `src/services/agentRuntime/` | Runtime bridge orchestration, safety policy, audit log, and inbound A2A inbox. |
| `src/server/dashboardRoutes.js` | Dashboard REST API for runtime chat/tool execution, A2A inbox, decisions, and audit logs. |

## Runtime modes

Configured by `AGENT_RUNTIME_MODE`.

| Mode | Meaning |
| --- | --- |
| `manual` | Protected actions always require explicit confirmation. |
| `semi_auto` | Default. Read/chat actions are automatic; task acceptance, delivery, evaluation, and outbound protected operations require confirmation. |
| `auto` | Allows protected actions without confirmation. Use only in trusted environments. |

Protected actions include operations such as accepting OKX.AI tasks, delivering work, evaluating tasks, or executing high-impact runtime tools.

## Environment variables

See `.env.example` for full configuration. Key variables:

```env
AGENT_RUNTIME_MODE=semi_auto
OKXAI_DRY_RUN=true
OKXAI_API_URL=https://okx.ai
OKXAI_A2A_URL=https://okx.ai
OKXAI_A2A_WS_URL=
OKXAI_API_KEY=
OKXAI_AGENT_ID=
PUBLIC_BASE_URL=

DEFAULT_AI_PROVIDER=gemini
GEMINI_API_KEY=
OPENROUTER_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
```

## Dashboard API endpoints

All endpoints below are mounted under the protected dashboard API router.

### Runtime

- `GET /agent-runtime/status`
- `POST /agent-runtime/chat`
- `POST /agent-runtime/tools/execute`

If a protected action needs user confirmation, the runtime returns HTTP `409` with:

```json
{
  "error": "Action ... requires explicit user confirmation",
  "code": "CONFIRMATION_REQUIRED",
  "action": "task_accept",
  "mode": "semi_auto"
}
```

Retry with `confirmed: true` after the user approves.

### A2A inbound/inbox

- `POST /agent-runtime/a2a/inbound`
- `GET /agent-runtime/inbox`
- `GET /agent-runtime/decisions`
- `PUT /agent-runtime/inbox/:id/status`

Inbound envelopes are persisted in `agent_runtime_inbox`. Events such as `decision_request`, `requires_approval`, `acceptance_request`, and similar are marked as decision items.

### Audit

- `GET /agent-runtime/audit`

Owner-only endpoint for recent runtime audit records.

## A2A webhook shape

The inbound route accepts either a raw envelope body or `{ "envelope": { ... } }`.

Examples:

```json
{
  "msgType": "a2a-agent-chat",
  "jobId": "job_123",
  "sender": {
    "role": "ASP",
    "agentId": "asp_abc"
  },
  "event": "decision_request",
  "content": "Please approve delivery terms",
  "payload": {
    "title": "Approve task milestone"
  }
}
```

System event example:

```json
{
  "agentId": "agent_123",
  "message": {
    "source": "system",
    "event": "task_status_changed",
    "jobId": "job_123",
    "status": "delivered"
  }
}
```

## AI provider routing

The AI router supports server keys and user keys. Selection order:

1. Explicit provider/model requested by caller.
2. User preferred provider.
3. `DEFAULT_AI_PROVIDER`.
4. First configured server provider.

For each provider, user-supplied keys can be stored through dashboard AI-router endpoints. If no user key exists, xBot falls back to the server key.

## Verification

Targeted runtime tests:

```bash
npx jest __tests__/agentRuntime.test.js --verbose
```

Full project test suite:

```bash
npm test
```

## Recommended next steps

- Add a dashboard UI panel for Agent Runtime inbox/decisions/audit if not already exposed in the frontend.
- Point OKX.AI agent endpoint to `PUBLIC_BASE_URL` plus the dashboard/API path that receives inbound envelopes.
- Keep `OKXAI_DRY_RUN=true` until OKX.AI production API endpoints and credentials are verified.