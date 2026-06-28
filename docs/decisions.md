# Decision Log

Locked decisions for GuessEat. Update this file as new choices are made.

## D1 — Product name: GuessEat.my

- **Date:** 2026-06-18
- **Decision:** Use **GuessEat.my** (not "Makan Guesser" from the biz plan).
- **Rationale:** Owner preference; `.my` ccTLD reinforces the Malaysian focus.

## D2 — Architecture: separate React SPA from Laravel (not Inertia starter kit)

- **Date:** 2026-06-18
- **Decision:** Turborepo monorepo with a separate React + TanStack Router SPA in `packages/web`, not the Laravel + React (Inertia) starter kit.
- **Rationale:** Biz plan mandates TanStack Router + TanStack Query (SPA), mobile-first with React Native sharing TypeScript via `packages/shared`, Laravel is API-only (no Blade), and independent deployment (web → Cloudflare Pages, API → Hetzner, mobile → Expo EAS). Inertia would couple the frontend to Laravel routing.

## D3 — Backend: Laravel 13.x on PHP 8.3+

- **Date:** 2026-06-18 (updated 2026-06-18 to PHP 8.5.7)
- **Decision:** Laravel 13.16.1 (latest stable) on PHP 8.5.7. Verified `composer show -a laravel/framework` and the official docs.
- **Rationale:** Biz plan requires latest stable. Laravel 13 requires `^8.3`. Originally scaffolded on PHP 8.3.30 (the machine had PHP 8.2 which pulled Laravel 12); the machine has since been upgraded to PHP 8.5.7, which satisfies `^8.3`. Required extensions (`fileinfo`, `zip`, `gd`, `exif`, `pdo_sqlite`, `pdo_pgsql`, `pgsql`) are enabled in `C:\php\php.ini`.

## D4 — Laravel guidance: official laravel/boost MCP

- **Date:** 2026-06-18
- **Decision:** Install `laravel/boost` (official Laravel Boost MCP server, v2.4.10) in `packages/api` and register `php artisan boost:mcp` in `opencode.json` with `cwd: packages/api`.
- **Rationale:** The AGENTS.md references a "Laravel Boost MCP"; the official package is `laravel/boost` (3.5k stars, laravel/boost on GitHub). It exposes `search-docs` (semantic search over 17k+ Laravel 13.x doc entries), `application-info`, `database-schema`, `database-query`, and log tools. The MCP command uses the `php` from PATH (now PHP 8.5.7) with `cwd: packages/api`. `opencode.json` is gitignored (machine-local).

## D5 — Geography: Klang Valley for MVP (deferrable)

- **Date:** 2026-06-18
- **Decision:** MVP scoped to Klang Valley, but exact boundaries deferred until data seeding.
- **Rationale:** Owner: "this can be decided later, let's build the scaffold first."

## D6 — Documentation: dedicated docs/ folder

- **Date:** 2026-06-18
- **Decision:** All project docs live in `docs/` (architecture, setup, decisions, roadmap, php-setup). Grant applications deferred until initial users exist.
- **Rationale:** Owner: "We'll get some initial users first before prepping for grant application. Make sure we have good documentation along the way."

## D7 — Team: solo + AI

- **Date:** 2026-06-18
- **Decision:** Solo founder building with AI assistance (opencode).
- **Rationale:** Owner stated. Affects how aggressively we parallelize — Phase 0 is sequential, not multi-developer.

## D8 — Timeline: 8-week MVP acceptable

- **Date:** 2026-06-18
- **Decision:** 8-week MVP timeline (Phase 0 + Phase 1) is acceptable.
- **Rationale:** Owner confirmed.

## D9 — PostgreSQL 16 + PostGIS 3.5 via Docker

- **Date:** 2026-06-19
- **Decision:** Run PostgreSQL 16 + PostGIS 3.5 in a Docker container (`postgis/postgis:16-3.5`) rather than installing natively. Container name `gueseat-postgres`, port 5432, databases `guesseat` (dev) and `guesseat_testing` (tests).
- **Rationale:** Laragon only bundles MySQL, not PostgreSQL. Docker is already installed. The `postgis/postgis` image bundles both PostgreSQL and PostGIS with zero config. Cleaner than a native install — no system pollution, easy to start/stop/recreate. PHP extensions (`pdo_pgsql`, `pgsql`) were already enabled in `C:\php\php.ini`.

## D10 — Laravel Sanctum instead of Fortify for auth

- **Date:** 2026-06-19
- **Decision:** Use Laravel Sanctum (API token auth) + custom phone OTP flow instead of Laravel Fortify. The biz plan says "Fortify + Twilio" but Fortify is designed for web-based session auth (Blade/Inertia), not API-only backends.
- **Rationale:** Backend is API-only (no Blade views). Mobile (React Native) and web (React SPA) are separate clients that need Bearer token auth, not session cookies. Sanctum's "Mobile Application Authentication" pattern is the right fit. OTP flow: `POST /api/auth/otp/send` → `POST /api/auth/otp/verify` → issues Sanctum token. `OtpService` interface with `DevOtpService` (code "123456") and `TwilioOtpService` (Twilio Verify API) implementations, switched via `OTP_DRIVER` env var.

## D11 — Cloudflare R2 via S3-compatible adapter

- **Date:** 2026-06-19
- **Decision:** Configure R2 as a custom `r2` disk in `config/filesystems.php` using `league/flysystem-aws-s3-v3` with `use_path_style_endpoint => true`. Env vars `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` in `.env`.
- **Rationale:** R2 is S3-compatible — the AWS S3 flysystem adapter works directly. Path-style endpoints are required by R2. Credentials not yet set (pending R2 bucket creation on Cloudflare dashboard).

## D12 — Admin backoffice: Filament v5

- **Date:** 2026-06-21
- **Decision:** Install Filament v5.6.7 as the admin backoffice (free, open source). Runs at `/admin` via session-based auth. Only users with `is_admin = true` can access (via `FilamentUser::canAccessPanel()`).
- **Rationale:** The biz plan requires a moderation queue and admin panel. Filament provides a full CRUD backoffice (User, Venue, Photo, Guess resources) with approve/reject moderation actions, filters, and badges — all without writing Blade views. Admin users log in with email + password at `/admin/login` (separate from the consumer OTP auth flow). The admin lives alongside the API — Filament serves its own routes under `/admin` without affecting the `/api` consumer endpoints.

## D13 — Base game architecture: settings, game modes, DB-backed daily challenges

- **Date:** 2026-06-22
- **Decision:** Add a settings foundation, integration settings, game modes table, and DB-backed daily challenges to make the base game structurally complete before ML Kit, Google Vision, or advanced game modes.
- **Rationale:** The original implementation hardcoded game behavior in API controllers with no admin control. This made it impossible to toggle features, configure game parameters, or manage daily challenges without code changes. The new architecture adds:
  - `settings` table + `SettingsService` for 15 cached, typed game/content/security/display settings (admin Filament Settings page).
  - `integration_settings` table + `IntegrationService` for 6 external integrations with admin toggles and status display (secrets stay in `.env`).
  - `game_modes` table with built-in Classic + Daily modes (admin Filament GameModeResource; built-in modes protected from deletion).
  - `daily_challenges` + `daily_challenge_photos` tables replacing cache-only daily challenges (admin Filament DailyChallengeResource with generate/regenerate/publish actions; `DailyChallengeGenerator` service; `guesseat:daily-challenge --publish` command).
  - Anti-cheat: `correct_venue_id` no longer returned in play response by default (controlled by `return_correct_answer_before_guess` setting, default OFF).
  - Guess tracking: `game_mode_slug` and `daily_challenge_id` columns on `guesses` table for per-mode analytics.
  - `PhotoSelectionService` now reads all selection rules from settings (exclude own, exclude seen, require approved, require censored URL, underplayed threshold, freshness days) and supports category/district filters.
  - Playability Dashboard widget on the admin homepage showing launch-readiness metrics (playable photos, venues, moderation queue, category coverage, daily challenge status, game mode toggles).
  - All gameplay API endpoints respect admin settings (return 403 when disabled).

## D14 — User model: HasName contract for Filament

- **Date:** 2026-06-22
- **Decision:** Implement `Filament\Models\Contracts\HasName` on the User model with `getFilamentName(): string` returning `$this->username`.
- **Rationale:** The `users` table uses `username` (not `name`), which caused a `TypeError` in Filament's `getUserName()` when rendering the avatar component. Filament 5's documented approach is to implement `HasName` and define `getFilamentName()`.
