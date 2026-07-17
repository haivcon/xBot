# Kế hoạch hợp nhất xBot Chat AI

> **For Hermes:** triển khai theo TDD, từng phase có feature flag và rollback. Product owner đã phê duyệt rõ ràng ngày 2026-07-17 việc xóa cả Smart Copy và social copy-trading theo dependency scan; không cần xin lại phê duyệt cho danh sách đã cập nhật ở mục 2.

**Mục tiêu:** Trong dashboard chỉ giữ Chat AI, loại bỏ AI Trading, Smart Copy và OKX AI; nâng Chat AI thành Node orchestrator dùng private 9Router, private Hermes Python và OnchainOS qua MCP/artifact đã kiểm định.

**Kiến trúc:** xBot Node/Express tiếp tục là public trust boundary (auth, tenant, quota, SSE, approvals). 9Router chỉ là gateway OpenAI-compatible/SSE nội bộ. Hermes chạy service Python riêng, dùng Service API/Runs hoặc OpenAI-compatible API thay vì copy/fork. OnchainOS được updater lấy theo commit cố định, kiểm SHA, test ở staging/canary rồi atomic promote; runtime không bám `main`.

**Ràng buộc:** Triển khai trong working tree local; không commit/push/deploy và không sửa production VPS. License OnchainOS phải được xác minh trước mọi redistribution. Release này dừng writers nhưng không drop hoặc migrate các bảng cũ để giữ rollback-safe.

---

## 1. Dependency map hiện tại

### AI Trading — mã riêng sẽ gỡ

- UI route/import: `dashboard/xBot/src/App.jsx` (`AiTraderPage`, `/ai-trader`).
- Menu: `dashboard/xBot/src/components/layout/Sidebar.jsx`.
- UI nhúng trong Chat: `dashboard/xBot/src/pages/user/ChatPage.jsx` import/mở `AiTraderPanel`.
- Landing/i18n: `dashboard/xBot/src/pages/LandingPage.jsx`, `dashboard/xBot/src/i18n/index.js` (`dashboard.sidebar.aiTrader`, `dashboard.aiTraderPage`, `pageAiTraderDesc`).
- UI riêng: `dashboard/xBot/src/pages/user/AiTraderPage.jsx`, `dashboard/xBot/src/components/AiTraderPanel.jsx`; chúng gọi `/api/ai/agent/status|plans|positions|enable|disable|pause|plans/:id/approve|reject|positions/:id/close|export`. Không tìm thấy route Node tương ứng trong `src/server/*`; cần regression source scan để tránh giữ UI chết.
- Engine riêng: `src/features/autoTrading.js`; tự tạo `auto_trading_config`, `auto_trading_plans`, `auto_trading_log`.
- Position engine đi kèm: `src/features/tradeExecutionEngine.js`, chỉ được `autoTrading.js` gọi và ngược lại dùng `CHAIN_ID_MAP` từ đó.
- Hook trong shared onchain catalog: `src/features/ai/onchain/marketTools.js` (`manage_auto_trading`) và khai báo liên quan trong `src/features/ai/onchain/declarations.js`.
- Giá sản phẩm trong shared billing: `src/services/x402PaymentService.js` (`auto_trading`).

### Smart Copy và social copy-trading — đều được duyệt gỡ

- UI route/import: `dashboard/xBot/src/App.jsx` (`SmartCopyPage`, `/smart-copy`).
- Menu/landing/i18n: `dashboard/xBot/src/components/layout/Sidebar.jsx`, `dashboard/xBot/src/pages/LandingPage.jsx`, `dashboard/xBot/src/i18n/index.js` (`smartCopyPage`, `pageSmartCopyDesc`).
- UI riêng: `dashboard/xBot/src/pages/user/SmartCopyPage.jsx` gọi `/api/dashboard/smart-copy/status|leaders|start|stop|discover`.
- API riêng nằm trong shared router: `src/server/dashboardRoutes.js`.
- Engine riêng: `src/features/smartCopyEngine.js`; tự tạo `smart_copy_sessions`, `smart_copy_trades`, `smart_copy_leaders`, giữ polling trong process và gọi `autoTrading.js` để lập/thực thi plan.
- Chat tool riêng: `src/features/ai/onchain/smartCopyTools.js`; được spread bởi shared `src/features/ai/ai-onchain.js`; declaration `smart_copy` ở `src/features/ai/onchain/declarations.js`.
- Social copy-trading riêng nhưng cũng đã được product owner duyệt gỡ: `src/features/copyTrading.js`, `manage_copy_trading` trong `src/features/ai/onchain/marketTools.js`, declaration tương ứng trong `src/features/ai/onchain/declarations.js`, callback `copy|yes|*`, `copy|no|*`, `copy|unfollow|*`/writer `copy_trades` trong `src/app/coreCommands.js`, và suggestion chỉ phục vụ copy-trading trong `src/features/smartChatAI.js`.
- Giá sản phẩm `copy_trading` trong `src/services/x402PaymentService.js` bị gỡ vì không còn surface nào sử dụng.
- Không xóa primitive dùng chung chỉ vì tên/DB liên quan xuất hiện trong dependency scan. Các bảng `copy_*`, `smart_copy_*` được giữ nguyên; chỉ dừng code writer/poller trong release này.

### OKX AI / custom Agent Runtime — mã riêng sẽ gỡ sau khi Hermes thay thế

- UI route/import: `dashboard/xBot/src/App.jsx` (`OKXAIPage`, `/okx-ai`).
- Menu/i18n: `dashboard/xBot/src/components/layout/Sidebar.jsx` (`dashboard.sidebar.okxai`) và `dashboard/xBot/src/i18n/index.js`.
- UI riêng: `dashboard/xBot/src/pages/user/OKXAIPage.jsx`; gọi `/okxai/*`, `/ai-router/*`, `/agent-runtime/*`.
- API riêng nằm trong shared router: `src/server/dashboardRoutes.js` (`/okxai/*`, `/agent-runtime/*`).
- Telegram command: `src/commands/okxai.js`.
- Tool adapter: `src/features/ai/okxaiTools.js`; được dùng bởi shared `src/server/chatRoutes.js` và custom runtime.
- Service riêng: toàn bộ `src/services/okxai/` (`index.js`, `agent.js`, `taskManager.js`, `a2a.js`, `wallet.js`, `x402Enhanced.js`). Các bảng tạo động: `okxai_agents`, `okxai_tasks`, `okxai_a2a_messages`.
- Custom runtime riêng: toàn bộ `src/services/agentRuntime/` (`index.js`, `policy.js`, `limits.js`, `toolRegistry.js`, `inbox.js`, `audit.js`). Các bảng tạo động: `agent_runtime_inbox`, `agent_runtime_audit`.
- Config/docs/tests liên quan: `.env.example`, `docs/OKXAI_AGENT_RUNTIME.md`, `docs/XBOT_OKXAI_BRIDGE_SETUP_MULTILANGUAGE.md`, `__tests__/agentRuntime.test.js`.

### Shared code phải giữ và tái sử dụng

- Public API/auth/tenant boundary: `src/server/apiServer.js`, `src/server/dashboardAuth.js`, `src/server/chatRoutes.js`, `src/server/dashboardRoutes.js`, `src/server/validation.js`.
- Chat UI/API client/auth: `dashboard/xBot/src/pages/user/ChatPage.jsx`, `dashboard/xBot/src/api/client.js`, `dashboard/xBot/src/stores/authStore.js`, `dashboard/xBot/src/config.js`.
- AI provider abstraction: toàn bộ `src/services/aiRouter/` và `__tests__/aiRouter.test.js`; thay provider `9router` thành private OpenAI-compatible/SSE endpoint, không đưa key ra browser.
- Chat AI/tool core: `src/features/ai/ai-onchain.js`, `src/features/ai/onchain/declarations.js`, mọi onchain tool không thuộc hai module bị gỡ, `src/features/ai/clients.js`, `src/features/aiService.js`, `src/features/smartChatAI.js`, `db/ai.js`, bảng `user_ai_memory` trong `db/schema.js`.
- Onchain/OKX reusable: `src/services/onchainos.js`, `src/services/okxService.js`, `src/services/okxCex.js`, `src/server/okxRoutes.js`, wallet/key managers và confirmation handlers hiện có.
- Billing/rate-limit primitives: `src/services/x402PaymentService.js`, `src/core/jobQueue.js`; chỉ xóa SKU của module cũ, không xóa service.
- Locales bot: `locales/{en,vi,zh,ko,ru,id}.json`; chỉ xóa key thực sự dành cho module cũ sau source scan, giữ key Chat/onchain dùng chung.

---

## 2. Danh sách file đã được duyệt xóa

Product owner đã phê duyệt scope sau. Trước từng deletion vẫn phải source/dependency scan để bảo đảm file không chứa primitive dùng chung:

1. `dashboard/xBot/src/pages/user/AiTraderPage.jsx`
2. `dashboard/xBot/src/components/AiTraderPanel.jsx`
3. `dashboard/xBot/src/pages/user/SmartCopyPage.jsx`
4. `dashboard/xBot/src/pages/user/OKXAIPage.jsx`
5. `src/features/autoTrading.js`
6. `src/features/tradeExecutionEngine.js`
7. `src/features/smartCopyEngine.js`
8. `src/features/ai/onchain/smartCopyTools.js`
9. `src/commands/okxai.js`
10. `src/features/ai/okxaiTools.js`
11. `src/services/okxai/index.js`
12. `src/services/okxai/agent.js`
13. `src/services/okxai/taskManager.js`
14. `src/services/okxai/a2a.js`
15. `src/services/okxai/wallet.js`
16. `src/services/okxai/x402Enhanced.js`
17. `src/services/agentRuntime/index.js`
18. `src/services/agentRuntime/policy.js`
19. `src/services/agentRuntime/limits.js`
20. `src/services/agentRuntime/toolRegistry.js`
21. `src/services/agentRuntime/inbox.js`
22. `src/services/agentRuntime/audit.js`
23. `__tests__/agentRuntime.test.js` (chỉ sau khi test Hermes bridge thay thế đã xanh)
24. `docs/OKXAI_AGENT_RUNTIME.md`
25. `docs/XBOT_OKXAI_BRIDGE_SETUP_MULTILANGUAGE.md`
26. `src/features/copyTrading.js`
27. `src/features/smartOrderExecutor.js` nếu source scan xác nhận chỉ phục vụ `autoTrading.js` (không xóa nếu có consumer dùng chung)

Không xóa DB/table trong cùng release. Đầu tiên dừng writer, export/backup, để bảng read-only qua ít nhất một rollback window; drop table phải là migration riêng được duyệt.

---

## 3. Kiến trúc đích

```text
Browser/Telegram
  -> xBot Node/Express (public)
       auth + tenant scope + quota/cost + conversation mapping
       tool allowlist/risk + approval + onchain confirmation
       SSE relay/cancellation/idempotency/audit
       -> private 9Router (OpenAI-compatible /v1, SSE)
       -> private Hermes Python service
            Service API/Runs hoặc OpenAI-compatible API
            tenant-scoped run/thread + tool-call envelopes
            -> xBot-owned approved tool executor
            -> OnchainOS MCP server/artifact (read-only mặc định)

Updater riêng
  upstream OnchainOS -> resolve commit -> download -> SHA verify
  -> license gate -> static/contract tests -> staging -> canary
  -> atomic promote manifest/current pointer -> rollback previous artifact
```

- Node là nơi duy nhất nhận dashboard token và nắm mapping `userId/tenantId -> conversation/run`; 9Router/Hermes không tin tenant do client gửi trực tiếp.
- 9Router bind private interface/network, xác thực service-to-service, timeout/circuit breaker; Node truyền model policy và relay SSE, không lộ provider key.
- Hermes không được fork/copy vào xBot. Client Node mới dự kiến ở `src/services/hermes/client.js`; orchestration/policy dự kiến ở `src/services/chatOrchestrator/{index,policy,sse}.js`.
- Python adapter mỏng (nếu Hermes cần normalization) dự kiến ở `services/hermes-api/app/main.py`, `services/hermes-api/tests/`; nó gọi Hermes API chuẩn, không sửa core Hermes.
- OnchainOS MCP adapter dự kiến `src/services/onchainosMcp.js`; updater `scripts/update-onchainos-skills.js`; manifest pin `config/onchainos-skills.lock.json` chứa repo, commit, artifact SHA, schema/version và license review status. Không chứa secret.
- Mọi side effect dùng tool envelope gồm `tenantId`, `userId`, `runId`, `toolCallId`, risk, args hash, expiry và idempotency key. Onchain write luôn cần confirmation gắn đúng chain/token/amount/to/calldata; simulation không thay thế confirmation.

---

## 4. Phases TDD, migration và rollback

### Phase 0 — Baseline và contract tests (không đổi hành vi)

**Tạo:** `__tests__/chatAiConsolidation.contract.test.js`, `__tests__/chatOrchestrator.test.js`, `__tests__/hermesBridge.test.js`, `__tests__/onchainosUpdater.test.js`.

1. RED: test inventory khẳng định chỉ `/chat` xuất hiện trong nhóm AI sau migration; test old URLs trả redirect/404 có chủ ý.
2. RED: contract cho OpenAI-compatible streaming (`data:` chunks, `[DONE]`, abort, timeout, upstream error).
3. RED: tenant A không đọc/tiếp tục run, key, audit hoặc tool result của tenant B.
4. RED: high-risk tool dừng ở `approval_required`; replay cùng idempotency key không thực thi lần hai.
5. Ghi baseline latency, token/cost, cancellation và test hiện tại. Không “sửa” test bằng snapshot mơ hồ.

**Rollback:** chưa có thay đổi runtime.

### Phase 1 — Node orchestrator + private 9Router

**Sửa:** `src/services/aiRouter/{providers,router,index}.js`, `src/server/chatRoutes.js`, `.env.example`.
**Tạo:** `src/services/chatOrchestrator/{index,policy,sse}.js`.

1. RED cho service auth, allowlisted model, SSE relay, abort propagation, timeout, fallback và circuit breaker.
2. GREEN: cấu hình 9Router bằng internal base URL + service credential; dùng gateway OpenAI-compatible/SSE, không import source 9Router.
3. Tách server-owned và BYOK credential; encrypt-at-rest hiện trạng phải được audit, không log headers/body/key.
4. Thêm per-tenant concurrency, request/token/cost ceilings và rate limits.
5. Feature flag `CHAT_ORCHESTRATOR_V2`; shadow only trước, rồi canary theo tenant.

**Rollback:** tắt flag để quay lại `chatRoutes.js`/`aiRouter` hiện tại; không thay schema ở phase này.

### Phase 2 — Hermes Python service, không fork

**Tạo:** `src/services/hermes/client.js`, `services/hermes-api/app/main.py`, `services/hermes-api/tests/test_runs.py`, `services/hermes-api/requirements.lock` (hoặc lockfile chuẩn được chọn sau spike).

1. RED contract against fake Hermes: create/resume/cancel run, SSE, tool call, retry-safe request ID.
2. GREEN dùng Hermes Service API/Runs; nếu deployment chỉ bật OpenAI-compatible API thì adapter giữ cùng internal contract.
3. Service private, mTLS hoặc rotated service token; Node ký tenant/run context, Hermes không nhận dashboard token.
4. Tool execution quay về Node allowlist; Hermes chỉ đề xuất tool call, không giữ wallet key và không tự duyệt.
5. Shadow compare rồi canary 1%/tenant allowlist; quan sát error, cost, latency, stuck runs.

**Rollback:** `HERMES_ENABLED=false`, route quay về 9Router trực tiếp; giữ run mapping mới nhưng không tiếp tục chúng qua engine cũ.

### Phase 3 — OnchainOS MCP và updater an toàn

**Tạo:** `src/services/onchainosMcp.js`, `scripts/update-onchainos-skills.js`, `config/onchainos-skills.lock.json`; artifact runtime nằm ngoài source tree ở thư mục versioned.

1. RED: updater từ chối unpinned ref, SHA mismatch, schema incompatibility, unsigned/unreviewed manifest và license gate chưa đạt.
2. Resolve “latest” thành commit cụ thể; pin commit + SHA-256 trong lock manifest. Không checkout/chạy trực tiếp `main`.
3. **License gate bắt buộc:** xác minh license file/metadata tại commit pin và quyền redistribution; nếu chưa rõ, chỉ fetch/use nội bộ, không bundle/publish artifact.
4. Chạy static scan, MCP schema/contract tests, read-only tool tests; staging rồi canary.
5. Atomic promote bằng manifest/current pointer; giữ previous artifact để rollback tức thì. Updater không có production wallet secret.
6. MCP read tools có thể auto theo policy; write/onchain tools luôn qua Node approval + simulation + explicit confirmation + idempotency.

**Rollback:** atomic pointer về commit/SHA trước; disable MCP adapter, fallback sang `src/services/onchainos.js` hiện tại.

### Phase 4 — UI consolidation, sau đó gỡ module cũ

**Sửa:** `dashboard/xBot/src/App.jsx`, `dashboard/xBot/src/components/layout/Sidebar.jsx`, `dashboard/xBot/src/pages/user/ChatPage.jsx`, `dashboard/xBot/src/pages/LandingPage.jsx`, `dashboard/xBot/src/i18n/index.js`, `src/server/dashboardRoutes.js`, `src/server/chatRoutes.js`, `src/features/ai/ai-onchain.js`, `src/features/ai/onchain/{declarations,marketTools}.js`, `src/services/x402PaymentService.js`, `.env.example`.

1. RED source/navigation tests cho route/menu/chip cũ và old API không còn reachable.
2. Xóa import/route/menu/landing/i18n của AI Trading, Smart Copy, OKX AI; bỏ chip/panel AI Trader khỏi Chat.
3. Bỏ API/tool/declaration/SKU/config của module cũ, gồm cả social copy-trading đã được duyệt xóa; giữ Chat, aiRouter, onchain generic và mọi primitive dùng chung.
4. Dừng mọi poller/writer cũ trước khi xóa module; kiểm tra active sessions và graceful shutdown.
5. Source scan ngay trước deletion rồi xóa các file đã được duyệt ở mục 2; không xóa conditional candidate nếu còn consumer dùng chung.
6. Không drop bảng; xuất row counts/backup và ghi migration cleanup riêng.

**Rollback:** release trước còn file/module; old URLs có thể redirect về `/chat`. Không rollback code mới trong khi bật writer schema không tương thích.

### Phase 5 — Canary/promote và cleanup dữ liệu tách biệt

1. Canary theo tenant, không random theo request; sticky engine per conversation.
2. Gates: security tests, no cross-tenant reads, no duplicate side effect, SSE completion/cancel, cost ceiling, artifact provenance.
3. Promote dần; giữ flags và artifact trước trong rollback window.
4. Chỉ sau window: trình migration riêng cho `auto_trading_*`, `smart_copy_*`, `okxai_*`, `agent_runtime_*`; backup + dry-run + approval trước DROP.

---

## 5. Security và multitenancy bắt buộc

- Derive `tenantId/userId` từ auth server-side; mọi SELECT/UPDATE/run/tool/audit phải scope tenant + user.
- Không dùng fallback `'server'` cho request người dùng; service identity tách khỏi user identity.
- Secret chỉ ở secret store/env của service tương ứng; redact logs/traces/errors; không truyền xuống browser/SSE.
- Service-to-service auth, private network, egress allowlist, body/stream limits, timeout, cancellation và backpressure.
- Tool registry default-deny; arguments validate bằng schema; approval token single-use, short TTL, bound args hash.
- Onchain: simulation, chain/asset/amount/recipient display, explicit user confirmation, nonce/idempotency/replay protection; không auto-sign/auto-send.
- Audit append-only cho prompt metadata, routing decision, approvals, tool call và artifact version; không lưu plaintext secret.
- Rate/cost limit theo tenant/user/provider; 9Router fallback không được vượt model/risk/cost policy.

---

## 6. Acceptance criteria

- Dashboard nhóm AI chỉ có Chat AI; không import/menu/route/chip cho AI Trading, Smart Copy, OKX AI.
- Old UI routes redirect có chủ ý về `/chat` hoặc 404; old private APIs trả 404/410, không còn poller/writer cũ.
- Chat text streaming hoạt động end-to-end qua Node -> 9Router và Node -> Hermes; abort client dừng upstream.
- Không provider/service/wallet secret xuất hiện ở JS bundle, SSE, response hoặc logs.
- Tenant isolation tests xanh cho conversations, runs, user keys, approvals, audit và tool results.
- Tool high-risk không chạy khi thiếu/expired/mismatched approval; replay không tạo side effect thứ hai.
- Onchain write hiển thị simulation + exact transaction intent và cần confirmation; canary dùng testnet/dry-run, không hành động trả phí/onchain trong CI.
- OnchainOS runtime báo đúng pinned commit + SHA; SHA/license/schema failure không promote; rollback artifact được kiểm thử.
- Hermes dùng API/service boundary, không có vendored/forked Hermes source trong repo.
- Toàn bộ test hiện tại, test mới và dashboard build xanh; `git diff --check` xanh.
- File trong danh sách duyệt chỉ bị xóa sau source scan; table/data chỉ bị drop qua migration riêng sau rollback window.

---

## 7. Commands test/verification (Git Bash, từ repo root)

```bash
cd '/c/Users/Admin/Downloads/Build X/xBot'

# Baseline và focused TDD
npm test -- --runInBand
npx jest __tests__/aiRouter.test.js --runInBand
npx jest __tests__/chatAiConsolidation.contract.test.js __tests__/chatOrchestrator.test.js __tests__/hermesBridge.test.js __tests__/onchainosUpdater.test.js --runInBand

# Python adapter/Hermes contracts (dùng Python 3.11+ với requirements đã cài)
python -m pytest services/hermes-api/tests -q

# Frontend compile
npm --prefix dashboard run build

# Không còn UI/module strings cũ trong source active
node -e "const fs=require('fs'),p=require('path');const roots=['dashboard/xBot/src'];const bad=[];function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=p.join(d,e.name);e.isDirectory()?w(f):/\.(js|jsx)$/.test(f)&&/AiTrader|SmartCopy|OKXAI|\/ai-trader|\/smart-copy|\/okx-ai/.test(fs.readFileSync(f,'utf8'))&&bad.push(f)}}roots.forEach(w);if(bad.length){console.error(bad.join('\n'));process.exit(1)}"

# Private services (dev/staging; URL/token lấy từ secret environment, không in token)
curl -fsS "$NINEROUTER_INTERNAL_URL/health"
curl -fsS "$HERMES_INTERNAL_URL/health"
node scripts/update-onchainos-skills.js --check --lock config/onchainos-skills.lock.json
node scripts/update-onchainos-skills.js --verify-current --lock config/onchainos-skills.lock.json

# Quality gates cuối
npm test -- --runInBand
npm --prefix dashboard run build
git diff --check
git status --short
```

Kỳ vọng: mọi suite/build exit 0; source scan không in file; health trả 2xx; updater xác nhận commit/SHA hiện tại và không promote khi bất kỳ gate nào fail.
