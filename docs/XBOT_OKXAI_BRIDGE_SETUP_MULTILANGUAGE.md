# xBot OKX.AI Bridge — Hướng dẫn cài đặt và sử dụng đa ngôn ngữ

Tài liệu này hướng dẫn cách cài đặt, cấu hình, triển khai và tích hợp **xBot OKX.AI Bridge / Agent Runtime** với các ứng dụng viết bằng nhiều ngôn ngữ khác nhau như JavaScript/Node.js, Python, Go, PHP, Java, C#, cURL/shell và các hệ thống backend bất kỳ.

Mục tiêu của bridge:

- Cho phép xBot đóng vai trò tương tự một lớp thay thế/mở rộng cho OpenClaw hoặc Hermes Agent.
- Làm cầu nối giữa người dùng OKX.AI/A2A và các AI provider bên ngoài.
- Hỗ trợ API key của server hoặc API key riêng của người dùng.
- Hỗ trợ các provider như:
  - OpenRouter / 9Router-compatible
  - Gemini
  - OpenAI-compatible endpoint
  - Groq
  - các provider tương thích chuẩn OpenAI Chat Completions.
- Nhận A2A/OKX.AI inbound envelope.
- Lưu inbox, decisions, audit log.
- Chạy tool an toàn qua policy `auto`, `semi-auto`, `manual`.
- Tích hợp dashboard quản trị.

---

## 1. Kiến trúc tổng quan

```text
User / OKX.AI
    │
    │ A2A task / webhook / message
    ▼
xBot Agent Runtime
    │
    ├── Inbound Inbox
    ├── Policy Guard
    ├── Audit Log
    ├── Quota / Limits
    ├── Tool Registry
    └── AI Router
            │
            ├── Server API Key
            ├── User API Key
            ├── Gemini
            ├── OpenRouter / 9Router
            ├── OpenAI-compatible
            └── Groq
```

Các module chính trong mã nguồn:

```text
src/services/agentRuntime/
src/services/aiRouter/
src/services/okxai/
src/features/ai/okxaiTools.js
src/server/dashboardRoutes.js
src/server/chatRoutes.js
dashboard/xBot/src/pages/user/OKXAIPage.jsx
docs/OKXAI_AGENT_RUNTIME.md
```

---

## 2. Chức năng chính

### 2.1 AI Router

AI Router chịu trách nhiệm định tuyến request chat tới provider phù hợp.

Chức năng:

- Chọn provider tự động hoặc theo yêu cầu.
- Dùng API key của server.
- Dùng API key riêng của user nếu có.
- Chuẩn hóa request dạng `messages`.
- Chuẩn hóa response từ nhiều provider.
- Hỗ trợ tool call nếu provider tương thích.

Provider thường dùng:

| Provider | Mục đích |
|---|---|
| `auto` | Tự chọn provider khả dụng |
| `openrouter` | Dùng OpenRouter hoặc 9Router-compatible |
| `gemini` | Dùng Google Gemini |
| `openai` | Dùng OpenAI hoặc endpoint tương thích OpenAI |
| `groq` | Dùng Groq |

---

### 2.2 Agent Runtime

Agent Runtime là lớp runtime để xử lý:

- Chat qua AI provider.
- Tool call.
- A2A inbound envelope.
- Inbound inbox.
- Decision approval/reject.
- Audit log.
- Runtime status.
- Quota.

Các hành động nguy hiểm như wallet/trade/payment/task stake nên luôn cần xác nhận người dùng.

---

### 2.3 OKX.AI Tools

Các tool mẫu đã tích hợp:

| Tool | Mục đích |
|---|---|
| `okxai_search_agents` | Tìm agent/ASP trên OKX.AI |
| `okxai_create_task` | Tạo task OKX.AI/A2A |
| `okxai_get_task` | Xem task |
| `okxai_wallet_status` | Xem trạng thái wallet |
| `okxai_wallet_balances` | Xem balances |

---

### 2.4 Dashboard UI

Dashboard có trang OKX.AI Bridge để:

- Xem status AI provider.
- Lưu/xóa user API key.
- Test AI bridge.
- Xem Agent Runtime status.
- Xem inbox/decisions/audit.
- Register/update bridge agent.
- Publish A2A task.
- Execute OKX.AI tool.

---

## 3. Cài đặt local

### 3.1 Cài dependencies backend

Tại thư mục gốc dự án:

```bash
npm install
```

### 3.2 Cài dependencies dashboard

```bash
npm --prefix dashboard install
```

### 3.3 Chạy test

```bash
npm test -- --runInBand
```

### 3.4 Build dashboard

```bash
npm --prefix dashboard run build
```

### 3.5 Chạy backend

```bash
npm start
```

### 3.6 Chạy dashboard dev

```bash
npm --prefix dashboard run dev
```

---

## 4. Cấu hình `.env`

Tạo file `.env` từ `.env.example`.

Ví dụ cấu hình cơ bản:

```env
# Server
PORT=3000
NODE_ENV=development

# OKX.AI
OKXAI_API_BASE_URL=https://example-okxai-api
OKXAI_API_KEY=your_okxai_api_key
OKXAI_AGENT_ID=your_registered_agent_id

# A2A / Agent Runtime inbound security
AGENT_RUNTIME_INBOUND_SECRET=replace_with_strong_random_secret

# Runtime mode: auto | semi-auto | manual
AGENT_RUNTIME_BRIDGE_MODE=semi-auto

# AI providers - server keys
OPENROUTER_API_KEY=your_openrouter_or_9router_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini

GEMINI_API_KEY=your_gemini_key
GEMINI_DEFAULT_MODEL=gemini-1.5-flash

OPENAI_API_KEY=your_openai_or_compatible_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_DEFAULT_MODEL=gpt-4o-mini

GROQ_API_KEY=your_groq_key
GROQ_DEFAULT_MODEL=llama-3.1-8b-instant

# Public callback URL if OKX.AI calls your server
PUBLIC_BASE_URL=https://your-domain.com
```

Khuyến nghị:

- Production phải dùng HTTPS.
- Không commit `.env`.
- `AGENT_RUNTIME_INBOUND_SECRET` phải đủ mạnh.
- Ban đầu dùng `AGENT_RUNTIME_BRIDGE_MODE=semi-auto`.

---

## 5. Runtime modes

### 5.1 `auto`

Tool được phép sẽ tự chạy nếu policy cho phép.

Chỉ nên dùng cho:

- Read-only tools.
- Demo nội bộ.
- Môi trường đã kiểm soát kỹ.

Không nên dùng auto cho:

- Trading.
- Payment.
- Wallet transfer.
- Stake/dispute.
- Task có rủi ro tài chính.

---

### 5.2 `semi-auto`

Khuyến nghị mặc định.

- Tool read-only có thể chạy tự động.
- Tool rủi ro cần xác nhận.
- Dashboard sẽ hiển thị decision để user approve/reject.

---

### 5.3 `manual`

Mọi tool quan trọng đều cần xác nhận.

Phù hợp cho:

- Production mới launch.
- Tài khoản có tiền thật.
- Luồng task có dispute/stake/payment.

---

## 6. API sử dụng tổng quát

Tên route cụ thể có thể tùy theo cách server đang mount `dashboardRoutes` và `chatRoutes`. Về mặt chức năng, các nhóm API chính gồm:

```text
AI Router:
POST /api/ai/chat
GET  /api/ai/status
POST /api/ai/user-keys
DELETE /api/ai/user-keys/:provider

Agent Runtime:
GET  /api/agent-runtime/status
POST /api/agent-runtime/chat
POST /api/agent-runtime/tool
POST /api/agent-runtime/inbound
POST /api/agent-runtime/decide

OKX.AI:
POST /api/okxai/agent/register
POST /api/okxai/agent/update
POST /api/okxai/tasks
GET  /api/okxai/tasks/:id
```

Nếu route thực tế khác, kiểm tra trong:

```text
src/server/dashboardRoutes.js
src/server/chatRoutes.js
```

---

## 7. Ví dụ request chuẩn

### 7.1 Chat qua Agent Runtime

```json
{
  "provider": "auto",
  "model": "auto",
  "messages": [
    {
      "role": "user",
      "content": "Tìm giúp tôi ASP phù hợp để phân tích token trên OKX.AI"
    }
  ],
  "autoExecuteTools": true
}
```

### 7.2 Chat với Gemini

```json
{
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "messages": [
    {
      "role": "user",
      "content": "Giải thích OKX.AI Agent Runtime là gì"
    }
  ]
}
```

### 7.3 Chat với OpenRouter hoặc 9Router-compatible

```json
{
  "provider": "openrouter",
  "model": "openai/gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "Tạo kế hoạch triển khai bridge AI cho xBot"
    }
  ]
}
```

### 7.4 Execute tool

```json
{
  "name": "okxai_search_agents",
  "arguments": {
    "query": "token analysis",
    "role": "asp"
  },
  "confirmed": false
}
```

### 7.5 Inbound A2A envelope

Header:

```http
x-agent-runtime-secret: replace_with_strong_random_secret
```

Body:

```json
{
  "jobId": "job_123",
  "event": "task_created",
  "userId": "user_abc",
  "title": "Analyze token",
  "content": "Please analyze this token and return risk report",
  "payload": {
    "description": "Token risk analysis task"
  }
}
```

### 7.6 Approve decision

```json
{
  "inboxId": "inbox_123",
  "decision": "approve"
}
```

### 7.7 Reject decision

```json
{
  "inboxId": "inbox_123",
  "decision": "reject"
}
```

---

## 8. Tích hợp bằng cURL

### 8.1 Chat

```bash
curl -X POST "http://localhost:3000/api/agent-runtime/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "auto",
    "messages": [
      {
        "role": "user",
        "content": "Xin chào, hãy kiểm tra bridge có hoạt động không"
      }
    ]
  }'
```

### 8.2 Inbound envelope

```bash
curl -X POST "http://localhost:3000/api/agent-runtime/inbound" \
  -H "Content-Type: application/json" \
  -H "x-agent-runtime-secret: replace_with_strong_random_secret" \
  -d '{
    "jobId": "job_demo_001",
    "event": "task_created",
    "userId": "demo_user",
    "title": "Demo inbound task",
    "content": "Hãy xử lý task demo này"
  }'
```

### 8.3 Runtime status

```bash
curl "http://localhost:3000/api/agent-runtime/status"
```

---

## 9. Tích hợp bằng JavaScript / Node.js

### 9.1 Dùng `fetch`

```js
async function chatWithXBot() {
  const response = await fetch('http://localhost:3000/api/agent-runtime/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider: 'auto',
      messages: [
        {
          role: 'user',
          content: 'Hãy dùng AI provider tốt nhất để trả lời câu hỏi này'
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`xBot error: ${response.status}`);
  }

  return response.json();
}

chatWithXBot()
  .then(console.log)
  .catch(console.error);
```

### 9.2 Gửi inbound A2A envelope

```js
async function sendEnvelope() {
  const response = await fetch('http://localhost:3000/api/agent-runtime/inbound', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-runtime-secret': process.env.AGENT_RUNTIME_INBOUND_SECRET
    },
    body: JSON.stringify({
      jobId: 'job_node_001',
      event: 'task_created',
      userId: 'node_user',
      title: 'Node.js task',
      content: 'Task được gửi từ Node.js'
    })
  });

  return response.json();
}

sendEnvelope().then(console.log);
```

### 9.3 Express proxy

```js
const express = require('express');

const app = express();
app.use(express.json());

app.post('/my-ai', async (req, res) => {
  const upstream = await fetch('http://localhost:3000/api/agent-runtime/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: req.body.provider || 'auto',
      messages: req.body.messages || [
        { role: 'user', content: req.body.prompt }
      ]
    })
  });

  const data = await upstream.json();
  res.status(upstream.status).json(data);
});

app.listen(8080);
```

---

## 10. Tích hợp bằng Python

### 10.1 Chat bằng `requests`

```python
import requests

url = "http://localhost:3000/api/agent-runtime/chat"

payload = {
    "provider": "auto",
    "messages": [
        {
            "role": "user",
            "content": "Hãy giải thích chức năng xBot OKX.AI Bridge"
        }
    ]
}

response = requests.post(url, json=payload, timeout=60)
response.raise_for_status()

print(response.json())
```

### 10.2 Inbound envelope

```python
import os
import requests

url = "http://localhost:3000/api/agent-runtime/inbound"

headers = {
    "x-agent-runtime-secret": os.environ["AGENT_RUNTIME_INBOUND_SECRET"]
}

payload = {
    "jobId": "job_python_001",
    "event": "task_created",
    "userId": "python_user",
    "title": "Python inbound task",
    "content": "Task gửi từ Python"
}

response = requests.post(url, json=payload, headers=headers, timeout=60)
response.raise_for_status()

print(response.json())
```

### 10.3 FastAPI integration

```python
from fastapi import FastAPI
import requests

app = FastAPI()

@app.post("/bridge-chat")
def bridge_chat(body: dict):
    payload = {
        "provider": body.get("provider", "auto"),
        "messages": body.get("messages") or [
            {"role": "user", "content": body.get("prompt", "")}
        ]
    }

    response = requests.post(
        "http://localhost:3000/api/agent-runtime/chat",
        json=payload,
        timeout=60
    )
    response.raise_for_status()
    return response.json()
```

---

## 11. Tích hợp bằng Go

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"provider": "auto",
		"messages": []map[string]string{
			{
				"role":    "user",
				"content": "Kiểm tra xBot bridge từ Go",
			},
		},
	}

	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(
		"POST",
		"http://localhost:3000/api/agent-runtime/chat",
		bytes.NewBuffer(body),
	)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	data, _ := io.ReadAll(resp.Body)
	fmt.Println(string(data))
}
```

Gửi inbound envelope trong Go:

```go
req.Header.Set("x-agent-runtime-secret", "replace_with_strong_random_secret")
```

---

## 12. Tích hợp bằng PHP

```php
<?php

$url = "http://localhost:3000/api/agent-runtime/chat";

$payload = [
    "provider" => "auto",
    "messages" => [
        [
            "role" => "user",
            "content" => "Kiểm tra xBot bridge từ PHP"
        ]
    ]
];

$ch = curl_init($url);

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);

if ($response === false) {
    throw new Exception(curl_error($ch));
}

curl_close($ch);

echo $response;
```

Inbound envelope:

```php
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "x-agent-runtime-secret: replace_with_strong_random_secret"
]);
```

---

## 13. Tích hợp bằng Java

Ví dụ dùng Java 11+ `HttpClient`.

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class XBotBridgeExample {
    public static void main(String[] args) throws Exception {
        String json = """
        {
          "provider": "auto",
          "messages": [
            {
              "role": "user",
              "content": "Kiểm tra xBot bridge từ Java"
            }
          ]
        }
        """;

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:3000/api/agent-runtime/chat"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

        HttpClient client = HttpClient.newHttpClient();

        HttpResponse<String> response = client.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        System.out.println(response.body());
    }
}
```

---

## 14. Tích hợp bằng C# / .NET

```csharp
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using var client = new HttpClient();

        var json = """
        {
          "provider": "auto",
          "messages": [
            {
              "role": "user",
              "content": "Kiểm tra xBot bridge từ C#"
            }
          ]
        }
        """;

        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync(
            "http://localhost:3000/api/agent-runtime/chat",
            content
        );

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        Console.WriteLine(body);
    }
}
```

Inbound envelope với secret:

```csharp
client.DefaultRequestHeaders.Add(
    "x-agent-runtime-secret",
    "replace_with_strong_random_secret"
);
```

---

## 15. Dùng API key riêng của user

Bridge hỗ trợ ý tưởng:

- Server có key mặc định.
- User có thể nhập key riêng trong dashboard.
- Khi user có key riêng, request của user có thể đi qua key đó thay vì key server.
- Nếu user không có key, fallback sang server key nếu policy cho phép.

Quy trình đề xuất:

1. User vào dashboard OKX.AI Bridge.
2. Chọn provider.
3. Nhập API key.
4. Test provider.
5. Key được lưu theo user.
6. Runtime request sau đó sử dụng key tương ứng.

Không nên:

- Log API key.
- Trả API key về frontend sau khi lưu.
- Lưu plaintext nếu có thể mã hóa.
- Cho phép user khác đọc key.

---

## 16. Đăng ký xBot như OKX.AI Agent/ASP

Thông tin nên dùng khi đăng ký:

```text
Name:
xBot AI Bridge Runtime

Role:
ASP / Provider Agent

Description:
xBot is an OKX.AI bridge runtime that connects users and A2A tasks to external AI providers such as Gemini, OpenRouter/9Router-compatible APIs, OpenAI-compatible endpoints, and user-provided API keys. It supports tool execution, inbox decisions, audit logs, and policy-protected automation.

Endpoint:
https://your-domain.com/api/agent-runtime/inbound

Auth:
x-agent-runtime-secret
```

Khuyến nghị:

- Endpoint phải public HTTPS.
- Secret phải khác nhau giữa staging và production.
- Không dùng localhost khi đăng ký production.
- Test inbound bằng cURL trước khi đăng ký.

---

## 17. Public webhook với ngrok/cloudflared

### 17.1 Dùng ngrok cho local test

```bash
ngrok http 3000
```

Sau đó lấy URL dạng:

```text
https://xxxx.ngrok-free.app
```

Cấu hình:

```env
PUBLIC_BASE_URL=https://xxxx.ngrok-free.app
```

Endpoint inbound:

```text
https://xxxx.ngrok-free.app/api/agent-runtime/inbound
```

### 17.2 Dùng Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:3000
```

Cấu hình tương tự với domain Cloudflare cấp.

---

## 18. Triển khai production bằng PM2

### 18.1 Cài PM2

```bash
npm install -g pm2
```

### 18.2 Chạy server

```bash
pm2 start index.js --name xbot-okxai-bridge
```

### 18.3 Lưu process list

```bash
pm2 save
```

### 18.4 Xem log

```bash
pm2 logs xbot-okxai-bridge
```

---

## 19. Triển khai production bằng Docker Compose

Nếu project đã có `docker-compose.yml`, quy trình cơ bản:

```bash
docker compose build
docker compose up -d
```

Xem log:

```bash
docker compose logs -f
```

Restart:

```bash
docker compose restart
```

Dừng:

```bash
docker compose down
```

---

## 20. Reverse proxy Nginx mẫu

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Sau khi cài SSL bằng Certbot:

```bash
certbot --nginx -d your-domain.com
```

Production nên dùng HTTPS.

---

## 21. Kịch bản demo end-to-end

### Mục tiêu

Kiểm chứng toàn bộ luồng:

```text
OKX.AI/User
  → xBot inbound
  → inbox/task
  → AI provider
  → tool call
  → policy guard
  → decision
  → result/audit
```

### Các bước

1. Chạy backend.
2. Chạy dashboard.
3. Cấu hình provider key.
4. Test chat provider.
5. Gửi inbound envelope demo.
6. Kiểm tra inbox.
7. Execute read-only tool.
8. Execute protected tool không có confirm.
9. Xác nhận hệ thống trả `CONFIRMATION_REQUIRED`.
10. Approve trong dashboard.
11. Chạy lại với `confirmed=true`.
12. Kiểm tra audit log.

---

## 22. Checklist local test

```text
[ ] npm install thành công
[ ] npm --prefix dashboard install thành công
[ ] .env đã có provider key
[ ] npm test -- --runInBand passed
[ ] npm --prefix dashboard run build passed
[ ] npm start chạy backend
[ ] dashboard dev mở được
[ ] AI status thấy provider
[ ] Chat provider auto hoạt động
[ ] Chat Gemini hoạt động
[ ] Chat OpenRouter/9Router hoạt động
[ ] User key override hoạt động
[ ] Inbound secret đúng thì nhận envelope
[ ] Inbound secret sai thì bị chặn
[ ] Inbox hiển thị inbound task
[ ] Decision approve/reject hoạt động
[ ] Audit log có bản ghi
```

---

## 23. Checklist staging/production

```text
[ ] Domain HTTPS đã sẵn sàng
[ ] PUBLIC_BASE_URL đúng
[ ] Endpoint inbound public truy cập được
[ ] AGENT_RUNTIME_INBOUND_SECRET đủ mạnh
[ ] OKXAI_API_KEY thật đã cấu hình
[ ] Server provider keys đã cấu hình
[ ] Bridge mode là semi-auto hoặc manual
[ ] Dashboard admin có auth
[ ] Không expose API key trong response/log
[ ] Quota đã bật
[ ] Audit log hoạt động
[ ] Backup DB đã cấu hình
[ ] PM2/Docker restart policy đã cấu hình
[ ] Healthcheck hoạt động
[ ] Đăng ký OKX.AI Agent/ASP thành công
[ ] Gửi task OKX.AI thật thành công
[ ] Protected tool cần confirm
[ ] Không bật auto cho wallet/trading/payment
```

---

## 24. Bảo mật

### 24.1 Secret inbound

Mọi request inbound từ OKX.AI/A2A nên có secret:

```http
x-agent-runtime-secret: your_secret
```

Server kiểm tra secret trước khi lưu envelope.

### 24.2 API key provider

Không bao giờ:

- Commit key.
- In key trong log.
- Gửi key về frontend sau khi lưu.
- Chia sẻ key giữa user nếu không được phép.

### 24.3 Tool risk

Phân loại tool:

| Risk | Ví dụ | Policy |
|---|---|---|
| low | search, read status | có thể auto |
| medium | create task, update metadata | nên semi-auto |
| high | wallet, payment, trading, dispute | manual/confirm bắt buộc |

### 24.4 Dashboard

Dashboard admin nên có:

- Login.
- Role admin/user.
- HTTPS.
- CSRF/CORS phù hợp.
- Rate limit.
- Không public trang cấu hình key nếu chưa có auth.

---

## 25. Quan sát và debug

### 25.1 Kiểm tra status

```bash
curl "http://localhost:3000/api/agent-runtime/status"
```

### 25.2 Kiểm tra provider

Gửi chat test với provider cụ thể:

```json
{
  "provider": "gemini",
  "messages": [
    {
      "role": "user",
      "content": "ping"
    }
  ]
}
```

### 25.3 Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `UNAUTHORIZED_INBOUND` | Secret sai hoặc thiếu | kiểm tra header và `.env` |
| `CONFIRMATION_REQUIRED` | Tool protected cần confirm | approve decision hoặc gửi `confirmed=true` |
| Provider 401 | API key sai | kiểm tra provider key |
| Provider 404 model | model không tồn tại | đổi model |
| Quota exceeded | vượt quota runtime | tăng limit hoặc reset session |
| Dashboard không gọi được API | base URL/proxy sai | kiểm tra config dashboard/server |
| CORS error | cấu hình CORS thiếu | thêm origin dashboard |

---

## 26. Mapping với OpenClaw/Hermes Agent

xBot bridge có thể thay thế hoặc bổ sung các agent runtime kiểu OpenClaw/Hermes theo mapping sau:

| OpenClaw/Hermes concept | xBot OKX.AI Bridge |
|---|---|
| Agent runtime | `src/services/agentRuntime` |
| LLM provider router | `src/services/aiRouter` |
| Tool execution | `toolRegistry` |
| Human approval | `inbox` + `decide` |
| Audit trail | `audit` |
| External task envelope | `handleEnvelope` |
| Provider key management | `userKeys` |
| Safety mode | `policy` |
| UI console | `OKXAIPage.jsx` |

---

## 27. Luồng đề xuất cho production thực tế

Giai đoạn 1 — Local:

```text
.env local → test provider → test runtime → test dashboard
```

Giai đoạn 2 — Staging:

```text
public URL → inbound webhook → fake task → audit → protected decision
```

Giai đoạn 3 — OKX.AI registration:

```text
register ASP/Agent → endpoint public → test task thật
```

Giai đoạn 4 — Controlled beta:

```text
semi-auto mode → read-only auto → protected manual confirm
```

Giai đoạn 5 — Production:

```text
quota + monitoring + backups + HTTPS + manual high-risk actions
```

---

## 28. Ví dụ prompt hệ thống cho bridge agent

Có thể dùng prompt sau khi cấu hình agent:

```text
You are xBot OKX.AI Bridge Runtime, an agent that connects OKX.AI users and A2A tasks to external AI providers and approved xBot tools.

Rules:
- Use read-only tools automatically when safe.
- For wallet, payment, trading, stake, dispute, or irreversible actions, request explicit user confirmation.
- Never expose API keys or secrets.
- Prefer concise, actionable responses.
- Store inbound tasks and decisions through the runtime.
- Respect user provider preferences and user-owned API keys when available.
```

---

## 29. Tối thiểu cần làm để chạy được

Nếu chỉ muốn chạy nhanh:

```bash
npm install
npm --prefix dashboard install
copy .env.example .env
```

Sau đó sửa `.env`:

```env
AGENT_RUNTIME_INBOUND_SECRET=dev_secret
AGENT_RUNTIME_BRIDGE_MODE=semi-auto
GEMINI_API_KEY=your_key
```

Chạy:

```bash
npm test -- --runInBand
npm start
```

Mở terminal khác:

```bash
npm --prefix dashboard run dev
```

Test:

```bash
curl -X POST "http://localhost:3000/api/agent-runtime/chat" \
  -H "Content-Type: application/json" \
  -d "{\"provider\":\"gemini\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}]}"
```

---

## 30. Kết luận

Sau khi hoàn tất cấu hình, xBot có thể hoạt động như một lớp Agent Runtime/AI Bridge cho OKX.AI:

- Nhận task/envelope từ OKX.AI.
- Gọi AI provider bằng key server hoặc key user.
- Chạy tool OKX.AI/xBot.
- Bảo vệ hành động rủi ro bằng confirmation.
- Ghi audit log.
- Quản trị qua dashboard.

Khuyến nghị production:

- `AGENT_RUNTIME_BRIDGE_MODE=semi-auto`
- HTTPS bắt buộc
- inbound secret mạnh
- dashboard có auth
- không auto-run wallet/trade/payment
- test kỹ inbound A2A trước khi nhận task thật

---

## 31. Tích hợp bằng TypeScript

Nếu dùng TypeScript, nên định nghĩa type cho request/response để tránh sai schema.

```ts
type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

interface XBotMessage {
  role: ChatRole;
  content: string;
}

interface XBotChatRequest {
  provider?: 'auto' | 'gemini' | 'openrouter' | 'openai' | 'groq';
  model?: string;
  messages: XBotMessage[];
  autoExecuteTools?: boolean;
  userId?: string;
}

async function xbotChat(payload: XBotChatRequest) {
  const response = await fetch('http://localhost:3000/api/agent-runtime/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xBot bridge failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function main() {
  const result = await xbotChat({
    provider: 'auto',
    messages: [
      {
        role: 'user',
        content: 'Hãy dùng xBot OKX.AI Bridge để trả lời câu hỏi này.'
      }
    ],
    autoExecuteTools: true
  });

  console.log(result);
}

main().catch(console.error);
```

---

## 32. Tích hợp bằng Rust

Ví dụ dùng `reqwest` và `serde_json`.

`Cargo.toml`:

```toml
[dependencies]
reqwest = { version = "0.12", features = ["json", "blocking"] }
serde_json = "1"
```

Code:

```rust
use reqwest::blocking::Client;
use serde_json::json;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();

    let payload = json!({
        "provider": "auto",
        "messages": [
            {
                "role": "user",
                "content": "Kiểm tra xBot bridge từ Rust"
            }
        ]
    });

    let response = client
        .post("http://localhost:3000/api/agent-runtime/chat")
        .json(&payload)
        .send()?;

    let status = response.status();
    let body = response.text()?;

    println!("Status: {}", status);
    println!("Body: {}", body);

    Ok(())
}
```

Gửi inbound envelope:

```rust
let response = client
    .post("http://localhost:3000/api/agent-runtime/inbound")
    .header("x-agent-runtime-secret", "replace_with_strong_random_secret")
    .json(&json!({
        "jobId": "job_rust_001",
        "event": "task_created",
        "title": "Rust inbound task",
        "content": "Task gửi từ Rust"
    }))
    .send()?;
```

---

## 33. Tích hợp bằng Ruby

```ruby
require 'net/http'
require 'json'
require 'uri'

uri = URI('http://localhost:3000/api/agent-runtime/chat')

payload = {
  provider: 'auto',
  messages: [
    {
      role: 'user',
      content: 'Kiểm tra xBot bridge từ Ruby'
    }
  ]
}

request = Net::HTTP::Post.new(uri)
request['Content-Type'] = 'application/json'
request.body = payload.to_json

response = Net::HTTP.start(uri.hostname, uri.port) do |http|
  http.request(request)
end

puts response.code
puts response.body
```

Inbound envelope:

```ruby
request['x-agent-runtime-secret'] = 'replace_with_strong_random_secret'
```

---

## 34. Tích hợp bằng Dart / Flutter

Có thể dùng package `http`.

`pubspec.yaml`:

```yaml
dependencies:
  http: ^1.2.0
```

Code:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> chatWithXBot() async {
  final uri = Uri.parse('http://localhost:3000/api/agent-runtime/chat');

  final response = await http.post(
    uri,
    headers: {
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'provider': 'auto',
      'messages': [
        {
          'role': 'user',
          'content': 'Kiểm tra xBot bridge từ Flutter',
        }
      ],
    }),
  );

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw Exception('xBot error: ${response.statusCode} ${response.body}');
  }

  print(response.body);
}
```

Lưu ý khi gọi từ mobile:

- Không hardcode provider API key trong app mobile.
- App mobile nên gọi backend xBot, không gọi trực tiếp Gemini/OpenRouter bằng key thật.
- Dùng HTTPS bắt buộc khi production.

---

## 35. Tích hợp bằng React frontend

Ví dụ component test nhanh.

```jsx
import { useState } from 'react';

export default function XBotBridgeTester() {
  const [prompt, setPrompt] = useState('Xin chào xBot');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/agent-runtime/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'auto',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      <button onClick={send} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      <pre>{result}</pre>
    </div>
  );
}
```

---

## 36. Tích hợp với Telegram/Discord bot bất kỳ

Mẫu logic chung:

```text
User message trong Telegram/Discord
    → bot backend nhận message
    → gọi POST /api/agent-runtime/chat
    → nhận kết quả từ xBot bridge
    → gửi lại message cho user
```

Pseudo-code:

```js
async function handleBotMessage(userId, text) {
  const response = await fetch('http://localhost:3000/api/agent-runtime/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider: 'auto',
      userId,
      messages: [
        {
          role: 'user',
          content: text
        }
      ],
      autoExecuteTools: true
    })
  });

  const data = await response.json();

  return data.text || data.content || JSON.stringify(data);
}
```

Khuyến nghị:

- Map `telegramUserId` hoặc `discordUserId` vào `userId`.
- Nếu user có API key riêng, lưu key theo `userId`.
- Với lệnh có rủi ro, trả link/dashboard decision để user xác nhận.

---

## 37. Tích hợp với hệ thống queue / worker

Với task dài, không nên giữ HTTP request quá lâu. Nên dùng queue:

```text
Client
  → POST /your-api/task
  → lưu job vào queue
  → worker gọi xBot Agent Runtime
  → lưu kết quả
  → client poll hoặc nhận webhook
```

Ví dụ worker Node.js:

```js
async function processJob(job) {
  const response = await fetch('http://localhost:3000/api/agent-runtime/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider: job.provider || 'auto',
      userId: job.userId,
      messages: [
        {
          role: 'user',
          content: job.prompt
        }
      ],
      autoExecuteTools: job.autoExecuteTools ?? false
    })
  });

  const result = await response.json();

  await saveJobResult(job.id, result);
}
```

Queue phù hợp:

- BullMQ / Redis
- RabbitMQ
- Kafka
- SQS
- Celery
- Sidekiq
- Hangfire

---

## 38. Chuẩn response đề xuất cho các app bên ngoài

Để các app viết bằng mọi ngôn ngữ dễ dùng, nên chuẩn hóa response nội bộ theo dạng:

```json
{
  "ok": true,
  "requestId": "req_123",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "text": "Nội dung trả lời cho user",
  "toolCalls": [],
  "decisions": [],
  "usage": {
    "inputTokens": 100,
    "outputTokens": 50,
    "totalTokens": 150
  },
  "auditId": "audit_123"
}
```

Khi lỗi:

```json
{
  "ok": false,
  "code": "PROVIDER_UNAUTHORIZED",
  "message": "Provider API key is invalid or missing",
  "requestId": "req_123",
  "details": {
    "provider": "gemini"
  }
}
```

Mã lỗi nên dùng ổn định:

| Code | Ý nghĩa |
|---|---|
| `BAD_REQUEST` | Request sai schema |
| `UNAUTHORIZED_INBOUND` | Secret inbound sai |
| `PROVIDER_UNAVAILABLE` | Provider chưa cấu hình |
| `PROVIDER_UNAUTHORIZED` | Provider key sai |
| `MODEL_NOT_FOUND` | Model không hợp lệ |
| `CONFIRMATION_REQUIRED` | Tool cần xác nhận |
| `TOOL_NOT_FOUND` | Tool không tồn tại |
| `TOOL_FORBIDDEN` | Policy chặn tool |
| `QUOTA_EXCEEDED` | Vượt quota |
| `INTERNAL_ERROR` | Lỗi server |

---

## 39. Contract OpenAPI tối giản

Có thể dùng contract này để sinh SDK cho nhiều ngôn ngữ.

```yaml
openapi: 3.0.3
info:
  title: xBot OKX.AI Bridge API
  version: 1.0.0
servers:
  - url: http://localhost:3000
paths:
  /api/agent-runtime/status:
    get:
      summary: Get runtime status
      responses:
        '200':
          description: Runtime status
  /api/agent-runtime/chat:
    post:
      summary: Chat with xBot Agent Runtime
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - messages
              properties:
                provider:
                  type: string
                  example: auto
                model:
                  type: string
                  example: auto
                userId:
                  type: string
                autoExecuteTools:
                  type: boolean
                messages:
                  type: array
                  items:
                    type: object
                    required:
                      - role
                      - content
                    properties:
                      role:
                        type: string
                        enum:
                          - system
                          - user
                          - assistant
                          - tool
                      content:
                        type: string
      responses:
        '200':
          description: Chat response
  /api/agent-runtime/tool:
    post:
      summary: Execute a registered tool
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
                - arguments
              properties:
                name:
                  type: string
                arguments:
                  type: object
                confirmed:
                  type: boolean
      responses:
        '200':
          description: Tool response
  /api/agent-runtime/inbound:
    post:
      summary: Receive OKX.AI/A2A inbound envelope
      parameters:
        - in: header
          name: x-agent-runtime-secret
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                jobId:
                  type: string
                event:
                  type: string
                userId:
                  type: string
                title:
                  type: string
                content:
                  type: string
                payload:
                  type: object
      responses:
        '200':
          description: Inbound accepted
```

Có thể lưu phần này ra file riêng nếu muốn:

```text
docs/openapi/xbot-okxai-bridge.openapi.yaml
```

---

## 40. Sinh SDK cho nhiều ngôn ngữ từ OpenAPI

Nếu đã có OpenAPI spec, có thể dùng `openapi-generator`.

Ví dụ:

```bash
npm install -g @openapitools/openapi-generator-cli
```

Sinh SDK TypeScript:

```bash
openapi-generator-cli generate ^
  -i docs/openapi/xbot-okxai-bridge.openapi.yaml ^
  -g typescript-fetch ^
  -o sdk/typescript
```

Sinh SDK Python:

```bash
openapi-generator-cli generate ^
  -i docs/openapi/xbot-okxai-bridge.openapi.yaml ^
  -g python ^
  -o sdk/python
```

Sinh SDK Java:

```bash
openapi-generator-cli generate ^
  -i docs/openapi/xbot-okxai-bridge.openapi.yaml ^
  -g java ^
  -o sdk/java
```

Sinh SDK C#:

```bash
openapi-generator-cli generate ^
  -i docs/openapi/xbot-okxai-bridge.openapi.yaml ^
  -g csharp ^
  -o sdk/csharp
```

Danh sách generator:

```bash
openapi-generator-cli list
```

---

## 41. Mẫu file `.env.production`

```env
NODE_ENV=production
PORT=3000

PUBLIC_BASE_URL=https://your-domain.com

OKXAI_API_BASE_URL=https://your-okxai-api
OKXAI_API_KEY=replace_with_real_key
OKXAI_AGENT_ID=replace_with_agent_id

AGENT_RUNTIME_INBOUND_SECRET=replace_with_very_strong_secret
AGENT_RUNTIME_BRIDGE_MODE=semi-auto

OPENROUTER_API_KEY=replace_with_openrouter_or_9router_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini

GEMINI_API_KEY=replace_with_gemini_key
GEMINI_DEFAULT_MODEL=gemini-1.5-flash

OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_DEFAULT_MODEL=gpt-4o-mini

GROQ_API_KEY=
GROQ_DEFAULT_MODEL=llama-3.1-8b-instant
```

Quy tắc:

- File `.env.production` không commit lên Git.
- Mỗi môi trường dùng secret khác nhau.
- Rotate key định kỳ.
- Tắt key ngay nếu nghi ngờ bị lộ.

---

## 42. Mẫu systemd service cho Linux server

Nếu không dùng Docker/PM2, có thể dùng systemd.

```ini
[Unit]
Description=xBot OKX.AI Bridge
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/xbot
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5
EnvironmentFile=/opt/xbot/.env.production
User=xbot
Group=xbot

[Install]
WantedBy=multi-user.target
```

Lưu tại:

```text
/etc/systemd/system/xbot-okxai-bridge.service
```

Commands:

```bash
sudo systemctl daemon-reload
sudo systemctl enable xbot-okxai-bridge
sudo systemctl start xbot-okxai-bridge
sudo systemctl status xbot-okxai-bridge
sudo journalctl -u xbot-okxai-bridge -f
```

---

## 43. Healthcheck và monitoring

Nên có healthcheck public hoặc internal:

```bash
curl http://localhost:3000/api/agent-runtime/status
```

Các chỉ số nên theo dõi:

- Server uptime.
- Request per minute.
- Provider latency.
- Provider error rate.
- Tool execution count.
- Confirmation required count.
- Quota exceeded count.
- Inbound accepted/rejected count.
- Audit log write failure.
- Memory/CPU.
- Disk usage nếu audit/inbox lưu local.

Cảnh báo nên bật:

```text
[ ] provider error rate > 10%
[ ] inbound unauthorized tăng bất thường
[ ] quota exceeded tăng bất thường
[ ] disk usage > 80%
[ ] response latency > 30s
[ ] process restart nhiều lần
```

---

## 44. Backup và restore

Nếu dùng SQLite/file DB/local storage:

Backup tối thiểu:

```bash
mkdir -p backups
copy data\xbot.db backups\xbot-%DATE%.db
```

Trên Linux:

```bash
mkdir -p backups
cp data/xbot.db "backups/xbot-$(date +%F-%H%M%S).db"
```

Nếu dùng Postgres/MySQL, dùng công cụ tương ứng:

```bash
pg_dump your_db > backup.sql
mysqldump your_db > backup.sql
```

Restore phải test trước trên staging.

Checklist backup:

```text
[ ] Backup DB
[ ] Backup .env.production ở nơi an toàn
[ ] Backup uploaded assets nếu có
[ ] Test restore staging
[ ] Đặt lịch backup tự động
[ ] Mã hóa backup chứa secret/user data
```

---

## 45. Quy trình release an toàn

1. Pull code mới.
2. Cài dependency nếu thay đổi.
3. Chạy test.
4. Build dashboard.
5. Backup DB.
6. Deploy staging.
7. Test inbound.
8. Test chat provider.
9. Test protected decision.
10. Deploy production.
11. Theo dõi log 30-60 phút.

Commands mẫu:

```bash
git pull
npm install
npm --prefix dashboard install
npm test -- --runInBand
npm --prefix dashboard run build
```

Nếu dùng PM2:

```bash
pm2 restart xbot-okxai-bridge
pm2 logs xbot-okxai-bridge
```

Nếu rollback:

```bash
git checkout <previous_commit>
npm install
npm --prefix dashboard run build
pm2 restart xbot-okxai-bridge
```

---

## 46. Chính sách xác nhận tool khuyến nghị

Bảng policy production:

| Nhóm tool | Ví dụ | Auto? | Confirm? |
|---|---|---:|---:|
| Read-only search | search agent, get task | Có | Không |
| Read-only wallet status | status, balance | Có thể | Không hoặc optional |
| Create/update task | create task, update task | Không nên | Có |
| Payment/x402 | pay, settle, permit | Không | Bắt buộc |
| Wallet transfer | send token, approve | Không | Bắt buộc |
| Trading | swap, limit order | Không | Bắt buộc |
| Dispute/stake | stake, dispute, accept settlement | Không | Bắt buộc |
| Admin config | update provider key, mode | Không | Bắt buộc |

Nguyên tắc:

```text
Nếu hành động có thể làm mất tiền, khóa tiền, gửi tiền, giao dịch, ký message, ký transaction, hoặc thay đổi trạng thái task có ràng buộc tài chính → bắt buộc confirm.
```

---

## 47. Prompt mẫu cho từng vai trò

### 47.1 User Agent

```text
You are xBot User Agent. Help the user interact with OKX.AI tasks and providers safely.
Always explain risks before actions involving payments, wallet, trading, staking, or disputes.
Use external AI providers only through the configured xBot AI Router.
Never reveal secrets or API keys.
```

### 47.2 ASP / Provider Agent

```text
You are xBot ASP Bridge Agent. You receive A2A tasks from OKX.AI and process them using approved AI providers and xBot tools.
For read-only analysis, proceed when policy allows.
For irreversible or financial operations, create a decision request and wait for confirmation.
Return structured results with summary, evidence, and next steps.
```

### 47.3 Evaluator Agent

```text
You are xBot Evaluator Agent. Review task evidence, delivery quality, and dispute context.
Stay neutral.
Do not execute financial tools.
When information is insufficient, request clarification.
Keep audit-friendly reasoning.
```

---

## 48. Hướng dẫn test với key user riêng

Luồng kiểm thử:

1. Xóa server key tạm thời hoặc chọn provider chưa có server key.
2. Vào dashboard OKX.AI Bridge.
3. Nhập user API key cho provider.
4. Gửi chat với `userId` đó.
5. Xác nhận request thành công.
6. Gửi chat với `userId` khác chưa có key.
7. Xác nhận bị lỗi provider unavailable hoặc fallback theo policy.

Request test:

```json
{
  "userId": "user_with_own_key",
  "provider": "gemini",
  "messages": [
    {
      "role": "user",
      "content": "Test user-owned Gemini key"
    }
  ]
}
```

Điểm cần kiểm tra:

```text
[ ] User A dùng được key của User A
[ ] User B không đọc được key của User A
[ ] API response không chứa plaintext key
[ ] Audit không ghi plaintext key
[ ] Xóa key thì request fallback/failed đúng policy
```

---

## 49. Mẫu tài liệu bàn giao cho người vận hành

```text
Tên hệ thống:
xBot OKX.AI Bridge

Mục đích:
Kết nối OKX.AI/A2A tasks với AI providers và xBot tools.

URL production:
https://your-domain.com

Inbound endpoint:
https://your-domain.com/api/agent-runtime/inbound

Dashboard:
https://your-domain.com/xBot

Runtime mode:
semi-auto

Provider đang bật:
- Gemini
- OpenRouter/9Router

Secret location:
.env.production trên server

Log:
pm2 logs xbot-okxai-bridge

Backup:
backups/ hoặc managed database backup

Người chịu trách nhiệm:
Tên / Telegram / Email

Quy tắc an toàn:
Không bật auto cho payment, wallet, trading, dispute.
```

---

## 50. Roadmap nên làm tiếp

Sau tài liệu và bridge cơ bản, các bước phát triển tiếp theo nên là:

```text
[ ] Tạo OpenAPI spec file riêng trong docs/openapi/
[ ] Sinh SDK TypeScript/Python từ OpenAPI
[ ] Thêm integration test cho HTTP routes
[ ] Thêm E2E test inbound → inbox → decision
[ ] Mã hóa user provider keys ở DB
[ ] Thêm dashboard auth/role nếu chưa đủ mạnh
[ ] Thêm rate limit theo user/provider
[ ] Thêm healthcheck route rõ ràng
[ ] Thêm metrics Prometheus hoặc log structured JSON
[ ] Thêm Docker production example
[ ] Thêm sample ngrok/cloudflared demo script
[ ] Thêm staging deployment checklist riêng
[ ] Thêm policy config dạng JSON để chỉnh không cần sửa code
[ ] Thêm retry/backoff cho provider API
[ ] Thêm circuit breaker khi provider lỗi nhiều
[ ] Thêm streaming response nếu provider hỗ trợ
[ ] Thêm webhook callback trả kết quả về OKX.AI nếu protocol yêu cầu
```
