# Makan Guesser — Product Bible

**Version:** 2.1
**Date:** June 13, 2026
**Status:** Pre-MVP / Planning Complete

---

## Table of Contents

1. [Overview & Vision](#1-overview--vision)
2. [Core Game Loop](#2-core-game-loop)
3. [Game Modes](#3-game-modes)
4. [Photo Category System](#4-photo-category-system)
5. [Image Selection Algorithm](#5-image-selection-algorithm)
6. [Image Serving Pipeline](#6-image-serving-pipeline)
7. [Submitter Incentive System](#7-submitter-incentive-system)
8. [Spam & Quality Prevention](#8-spam--quality-prevention)
9. [Auto Image Censorship](#9-auto-image-censorship)
10. [Monetization Strategy](#10-monetization-strategy)
11. [Early-Stage Funding & Runway](#11-early-stage-funding--runway)
12. [Marketing & Growth Strategy](#12-marketing--growth-strategy)
13. [Technical Architecture](#13-technical-architecture)
14. [Deployment & Infrastructure Costs](#14-deployment--infrastructure-costs)
15. [Implementation Roadmap](#15-implementation-roadmap)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Open Decisions](#17-open-decisions)

---

## 1. Overview & Vision

### The Product

A GeoGuessr-style geography guessing game built around user-submitted photos of Malaysian restaurants — where players compete to identify the restaurant name and location from a single image.

### Core Principle

Makan Guesser is a **two-sided platform.** Submitters capture and upload photos of restaurants, mamaks, kopitiams, hawker stalls, and warungs. Guessers are shown a photo and must identify the restaurant by name (multiple-choice or free-text) or by dropping a pin on a map. Photos are categorized upon upload — signature dishes, ambience, exteriors, table settings, staff uniforms, and menu signage — enabling category-gated game modes that test different dimensions of food knowledge.

### Why It Works

- **Cultural specificity is the moat.** No global competitor will accidentally build "guess the Malaysian restaurant from its tablecloth."
- **Zero API costs.** Unlike GeoGuessr ($23M revenue, but burdened by Google Maps API costs), Makan Guesser runs on user-generated photos. Content is free; costs are storage + bandwidth.
- **The content is inherently viral.** "Only real Malaysians can name this mamak" is TikTok-ready.
- **Monetization has two sides.** Consumers play free; businesses eventually pay for visibility. GeoGuessr only monetizes the consumer side.
- **The data asset appreciates.** A verified, geotagged, categorized database of 100,000+ Malaysian F&B venues with photos and engagement metadata is uniquely valuable.
- **Categories multiply gameplay depth.** A single restaurant generates up to 7 distinct guessable experiences — the dish, the decor, the exterior, the table setting, the menu, the staff, the vibe. Without categories, it's just one photo.

### Target Audience

- **Primary:** Malaysian mobile users, age 16–35, urban and suburban
- **Secondary:** Malaysian diaspora (nostalgia-driven engagement)
- **Tertiary:** Food tourists, Singapore market expansion

### Comparable Precedents

| Product | What They Do | Makan Guesser's Advantage |
|---|---|---|
| **GeoGuessr** | Global geography via Street View | We own Malaysian F&B. No API cost burden. |
| **Google Maps / Reviews** | Restaurant discovery utility | We're a game. Different user intent. Category-structured content. |
| **Burpple / Eatigo** | Restaurant deals + reviews | We drive engagement through play, not discounts. |
| **Food bloggers on TikTok/IG** | Restaurant content | We aggregate and gamify their content into a platform. |

---

## 2. Core Game Loop

### Guesser Flow

1. Open app → presented with a restaurant photo
2. Identify the restaurant (mode-dependent: multiple-choice, free-text autocomplete, or map pin)
3. Score calculated based on accuracy + speed
4. Results screen: score, streak, leaderboard movement, submitter credit, category tag
5. Next round or return to menu

### Submitter Flow

1. Visit a restaurant → snap a photo
2. Client-side face blur via ML Kit (automatic, on-device)
3. **Select category** — Signature Dish, Ambience, Exterior, Table Setting, Staff & Uniforms, Menu & Signage, or General
4. Select venue from autocomplete or suggest new
5. Upload → EXIF GPS auto-extracted → validation pipeline begins
6. Server-side: GPS validation + pHash dedup + quality gate + censorship check + AI category verification
7. If approved → enters playable pool, submitter earns XP
8. If flagged → enters moderation queue with feedback

### Scoring Model — Guesser

| Component | Value |
|---|---|
| **Correct name** (multiple-choice) | 100 points |
| **Correct name** (free-text, no autocomplete used) | 200 points |
| **Map pin accuracy** (bonus) | Up to 100 points, distance-decayed (0m = 100, >5km = 0) |
| **Speed multiplier** | 1.0x–2.0x based on response time vs. average for that photo |
| **Streak multiplier** | 1.0x–1.5x for consecutive correct answers |
| **Difficulty multiplier** | 1.0x–2.0x based on photo's historical guess accuracy rate |
| **Category multiplier** | 1.0x–1.5x for harder categories (Signature Dish = 1.5x, Exterior = 1.0x) |

### Scoring Model — Submitter

Total XP = (Base + Bonuses) × Streak Multiplier

| Component | Value | Anti-Abuse Logic |
|---|---|---|
| **Base** | 50 XP per approved photo | Must pass all validation gates |
| **Pioneer Bonus** | 200 XP if first-ever photo of this restaurant | Triggers once per restaurant, per lifetime |
| **Category Pioneer Bonus** | 100 XP if first photo of this category for this venue | Triggers once per venue-category pair |
| **Fresh Angle Bonus** | 30 XP if no similar photo exists (pHash < 85% match) | Incentivizes creative angles |
| **Coverage Gap Bonus** | 100 XP if restaurant is in a district with <10 total photos | Pushes submitters toward under-mapped areas |
| **Category Gap Bonus** | 50 XP if venue has <3 photos in this category | Incentivizes category diversity per venue |
| **Engagement Dividend** | 1 XP per guess played (capped at 200) | Rewards photos that are fun to guess |
| **Approval Streak** | 1.1x → 1.5x multiplier for consecutive approvals | Resets on any rejection |

---

## 3. Game Modes

### MVP (Launch)

| Mode | Description | Category Support |
|---|---|---|
| **Classic Guess** | Photo → multiple-choice (4 names) → score | All categories. Category diversity bias ensures mix. Category tag displayed on photo. |
| **Daily Challenge** | 5 fixed photos, everyone gets same set. Leaderboard ranked. | Curated mix of categories. Pre-selected at midnight + cached in Redis. |

### Phase 2

| Mode | Description | Category Support |
|---|---|---|
| **Free-Text Guess** | Photo → type restaurant name (autocomplete) → score | All categories |
| **Map Pin Drop** | Photo → pin exact location on map → distance-based score | All categories |
| **Signature Dish** | Close-up of food only. No signage, no decor, no context. Pure dish knowledge. | `signature_dish` only |
| **Ambience** | Interior shots only. Tests spatial memory — "I've sat in that corner booth." | `ambience` only |
| **District Royale** | 10 photos from 10 different restaurants in same district | All categories. Category diversity enforced. |

### Phase 3

| Mode | Description | Category Support |
|---|---|---|
| **Duels** | 1v1, identical photo, faster correct guess wins (HP-based) | All categories. Both players see same photo + category tag. |
| **Category Gauntlet** | 5-round structured sequence: Exterior → Ambience → Table Setting → Menu → Signature Dish. Progressive difficulty. Score multiplier increases each round. | Fixed sequence. One round per category. |
| **Cuisine Sprint** | 60-second timer, single cuisine type, as many correct as possible | All categories. Category displayed for context. |
| **Chain Challenge** | Photos from different outlets of same chain | All categories. `staff_uniforms` highlighted for chain identification. |

### Phase 4

| Mode | Description | Category Support |
|---|---|---|
| **Neighbourhood Bingo** | 9-square grid of nearby restaurants. Visit + snap all 9. | Must include 3 different categories. |
| **Restaurant Hunter** | Weekly hunt: 10 target restaurants needing photos. Specific category gaps highlighted. | Category-specific bounties. |
| **Photo Bounties** | Players post bounties on unmapped restaurants. Can specify category. | "500 XP for first table_setting photo of Restoran ABC" |
| **Team Duels** | 2v2 ranked with in-game chat | All categories |
| **Table Setting Challenge** | Pure tableware identification. Plates, cutlery, chili bottles, tissue holders. | `table_setting` only |

---

## 4. Photo Category System

### The Taxonomy

Every uploaded photo is assigned a primary category. Categories are mutually exclusive — one photo belongs to exactly one category. The default is `general`.

| Category | Slug | Definition | Example Game Mode |
|---|---|---|---|
| **Signature Dish** | `signature_dish` | Close-up of food or drink. The dish is the primary subject. | "Name the restaurant from this roti canai." |
| **Ambience** | `ambience` | Interior decor, lighting, wall art, furniture, overall vibe. No food as main subject. | "Which mamak has this distinctive tile pattern?" |
| **Exterior** | `exterior` | Building facade, signage, street-facing view, parking area. | "You've walked past this place 100 times. Name it." |
| **Table Setting** | `table_setting` | Plates, cutlery, glasses, chopsticks, tissue holder, chili sauce bottles — anything on the table surface. | "That blue-rimmed plate — which kopitiam?" |
| **Staff & Uniforms** | `staff_uniforms` | Staff attire, aprons, caps, name tags. Faces blurred by ML Kit. | "Which chain has servers in striped batik shirts?" |
| **Menu & Signage** | `menu_signage` | Physical menu, wall-mounted menu board, promotional banners, price lists. | "RM 6.50 for nasi lemak — this price point belongs to..." |
| **General** | `general` | Fallback. Doesn't fit any specific category or submitter is unsure. | Standard game modes. |

### Secondary Tags (Optional, Multiple Allowed)

Tags add metadata without defining a game mode. Some are extracted automatically.

| Tag | Source | Values |
|---|---|---|
| **Time of day** | Auto (EXIF timestamp) | Morning, afternoon, evening, late_night |
| **Crowded** | Submitter | Busy, moderate, quiet, empty |
| **Outdoor seating** | Submitter | Yes / No |
| **Self-service** | Submitter | Yes / No (visible counter ordering) |
| **TV visible** | Submitter | Yes / No (mamak with football screening) |
| **Historical** | Submitter | Pre-1990, heritage_status |

### Category Assignment — Three-Layer System

**Layer 1: Submitter Self-Selects (MVP)**

After capturing the photo, before venue selection, the submitter taps one category from a horizontal scroll:

```
[🍛 Signature Dish] [🪑 Ambience] [🏠 Exterior] [🍽️ Table Setting] [👔 Staff] [📋 Menu] [📷 General]
```

Selected chip highlights. Takes ~2 seconds. The photo preview is visible above the chips so the submitter sees the image while choosing.

**Layer 2: AI Auto-Tagging (Post-Launch)**

Server-side, `ProcessPhotoJob` calls Google Cloud Vision API with label detection. Labels map to categories:

```php
$labelToCategory = [
    'food'           => 'signature_dish',
    'dish'           => 'signature_dish',
    'cuisine'        => 'signature_dish',
    'plate'          => 'table_setting',
    'tableware'      => 'table_setting',
    'interior design'=> 'ambience',
    'restaurant'     => 'ambience',
    'building'       => 'exterior',
    'signage'        => 'menu_signage',
    'menu'           => 'menu_signage',
    'person'         => 'staff_uniforms',
    'uniform'        => 'staff_uniforms',
];

// If submitter category conflicts with AI with high confidence (>90%),
// flag for moderation but respect submitter choice by default
if ($submitterCategory !== $aiCategory && $aiConfidence > 0.9) {
    $photo->flagForReview('Category mismatch');
}
```

AI does not override the submitter. It flags mismatches for moderator review. Trust tiers apply — Curator submitters are never flagged; New submitters with frequent mismatches get auto-approval suspended.

**Layer 3: Community Correction**

After guessing, players see a "Wrong category?" flag option. N flags trigger category re-review. Same flag system as "Wrong restaurant" and "Not this location."

### Category-Gated Selection

When a game mode specifies a category, the candidate pool is filtered before weighting:

```sql
SELECT * FROM photos
WHERE status = 'approved'
  AND category = :modeCategory        -- 'signature_dish', 'ambience', etc.
  AND id NOT IN (SELECT photo_id FROM guesses WHERE guesser_id = :playerId)
  AND submitter_id != :playerId
LIMIT 200;
```

For mixed-category modes (Classic Guess, Daily Challenge), a category diversity bonus is applied:

```php
// Boost weight for categories the player has seen least in this session
$categoryDiversityMultiplier = match($photo->category) {
    'table_setting' => 3.0,   // never seen this session — push it
    'exterior'      => 1.8,   // seen once
    'ambience'      => 1.3,   // seen twice
    'signature_dish'=> 0.7,   // seen 8 times — deprioritize
    default         => 1.0,
};
```

This means a player doing 20 rounds naturally sees a mix of dish photos, ambience shots, exteriors, and table settings — without being explicitly told.

### Venue-Level Category Stats

```sql
CREATE VIEW venue_category_stats AS
SELECT
    venue_id,
    category,
    COUNT(*) as photo_count,
    AVG(avg_rating) as avg_category_rating,
    AVG(correctGuesses::float / NULLIF(totalGuesses, 0)) as category_accuracy
FROM photos
WHERE status = 'approved'
GROUP BY venue_id, category;
```

This powers:
- **Venue profile page:** "12 dish photos, 5 ambience, 2 exteriors. Most recognizable by: Signature Dish (72% accuracy)."
- **Submitter guidance:** When opening the camera at a venue, the app shows under-represented categories: "This venue needs: Table Setting, Menu & Signage."
- **Sponsorship pitch:** "Your Signature Dish photos have 68% guess accuracy vs. district average of 45%. Your plating is a branding asset."

---

## 5. Image Selection Algorithm

### Strategy Overview

The production system uses layered selection. No single strategy is sufficient. The system combines hard filters, a candidate pool cap, composite weighting, and mode-specific overrides.

### Layer 1: Hard Filters (Always Applied)

1. Status = `approved`
2. Censored URL exists
3. Not previously guessed by this player
4. Not submitted by this player
5. Not from a venue the player submitted (can't guess own restaurant)
6. If mode specifies a category → `WHERE category = :modeCategory`

### Layer 2: Candidate Pool Cap

Select 200 random candidates from the filtered pool. Prevents weighting computation from scanning millions of rows.

### Layer 3: Composite Weight

```
FinalWeight = freshness × quality × difficulty × stalenessProtection × categoryDiversity
```

| Component | Formula | Purpose |
|---|---|---|
| **Freshness** | `1.0 + 0.5 × max(0, 1 - ageDays/30)` | New photos get up to +50% boost, decaying over 30 days |
| **Quality** | `0.3 + 0.7 × avgRating/5.0` | 1-star = 0.44×, 5-star = 1.00× |
| **Difficulty** | `1.5` if 30–70% accuracy; `0.5` if <10%; else `1.0` | Sweet spot prioritized; impossible photos deprioritized |
| **Staleness protection** | `2.0` if totalGuesses < 10; else `1.0` | New submitters' photos get doubled weight. Prevents burial. |
| **Category diversity** | 0.7x–3.0x based on session category distribution | Ensures mixed-category modes show variety |

### Layer 4: Mode-Specific Overrides

| Mode | Override |
|---|---|
| **Daily Challenge** | Pre-selected at midnight via scheduled task. Cached in Redis for 24h. All players get identical set. |
| **Duels** | Both players see same photo. Selection excludes photos either player has seen. Pushed simultaneously via Reverb WebSocket. |
| **District Royale** | Hard filter `WHERE district = ?`. Composite weight applied within district. |
| **Category Gauntlet** | Fixed sequence: Exterior → Ambience → Table Setting → Menu → Signature Dish. No random selection. |
| **Signature Dish / Ambience** | Hard filter to specific category. Freshness weight doubled. |

### Evolution Roadmap

| Phase | Strategy |
|---|---|
| **MVP** (Week 1) | Seen-once exclusion + freshness decay + staleness protection. Three rules, <50ms query. |
| **Post-Launch** (Month 2) | Add quality weighting + category diversity. Requires rating data + session tracking. |
| **Scale** (Month 6+) | UCB bandit algorithm replaces composite weight. Mathematically optimal explore/exploit balance. |

---

## 6. Image Serving Pipeline

### Upload → Storage → Delivery

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT-SIDE (React Native)                                      │
│                                                                 │
│ Capture → ML Kit face blur → Select category → Select venue     │
│ → Compress to ~500KB JPEG → POST /api/photos (multipart)        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ LARAVEL API                                                     │
│                                                                 │
│ Validate GPS + venue → Store raw to R2 /raw/{id}.jpg            │
│ → INSERT photos (status='pending') → Dispatch ProcessPhotoJob   │
│ → Return 202 Accepted                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ ProcessPhotoJob (Laravel Queue)                                 │
│                                                                 │
│ Download raw → EXIF validate → pHash dedup → Laplacian blur     │
│ → Generate thumbnail 400px → Upload to R2:                      │
│   /censored/{id}.jpg (1920px)                                   │
│   /thumb/{id}.webp (400px)                                      │
│ → Update status='approved' or 'quarantined'                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ CensorPhotoJob (Laravel Queue) — Post-Launch                    │
│                                                                 │
│ Google Cloud Vision: Face + SafeSearch + OCR                     │
│ → Blur remaining faces → Blur license plates                    │
│ → If NSFW ≥ LIKELY: quarantine                                  │
│ → Re-upload censored version to /censored/{id}.jpg              │
│ → Update server_flags JSONB                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Storage Layout (Cloudflare R2)

| Path | Resolution | Format | Public? | Purpose |
|---|---|---|---|---|
| `/raw/{id}.jpg` | Original (up to 4K) | JPEG | No (signed URL) | Moderation, appeals |
| `/censored/{id}.jpg` | 1920px | JPEG | Yes | Primary gameplay image |
| `/thumb/{id}.webp` | 400px | WebP | Yes | Leaderboards, galleries, lobbies |

### CDN Layer (Cloudflare)

| Path | Cache TTL | Stale-while-revalidate |
|---|---|---|
| `/censored/*` | 30 days | 7 days |
| `/thumb/*` | 90 days | 30 days |
| `/raw/*` | None (always origin fetch with signed URL) | N/A |

Cache invalidation on: censored version updated, photo rejected/deleted. Origin server never serves static images — only API responses and WebSocket events.

### Delivery Timing (Per Play)

| Step | Target Latency |
|---|---|
| POST /play → candidate query + weighting + distractors | <50ms |
| Client receives JSON | <30ms |
| GET image from CDN (cached) | <50ms |
| **Tap → photo visible** | **<130ms** |
| POST /guess → score calculation + DB insert | <30ms |
| Response received | <30ms |
| **Guess → result** | **<60ms** |

---

## 7. Submitter Incentive System

### Design Principle

**Reward coverage, not volume.** A user submitting the first photo of 10 different rural warungs earns dramatically more than someone submitting 50 photos of the same famous mamak. Category diversity per venue is also rewarded.

### Badge System — Submitter Track

| Badge | Unlock Condition | Behavior Incentivized |
|---|---|---|
| **Pioneer** | First submission to any restaurant | Entry-level dopamine |
| **Cartographer** | First submissions to 10+ different restaurants | Coverage breadth |
| **Category Master** | First submission in 4+ different categories | Category diversity |
| **Venue Completionist** | Submitted all 7 categories for a single venue | Exhaustive venue documentation |
| **District Champion** | Most restaurants submitted in a single district | Territorial competition |
| **Explorer** | Submissions across 5+ different districts | Geographic diversity |
| **Lens Master** | Single photo surpasses 1,000 guesses played | Quality engagement |
| **Curator** | 10 photos with average 4+ star rating | Consistent quality |
| **Ghost Hunter** | First submission of a restaurant with zero online presence | True discovery |
| **Dish Detective** | 50 approved Signature Dish photos | Food expertise |

### Social & Visibility Incentives

- **In-game photo watermark:** "📸 @username" on every photo during gameplay
- **Submitter leaderboard:** Public, filterable by weekly/monthly/all-time, by district, by category
- **"First mapped by" tag:** Permanent attribution on restaurant profile pages
- **"Category pioneer" tag:** "First Table Setting photo of this venue — @username"
- **Featured Submitter of the Week:** Curated spotlight on home screen
- **Photo Bounty payouts:** Community-funded rewards for targeted submissions (Phase 4)

---

## 8. Spam & Quality Prevention

### Technical Gates (Automatic)

| Gate | Implementation |
|---|---|
| **EXIF GPS validation** | Photo GPS must be within 50m of claimed restaurant. Hard reject if missing. |
| **Perceptual hashing (pHash)** | Compare against all existing photos for same venue. Reject if >85% similarity. |
| **Blur/shake detection** | Laplacian variance threshold. Auto-reject below minimum sharpness. |
| **Minimum resolution** | Below 720p → auto-rejected |
| **Reverse image search** | Flag photos matching existing web images (Google Reviews, Instagram) |

### Velocity Gates (Automatic)

| Gate | Implementation |
|---|---|
| **Per-venue cooldown** | Same user cannot submit to same restaurant more than once per 7 days |
| **Per-category cooldown** | Same user cannot submit same category to same venue more than once per 30 days |
| **Per-user rate limit** | 20/day for new users, 50/day for trusted |
| **Cluster detection** | 5+ restaurants within 100m in <10 minutes → flagged for review |

### Trust Tiers (Progressive)

| Tier | Threshold | Privileges |
|---|---|---|
| **New** | 0–4 approved | All submissions to moderation queue. Max 20/day. |
| **Verified** | 5+ approved, 0 rejected | 50% auto-approved |
| **Trusted** | 50+ approved, <5% rejection | 90% auto-approved. Can flag other users' photos. |
| **Curator** | 200+ approved, manually promoted | Full auto-approval. Moderation panel access. |

### Community Gates (Social)

- **Post-guess rating:** 1–5 stars per photo. Low-rated photos deprioritized.
- **Flag system:** "Wrong restaurant," "Not this location," "Poor quality," "Inappropriate," "Wrong category." N flags trigger quarantine.
- **Photo decay:** Low-engagement photos naturally deprioritize over time. Soft cycle, not deletion.

---

## 9. Auto Image Censorship

### What Needs Censoring

| Target | Risk |
|---|---|
| **Human faces** | Privacy violation (PDPA 2010). Restaurant photos capture customers, staff, passersby. |
| **License plates** | Personally identifiable via JPJ. Street-facing shots capture parked cars. |
| **NSFW / explicit content** | Platform safety. App Store / Play Store rejection risk. |
| **Phone numbers** | Menu boards sometimes display personal numbers. |

### Architecture: Hybrid Client + Server

**Step 1 — Client-side (React Native, before upload):**
- `expo-face-detector` (Google ML Kit on-device) detects faces in real-time
- Gaussian blur applied to detected face regions immediately
- Blurred photo is what gets uploaded — raw uncensored photo never leaves the device
- **Cost:** $0. Catches ~85–90% of faces.

**Step 2 — Server-side (Laravel Queue, after upload):**
- `CensorPhotoJob` calls Google Cloud Vision API (single request):
  - **Face Detection:** catches missed faces
  - **SafeSearch:** NSFW detection (adult, violence, medical)
  - **Text Detection:** license plate pattern matching (`ABC 1234`)
- Blur remaining faces and plates
- If SafeSearch adult/violence ≥ LIKELY → quarantine
- **Cost:** $1.50 per 1,000 photos. First 1,000/month free.

### Cost Projection

| Volume (photos/month) | Server Cost |
|---|---|
| 500 (MVP) | $0 (free tier) |
| 3,000 (1,000 DAU) | $3.00 |
| 15,000 (5,000 DAU) | $21.00 |
| 60,000 (25,000 DAU) | $88.50 |

---

## 10. Monetization Strategy

### The Core Principle

**Never put the core game loop behind any barrier.** All monetization must be optional, additive, or invisible during gameplay. Malaysians have low willingness-to-pay for mobile apps. Any friction kills adoption at the viral stage.

### Consumer Revenue (Free-to-Play Tier)

| Source | Description | Impact on Gameplay |
|---|---|---|
| **Rewarded video ads** | Watch ad → 5 extra guesses, 2x XP, hint reveal, streak freeze | Player chooses. Never forced. |
| **Cosmetic IAP** | Category badges (RM 3.90), custom pin skins (nasi lemak pin, RM 1.90), profile frames (RM 2.90) | Pure status/personalization. No gameplay advantage. |
| **Ad removal IAP** | One-time purchase (RM 14.90) to remove all ads permanently | Anti-frustration, not pay-to-play. |
| **Affiliate deep links** | After correct guess: "Order from [Restaurant] on GrabFood" button. 3–8% commission. | Invisible to free players. Passive revenue. |

### Business Revenue (Post-Virality — Phase 3+)

| Tier | Price (RM/month) | Features |
|---|---|---|
| **Claimed Profile** | 29 | Photo curation, category highlights, menu, hours, Waze/Google Maps link, trending badge |
| **Sponsored Restaurant** | 99–299 | Daily challenge appearances, Restaurant of the Day, Chain Challenge mode, category analytics |
| **Platform Partnership** | Custom | GrabFood/Foodpanda deep links, tourism board food trails, F&B association festival challenges |

### The Data Asset (Year 2–3)

A verified, geotagged, categorized database of 100,000+ Malaysian F&B venues with photos and engagement metadata. Per-category recognizability scores per venue. Annual data license model: RM 5,000–50,000/year to delivery platforms, tourism boards, and marketing agencies.

### Revenue by Stage

| Stage | Key Sources | Monthly Runway |
|---|---|---|
| **Phase 1** (0–5,000 DAU) | Grants + symbolic ads/affiliates | ~RM 14,000 (grant-funded) |
| **Phase 2** (5k–25k DAU) | Grants + ads + affiliates + IAP | ~RM 13,000 (mix of grant + revenue) |
| **Phase 3** (25k–100k DAU) | Ads + affiliates + IAP + early sponsorships | ~RM 20,000 (self-sustaining) |

---

## 11. Early-Stage Funding & Runway

### Grant Funding Strategy (18-Month, Non-Dilutive)

| Phase | Source | Amount | Purpose |
|---|---|---|---|
| Month 1–3 | Personal funds | Self-funded | Build MVP |
| Month 3–6 | **Cradle CIP Spark** | **RM 150,000** | Full-time development, seeding, marketing, 18-month runway |
| Month 6–12 | **State tourism grant** (Penang/Selangor) | **RM 30,000** | State-specific content seeding and launch campaign |
| Month 12–18 | **MDEC Digital Content Grant** | **RM 50,000–100,000** | Singapore expansion, scaling infrastructure |

**Total non-dilutive funding: ~RM 230,000–280,000 across 18 months. Zero equity lost.**

### The 18-Month Runway Playbook

1. Build MVP with personal funds (Months 1–3)
2. Apply for Cradle CIP Spark during MVP build (2–4 month approval cycle)
3. Launch free — no paywalls — with rewarded ads only
4. Apply for state tourism grants once you have a working demo
5. Integrate GrabFood affiliate links from day one
6. Add cosmetic IAP at Month 3
7. Apply for MDEC grant at Month 6 with traction metrics
8. By Month 18 at 100,000 DAU: self-sustaining from ads + affiliates + cosmetics
9. **Then** introduce restaurant sponsorships — when you have the traffic to justify pricing

---

## 12. Marketing & Growth Strategy

### Phase 1: Pre-Launch Seeding

| Source | Target | Method |
|---|---|---|
| Manual curation | 150 iconic restaurants | Visit/pull photos for famous spots in KL, PJ, Penang, JB, Ipoh, Melaka |
| Power users | 200 restaurants from 30 early adopters | Recruit from r/malaysia, r/malaysianfood, foodie Twitter/X. Free lifetime Pro for 20 submissions. |
| Google Maps import | 150 restaurants | Public photos via Places API. Labeled "community contributed." Replaceable by user uploads. |

### Phase 2: Launch Channels

- **Reddit:** r/malaysia — "I built a game where you guess Malaysian restaurants from photos."
- **Twitter/X:** Malaysian foodie community. Direct outreach.
- **University ambassador program:** RM 50 + free Pro to campus ambassadors. 10 verified restaurants each. Target UM, Taylor's, Sunway, Monash, INTI.

### Phase 3: Viral Loops

- **"Your restaurant is on Makan Guesser"** — automated email/FB notification to businesses. Primary cold outreach funnel.
- **Food blogger partnerships:** 20 Malaysian food bloggers. Their reviews link to playable challenges.
- **TikTok-native content:** "Name this mamak from its table setting." Built into product via shareable result cards.
- **District leaderboard rivalry:** Public, competitive, inherently shareable.

### Phase 4: Institutional Partnerships

- **Tourism boards:** Food trail challenges (Penang Global Tourism, Tourism Selangor)
- **F&B associations:** Industry-wide challenges during food festivals
- **Delivery platforms:** GrabFood/Foodpanda post-guess deep links with revenue share

---

## 13. Technical Architecture

### Final Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend** | Laravel 11 + PostgreSQL (PostGIS) + Redis + Reverb | Single coherent backend. Queue-based photo processing (Horizon). WebSockets via Reverb for duels. Geospatial via PostGIS. |
| **Web App** | React + TanStack Router + TanStack Query + Vite | SPA game UI. Deployed as static assets. |
| **Mobile App** | React Native (Expo) + TanStack Query + React Navigation | 40–50% TypeScript shared with web via monorepo `packages/shared`. Native camera, map, ML Kit. |
| **Shared Package** | TypeScript monorepo (`packages/shared`) via Turborepo | Types, scoring logic, badge system, category definitions, API client — single source of truth. |
| **Photo Storage** | Cloudflare R2 | Zero egress fees. Critical for photo-heavy app. |
| **CI/CD** | GitHub Actions | Lint → test shared → build web → build mobile (Expo EAS local for dev, EAS cloud for App Store). |
| **Auth** | Laravel Fortify + Twilio (phone OTP) | ~$0.08 per OTP. Natural for Malaysian users. |

### Why This Stack

- **Supabase rejected.** Laravel gives full control over game logic, queue processing, and transactional operations.
- **NativePHP rejected.** WebView maps too slow for budget Malaysian Android phones.
- **Flutter rejected.** Code sharing with React web (40–50% TypeScript) outweighs Flutter advantages.
- **Vapor rejected.** Serverless Lambda cannot host persistent WebSocket connections for Reverb.

### System Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  packages/shared (TypeScript)                                 │
│  Types, scoring, badges, categories, API client               │
└─────────────────┬────────────────────────────────────────────┘
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
┌──────────────┐   ┌─────────────────────────────────────────┐
│ React Web    │   │ React Native (Expo)                      │
│ TanStack R   │   │ React Navigation + ML Kit (face blur)    │
│ Vite + Vercel│   │ Camera → Category Select → Upload        │
└──────┬───────┘   └──────────────────┬──────────────────────┘
       │                              │
       └──────────────┬───────────────┘
                      │ HTTPS + WebSocket
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                Laravel 11 Backend                             │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────────────────────┐  │
│  │ REST API          │  │ Laravel Reverb                   │  │
│  │ /photos, /venues, │  │ (duel state, leaderboards,       │  │
│  │ /guesses, /play   │  │  lobbies)                        │  │
│  └────────┬─────────┘  └──────────────────────────────────┘  │
│           │                                                  │
│  ┌────────▼─────────────────────────────────────────────┐    │
│  │              Laravel Queue (Horizon)                  │    │
│  │  ┌──────────────────┐  ┌────────────────────────────┐ │    │
│  │  │ProcessPhotoJob   │  │CensorPhotoJob               │ │    │
│  │  │EXIF, pHash, blur │  │Google Vision: faces, NSFW,  │ │    │
│  │  │AI category       │  │license plates, phones       │ │    │
│  │  │thumbnail gen     │  │                             │ │    │
│  │  └──────────────────┘  └────────────────────────────┘ │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────┬──────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────┐ ┌─────────┐ ┌──────────────┐
│PostgreSQL│ │  Redis  │ │ Cloudflare R2│
│+ PostGIS │ │         │ │ /raw/        │
│          │ │         │ │ /censored/   │
│          │ │         │ │ /thumb/      │
└──────────┘ └─────────┘ └──────────────┘
```

### Key Data Models

```
venues
├── id (UUID)
├── name (text, pg_trgm indexed for fuzzy search)
├── address (text)
├── location (PostGIS POINT, GiST indexed)
├── district (text, indexed)
├── venue_type (enum)
├── cuisine_tags (text[])
├── price_range (int, 1-3)
├── halal_status (enum)
├── claimed_by (FK → users, nullable)
├── first_submitted_by (FK → users)
├── created_at, updated_at

photos
├── id (UUID)
├── venue_id (FK → venues)
├── submitter_id (FK → users)
├── category (text, CHECK IN categories)
├── secondary_tags (text[])
├── auto_category (text)                         -- AI-inferred category
├── auto_category_confidence (float, 0.0-1.0)
├── category_flags (int DEFAULT 0)                -- community flags
├── censored_url (text)                           -- Public-facing
├── original_url (text)                           -- Raw, admin-only
├── thumbnail_url (text)
├── exif_gps (PostGIS POINT)
├── phash (text, indexed)
├── quality_score (float)
├── status (enum: pending, approved, quarantined, rejected)
├── client_censored (boolean)
├── server_flags (JSONB)                          -- {"faces": 3, "plates": 1, "nsfw": "VERY_UNLIKELY"}
├── needs_human_review (boolean)
├── total_guesses (int)
├── avg_rating (float)
├── correct_guesses (int)
├── created_at

guesses
├── id (UUID)
├── photo_id (FK → photos)
├── guesser_id (FK → users)
├── guessed_venue_id (FK → venues, nullable)
├── guessed_pin (PostGIS POINT, nullable)
├── actual_pin (PostGIS POINT)
├── distance_meters (float)
├── time_ms (int)
├── is_correct_name (bool)
├── score (int)
├── created_at

-- Indexes
CREATE INDEX idx_photos_status ON photos(status) WHERE status = 'approved';
CREATE INDEX idx_photos_category ON photos(category) WHERE status = 'approved';
CREATE INDEX idx_photos_venue_category ON photos(venue_id, category);
CREATE INDEX idx_photos_phash ON photos(phash);
```

---

## 14. Deployment & Infrastructure Costs

### Scenario A — Budget MVP (Hetzner + Self-Managed)

| Component | Provider | Monthly Cost |
|---|---|---|
| Laravel backend + Reverb | Hetzner CX32 (4 vCPU, 8 GB) | ~$13 |
| PostgreSQL + PostGIS | Self-managed on same VPS | $0 |
| Redis | Self-managed on same VPS | $0 |
| React web app | Cloudflare Pages | $0 |
| React Native builds | Expo Free + local builds | $0 |
| Photo storage | Cloudflare R2 | ~$1 |
| Censorship API | Google Cloud Vision (free tier) | $0 |
| Phone auth (OTP) | Twilio (~60 new users/month) | ~$5 |
| **TOTAL** | | **~$19/month (~RM 85)** |

### Scenario B — Growth (Managed + Semi-Managed)

| Component | Provider | Monthly Cost |
|---|---|---|
| Laravel backend + Reverb | Forge ($12) + DO Droplet 4GB ($24) | $36 |
| PostgreSQL + PostGIS | DO Managed PostgreSQL (2 GB) | $15 |
| Redis | DO Managed Redis (1 GB) | $15 |
| React web app | Vercel Pro | $20 |
| React Native builds | Expo Free + local builds | $0 |
| Photo storage | Cloudflare R2 | ~$5 |
| Censorship API | Google Cloud Vision | ~$3 |
| Phone auth (OTP) | Twilio (~500 new users/month) | ~$40 |
| **TOTAL** | | **~$134/month (~RM 600)** |

### Scenario C — Scale (Fully Managed)

| Component | Provider | Monthly Cost |
|---|---|---|
| Laravel backend | Laravel Cloud Production ($20 + ~$30 usage) | ~$50 |
| Reverb + DB + Redis | Laravel Cloud managed (included) | $0 |
| React web app | Vercel Pro | $20 |
| React Native builds | Expo EAS Production | $199 |
| Photo storage | Cloudflare R2 | ~$15 |
| Censorship API | Google Cloud Vision | ~$22 |
| Phone auth (OTP) | Twilio (~2,000 new users/month) | ~$160 |
| **TOTAL** | | **~$466/month (~RM 2,100)** |

### Hidden Costs

| Item | Cost |
|---|---|
| Apple Developer Program | $99/year |
| Google Play Console | $25 (one-time) |
| Domain name | ~RM 50–80/year |
| SSL certificates | Free (Let's Encrypt via Forge/Certbot) |

---

## 15. Implementation Roadmap

### Phase 0: Foundation (Weeks 1–4)

- [ ] PostgreSQL schema + PostGIS + category CHECK constraints
- [ ] Laravel API skeleton: venues CRUD, photo upload endpoint with category
- [ ] Laravel Fortify + Twilio phone auth
- [ ] React web app skeleton: TanStack Router + Query + Vite
- [ ] React Native skeleton: Expo + React Navigation + TanStack Query + ML Kit
- [ ] Turborepo monorepo: `packages/shared`, `packages/web`, `packages/mobile`
- [ ] Cloudflare R2 bucket configuration
- [ ] EXIF extraction module (Laravel)
- [ ] pHash generation + comparison module (Laravel)

### Phase 1: MVP Launch (Weeks 5–8)

- [ ] Photo upload flow: camera → ML Kit face blur → category select → venue select → upload
- [ ] Classic Guess mode: multiple-choice, 4 options, scoring, category tag display
- [ ] Daily Challenge: curated 5-photo set, category mix, Redis cached
- [ ] Image selection: seen-once exclusion + freshness decay + staleness protection
- [ ] Basic submitter XP (base + pioneer + category pioneer bonuses)
- [ ] All validation gates: EXIF GPS, pHash, blur detection, client-side face blur
- [ ] Trust tiers: New + Verified
- [x] Moderation queue (admin panel) — **Implemented via Filament v5 at `/admin`**. Provides CRUD for Users, Venues, Photos, and Guesses; photo approve/reject actions with XP awarding; admin-only access via `is_admin` flag. See `docs/decisions.md` (D12) and `docs/tech-stack.md`.
- [ ] Seed 150+ restaurants manually across all categories
- [ ] Launch on r/malaysia

### Phase 2: Engagement (Weeks 9–14)

- [ ] Free-Text Guess mode with autocomplete
- [ ] Map Pin Drop mode
- [ ] Signature Dish mode (category-gated)
- [ ] Ambience mode (category-gated)
- [ ] District Royale mode with category diversity
- [ ] Full badge system including Category Master, Venue Completionist, Dish Detective
- [ ] Category gap bonus + engagement dividend + fresh angle bonus
- [ ] Submitter leaderboards (by district, by category)
- [ ] In-game photo watermarks ("📸 @user")
- [ ] Post-guess rating + photo decay algorithm
- [ ] Google Cloud Vision: server-side censorship + AI category verification
- [ ] GrabFood affiliate deep link integration

### Phase 3: Competitive (Weeks 15–22)

- [ ] Duels (1v1, HP-based, Elo matchmaking, category tag in duels)
- [ ] Category Gauntlet mode (5-round fixed category sequence)
- [ ] Cuisine Sprint mode
- [ ] Team Duels
- [ ] Competitive divisions (Bronze → Champion)
- [ ] Professional subscription tier (RM 6.90/month) — only after significant free user base

### Phase 4: Business (Weeks 23–30)

- [ ] Claimed Business Profile (RM 29/month) with category analytics
- [ ] Sponsored Restaurant tier (RM 99–299/month)
- [ ] Chain Challenge mode with uniform category focus
- [ ] Business analytics dashboard with per-category recognizability data
- [ ] Restaurant Hunter mode with category-specific bounties
- [ ] Photo Bounty system (venue + category targets)

### Phase 5: Expansion (Month 8+)

- [ ] Tourism board partnerships
- [ ] Singapore market expansion
- [ ] Indonesia market research
- [ ] Aggregated insights data product (per-category recognizability scores)
- [ ] Live event mode (Ramadan bazaar, food festivals)

---

## 16. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Cold start — no photos** | Critical | Pre-seed 300+ restaurants across all categories; power user program; university ambassadors |
| **Category mislabeling** | Medium | Submitter self-select + AI verification + community flagging |
| **Category imbalance** (too many `general`, not enough niche) | Medium | Category gap bonus; venue-level "needs" display; category bounties |
| **Fake or wrong uploads** | High | EXIF GPS hard gate; pHash dedup; community flagging; trust tiers |
| **Low retention** | High | Daily Challenge + streaks + competitive Duels + category variety |
| **Photo copyright claims** | Medium | ToS assigns license to platform; takedown process; attribution |
| **Restaurant owners object** | Medium | Opt-out process; pitch Claimed Profile |
| **Privacy violations (faces, plates)** | High | Client ML Kit blur + server Google Vision + moderation queue |
| **NSFW uploads** | Medium | Google Vision SafeSearch; community flagging; App Store compliance |
| **Malaysian unwillingness to pay** | High | Never paywall core loop. Grants cover runway. Monetize via affiliates + ads + cosmetics. |
| **Competition** | Low | None are Malaysia-specific. Cultural + category specificity is the moat. |
| **Spam overwhelming moderation** | Medium | Progressive trust tiers; auto-approve trusted; community flagging; photo decay. |

---

## 17. Open Decisions

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | **Name** | Makan Guesser / Kedai Guesser / Jom Teka | **Makan Guesser** |
| 2 | **Guess mechanism MVP** | Multiple-choice / Free-text / Map pin / Hybrid | **Multiple-choice (4 options) + optional map pin bonus** |
| 3 | **MVP geographic scope** | KL + PJ / Klang Valley / Nationwide | **Klang Valley** |
| 4 | **Monetization approach** | Consumer Pro first / Business first / Grants + free-to-play | **Grants + free-to-play for 18 months.** No subscription until 50k+ DAU. |
| 5 | **Platform priority** | Mobile only / Web companion | **Mobile-first (React Native + Expo).** Web for leaderboards. |
| 6 | **Seed photo sourcing** | Manual only / Google Maps import / Both | **Both.** Manual 150 iconic; Maps import with "community contributed" label. |
| 7 | **Deployment starting point** | Scenario A ($19/mo) / Scenario B ($134/mo) | **Scenario A** for MVP. Migrate to B at 1,000+ DAU. |
| 8 | **Censorship at MVP** | Client-side only / Full hybrid | **Client-side ML Kit only.** Add Google Vision post-launch. |
| 9 | **Grant applications** | Cradle first / State first / Simultaneous | **Cradle CIP Spark first.** State tourism during MVP build. |
| 10 | **Categories at launch** | All 7 categories / Simplified 4 categories | **All 7 categories.** Category selection is a 2-second interaction. No reason to defer. |
| 11 | **AI category verification** | At MVP / Post-launch | **Post-launch (Phase 2).** AI labeling hits the same Vision API as censorship. Combine them. |

---

*This document is the living reference for Makan Guesser. Update it as decisions are made, architecture evolves, and milestones are reached.*
