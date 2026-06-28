# GuessEat.my

A geo-guessing game for Malaysian restaurants. Players identify restaurants from user-submitted photos. Mobile-first.

## Status

Pre-MVP / scaffolding complete. See `docs/roadmap.md`.

## Tech stack

- **Backend:** Laravel 13 (API-only) + PostgreSQL/PostGIS + Redis + Reverb
- **Web:** React 19 + Vite 8 + TanStack Router + TanStack Query
- **Mobile:** React Native 0.86 + Expo SDK 56 (expo-router)
- **Shared:** `@guesseat/shared` (TypeScript types, scoring, categories, badges)
- **Monorepo:** pnpm workspaces + Turborepo
- **Storage:** Cloudflare R2 (planned)
- **Auth:** Laravel Fortify + Twilio phone OTP (planned)

## Quickstart

1. **PHP 8.3+** must be your default `php` (Laravel 13 requires `^8.3`; PHP 8.5.7 recommended). See `docs/php-setup.md`.
2. Install deps:
   ```bash
   pnpm install
   ```
3. Start everything:
   ```bash
   pnpm dev          # api (8000) + web (5173) + mobile (expo)
   ```
   Or individually:
   ```bash
   pnpm dev:api      # php artisan serve -> http://127.0.0.1:8000
   pnpm dev:web      # vite -> http://127.0.0.1:5173 (proxies /api)
   pnpm dev:mobile   # expo start
   ```

## Layout

```
packages/
  api/      Laravel 13 backend
  shared/   @guesseat/shared — types, scoring, categories, badges
  web/      React + Vite SPA
  mobile/   React Native + Expo
docs/       architecture, setup, decisions, roadmap, php-setup
```

## Documentation

- `guesseat-biz-plan.md` — product bible (data models, scoring, game modes, monetization)
- `docs/architecture.md` — system architecture and data models
- `docs/setup.md` — local dev setup
- `docs/decisions.md` — decision log
- `docs/roadmap.md` — implementation roadmap
- `docs/php-setup.md` — making PHP 8.3+ the default on Windows
- `AGENTS.md` — instructions for AI coding agents (opencode)
