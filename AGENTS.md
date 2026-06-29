# GuessEat — Agent Instructions

> GuessEat.my — a geo-guessing game for Malaysian restaurants. Mobile-first.

## Tech stack (use the LATEST stable versions; verify before writing code)

- **Backend:** Laravel 13.x (API-only) + PostgreSQL 16 + PostGIS + Redis + Laravel Reverb
- **Mobile:** React Native + Expo (SDK latest) + React Navigation + TanStack Query
- **Web:** React + Vite + TanStack Router + TanStack Query
- **Shared:** TypeScript package `@guesseat/shared` (types, scoring, categories, API client)
- **Monorepo:** pnpm workspaces + Turborepo
- **Storage:** Cloudflare R2
- **Auth:** Laravel Fortify + Twilio phone OTP
- **PHP:** 8.3+ (Laravel 13 requires `^8.3`; PHP 8.5.7 in use). The backend lives in `packages/api`.

## Laravel guidance — ALWAYS use the Laravel Boost MCP

A `laravel-boost` MCP server is configured for this project. **Before writing any Laravel code or answering Laravel questions, call the `search-docs` MCP tool** to fetch version-specific Laravel 13.x documentation. Do not rely on memory for Laravel APIs — the framework evolves and the biz plan mandates latest versions.

Key MCP tools available:
- `search-docs` — semantic search over Laravel 13.x docs (Laravel, Inertia, Pest, Livewire, Filament, Tailwind, etc.). **Use this first.**
- `application-info` — call on each new chat to get installed package versions; write version-specific code.
- `database-schema` / `database-query` / `database-connections` — inspect the DB.
- `last-error` / `read-log-entries` / `browser-logs` — debug errors.

## Monorepo layout

```
packages/
  api/        Laravel 13 backend (composer-managed; served by Laragon)
  shared/     @guesseat/shared — TypeScript types, scoring, categories
  web/        React + Vite SPA
  mobile/     React Native + Expo
docs/         Project documentation (setup, architecture, decisions, roadmap)
```

## Conventions

- **No comments in code** unless explicitly requested.
- Follow existing patterns in each package. Check neighboring files before adding libraries.
- Shared logic (scoring, categories, types, badge definitions) belongs in `packages/shared` — never duplicated across web/mobile.
- Backend is **API-only**: return JSON, no Blade views. Web/mobile are separate SPAs.
- UUIDs for primary keys on `venues`, `photos`, `guesses` (see biz plan data models).
- Photo categories are a closed set of 7 — use `PHOTO_CATEGORIES` from `@guesseat/shared`.

## Reference

- `guesseat-biz-plan.md` — the product bible (data models, scoring, game modes, roadmap). Read it before feature work.
- `docs/` — architecture, setup, decisions log, roadmap.

## Running things

- Backend dev: `php artisan serve` (from `packages/api`) — requires PHP 8.3+ in PATH.
- Web dev: `pnpm dev:web`
- Mobile dev: `pnpm dev:mobile`
- All: `pnpm dev`
- Docker (local full stack): `docker compose up --build`
- Docker (stop): `docker compose down` (add `-v` to wipe volumes)

## Deployment

- **Host:** Contabo VPS (109.123.239.88)
- **Platform:** Coolify 4.1.2
- **Stack:** Docker Compose (api, web, queue, scheduler, postgres/PostGIS, redis)
- **CI:** GitHub Actions (ci.yml — shared lint, web build+lint, mobile TS, Laravel tests+Pint)
- **Domains:** guesseat.my (web), api.guesseat.my (API)
- **Env vars:** Managed in Coolify UI, injected via `env_file: .env` in docker-compose.yml
- **Deploy:** Push to GitHub `main` branch → Click Redeploy in Coolify (or enable auto-deploy)
