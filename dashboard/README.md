# 🌐 xlayer.my — Web3 Ecosystem Portal

**xlayer.my** is the unified web portal for the xBot ecosystem, serving 3 independent React applications from a single Vite Multi-Page App (MPA):

| Route | App | Description |
|---|---|---|
| `/` | Landing Page | Ecosystem introduction with i18n (15 languages) |
| `/xBot/` | xBot Dashboard | Telegram bot management (admin & user views) |
| `/xKey/` | xKey Web Demo | Offline wallet vault preview ([latest on GitHub](https://github.com/haivcon/xKey)) |

> **⚡ Tech Stack**: React 19, Vite 8, Tailwind CSS v4, Zustand, react-i18next

---

## 🚀 What's New in v2.0.0

### 🏗️ Ecosystem Architecture (MPA)
- **Vite Multi-Page App**: 3 independent React apps sharing one `node_modules` and build pipeline
- **Separate entry points**: Each app has its own `index.html`, `main.jsx`, and CSS
- **Shared vendor chunks**: React, react-router-dom, lucide-react bundled once

### 🎨 Tailwind CSS v4 Migration
- **Removed**: `tailwind.config.js`, `postcss.config.js`
- **Added**: `@import "tailwindcss"` + `@theme` blocks in each app's CSS
- **Custom dark mode**: `@custom-variant dark` for class-based toggling
- **Refactored**: All `@apply` cross-references inlined for strict v4 compatibility

### 🌍 Landing Page (15 Languages)
- **Glassmorphism UI**: Animated gradient background with glow orbs
- **Full i18n**: All text translated (vi, en, zh, ko, ja, ru, id, th, es, fr, de, pt, ar, hi, tr)
- **Language selector**: Dropdown with flag emojis, persisted selection
- **Product cards**: xBot and xKey with feature pills and action buttons

### 🔗 xKey Web Demo Integration
- **Embedded preview**: xKey source code served as a demo at `/xKey/`
- **"WEB DEMO" banner**: Bottom bar with dismissible notice and GitHub release link
- **Not a production build**: Users are directed to GitHub for the latest APK/source

### 🧭 Navigation
- **"← xlayer.my" button**: Fixed back-to-home button on both xBot and xKey pages
- **Telegram-aware**: Back button hidden when running inside Telegram Mini App
- **Trailing-slash routing**: Proper MPA routing with `/xBot/` and `/xKey/`

---

<details>
<summary><b>📦 Previous Dashboard Features (v1.x)</b></summary>
<br>

### Dashboard v1.3.7
- Security & Analytics upgrade
- JWT authentication with Telegram
- Owner/User role-based access

### Dashboard Core
- **Auth**: Telegram Login Widget + bot deep link one-time token
- **Owner Pages**: Dashboard, Users, Groups, Analytics, Alerts, Posts, Config
- **User Pages**: Profile, Wallets, Trading, Leaderboard, Settings, Chat AI
- **Real-time**: WebSocket auto-reconnect for live updates
- **i18n**: 6 languages via react-i18next
- **PWA**: Service worker, manifest.json, offline-capable

</details>

---

## 📁 Directory Structure

```
dashboard/
├── index.html                # Landing page entry
├── vite.config.js            # MPA config (3 entry points)
├── package.json              # Shared dependencies
│
├── src-landing/              # Landing page source
│   ├── main.jsx
│   ├── App.jsx               # 15-language ecosystem intro
│   └── index.css
│
├── xBot/                     # xBot Dashboard
│   ├── index.html            # Entry (Telegram SDK lazy-load)
│   └── src/                  # Full dashboard source
│       ├── App.jsx, main.jsx, index.css
│       ├── components/, pages/, stores/
│       ├── hooks/, api/, i18n/, utils/
│       └── config.js
│
├── xKey/                     # xKey Web Demo (read-only copy)
│   ├── index.html            # Entry (WEB DEMO banner)
│   └── src/                  # Mirrored from github.com/haivcon/xKey
│
└── public/
    ├── xbot-logo.png, xkey-logo.png
    ├── manifest.json, sw.js
    └── icons/
```

---

## 🚀 Quick Start

```bash
cd dashboard
npm install
npm run dev          # http://localhost:5173
```

### Build for Production
```bash
npm run build        # Outputs to dist/
npm run preview      # Preview production build
```

---

## ⚠️ Notes

- **xKey at `/xKey/` is a web demo only.** The production xKey app is a standalone Capacitor Android project at [github.com/haivcon/xKey](https://github.com/haivcon/xKey).
- **xBot dashboard requires the bot backend** running at `localhost:3000` for API proxy to work.
- **Tailwind v4** requires `@tailwindcss/vite` plugin — no PostCSS needed.
