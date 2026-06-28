# Deployment & Infrastructure

> Deployment stack recommendation, MVP specs, and scale specs for GuessEat.my.
> Supersedes the generic scenarios in `guesseat-biz-plan.md` section 14 (which predate the
> Hetzner Singapore region and Coolify). Locked external services (Cloudflare R2 + CDN +
> Pages, Twilio Verify, Google Cloud Vision, Expo EAS) come from the biz plan; this doc
> nails down **where the Laravel backend lives and how it grows**.
>
> **Date:** 2026-06-22 · **Status:** Recommended (pending D13 decision-log entry)

---

## TL;DR

Run the **Laravel API + queue workers + Reverb + PostgreSQL/PostGIS + Redis** on a single
**Hetzner Singapore** VPS managed by **Coolify**. Serve the React web SPA on **Cloudflare
Pages**, photos out of **Cloudflare R2** (zero egress) fronted by the **Cloudflare CDN**.
Mobile via **Expo EAS**. Phone OTP via **Twilio Verify**.

This is biz-plan **Scenario A cost** (~$15–25/mo) with **Scenario B convenience**: Coolify
gives you a dashboard for deploys, databases, SSL, and persistent processes — and it runs
real long-lived processes, so **Reverb WebSockets work** (the reason Vapor/Lambda was
rejected). An AI agent (opencode + the `laravel/boost` MCP) can author and maintain nearly
all of the config/scripts/runbooks and help debug; you stay "light SRE" for ~5 periodic
tasks.

| Component | Provider / Tool | MVP cost (approx) |
|---|---|---|
| Backend (API + queue + Reverb) + Postgres + PostGIS + Redis | **Hetzner Singapore CX32** via **Coolify** (self-hosted) | ~$11/mo |
| Web SPA (`packages/web`) | **Cloudflare Pages** (free) | $0 |
| Photo storage + CDN | **Cloudflare R2** + Cloudflare CDN | ~$0 (<1GB) |
| Phone OTP | **Twilio Verify** (~60 users) | ~$5/mo |
| Censorship (Phase 2) | **Google Cloud Vision** (free tier) | $0 |
| Mobile builds | **Expo EAS** free / local | $0 |
| Error tracking | **Sentry** free tier | $0 |
| Uptime monitoring | **Uptime Kuma** (self-hosted in Coolify) | $0 |
| Domain `.my` | Exabytes / MYNIC | ~RM 80/yr |
| Apple Developer + Google Play | Apple / Google | $99/yr + $25 once |
| **Total MVP** | | **~$16–25/mo (≈ RM 70–110)** |

> Prices are approximate and change — verify on each provider's site before provisioning.
> USD→RM ≈ 4.5.

---

## 1. Design principles

1. **Zero egress for photos.** R2 is non-negotiable (biz plan). Photo-heavy app + paid egress
   = death by bandwidth. Cloudflare CDN caches `/censored/*` and `/thumb/*` at the edge.
2. **Persistent processes must be allowed.** Reverb (WebSockets) and queue workers are
   long-lived. This rules out Vapor/Lambda and any serverless-only platform.
3. **Malaysia-first latency.** Target users are in Malaysia. Pick regions with a Singapore
   PoP: Hetzner `sin`, Cloudflare (global anycast, SG PoP), Twilio. Aim for <50ms RTT.
4. **Solo-founder economics.** Grant-funded (Cradle CIP Spark), 18-month runway. Keep the
   MVP under ~RM 150/mo; only add spend when a DAU tier or a biz-plan trigger demands it.
5. **One box until it hurts.** A single 8GB VPS comfortably runs API + DB + Redis + workers
   + Reverb through ~1,000 DAU. Splitting services early is premature.
6. **Boring, reversible choices.** Docker containers everywhere → any service can move to
   managed/another host later with a redeploy, no code change.
7. **AI-agent operable.** Prefer declarative, file-based config (Dockerfile, `nixpacks.toml`,
   `docker-compose`, env vars) that an agent can generate and diff over click-ops UIs.

---

## 2. The recommended stack

### 2.1 Backend — Coolify on Hetzner Singapore

- **VPS:** Hetzner Cloud, **Singapore (`sin`)**. Start at **CX32** (4 vCPU, 8 GB RAM, 80 GB
  disk, 20 TB traffic) ≈ $10–13/mo. The SG region gives ~20–40ms RTT to Klang Valley.
  - *Budget floor:* CX22 (2 vCPU, 4 GB) ≈ $5/mo works for a tiny private beta, but Coolify
    + Postgres + Redis + workers get tight on 4 GB. Don't ship the public launch on it.
- **PaaS layer:** **Coolify v4** (open-source, self-hostable) installed on the same VPS.
  Coolify provides: git-push deploys (webhook from GitHub), Docker/Nixpacks builds, Traefik
  reverse proxy with automatic Let's Encrypt SSL, database provisioning, persistent
  containers, scheduled backups to S3-compatible storage (R2), multi-server scaling later.
- **App serving options in Coolify (pick one):**
  - **Nixpacks** auto-build from the Laravel app (zero Dockerfile). Good default.
  - **Custom Dockerfile** for full control (recommended once you add Reverb + Horizon so you
    can run multiple processes/containers from one image).
  - **FrankenPHP** (Laravel docs list it as a supported app server) for a single-binary,
    high-performance PHP server with HTTP/3 — optional performance upgrade, not MVP.
- **PostgreSQL 16 + PostGIS 3.5** as a Coolify database resource using the **custom image
  `postgis/postgis:16-3.5`** — the exact image already used locally in Docker
  (see `docs/decisions.md` D9). Same extensions: `postgis`, `pg_trgm`.
- **Redis 7** as a Coolify database resource. Used for: queue driver, cache, Daily Challenge
  cache, Reverb broadcasting backend, (later) Horizon + rate limiting.
- **Laravel Reverb** (Phase 3, Duels) runs as a **persistent container** with
  `php artisan reverb:start --daemon`. Coolify keeps it alive (restart policy). This is the
  key reason we're on a VPS and not serverless.
- **Queue workers** for `ProcessPhotoJob` (and later `CensorPhotoJob`) run as persistent
  containers: `php artisan queue:work redis --tries=3 --max-time=3600`. Add
  **Laravel Horizon** (Phase 2) for a dashboard + autoscaling workers — Horizon needs Redis
  as the queue driver, which we already have.

### 2.2 Web SPA — Cloudflare Pages

- `packages/web` (React 19 + Vite 8) builds to static assets → **Cloudflare Pages**, free
  plan. Global anycast (SG PoP), unlimited bandwidth/requests, 500 builds/mo.
- Set `VITE_API_URL=https://api.guesseat.my` and Reverb env vars at build time.
- Custom domain `guesseat.my` on Cloudflare DNS; `www` → Pages; `api` → Hetzner (proxied).
- **Why not Vercel:** Cloudflare is already our storage + CDN + DNS vendor; consolidate.

### 2.3 Mobile — Expo EAS

- `packages/mobile` (Expo SDK 56). **EAS Build/Submit** free tier for dev builds + initial
  store submissions; do **local builds** (`eas build --local`) to avoid burning cloud
  minutes. OTA updates via **EAS Update** (free tier) for JS-only changes.
- Upgrade to **EAS Production ($199/mo)** only when you need high-volume cloud builds,
  multiple update channels, and priority queues — i.e. at scale/launch crunch, not MVP.

### 2.4 Photos — Cloudflare R2 + Cloudflare CDN

- R2 bucket `guesseat-photos` with paths `/raw/{id}.jpg` (private, signed URL),
  `/censored/{id}.jpg` (public, 1920px), `/thumb/{id}.webp` (public, 400px) — per biz plan
  section 6. Wired via the `r2` disk in `config/filesystems.php` (decisions D11).
- **CDN cache rules:** `/censored/*` 30d + 7d SWR; `/thumb/*` 90d + 30d SWR; `/raw/*` no
  cache (signed URL origin fetch). Origin = R2 (not your VPS) → image traffic never touches
  the Hetzner box. This is what keeps the VPS cheap.
- Backups: Coolify can also dump the DB to a second R2 bucket/path on a schedule.

### 2.5 Auth — Twilio Verify

- Phone OTP via Twilio Verify API (`TwilioOtpService`, switched by `OTP_DRIVER=twilio`).
  ~$0.05–0.08 per successful verification. Dev stays on `DevOtpService` (`123456`).

### 2.6 Censorship — Google Cloud Vision (Phase 2)

- `CensorPhotoJob` calls Vision API (faces, SafeSearch, OCR for plates). $1.50/1,000 images;
  first 1,000/mo free on several features. Cost table in biz plan section 9.
- MVP uses **client-side ML Kit face blur only** (decisions D-/open decision 8).

### 2.7 Observability & ops

- **Sentry** (free tier: 5k errors/mo) for backend + frontend error tracking.
- **Laravel Boost MCP** (`search-docs`, `application-info`, `last-error`, `read-log-entries`)
  for AI-assisted debugging against the running app.
- **Uptime Kuma** self-hosted in Coolify for uptime + SSL-expiry + heartbeat monitoring
  (free). Ping `/up` (Laravel health route) + a Reverb WS probe + R2 HEAD.
- **Backups:** nightly `pg_dump` → R2 (Coolify scheduled backup) + `pgbackrest`/WAL later.

---

## 3. Why Coolify (+ can an AI agent help run it?)

**Is self-managed VPS + Coolify good enough?** Yes — for MVP through ~1,000 DAU, easily.
Coolify removes the parts of "self-managed" that waste solo-founder time:

- No hand-writing Nginx configs, SSL certs, or deploy hooks — Traefik + Let's Encrypt are
  automatic, deploys trigger on git push.
- No manual DB/Redis install — one-click resources, with the **custom-image option** that
  lets us run `postgis/postgis:16-3.5` (the only non-trivial requirement here).
- Persistent containers mean Reverb and `queue:work` "just run" with restart policies.
- Multi-server support means scaling out later (add a second Hetzner node for the DB) is a
  Coolify config change, not a replatform.
- Cost: Coolify itself is **free** self-hosted (vs Forge $12/mo or Laravel Cloud premium).

**What's left for you (the "light SRE" budget — ~5 periodic tasks):**

1. OS hardening once at provisioning: `ufw` firewall, SSH key-only login, `fail2ban`,
   disable root login. (Agent can write the script; you run it once.)
2. `unattended-upgrades` for automatic security patches — set + forget.
3. Rotate R2/Twilio/Vision/Stripe secrets quarterly (agent can remind + script the rotation;
   you approve).
4. Watch Uptime Kuma + Sentry alerts; act on incidents.
5. Periodic `pg_dump`→R2 restore drill (agent can write the drill script; you run it
   quarterly to prove backups actually restore).

**What an AI agent (opencode) can do well here:**

- Author the `Dockerfile` / `nixpacks.toml` / `docker-compose.yml` for Coolify.
- Generate deploy scripts that run `php artisan optimize --clear`, `migrate --force`,
  `queue:restart` (so workers pick up new code), `reverb:restart`.
- Write backup/restore runbooks, health-check probes, cron schedules.
- Debug incidents: read app logs via the Boost MCP (`last-error`, `read-log-entries`), and
  generate the exact SSH/`docker exec` commands for you to run on the box. With an SSH MCP
  server wired into opencode, the agent could run those commands itself (gate it behind
  explicit approval).
- Track drift: keep the Coolify resource definitions in-repo as IaC so config is reviewable
  and re-creatable.

**What still needs a human in the loop:** destructive ops on a live box (DB migrations on
hot data, secret rotation, kernel upgrades that need a reboot), and anything requiring
judgment during an incident. Net: **Coolify + an AI agent is a strong solo-founder combo**;
you are not on the hook for daily ops.

### Alternatives considered

| Option | Verdict |
|---|---|
| **Laravel Forge + DO/Hetzner** | Excellent, the Laravel-idiomatic choice; $12/mo on top of the VPS. Pick this if you'd rather not touch Coolify at all. More mature than Coolify, fewer rough edges, but less of a "PaaS you fully own." |
| **Laravel Cloud** | Fully managed (compute + DB + Redis + storage), queues + Reverb built in. Least ops, highest cost, newest. Consider at the **Scale** tier if you want to stop owning servers entirely. Verify SG region + Reverb pricing before committing. |
| **Fly.io** | SG edge, native persistent processes, horizontal scaling built in. Great fit technically, mid-cost, more config than Coolify. Strong alternative if duel-mode (Reverb) growth is faster than expected. |
| **Vapor / serverless Lambda** | Rejected (biz plan) — can't host persistent WebSocket connections for Reverb. |
| **Supabase / BaaS** | Rejected (biz plan) — need full control over game logic, queue processing, transactions. |

---

## 4. MVP specs

**Target:** private beta → public Klang Valley launch, 0 → ~1,000 DAU. Biz plan Phase 1.

### 4.1 Topology (single server)

```
                    guesseat.my (Cloudflare DNS)
        ┌───────────────────┬───────────────────────────┐
        ▼                   ▼                           ▼
  Cloudflare Pages    Cloudflare CDN               api.guesseat.my
  (React SPA, free)   (R2 images, cached)          (proxied → Hetzner SG)
        │                   │                           │
        │  VITE_API_URL─────┼──────────────────────────►│
        │                   │                           ▼
        ▼               R2 bucket                Hetzner SG CX32 (Coolify)
   TanStack Query    /raw  /censored  /thumb     ┌────────────────────────┐
   (HTTPS+Bearer)    (private) (public)          │ Traefik (TLS, routing) │
        │                                           │  ├─ Laravel API (FPM)  │
        └──────────────────────────────────────────►│  ├─ queue:work (x2)    │
                                                    │  ├─ reverb:start       │ (Phase 3)
                                                    │  ├─ Postgres 16+PostGIS│
                                                    │  └─ Redis 7            │
                                                    └────────────────────────┘
                          Twilio Verify ◄── OTP ──►  (external)
                          Google Vision  ◄── Censor (external, Phase 2)
                          Sentry / Uptime Kuma      (observability)
```

### 4.2 Sizing & resource budget (CX32, 8 GB)

| Process | RAM budget | Notes |
|---|---|---|
| OS + Coolify + Traefik | ~1.5 GB | Coolify dashboard + proxy overhead |
| PostgreSQL 16 + PostGIS | ~1.5 GB | `shared_buffers=512MB`, `work_mem=8MB` |
| Redis 7 | ~256 MB | cache + queue + Reverb backend; `maxmemory=200mb`, allkeys-lru |
| Laravel FPM (API) | ~1 GB | `php8.3-fpm`, ~10 workers |
| Queue workers (`ProcessPhotoJob`) | ~1 GB | 2 workers; spike to 4 during upload bursts |
| Reverb (Phase 3) | ~512 MB | persistent; grows with concurrent WS conns |
| Headroom | ~2 GB | for spikes + backups + `pg_dump` |
| **Total** | ~8 GB | fits CX32; upgrade to CX42 (16 GB) if headroom < 20% |

Disk: 80 GB is plenty at MVP (DB is small; photos live in R2, not the disk).

### 4.3 Laravel production config (deploy script)

Run on every deploy (Coolify post-deploy hook). Verified against Laravel 13 docs:

```bash
php artisan migrate --force           # schema migrations
php artisan optimize                  # cache config, routes, views, events
php artisan queue:restart             # gracefully restart workers (needs cache driver set)
php artisan reverb:restart            # restart Reverb process (Phase 3+)
```

Required PHP extensions on the server (Laravel 13 min): `ctype, curl, dom, fileinfo, filter,
hash, mbstring, openssl, pcre, pdo, session, tokenizer, xml` + **GuessEat-specific**:
`pdo_pgsql, pgsql, gd, exif, redis, zip`. Enable **OPcache** (`opcache.enable=1`,
`opcache.preload`, `opcache.jit` where supported). `APP_ENV=production`,
`APP_DEBUG=false`, `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, `SESSION_DRIVER=redis`.

Admin panel note: the admin backoffice is a React SPA in `packages/web` (no Filament/Blade). Access is gated by the `is_admin` user flag via the admin API routes (`'admin' => IsAdmin::class` middleware).

### 4.4 Environments & domains

| Host | Points to | Purpose |
|---|---|---|
| `guesseat.my`, `www.guesseat.my` | Cloudflare Pages | React web SPA |
| `api.guesseat.my` | Hetzner VPS (Cloudflare-proxied, gray-cloud OK for WS) | Laravel API + Reverb |
| `guesseat.my/admin` | Cloudflare Pages (`/admin` route in the SPA) | React admin backoffice |
| `cdn.guesseat.my` (or R2 public bucket domain) | Cloudflare CDN → R2 | photos |

> Cloudflare proxy (orange cloud) is fine for `api.` HTTP traffic. For Reverb WebSockets,
  either gray-cloud the `ws.`/`api.` record or use Cloudflare's WebSocket support with the
  proxied record and the right port — verify before Phase 3 launch.

### 4.5 Env vars to set in Coolify (app resource)

```
APP_ENV=production
APP_URL=https://api.guesseat.my
APP_DEBUG=false
DB_CONNECTION=pgsql            # Coolify injects DB host/creds as linked-resource vars
REDIS_CLIENT=phpredis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
OTP_DRIVER=twilio
TWILIO_*
R2_*  (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT)
SCOUT_* / VISION_*  (Phase 2)
SENTRY_LARAVEL_DSN=...
REVERB_*  (Phase 3)
```

### 4.6 Backup & DR (MVP)

- Nightly `pg_dump` (gzip) → R2 `backups/db/` — Coolify scheduled DB backup, 14-day retention.
- Weekly full → second R2 path, 4-week retention.
- Quarterly: restore drill into the `guesseat_testing` DB on a throwaway Coolify resource.
- R2 objects are the source of truth for photos; protect the bucket with versioning + a
  lifecycle policy. Raw (`/raw/*`) is admin-only via signed URLs.

### 4.7 MVP cost recap

| Item | ~$/mo |
|---|---|
| Hetzner SG CX32 | 11 |
| Cloudflare Pages | 0 |
| Cloudflare R2 (MVP volume) | 0–1 |
| Twilio Verify (~60 users) | 5 |
| Google Vision (Phase 2, free tier) | 0 |
| Sentry / Uptime Kuma | 0 |
| **Operating total** | **~16–17** |
| Annual: Apple $99 + domain ~RM 80 | ~$22/yr amortized ≈ 2/mo |

Matches biz-plan Scenario A cost, with managed-app convenience.

---

## 5. Scale specs

Growth is gated by **DAU + concurrent WebSocket connections + photo-upload throughput**.
Move up a tier only when a trigger fires — do not pre-scale.

### 5.1 Tiered growth plan

| Tier | DAU | Concurrent WS | Photos/mo | Trigger to advance |
|---|---|---|---|---|
| **T0 MVP** | 0–1,000 | n/a (no Reverb yet) | ≤500 | — |
| **T1 Launch** | 1,000–5,000 | n/a | ~3,000 | CPU avg >60% OR queue lag >30s OR DB >60% RAM |
| **T2 Growth** | 5,000–25,000 | ≤2,000 (Duels live) | ~15,000 | WS conns >1k OR Reverb RAM >1GB OR DB CPU hot |
| **T3 Scale** | 25,000–100,000 | 2,000–10,000 | ~60,000 | any single service saturating the box |
| **T4 Platform** | 100,000+ | 10,000+ | 250,000+ | multi-region, sponsor SLAs |

### 5.2 T1 — Launch (1k–5k DAU): split the DB, add Horizon

- **Upgrade VPS → CX42 (8 vCPU, 16 GB)** OR **add a second Hetzner node** and move
  PostgreSQL+PostGIS onto it as a Coolify database resource on its own server (DB node:
  CPX31/CPX41). Keeps the app node headroom healthy.
- **Laravel Horizon** installed → Redis-backed queue dashboard + worker autoscaling. Bump
  `ProcessPhotoJob` workers to 4–8.
- **Reverb not yet needed** (Duels is Phase 3).
- **R2 + CDN:** enable R2 versioning; add a `backups/photos` replication if desired.
- **Observability:** Sentry Team ($26/mo); Uptime Kuma probes for DB + queue lag.
- **Cost:** ~$40–70/mo (Hetzner app + DB nodes, Twilio ~$40 at 500 new users/mo, Vision ~$3).

### 5.3 T2 — Growth (5k–25k DAU): Reverb + dedicated services

- **Reverb goes live** (Duels). Run Reverb as its own Coolify container on the app node
  first; if WS connections >1,000, move Reverb to its own VPS (CPX31) behind `ws.guesseat.my`.
  Consider **Reverb horizontal scaling** (Redis pub/sub backend — already have Redis).
- **Redis → own node** (CPX21) if cache hit-rate drops or queue throughput is bound by Redis.
- **Postgres:** add a read replica (Coolify can host it) for leaderboards / Daily Challenge
  reads; keep writes on primary. Add `pgbouncer` for connection pooling.
- **CDN tuning:** raise cache TTLs, add `Cache-Tag` headers for surgical invalidation when a
  photo is rejected/re-censored.
- **Queue:** split `ProcessPhotoJob` and `CensorPhotoJob` into separate queues with
  independent worker pools; add a `notifications` queue.
- **Cost:** ~$120–200/mo (3–4 Hetzner nodes, Twilio ~$160 at 2k new users/mo, Vision ~$21,
  Sentry Team). Roughly biz-plan Scenario B.

### 5.4 T3 — Scale (25k–100k DAU): managed services + LB

- **Decision point:** keep self-managing on Hetzner/Coolify, or migrate the control plane to
  **Laravel Cloud** / managed Postgres to reduce SRE load. Re-evaluate ops appetite here.
- **Load balancer:** Hetzner Cloud Load Balancer (or Cloudflare's) in front of ≥2 app nodes;
  sticky sessions not needed (Sanctum tokens are stateless).
- **Postgres → managed** (Hetzner Cloud DB, or RDS-equivalent) with automated PITR + HA.
- **Reverb:** dedicated node(s) with horizontal scaling; or swap to Pusher Channels /
  Soketi if self-hosted Reverb ops get heavy.
- **Object storage tiering:** move `/raw/*` to R2 infrequent-access; keep `/censored` + `/thumb` hot.
- **Search:** if venue fuzzy search (`pg_trgm`) gets slow, add Meilisearch/Typesense in Coolify.
- **Cost:** ~$300–500/mo. Approaches biz-plan Scenario C.

### 5.5 T4 — Platform (100k+ DAU): multi-region

- **Multi-region:** second region (e.g. Jakarta or Mumbai for Indonesia/SG expansion) with
  read-only replicas + geo-routed API via Cloudflare.
- **Sponsorship SLAs** (Phase 4) require uptime targets → managed everything + on-call.
- This is beyond the 18-month runway scope; revisit when DAU trajectory is proven.

### 5.6 Scale-trigger checklist (automate alerts via Uptime Kuma / Sentry)

- CPU avg >60% over 1h → bump vCPU or split a service.
- Queue `pending` size >1,000 OR `lag` >30s → add workers / move Redis to own node.
- Postgres RAM >70% OR `pg_stat_activity` connections near `max_connections` → add
  `pgbouncer` + read replica.
- Reverb concurrent connections >1,000 or RAM >1GB → dedicated Reverb node.
- API p95 latency >200ms (from SG) → profile; likely DB index or cache miss.
- R2 read ops approaching free-tier limits (10M Class B/mo) → still cheap, but note it.

---

## 6. Provisioning checklist (first deploy)

1. Register `guesseat.my` (Exabytes/MYNIC); point NS to Cloudflare.
2. Create Hetzner Cloud project, **Singapore** region; spin up **CX32** with Ubuntu 24.04 LTS.
3. Harden: `ufw` (allow 22/80/443), SSH key-only, disable root login, `fail2ban`,
   `unattended-upgrades`. (Agent can generate this script.)
4. Install Coolify v4 (one-line installer). Access dashboard over HTTPS.
5. In Coolify: add the GitHub repo, create the Laravel **application** (Nixpacks first,
   custom Dockerfile once Reverb/Horizon land), set env vars from §4.5.
6. Add Coolify **database resources**: PostgreSQL with image `postgis/postgis:16-3.5`
   (enable `postgis` + `pg_trgm` extensions), Redis 7. Link them to the app resource.
7. Create Cloudflare R2 bucket `guesseat-photos` + API token; set `R2_*` in Coolify. Add CDN
   cache rules per §2.4.
8. Cloudflare Pages: connect `packages/web`, set `VITE_*` env vars, deploy to `guesseat.my`.
9. Run `php artisan migrate --force --seed` (or just migrations for prod); create the admin
   user (`is_admin=true`).
10. Set up Sentry DSNs (api + web), Uptime Kuma probes (`/up`, DB, R2 HEAD).
11. Configure nightly `pg_dump` → R2 backup in Coolify.
12. Twilio Verify service → set `OTP_DRIVER=twilio` + `TWILIO_*`; send a test OTP.
13. Expo: `eas build --local` + `eas submit` to TestFlight + internal Play track.

---

## 7. Open items / decisions to lock

- **D13 (proposed):** Backend hosting = Coolify on Hetzner Singapore (this doc). MVP single
  CX32; scale per §5.
- Verify Hetzner SG pricing + Coolify v4 PostGIS custom-image flow at provisioning time.
- Decide Cloudflare proxy mode for `api.` once Reverb is live (§4.4 note).
- Decide when to introduce Horizon (recommend at T1, not MVP — `database` queue is fine
  through ~1k DAU per `tech-stack.md`).
- Re-evaluate **Laravel Cloud** vs staying self-hosted at the T3 decision point.

---

*Living document. Update when a tier transition happens or a managed-service migration is
chosen. Cross-references: `guesseat-biz-plan.md` §13–14, `docs/tech-stack.md`,
`docs/architecture.md`, `docs/decisions.md` (D9, D11, D12).*
