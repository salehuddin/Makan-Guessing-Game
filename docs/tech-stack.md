# App Tech Stack — GuessEat.my

> Verified versions as of 2026-06-28. All versions are installed and confirmed.

## Monorepo (root)

| Tool | Version | Purpose |
|---|---|---|
| pnpm | 11.7.0 | Package manager |
| Turborepo | 2.3.3 | Build orchestration across packages |
| TypeScript | 5.7+ | Shared language across all packages |

## Backend — `packages/api`

| Tech | Version | Role |
|---|---|---|
| Laravel | 13.16.1 | API framework (latest stable) |
| PHP | 8.5.7 | Runtime (Laravel 13 requires `^8.3`) |
| PostgreSQL | 16.9 | Database (Docker container) |
| PostGIS | 3.5.2 | Geospatial extension — GPS points, distance queries |
| Laravel Sanctum | 4.3.2 | API token auth (Bearer tokens for mobile/web) |
| Twilio SDK | 8.11.6 | Phone OTP (via Twilio Verify API; dev mode returns `123456`) |
| league/flysystem-aws-s3-v3 | 3.34.0 | S3-compatible storage adapter (for Cloudflare R2) |
| Laravel Boost | 2.4.10 | MCP server for AI-assisted development |
| Laravel Pint | 1.29.3 | PHP code formatter |
| PHPUnit | 12.5.30 | Testing (142 tests passing) |

### Database details

- PostgreSQL via Docker (`postgis/postgis:16-3.5` image)
- `pg_trgm` extension for fuzzy venue name search (ILIKE + GIN index)
- PostGIS geography columns (SRID 4326) for GPS coordinates
- Partial indexes on `photos` (approved-only, category-approved)
- GiST indexes on geography columns for spatial queries
- `venue_category_stats` view for per-venue analytics
- `settings` table for DB-backed app/game settings (15 seeded defaults)
- `integration_settings` table for external integration toggles (6 seeded)
- `game_modes` table with built-in Classic + Daily modes
- `daily_challenges` + `daily_challenge_photos` tables for DB-backed daily challenges
- `guesses` table tracks `game_mode_slug` and `daily_challenge_id`

### Auth flow

Email/password or social login → Sanctum Bearer token. Phone number OTP (dev: `123456`, prod: Twilio Verify) is a one-time verification required only to submit photos/venues. The admin panel (`/admin` in `packages/web`) consumes the same Sanctum tokens; access is gated by the `is_admin` user flag.

### Storage

Local disk currently. R2 S3-compatible disk configured in `config/filesystems.php` but credentials empty (pending Cloudflare bucket setup).

### Queue

`database` driver currently. `ProcessPhotoJob` handles EXIF GPS validation, pHash dedup, Laplacian blur detection, thumbnail generation, and status determination (approved for verified users, quarantined for new users).

## Shared package — `packages/shared`

| Tech | Role |
|---|---|
| TypeScript 5.7+ | Types, scoring logic, category definitions |
| No runtime deps | Pure types + functions |

Contains:

- `PHOTO_CATEGORIES` — closed set of 7 categories with labels, emojis, multipliers
- `calculateGuesserScore()` — base + speed + streak + difficulty + category multipliers
- `calculateSubmitterXp()` — base + pioneer + category-pioneer + fresh-angle + coverage-gap bonuses
- Type definitions: `Photo`, `Venue`, `Guess`, `User`, `ScoreBreakdown`, `GameMode`
- 10 submitter badge definitions (Pioneer, Cartographer, Category Master, etc.)

Imported by both web and mobile as `@guesseat/shared`.

## Web app — `packages/web`

| Tech | Version | Role |
|---|---|---|
| React | 19.2.7 | UI framework |
| Vite | 8.0.16 | Dev server + bundler |
| TanStack Router | 1.170.16 | File-based routing |
| TanStack Query | 5.101.0 | Server state (caching, mutations) |
| Tailwind CSS | 4.3.1 | Styling (dark theme, mobile-first `max-w-md`) |
| TypeScript | 5.7+ | Type safety |

### Screens (6)

1. **Login** (`/login`) — phone number → OTP → token
2. **Home** (`/`) — XP/tier stats, navigation buttons
3. **Play** (`/play`) — Classic Guess: photo, 4 venue options, result with score breakdown, next round
4. **Daily Challenge** (`/daily`) — 5-photo sequence, progress dots, final score
5. **Upload** (`/upload`) — photo picker, 7 category chips, venue search, upload
6. **Admin** (`/admin`) — moderation queue with approve/reject (admin users only)

Mobile-responsive: constrained to 448px width, dark theme, touch-friendly buttons, sticky nav bar with icons.

## Mobile app — `packages/mobile`

| Tech | Version | Role |
|---|---|---|
| Expo SDK | 56.0.12 | Managed React Native framework |
| React Native | 0.86.0 | Native rendering |
| expo-router | 56.2.11 | File-based navigation |
| React Navigation | 7.3.3 | Native stack navigator |
| TanStack Query | 5.101.0 | Server state |
| Zustand | 5.0.14 | Client state (auth) |
| AsyncStorage | 3.1.1 | Token persistence |
| expo-image-picker | 56.0.18 | Camera roll access |
| React | 19.2.0 | UI |
| TypeScript | 5.7+ | Type safety |

### Screens (5)

1. **Login** — OTP flow, native keyboard handling
2. **Home** — stats, navigation buttons
3. **Play** — photo, 4 options, result card, next round
4. **Daily Challenge** — 5-photo sequence with progress dots
5. **Upload** — image picker, category chips, venue search

Dark theme matching web app. Code-complete but not yet tested on a device/emulator.

## Architecture diagram

```
                    @guesseat/shared (types, scoring, categories)
                          │
           ┌──────────────┼──────────────┐
           ▼              ▼              ▼
      packages/web   packages/mobile   (future packages)
     (React + Vite)  (Expo + RN)
           │              │
           └──────┬───────┘
                  │ HTTPS + Bearer token
                  ▼
           packages/api (Laravel 13)
                  │
    ┌─────────┬───┴───┬──────────┐
    ▼         ▼       ▼          ▼
 PostgreSQL  Redis  Cloudflare  Queue
 + PostGIS  (planned)  R2     (ProcessPhotoJob)
```

## API endpoints

### Auth (public)

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/otp/send` | Send OTP to phone |
| POST | `/api/auth/otp/verify` | Verify OTP, return Sanctum token |
| POST | `/api/auth/logout` | Revoke current token |

### Authenticated

| Method | Path | Description |
|---|---|---|
| GET | `/api/user` | Current user profile |
| GET | `/api/venues/search?q=` | Search venues by name |
| GET | `/api/venues/{id}` | Venue details |
| POST | `/api/venues/suggest` | Suggest a new venue |
| POST | `/api/photos` | Upload photo (multipart) |
| GET | `/api/photos` | List user's photos |
| GET | `/api/photos/{id}` | Photo details |
| POST | `/api/play/classic` | Get a photo + 4 options (respects settings) |
| POST | `/api/guesses` | Submit a guess (tracks game_mode_slug) |
| GET | `/api/daily-challenge` | Get today's published DB-backed challenge |
| POST | `/api/daily-challenge/guesses` | Submit daily challenge guess (tracks game_mode_slug + daily_challenge_id) |

### Admin (requires `is_admin`)

**Admin backoffice** at `/admin` (React SPA in `packages/web`, served by the same Vite build). Login uses the same player auth (email/password or social) and access is gated by the user's `is_admin` flag. There is no separate Filament/Blade admin panel; Filament was removed (see `docs/architecture.md`).

Navigation groups:
- **Content** — Users, Venues (with lat/lng editing + photo counts), Photos (image preview + approve/reject/quarantine + accuracy stats)
- **Game Management** — Guesses (with mode tracking), Game Modes (enable/disable, configure), Daily Challenges (generate/regenerate/publish), Dashboard (playability stats)
- **Settings** — Game Settings page (15 toggles/params), External Integrations page (6 integrations with status)

**API admin endpoints** (also available, used by the web app):

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/photos/pending` | Moderation queue |
| POST | `/api/admin/photos/{id}/approve` | Approve photo, award XP |
| POST | `/api/admin/photos/{id}/reject` | Reject photo, penalize submitter |

**Admin credentials:** `admin@guesseat.my` / `password` (seeded via `VenueSeeder`). To make any user an admin, set `is_admin = true` on their row.

## Not yet in place

| Tech | Status | Phase needed |
|---|---|---|
| Redis | Not running (Daily Challenge now DB-backed; cache fallback) | Phase 1 launch |
| Cloudflare R2 | Configured, no credentials set | Phase 1 launch |
| Laravel Reverb | Not installed | Phase 3 (Duels) |
| Laravel Horizon | Not installed | Phase 2+ |
| ML Kit face blur | Not integrated | Phase 1 (biz plan requirement) |
| Google Cloud Vision | Not integrated | Phase 2 (censorship + AI category) |
| GrabFood affiliate | Not integrated | Phase 2 |

## Development commands

```bash
# Install all dependencies
pnpm install

# Run everything (api + web + mobile)
pnpm dev

# Run individually
pnpm dev:api      # php artisan serve -> http://127.0.0.1:8000
pnpm dev:web      # vite -> http://127.0.0.1:5173
pnpm dev:mobile   # expo start

# Backend tests
cd packages/api && php artisan test

# Backend lint
cd packages/api && vendor/bin/pint --test

# TypeScript checks
pnpm --filter @guesseat/shared build
pnpm --filter @guesseat/web lint
cd packages/mobile && pnpm exec tsc --noEmit

# Database
cd packages/api && php artisan migrate:fresh --seed

# Queue worker (processes ProcessPhotoJob)
cd packages/api && php artisan queue:work

# Daily challenge generation
cd packages/api && php artisan guesseat:daily-challenge
```

## Infrastructure

Production deployment is specified in [`docs/deployment.md`](deployment.md) — Coolify on a
Hetzner Singapore VPS, Cloudflare Pages for web, R2 + CDN for photos. Summary:

| Component | Provider | Cost (MVP) |
|---|---|---|
| Laravel API + queue + Reverb + Postgres + PostGIS + Redis | Local (Laragon) / **Hetzner SG CX32 via Coolify** (prod) | $0 / ~$11 |
| React web app | Local (Vite) / Cloudflare Pages (prod) | $0 |
| Mobile builds | Expo (local / EAS) | $0 |
| Photo storage | Local disk / Cloudflare R2 (prod) | $0 / ~$0–1 |
| Phone OTP | Dev (fake) / Twilio Verify (prod) | $0 / ~$5 |
| Censorship | ML Kit (on-device) / Google Vision (Phase 2) | $0 |
| **Total MVP** | | **~$16–25/month** |
