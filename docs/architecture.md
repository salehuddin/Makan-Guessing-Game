# Architecture

## Monorepo layout

```
guesseat/
├── packages/
│   ├── api/        Laravel 13 backend (API-only; served by Laragon)
│   ├── shared/     @guesseat/shared — TypeScript types, scoring, categories, badges
│   ├── web/        React 19 + Vite 8 + TanStack Router + TanStack Query SPA (includes /admin panel)
│   └── mobile/     React Native 0.86 + Expo SDK 56 (expo-router)
├── docs/           Project documentation
├── guesseat-biz-plan.md   Product bible (data models, scoring, game modes, roadmap)
├── AGENTS.md       Agent instructions (read by opencode)
└── opencode.json   Machine-local opencode config (gitignored; MCP wiring)
```

## Tech stack (versions verified at scaffold time)

| Layer | Tech | Version |
|---|---|---|
| Backend | Laravel | 13.16.1 |
| Backend | PHP | 8.5.7 (Laravel 13 requires `^8.3`) |
| Backend | PostgreSQL + PostGIS | 16 (dev & testing) |
| Backend | Redis | latest (planned) |
| Backend | Laravel Reverb | WebSockets for duels (planned) |
| Shared | TypeScript | 5.7+ |
| Web | React | 19.2 |
| Web | Vite | 8.0 |
| Web | TanStack Router | 1.170+ |
| Web | TanStack Query | 5.101 |
| Mobile | Expo SDK | 56 |
| Mobile | React Native | 0.86 |
| Mobile | expo-router | 56.2 |
| Storage | Cloudflare R2 | (configured) |
| Auth | Laravel Sanctum + Twilio phone OTP | (configured, dev mode bypass) |

*Note: Filament v5 has been completely decommissioned and uninstalled. The admin backoffice is implemented fully within `packages/web` as a React SPA with TanStack Router/Query.*

## Data models

See `guesseat-biz-plan.md` section 13 (Key Data Models) for the canonical schema:

- `venues` — UUID PK, name (pg_trgm), PostGIS POINT, district, cuisine_tags, claimed_by, first_submitted_by
- `photos` — UUID PK, venue FK, submitter FK, category (CHECK), phash, quality_score, status, R2 URLs
- `guesses` — UUID PK, photo FK, guesser FK, guessed_venue, pin, distance, time_ms, score, game_mode_slug, daily_challenge_id, shown_option_ids, answered_at
- `users` — trust_tier, XP, streaks, is_admin
- `daily_challenges` — UUID PK, date, title, status, generated_by, published_at
- `daily_challenge_photos` — ID PK, daily_challenge_id FK, photo_id FK, position
- `integration_settings` — ID PK, key, label, description, enabled, mode, settings, last_status, last_error, last_checked_at
- `settings` — ID PK, key, value (jsonb), type, group, label, description, is_public

UUIDs for PKs on `venues`, `photos`, `guesses`, `daily_challenges`.

## Request flow

```
Mobile/Web (TanStack Query) ──HTTPS──▶ Laravel API (REST)
                                         ├── PostgreSQL + PostGIS
                                         ├── Redis (cache, daily challenge, sessions)
                                         ├── Queue ── ProcessPhotoJob
                                         ├── Reverb (WebSocket) ── duels (planned)
                                         └── Cloudflare R2 ── /raw/ /censored/ /thumb/
```

## Image pipeline

```
Capture → ML Kit face blur (on-device) → category select → venue select →
  POST /api/photos (multipart, ~500KB) → Laravel stores raw to R2 →
  ProcessPhotoJob: EXIF GPS validate → pHash dedup → Laplacian blur →
  thumbnail 400px → status approved|quarantined →
  CensorPhotoJob (Phase 2): Google Vision faces/NSFW/plates
```

R2 paths: `/raw/{id}.jpg` (admin-only, signed URL), `/censored/{id}.jpg` (public, 1920px), `/thumb/{id}.webp` (public, 400px).

## Shared package

`@guesseat/shared` is the single source of truth for:

- `PHOTO_CATEGORIES` — closed set of 7 categories
- Scoring logic — `calculateGuesserScore`, `calculateSubmitterXp`
- Type definitions — `Photo`, `Venue`, `Guess`, `User`, `ScoreBreakdown`
- Badge definitions — `SUBMITTER_BADGES`

Never duplicate this logic in web or mobile — import from `@guesseat/shared`.

## Admin Backoffice Architecture

The admin backoffice runs under the `/admin` path in `packages/web` as an authentic React SPA. It features:
- **Authentication**: Bearer Token auth via Laravel Sanctum (integrated with the custom auth provider). Checks user `is_admin` property before allowing access.
- **Pages**:
  - `index.tsx` (Dashboard) — shows live stats, playability metrics, and category coverage.
  - `photos.tsx` — list/review uploaded photos, approve/reject/quarantine queue.
  - `users.tsx` — list, search, modify trust tiers, grant/revoke admin roles, view full detail Drawer with user activity (Photos list, Guesses history, XP events audit trail, and linked Social Accounts).
  - `venues.tsx` — list, search, add, update, or delete venues with geolocation.
  - `game-modes.tsx` — manage round count, option count, filters, and enable/disable Classic/Daily modes.
  - `daily-challenges.tsx` — create, generate/regenerate, delete, or publish daily challenges; view detailed Drawer with 5 assigned photos (position, category, venue).
  - `settings.tsx` — single bulk-save interface with dirty-state tracking, Enum selectors, and value range/type boundaries.
  - `integrations.tsx` — single-column list of cards grouped by type (Auth, Infrastructure, Moderation, Monetization) showing status, mode, last-checked time, last-error trace, and active connection tests.
- **Connection Checks**: Backend `IntegrationHealthService` triggers low-risk, live checks for twilio, R2, Redis, Reverb, Google Vision, and provider credentials, returning direct diagnostic state.

## Laravel Boost MCP

The `laravel-boost` MCP server (configured in `opencode.json`) exposes tools to inspect the running Laravel app and search the latest Laravel 13.x docs. It must be called before writing Laravel code. See `AGENTS.md`.