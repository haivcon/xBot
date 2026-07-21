# Handoff: Tích hợp sâu 9Router vào Chat AI của XBot

> Cập nhật: 2026-07-18  
> Trạng thái: **đang triển khai, chưa hoàn tất, chưa được xác minh end-to-end**  
> Mục đích: tài liệu này là nguồn tiếp nối cho một phiên agent/chat mới khi context hiện tại đã quá lớn.

---

## 1. Mục tiêu sản phẩm

Tích hợp sâu 9Router vào Chat AI của XBot ở cả:

1. Dashboard React.
2. Backend Chat AI của dashboard.
3. Chat AI trong Telegram bot.
4. Quản lý tài khoản provider, combo, model, usage và quota.

Yêu cầu cốt lõi:

- Chat AI của XBot chỉ gửi inference qua 9Router.
- Người dùng đăng nhập provider của chính họ trong phần cài đặt Chat AI.
- Tài khoản provider phải gắn với Telegram ID của người dùng.
- Người dùng A tuyệt đối không được xem hoặc sử dụng account/token/quota/usage của người dùng B.
- Browser và XBot không được thu thập hoặc lưu API key/provider token trực tiếp.
- Credential do 9Router quản lý trong vùng dữ liệu riêng của tenant.
- Dashboard và Telegram phải dùng cùng tenant, cùng provider account, cùng combo/model và cùng quota.
- Các khu vực `Providers`, `Combos`, `Usage & Analytics`, `Quota Tracker` của 9Router phải xuất hiện rõ trong Chat AI settings của XBot.
- Không được fallback âm thầm sang Google/OpenAI/Groq bằng key global hoặc key cũ của XBot.

Repository nguồn 9Router:

- <https://github.com/decolua/9router>
- Source đang được vendored dưới `services/nine-router-sidecar/`.
- Phiên bản đã khảo sát trong phiên trước: 9Router `0.5.35`.
- Trước khi release phải khóa chính xác upstream commit/tag và cập nhật notice/license.

---

## 2. Kiến trúc đích

```text
Dashboard browser
    |
    | Dashboard auth cookie/token
    v
XBot Node API
    |
    | Tenant ID chỉ lấy từ dashboard session
    | HMAC-signed internal tenant assertion
    v
9Router sidecar (internal network only)
    |
    | Resolve tenant context
    v
data/nine-router-tenants/<telegram-id>/...
    |
    +-- provider accounts/tokens
    +-- combos/default model
    +-- usage/analytics
    +-- quota state
```

```text
Telegram update
    |
    | msg.from.id
    v
XBot Telegram Chat AI
    |
    | HMAC-signed internal tenant assertion
    v
Cùng 9Router sidecar và cùng tenant DB như dashboard
```

### Quy tắc tenant bắt buộc

- Canonical tenant ID là Telegram user ID dạng chuỗi.
- Dashboard không được nhận `tenantId` từ body/query/header của browser.
- Telegram không được nhận tenant ID từ nội dung lệnh hoặc callback payload.
- XBot phải tự suy ra tenant từ:
  - `req.dashboardUser.userId` đối với dashboard.
  - `msg.from.id` đối với Telegram.
- Sidecar phải xác minh chữ ký HMAC trước khi mở bất kỳ tenant DB nào.
- Tenant ID phải được normalize và chống path traversal.
- Không dùng một SQLite DB chung chứa credential của tất cả người dùng.
- Không log token, cookie provider, OAuth code, request Authorization hoặc tenant secret.
- Usage/quota/model discovery cũng phải tenant-bound, không chỉ riêng inference.

---

## 3. Những thay đổi đã có trong working tree

### 3.1 File đã sửa và đang được Git theo dõi

Theo `git status --short` gần nhất:

```text
 M __tests__/chatAiConsolidation.contract.test.js
 M dashboard/xBot/src/pages/user/ChatPage.jsx
 M src/server/chatRoutes.js
 M src/server/dashboardAuth.js
 M src/server/dashboardRoutes.js
 M src/services/chatOrchestrator/index.js
 M src/services/nineRouterConnection.js
```

Thống kê diff gần nhất:

```text
__tests__/chatAiConsolidation.contract.test.js | 13 +++--
dashboard/xBot/src/pages/user/ChatPage.jsx     |  7 +++
src/server/chatRoutes.js                       | 66 +++++++++++++++-----------
src/server/dashboardAuth.js                    |  4 +-
src/server/dashboardRoutes.js                  |  4 +-
src/services/chatOrchestrator/index.js         | 11 ++++-
src/services/nineRouterConnection.js           | 27 ++++++++---
```

### 3.2 File/thư mục mới chưa được Git theo dõi

```text
?? dashboard/xBot/src/components/chat/NineRouterSettings.jsx
?? services/nine-router-sidecar/
?? src/server/nineRouterTenantRoutes.js
?? src/services/nineRouterTenantClient.js
```

### 3.3 Ý nghĩa của các thay đổi hiện tại

#### `services/nine-router-sidecar/`

Đã vendor source 9Router và bắt đầu chuyển thành sidecar tenant-aware.

Các file đang mở/đã chỉnh quan trọng:

- `services/nine-router-sidecar/tenant-context.cjs`
- `services/nine-router-sidecar/custom-server.js`
- `services/nine-router-sidecar/src/lib/db/driver.js`
- `services/nine-router-sidecar/src/lib/db/paths.js`
- `services/nine-router-sidecar/src/lib/db/migrate.js`
- `services/nine-router-sidecar/src/lib/db/backup.js`

Mục đích của thay đổi:

- Nhận tenant assertion nội bộ.
- Resolve tenant theo Telegram ID.
- Chuyển DB path/migration/backup sang DB riêng theo tenant.
- Chạy custom server bao quanh 9Router.

**Chưa được xem là hoàn tất.** Cần audit toàn bộ nơi 9Router truy cập DB/file/cache để chắc chắn không còn singleton/global path.

#### `src/services/nineRouterTenantClient.js`

Đã tạo client nội bộ của XBot để:

- Normalize tenant ID.
- Lấy cấu hình sidecar nội bộ.
- Tạo header tenant có chữ ký HMAC SHA-256.
- Không đưa provider credential ra dashboard.

Contract test hiện kiểm tra các dấu hiệu:

- `createHmac('sha256', secret)`
- `normalizeTenantId(tenantId)`

Cần tiếp tục harden:

- Timestamp window.
- Nonce/replay protection nếu chưa có.
- Method/path/body binding trong chữ ký.
- Abort/timeout.
- Sanitized errors.
- Không cho URL sidecar là public URL.

#### `src/server/nineRouterTenantRoutes.js`

Đã tạo route quản lý 9Router dành cho dashboard tenant.

Mục đích:

- Proxy/adapter cho Providers.
- Proxy/adapter cho Combos.
- Proxy/adapter cho Usage & Analytics.
- Proxy/adapter cho Quota Tracker.
- Mọi request lấy tenant từ `req.dashboardUser`, không lấy từ browser payload.

Cần kiểm tra:

- Route/path allowlist chặt chẽ, không làm open proxy.
- Method allowlist.
- Body size limit.
- Response sanitization.
- OAuth flow/callback.
- SSE/stream cancellation.
- Không trả credential hoặc upstream cookie.

#### `src/server/dashboardRoutes.js`

Đã mount route tenant-aware:

```text
/ai/9router
```

và Chat AI route:

```text
/ai
```

Trong file vẫn còn ONE Connect owner/global runtime cũ. Cần quyết định rõ:

- ONE Connect chỉ là health/config hạ tầng sidecar cho owner; hoặc
- thay hoàn toàn bằng health sidecar mới.

Không được để ONE Connect global credential trở thành đường inference thay thế tenant.

#### `src/server/dashboardAuth.js`

Đã bắt đầu đưa `tenantId` vào dashboard identity, dựa trên Telegram user ID.

Cần xác minh mọi hình thức đăng nhập dashboard đều tạo cùng canonical identity và không cho client override.

#### `src/services/chatOrchestrator/index.js`

Đã mở rộng orchestrator để header có thể được tạo theo request/identity thay vì Authorization key global cố định.

Mục tiêu là dashboard và Telegram đều có thể dùng tenant assertion trên cùng orchestrator.

Cần bổ sung test cho:

- Dynamic headers.
- Không leak header giữa hai request concurrent.
- Abort.
- Retry không đổi tenant.
- Tool loop giữ đúng tenant.

#### `src/services/nineRouterConnection.js`

Đã mở rộng model discovery để nhận tenant-aware headers/identity.

Cần bổ sung test cross-tenant và concurrent discovery.

#### `src/server/chatRoutes.js`

Đã chuyển phần lớn dashboard Chat AI sang:

- Internal tenant sidecar URL.
- `createTenantHeaders`.
- Model discovery theo tenant.
- Chỉ chấp nhận model nằm trong model list tenant.
- Orchestrator dùng dynamic tenant headers.
- Không ghi usage vào singleton `nineRouterRuntime`; usage thuộc 9Router tenant DB.

Contract hiện kỳ vọng các dấu hiệu:

```text
baseUrl: getTenantApiRoot()
buildHeaders: (identity, request) => createTenantHeaders(...)
availableModelIds.includes(chosenModel)
configured: true
```

Cần audit runtime, không chỉ dựa trên string contract.

#### `dashboard/xBot/src/components/chat/NineRouterSettings.jsx`

Đã tạo UI settings tích hợp vào Chat AI.

Phạm vi dự kiến:

- Providers.
- Combos.
- Usage & Analytics.
- Quota Tracker.

Cần xác minh thực tế:

- Có loading, empty, error states.
- Không có hardcoded user-facing text.
- Dùng `react-i18next`.
- Dark/light mode.
- Mobile.
- Dùng token/class từ `dashboard/xBot/src/index.css`.
- Không hardcode hex color.
- Chỉ dùng `lucide-react`.
- Không hiển thị secret.

#### `dashboard/xBot/src/pages/user/ChatPage.jsx`

Đã gắn `NineRouterSettings` vào Chat AI page.

Cần kiểm tra UX:

- Settings không phá chat layout.
- Tab/drawer phù hợp mobile.
- Refresh model sau khi connect/disconnect provider hoặc sửa combo.
- Trạng thái “chưa có provider” dẫn người dùng vào settings.
- Model selector chỉ hiển thị model tenant thực sự có thể dùng.

#### `__tests__/chatAiConsolidation.contract.test.js`

Hai assertion cũ đã được đổi vì chúng mâu thuẫn với tenant architecture:

1. Không còn ghi usage vào `nineRouterRuntime.recordUsage`.
2. Không còn bắt inference dùng `baseUrl: NINEROUTER_API_ROOT` global.

Assertion mới kiểm tra tenant headers/HMAC/model allowlist.

**Contract test chưa được chạy lại sau lần chỉnh cuối.**

---

## 4. Trạng thái kiểm thử hiện tại

Lần chạy full test gần nhất trước khi cập nhật contract:

```text
Test Suites: 1 failed, 12 passed, 13 total
Tests:       2 failed, 109 passed, 111 total
```

Hai lỗi đều nằm trong:

```text
__tests__/chatAiConsolidation.contract.test.js
```

và đều là assertion cũ liên quan:

- `nineRouterRuntime.recordUsage`.
- `baseUrl: NINEROUTER_API_ROOT`.

Sau đó contract đã được cập nhật, nhưng chưa chạy lại.

Dashboard build **chưa chạy thực sự**. Lệnh trước dùng chuỗi XML-escaped:

```text
&&
```

trong Windows CMD nên shell báo:

```text
'amp' is not recognized...
```

### Phải chạy từng lệnh riêng trong phiên tiếp theo

```bat
npx jest __tests__/chatAiConsolidation.contract.test.js --runInBand --verbose
```

```bat
npm test -- --runInBand
```

```bat
npm --prefix dashboard/xBot run build
```

Không ghép lệnh bằng chuỗi XML-escaped.

---

## 5. Phần quan trọng nhất chưa hoàn tất: Telegram Chat AI

Telegram hiện vẫn dùng kiến trúc cũ trong:

- `src/app/aiHandlers.js`
- `src/commands/ai.js`
- có thể thêm các helper trong `src/features/aiService.js`
- có thể thêm config/provider adapter trong `src/services/aiRouter/providers.js`

### Các điểm đã xác định trong `src/app/aiHandlers.js`

```text
1227: async function isNineRouterAvailable(force = false)
3695: async function runNineRouterCompletion(...)
```

Hàm `runNineRouterCompletion` hiện vẫn:

- Nhận `personalKeys`.
- Nhận `serverKeys`.
- Tạo key pool.
- Tự xoay API key.
- Gọi `NINEROUTER_CHAT_COMPLETIONS_URL`.
- Có log kiểu “trying next key”.
- Có fallback logic dựa trên key nguồn.
- Dùng `NINEROUTER_MODEL` global.

Các dòng cuối đã quan sát:

```text
3793: nếu 429 thì thử key tiếp theo
3796: log key pool/index
3802: throw nếu không có response
3806: đọc response.choices[0].message
3818: lưu session history
3825: hiển thị provider
3826: hiển thị model
```

### Đây là việc nên làm tiếp theo đầu tiên

Không tiếp tục patch rời rạc trực tiếp trong file 4.800 dòng. Thực hiện theo thứ tự:

1. Mở rộng service tenant hiện có thay vì tạo một router/provider duplicate.
2. Tạo một factory/helper dùng chung từ:
   - `nineRouterTenantClient`
   - `nineRouterConnection`
   - `chatOrchestrator`
3. Helper phải nhận canonical `userId`, sau đó:
   - Discover model của đúng tenant.
   - Chọn model được phép.
   - Tạo HMAC headers theo request.
   - Gọi sidecar nội bộ.
   - Trả text/model/usage không chứa secret.
4. Sửa `isNineRouterAvailable(force)` thành tenant-aware:
   - Signature dự kiến: `isNineRouterAvailable(userId, force)`.
   - Không dùng health cache global cho mọi người.
   - Nếu cache, key phải là tenant ID và TTL ngắn.
   - Không cache credential/header.
5. Sửa `runNineRouterCompletion(...)`:
   - Bỏ `personalKeys`.
   - Bỏ `serverKeys`.
   - Bỏ key rotation.
   - Bỏ Authorization provider key.
   - Dùng tenant assertion.
   - Model phải đến từ tenant discovery hoặc tenant preference/combo.
6. Sửa mọi call site truyền `userId`.
7. Bỏ Chat AI fallback trực tiếp sang Google/OpenAI/Groq.
8. Nếu tenant chưa đăng nhập provider:
   - Fail closed.
   - Trả thông báo i18n.
   - Đưa link/nút mở Dashboard → Chat AI → Settings → Providers.
9. Giữ nguyên:
   - Telegram thread ID.
   - Session history.
   - Markdown escaping.
   - Tool execution policy.
   - Rate limit.
   - Queue/concurrency.
   - TTS/image path nếu không liên quan.
10. Sửa `src/commands/ai.js` để không còn thu thập `nineRouterUserKeys`.
11. Sửa `src/features/aiService.js`:
   - Không còn prompt “Send your 9Router API key”.
   - Thay bằng hướng dẫn đăng nhập provider trong dashboard.
12. Kiểm tra toàn repo và loại khỏi Chat AI các pattern:
   - `nineRouterUserKeys`
   - `9router-local`
   - `NINEROUTER_ALLOW_NO_KEY`
   - key pool riêng cho 9Router
   - fallback direct-provider

### Quy tắc phạm vi

Không xóa cơ chế API key khác của XBot một cách mù quáng nếu nó còn phục vụ tính năng ngoài Chat AI. Chỉ đảm bảo mọi đường Chat AI mới đi qua 9Router tenant. Nếu muốn xóa toàn bộ API Hub cũ, phải đánh giá như một refactor riêng.

---

## 6. Kế hoạch triển khai chi tiết còn lại

## Phase A — Baseline và bảo vệ working tree

1. Chạy:
   ```bat
   git status --short
   git diff --check
   git diff -- src/server/chatRoutes.js
   ```
2. Không dùng `git reset`, `git checkout --` hoặc xóa thay đổi hiện tại.
3. Kiểm tra `services/nine-router-sidecar/`:
   - Không có `.git/` lồng.
   - Không có `node_modules`.
   - Không có `.next`.
   - Không có SQLite/data thật.
   - Không có `.env` chứa secret.
4. Cập nhật root `.gitignore` cho:
   - Tenant DB.
   - Sidecar runtime data.
   - OAuth/session cache.
   - Build artifacts.
5. Ghi upstream commit/tag của 9Router vào notice/lock file.

**Acceptance:** working tree rõ ràng, không có secret/artifact/dữ liệu user chuẩn bị được commit.

---

## Phase B — Hoàn thiện sidecar tenant isolation

Audit toàn bộ source 9Router cho các nơi truy cập state global:

- DB singleton.
- Config singleton.
- Cache singleton.
- Provider token store.
- Combo store.
- Usage DB.
- Quota tracker.
- Backup/restore.
- OAuth session/state.
- Cron/background refresh.
- SSE/event emitter.
- File paths.
- Export/import.

Thực hiện:

1. Mỗi request phải chạy trong tenant context rõ ràng.
2. DB driver không được reuse connection của tenant A cho B.
3. Connection cache nếu có phải key theo canonical tenant ID.
4. Migration/backup/restore phải trỏ đúng tenant.
5. Background quota refresh phải giữ tenant context.
6. OAuth callback phải phục hồi tenant từ signed OAuth state:
   - Không tin tenant từ query thô.
   - State một lần sử dụng.
   - Có expiry.
   - Chống CSRF/replay.
7. Provider login popup/redirect không được rơi về default/global tenant.
8. File path phải chống `..`, slash, Unicode/path confusion.
9. HMAC assertion phải bind:
   - tenant ID
   - timestamp
   - nonce
   - HTTP method
   - request path
   - body digest nếu có body
10. Sidecar chỉ bind internal interface/network.
11. Không expose sidecar trực tiếp ra Internet.
12. Provider secrets không được xuất hiện trong API response/log/error.

**Acceptance:** hai request concurrent của tenant A/B đọc, ghi, login, chat, usage và quota hoàn toàn tách biệt.

---

## Phase C — Chuẩn hóa API adapter giữa XBot và 9Router

Không proxy tùy ý toàn bộ 9Router API. Xây allowlist endpoint rõ ràng.

Nhóm API cần có:

### Providers

- List provider definitions.
- List account connection status của tenant.
- Start login/connect.
- Complete/cancel login.
- Disconnect account.
- Enable/disable account nếu upstream hỗ trợ.
- Refresh status/quota.
- Không bao giờ trả token.

### Combos

- List combo.
- Create combo.
- Update combo.
- Delete combo.
- Set active/default combo.
- Validate model/provider references.
- Reorder/routing policy nếu upstream hỗ trợ.

### Models/endpoints

- Tenant model discovery.
- Model metadata.
- Active combo/default model.
- Chat completions.
- Streaming chat completions.
- Không chấp nhận model ngoài tenant catalog.

### Usage & Analytics

- Summary theo khoảng thời gian.
- Breakdown theo model/provider.
- Request count.
- Token/cost totals.
- Chart time series.
- Bounded range và pagination.

### Quota Tracker

- Account quota.
- Reset time.
- Remaining/used.
- Status/error.
- Last refresh.
- Refresh action có rate limit.

Yêu cầu adapter:

- Schema validation.
- Request timeout.
- Abort propagation.
- Response size limit.
- Sanitized errors.
- Không generic arbitrary URL/path proxy.
- Không forward browser Authorization/cookie sang provider.

**Acceptance:** dashboard chỉ gọi XBot API; XBot chỉ gọi allowlisted sidecar API bằng tenant assertion.

---

## Phase D — Hoàn thiện Dashboard UI

Audit `NineRouterSettings.jsx` theo `docs/DESIGN_SYSTEM.md` và `dashboard/xBot/src/index.css`.

Cấu trúc đề xuất:

1. Header:
   - 9Router status.
   - Active combo/model.
   - Refresh.
2. Tabs:
   - Providers.
   - Combos.
   - Usage & Analytics.
   - Quota Tracker.
3. Providers:
   - Account cards.
   - Connected/disconnected/error.
   - Connect/disconnect.
   - Popup/redirect status.
   - Empty/loading/error.
4. Combos:
   - List/editor.
   - Model/provider selector.
   - Default badge.
   - Validation.
   - Empty/loading/error.
5. Usage:
   - Summary cards.
   - Time range.
   - Chart/table.
   - Empty/loading/error.
6. Quota:
   - Per account quota.
   - Progress.
   - Reset timestamp.
   - Refresh.
   - Empty/loading/error.
7. Chat integration:
   - Refresh model list sau cấu hình.
   - Hiển thị routed-by 9Router.
   - Hiển thị active model/combo.
   - Không hiển thị raw endpoint/token.

UI rules:

- Dùng `glass-card`, `btn-primary`, `btn-secondary`, `btn-danger`, `input-field`, badge classes.
- Dùng `brand-*` và `surface-*`.
- Không hardcode hex.
- Chỉ dùng `lucide-react`.
- Dùng icon size chuẩn.
- Mobile usable ở `max-width: 480px` và `768px`.
- Dark/light mode.
- Không duplicate component đã có.

**Acceptance:** toàn bộ settings dùng được trên mobile/desktop và không có hardcoded text/color.

---

## Phase E — Dashboard i18n

Tất cả text mới phải dùng `t(...)`.

Thêm key có namespace rõ, ví dụ:

```text
dashboard.chatPage.nineRouter.*
dashboard.chatPage.providers.*
dashboard.chatPage.combos.*
dashboard.chatPage.usage.*
dashboard.chatPage.quota.*
```

Cập nhật mọi ngôn ngữ dashboard hiện được định nghĩa trong:

```text
dashboard/xBot/src/i18n/index.js
```

Bao phủ:

- Heading.
- Description.
- Button.
- Placeholder.
- Status.
- Loading.
- Empty.
- Error.
- Toast.
- Confirmation.
- Time range.
- Quota labels.
- Provider login instructions.

**Acceptance:** tìm kiếm trong component không còn user-facing string hardcoded.

---

## Phase F — Telegram Chat AI tenant-aware

Thực hiện refactor mô tả ở mục 5.

Ngoài ra cập nhật bot i18n trong tất cả:

```text
locales/en.json
locales/vi.json
locales/id.json
locales/ko.json
locales/ru.json
locales/zh.json
```

Các message cần có:

- Chưa kết nối provider.
- Mở dashboard để đăng nhập.
- Không có model khả dụng.
- Quota hết.
- Sidecar tạm không khả dụng.
- Model không còn được phép.
- Request cancelled/timed out.
- 9Router routed model/combo label.

Không gửi raw upstream error cho Telegram user.

**Acceptance:** cùng Telegram ID chat từ dashboard và bot dùng cùng provider account/quota/model catalog.

---

## Phase G — Docker, env và vận hành

Hiện chưa hoàn tất wiring.

Cần:

1. Thêm service 9Router sidecar vào root `docker-compose.yml`.
2. Internal network only.
3. Persistent volume cho tenant data.
4. Healthcheck sidecar.
5. XBot depends_on health hợp lý.
6. Shared tenant assertion secret qua secret/env.
7. Không expose sidecar port công khai mặc định.
8. Cập nhật:
   - `.env.example`
   - `dashboard/.env.example` nếu thực sự cần
   - `Dockerfile`
   - `.dockerignore`
   - root README/DASHBOARD_SETUP
9. Phân biệt:
   - Sidecar infrastructure URL.
   - Tenant assertion secret.
   - Không dùng provider API key global.
10. Readiness:
   - `/readyz` kiểm tra sidecar infrastructure health.
   - Không cần một user tenant cụ thể.
   - Không trả usage, tenant ID hoặc secret.
11. Graceful shutdown:
   - Abort stream.
   - Close tenant DB handles.
   - Flush safe state.

**Acceptance:** `docker compose up` khởi động XBot + dashboard + sidecar, tenant data persist, sidecar không public.

---

## Phase H — License và provenance

Vì source 9Router được vendor:

1. Xác nhận license từ `services/nine-router-sidecar/LICENSE`.
2. Ghi:
   - repository URL
   - version
   - exact commit SHA
   - license
   - local patches
3. Cập nhật `THIRD_PARTY_NOTICES.md`.
4. Không xóa copyright/license upstream.
5. Xem lại điều kiện redistribution trước release.
6. Cân nhắc dùng pinned image/submodule/patch workflow thay vì vendor toàn repo nếu phù hợp.

**Acceptance:** có provenance reproducible và đáp ứng license.

---

## Phase I — Kiểm thử bắt buộc

### Unit tests

- Tenant ID normalization.
- Invalid/missing signature.
- Expired timestamp.
- Replay nonce.
- Path traversal.
- Header construction.
- Request path/body binding.
- Error sanitization.
- Model allowlist.
- Dynamic header isolation.
- Abort and timeout.

### Tenant isolation integration tests

Tạo tenant A và B:

1. A connect provider.
2. B không thấy provider của A.
3. A tạo combo.
4. B không thấy combo của A.
5. A chat.
6. Usage/quota chỉ tăng ở A.
7. B không dùng được model chỉ có ở A.
8. Concurrent request không cross headers/DB.
9. OAuth callback của A không attach vào B.
10. Backup/restore không cross tenant.

### Dashboard route tests

- Unauthenticated → 401.
- Browser-supplied tenant ID bị bỏ qua.
- Cross-user route access bị từ chối.
- Arbitrary proxy path bị từ chối.
- Secret-shaped response bị lọc.
- Body/range/pagination limit.

### Telegram tests

- `msg.from.id` là tenant nguồn duy nhất.
- Không còn `nineRouterUserKeys`.
- Không còn key rotation.
- Không fallback direct provider.
- No provider → localized setup message.
- Model discovery và inference dùng cùng tenant.
- Quota error mapping.
- Session/tool loop giữ tenant.

### Frontend tests/build

- Loading.
- Empty.
- Error.
- Connect/disconnect.
- Combo CRUD.
- Usage range.
- Quota refresh.
- Mobile layout.
- Dark/light mode.
- No secret rendering.

### Commands cuối

Chạy riêng từng lệnh:

```bat
npx jest __tests__/chatAiConsolidation.contract.test.js --runInBand --verbose
```

```bat
npx jest __tests__/nineRouterConnection.test.js __tests__/nineRouterRuntime.test.js --runInBand --verbose
```

```bat
npm test -- --runInBand
```

```bat
npm --prefix dashboard/xBot run build
```

Sau khi kiểm tra script của sidecar:

```bat
npm --prefix services/nine-router-sidecar run lint
```

```bat
npm --prefix services/nine-router-sidecar run build
```

```bat
docker compose config
```

Không sửa assertion test để che lỗi runtime. Nếu test cũ mâu thuẫn với architecture mới, thay bằng contract bảo mật tương đương và thêm test hành vi.

---

## 7. Acceptance criteria cuối cùng

Chỉ đánh dấu hoàn tất khi tất cả điều kiện sau đạt:

### Security/isolation

- [ ] Browser không gửi/chọn tenant ID.
- [ ] Telegram dùng `msg.from.id`.
- [ ] HMAC assertion được xác minh.
- [ ] Replay/path traversal bị chặn.
- [ ] A không thể đọc hoặc dùng dữ liệu B.
- [ ] Credential không nằm trong XBot DB/log/response.
- [ ] Sidecar không public.
- [ ] OAuth callback tenant-safe.

### Functional

- [ ] Providers hiển thị và connect/disconnect được.
- [ ] Combos CRUD/default hoạt động.
- [ ] Model discovery phản ánh account/combo tenant.
- [ ] Dashboard Chat AI inference hoạt động.
- [ ] Telegram Chat AI inference hoạt động.
- [ ] Usage & Analytics đúng tenant.
- [ ] Quota Tracker đúng tenant.
- [ ] Dashboard và Telegram cùng một identity/data.

### UX

- [ ] Loading/empty/error đầy đủ.
- [ ] i18n đầy đủ.
- [ ] Mobile usable.
- [ ] Dark/light compatible.
- [ ] Không hardcoded color/text.
- [ ] Không hiển thị secret.

### Quality/release

- [ ] Root tests pass.
- [ ] Dashboard build pass.
- [ ] Sidecar lint/build/tests pass.
- [ ] Docker config/startup pass.
- [ ] `.gitignore` đúng.
- [ ] License/provenance hoàn tất.
- [ ] Không có artifact/data/secret bị commit.

---

## 8. Thứ tự tiếp tục khuyến nghị cho phiên chat mới

### Bước 1 — Đọc context tối thiểu

Đọc:

```text
docs/NINEROUTER_XBOT_HANDOFF.md
XBOT_ARCHITECTURE.md
docs/DESIGN_SYSTEM.md
docs/FEATURE_CHECKLIST.md
```

Sau đó:

```bat
git status --short
git diff --check
```

### Bước 2 — Chạy test hiện tại ngay

Chạy contract test riêng, rồi full tests và dashboard build riêng từng lệnh. Ghi lại lỗi thật trước khi sửa code.

### Bước 3 — Hoàn thiện Telegram trước

Đây là lỗ hổng chức năng lớn nhất:

- `src/app/aiHandlers.js`
- `src/commands/ai.js`
- `src/features/aiService.js`

Refactor về tenant client/orchestrator chung và loại key pool/fallback.

### Bước 4 — Thêm tenant isolation tests

Không tiếp tục mở rộng UI trước khi chứng minh A/B isolation bằng test.

### Bước 5 — Audit sidecar state/OAuth

Đảm bảo DB, cache, quota background jobs và OAuth callback đều tenant-aware.

### Bước 6 — Hoàn thiện API/UI/i18n

Sau khi contract tenant ổn định mới khóa schema frontend.

### Bước 7 — Docker/env/license

Wiring deployment, provenance và docs.

### Bước 8 — E2E

Hai Telegram account thật hoặc fixture A/B:

- Kết nối account khác nhau.
- Chat model khác nhau.
- So sánh usage/quota.
- Thử truy cập chéo.
- Restart containers và kiểm tra persistence.

---

## 9. Prompt đề xuất để mở phiên chat mới

```text
Tiếp tục tích hợp 9Router tenant-aware vào XBot.

Trước tiên hãy đọc:
- docs/NINEROUTER_XBOT_HANDOFF.md
- XBOT_ARCHITECTURE.md
- docs/DESIGN_SYSTEM.md
- docs/FEATURE_CHECKLIST.md

Sau đó kiểm tra git status/diff và chạy riêng:
1. npx jest __tests__/chatAiConsolidation.contract.test.js --runInBand --verbose
2. npm test -- --runInBand
3. npm --prefix dashboard/xBot run build

Không reset hoặc làm mất working tree hiện tại.

Ưu tiên tiếp theo là refactor Telegram Chat AI trong:
- src/app/aiHandlers.js
- src/commands/ai.js
- src/features/aiService.js

Yêu cầu:
- tenant duy nhất là Telegram user ID;
- dùng src/services/nineRouterTenantClient.js và orchestrator chung;
- không personal/server 9Router API key;
- không key rotation;
- không fallback Google/OpenAI/Groq trong Chat AI;
- model discovery và inference cùng tenant;
- fail closed và i18n nếu chưa connect provider;
- thêm test tenant A/B trước khi mở rộng tiếp.

Hãy làm từng bước, chạy test sau mỗi nhóm thay đổi và cập nhật checklist trong handoff.
```

---

## 10. Cảnh báo cho người tiếp tục

- Không xem code hiện tại là hoàn tất chỉ vì UI đã render.
- Không dựa duy nhất vào string-based contract test.
- Không gắn tenant bằng query/body do browser gửi.
- Không dùng global health/model cache cho mọi tenant.
- Không để OAuth callback mất tenant context.
- Không dùng DB riêng theo tenant nhưng cache/token singleton global.
- Không log key index/token/error thô.
- Không chạy lệnh ghép chứa `&&` trong Windows CMD.
- Không commit toàn bộ sidecar trước khi loại artifact/data và kiểm tra license.
- Không xóa các API key feature ngoài Chat AI nếu chưa xác định phạm vi phụ thuộc.
- Không chỉnh test để “xanh” nếu runtime vẫn cross-tenant hoặc fallback sai.