# Implementation Roadmap

> Source of truth for what's built vs what's planned. Derived from `guesseat-biz-plan.md` section 15.

## Overall progress

| Status | Count |
|---|---|
| Product roadmap done | 23 / 50 |
| Base-game ops hardening | 8 / 8 complete |
| In progress | Phase 1 — base game/admin ops complete; launch prep remains |
| Up next | Seed 130 more venues, configure R2/Redis, publish Daily Challenge, manual admin QA, ML Kit face blur, launch |
| MVP gate | Backend API + web/mobile UIs + admin backoffice all functional |

**Last updated:** 2026-06-26 (Roadmap reconciled: Filament decommissioned; SPA admin complete with 32 new tests; 141 tests total; Settings/Integrations/Daily Challenges/Game Modes/Users/Venues/Photos all in React SPA; ML Kit remains pending; 141 tests passing)

## Built so far

- **Monorepo** — Turborepo + pnpm workspaces (`packages/api`, `shared`, `web`, `mobile`)
- **Backend** — Laravel 13.16.1 on PHP 8.5.7, PostgreSQL 16 + PostGIS 3.5 (Docker), laravel/boost MCP
- **Database** — 13 migrations: users, venues, photos, guesses, venue_category_stats view, personal_access_tokens, settings, integration_settings, game_modes, daily_challenges, daily_challenge_photos, game tracking columns on guesses
- **Admin backoffice** — **React SPA** at `/admin` (Filament v5 removed) with full CRUD: Users, Venues, Photos (image preview + approve/reject/quarantine), Guesses (mode tracking), Game Modes, Daily Challenges (generate/regenerate/publish), Settings, Integrations, Dashboard, Moderation, Ads, Translations, XP Events. Admin auth via Sanctum token (requires `is_admin`). 32 new feature tests for 6 controllers.
- **Settings system** — DB-backed `SettingsService` with cached typed reads; 15 game/content/security/display settings; admin SPA Settings page with dirty tracking, discard, grouped sections, enum/range-aware controls
- **Integration settings** — 7 external integrations (Google Auth, Facebook Auth, Apple Auth, TikTok Auth, Twilio, R2, Redis, Reverb, Google Vision, GrabFood, AdMob, AdSense) with admin toggles, mode selector (dev/staging/production), test-connection buttons, health status display; secrets remain in `.env`
- **Game modes** — `game_modes` table with built-in Classic + Daily; admin SPA with enable/disable, configure option count, round count, category/district filters, selection strategy
- **Daily Challenges** — DB-backed `daily_challenges` + `daily_challenge_photos` tables; admin SPA with generate/regenerate/publish, detail drawer showing 5 assigned photos with position/category/venue, inline title editing
- **Anti-cheat** — `correct_venue_id` no longer returned in play response by default (controlled by `return_correct_answer_before_guess` setting); guesses track `game_mode_slug` and `daily_challenge_id`
- **Photo selection** — `PhotoSelectionService` now configurable via settings (exclude own, exclude seen, require approved, require censored URL, underplayed threshold, freshness days); supports category and district filters
- **Auth** — Laravel Sanctum + Twilio phone OTP (dev driver returns "123456"); 8 auth tests
- **Services** — ExifService, PHashService, PhotoSelectionService, DistractorService, GuesserScoringService, SubmitterXpService, SettingsService, IntegrationService, IntegrationHealthService, DailyChallengeGenerator
- **API endpoints** — Auth (OTP), Venues (search/suggest), Photos (upload/list), Play (classic), Guesses (submit), Daily Challenge (DB-backed), Admin moderation (pending/approve/reject); all gameplay endpoints respect admin settings toggles
- **Storage** — Cloudflare R2 S3-compatible disk configured (credentials pending)
- **Shared** — `@guesseat/shared` with `PHOTO_CATEGORIES` (7), scoring formulas, types, 10 badges
- **Web** — React 19 + Vite 8 + TanStack Router + TanStack Query + Tailwind 4; 6 screens: Login, Home, Play, Daily Challenge, Upload, Admin; mobile-responsive; handles optional category/submitter and hidden answers
- **Mobile** — Expo SDK 56 + React Native 0.86 + expo-router + TanStack Query + Zustand; 5 screens: Login, Home, Play, Daily, Upload; typechecks clean; handles optional category/submitter and hidden answers
- **Docs** — architecture, setup, decisions, roadmap, php-setup, tech-stack
- **Tooling** — pnpm 11.7, Turbo 2.3, Pint (passing), PHPUnit (141/141 passing)

## Currently working on

Phase 1 base game architecture is complete. Remaining launch blockers: venue/photo seeding expansion, production storage/cache setup, manual admin QA, ML Kit face blur, and launch prep.

## Phases

### Phase 0: Foundation (Weeks 1–4) — COMPLETE

- [x] Turborepo monorepo: `packages/shared`, `packages/api`, `packages/web`, `packages/mobile`
- [x] Laravel 13 API skeleton + PHP 8.5 + laravel/boost MCP
- [x] React web skeleton: TanStack Router + Query + Vite
- [x] React Native skeleton: Expo + expo-router + TanStack Query
- [x] `@guesseat/shared`: categories, scoring (guesser + submitter), types, badges
- [x] PostgreSQL schema + PostGIS + category CHECK constraints
- [x] Laravel Sanctum + Twilio phone OTP auth
- [x] Cloudflare R2 bucket configuration
- [x] EXIF extraction module (Laravel)
- [x] pHash generation + comparison module (Laravel)

**Gate to Phase 1:** a photo can be selected/captured, categorized, uploaded, processed, and approved locally. Client-side blur is intentionally deferred and tracked as a launch blocker.

### Base Game Operations — COMPLETE (added 2026-06-22, SPA admin completed 2026-06-26)

- [x] DB-backed app/game settings with admin Settings page (SPA)
- [x] External integration toggles/status page for all 7 integrations (SPA)
- [x] Built-in Game Modes admin resource for Classic and Daily (SPA)
- [x] DB-backed Daily Challenge model with admin generate/regenerate/publish workflow (SPA)
- [x] Playability Dashboard with launch-readiness metrics
- [x] Anti-cheat: hide correct answer before guess by default
- [x] Guess tracking by `game_mode_slug` and `daily_challenge_id`
- [x] Settings-driven API behavior for gameplay, uploads, and venue suggestions
- [x] User detail drawer with photos/guesses/XP events/social accounts
- [x] 32 new feature tests for 6 admin controllers (141 total)

## Phase 1: MVP Launch (Weeks 5–8)

- [x] Photo upload flow: photo picker/camera → category select → venue autocomplete → upload
- [ ] Client-side ML Kit face blur before upload
- [x] `POST /api/photos` stores raw to R2, inserts `pending`, dispatches `ProcessPhotoJob`
- [x] `ProcessPhotoJob`: EXIF GPS validation, pHash dedup, Laplacian blur, thumbnail, status
- [x] Trust tiers: New + Verified
- [x] `POST /api/play` — seen-once exclusion + freshness + staleness protection
- [x] Classic Guess mode: 4 distractors, full scoring, category tag
- [x] Daily Challenge: DB-backed curated set with admin generate/publish flow
- [x] Submitter XP: base + pioneer + category pioneer
- [x] Moderation queue (admin)
- [ ] Seed 150+ Klang Valley venues across all 7 categories
- [ ] Configure production R2 credentials and Redis/cache setup
- [ ] Manual admin QA click-through for Settings, Integrations, Game Modes, Daily Challenges, Photos, Venues, Guesses, Users
- [ ] Launch on r/malaysia

## Phase 2: Engagement (Weeks 9–14)

- [ ] Free-Text Guess with autocomplete
- [ ] Map Pin Drop mode
- [ ] Signature Dish + Ambience category-gated modes (admin/category-filter infrastructure exists; user-facing modes pending)
- [ ] District Royale (district-filter infrastructure exists; user-facing mode pending)
- [ ] Full badge system
- [ ] Category gap bonus + engagement dividend + fresh angle bonus
- [ ] Submitter leaderboards (district, category)
- [ ] In-game photo watermarks
- [ ] Post-guess rating + photo decay
- [ ] Google Cloud Vision: server-side censorship + AI category verification
- [ ] GrabFood affiliate deep links

## Phase 3: Competitive (Weeks 15–22)

- [ ] Duels (1v1, HP-based, Reverb WebSocket, Elo matchmaking)
- [ ] Category Gauntlet (fixed 5-round sequence)
- [ ] Cuisine Sprint
- [ ] Team Duels
- [ ] Competitive divisions (Bronze → Champion)
- [ ] Cosmetic IAP (optional)

## Phase 4: Business (Weeks 23–30)

- [ ] Claimed Business Profile (RM 29/month)
- [ ] Sponsored Restaurant tier (RM 99–299/month)
- [ ] Chain Challenge mode
- [ ] Business analytics dashboard (per-category recognizability; internal Playability Dashboard exists)
- [ ] Restaurant Hunter + Photo Bounty system

## Phase 5: Expansion (Month 8+)

- [ ] Tourism board partnerships
- [ ] Singapore expansion
- [ ] Indonesia market research
- [ ] Aggregated data product (per-category recognizability scores)
- [ ] Live event modes (Ramadan bazaar, food festivals)