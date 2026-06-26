# XBot

XBot is an AI-powered Web3 Telegram bot and dashboard for the OKX X Layer ecosystem.

## Current Version

- **Version:** `1.3.10`
- **Focus:** copy-trade credential enforcement, price alert cost optimization, docs/dashboard UX refresh

## What’s New

### v1.3.10
- Refined the dashboard docs experience with a smaller, cleaner layout.
- Replaced the language selector with a custom dropdown that matches the landing page style.
- Updated docs visual hierarchy for better readability on compact screens.
- Improved spacing, cards, headings, lists, code blocks, and table of contents density.
- Kept the landing page style aligned with the dashboard/docs design direction.

### v1.3.9
- Enforced personal OKX API credentials for copy trading workflows.
- Removed legacy auto trading backend modules and related routes/schemas.
- Optimized group price alerts by switching to the lower-cost Basic Market API.
- Restored missing market data metrics and localization support.

## Key Features

- AI-powered Telegram bot for Web3 workflows
- Multi-language support
- OKX X Layer focused trading utilities
- Copy trading and portfolio workflows
- Web dashboard for users and admins
- Security-focused wallet and vault features
- On-chain analytics and automated alerts

## Dashboard Docs

The dashboard documentation has been refreshed to:

- feel more compact and modern
- match the xLayer visual language
- use a better language switcher
- reduce unnecessary visual weight
- improve scanning and navigation for long content

## Project Layout

- `src/` - backend bot and server logic
- `dashboard/` - web dashboard and docs
- `docs/` - media assets and supporting files

## Build

```bash
npm install
npm run build
```

For the dashboard only:

```bash
npm --prefix dashboard install
npm --prefix dashboard run build
```

## Changelog Policy

This README now keeps only the current, relevant updates. Older release history should be treated as archival and moved to release notes or GitHub tags when needed.

## License

MIT