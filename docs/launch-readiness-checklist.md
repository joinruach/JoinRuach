# Pre-Launch Readiness Checklist

> **Status:** Draft
> **Author:** Forge Dev Intelligence
> **Date:** 2026-02-26
> **Target Domain:** `joinruach.org`

---

## Infrastructure

- [ ] PostgreSQL 15 + pgvector verified (`SELECT * FROM pg_extension WHERE extname = 'vector'`)
- [ ] Redis 7 with AOF persistence enabled
- [ ] Database backups scheduled (pg_dump cron or managed provider auto-backup)
- [ ] R2 bucket created with credentials set (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`)
- [ ] CDN configured for R2 (`R2_PUBLIC_DOMAIN` set, HTTPS enforced)
- [ ] SSL certificates valid for `joinruach.org` + `www.joinruach.org`
- [ ] DNS pointing to DigitalOcean App Platform
- [ ] Health check responding at `/api/health` (DO polls every 30s)
- [ ] BullMQ queues reachable (render-jobs, media-transcoding, formation-state)

---

## Security

- [ ] All secrets 32+ chars, cryptographically random
- [ ] Zero secrets in git history (audit with `git log --all -S "sk_live"` etc.)
- [ ] HTTPS enforced on all production endpoints
- [ ] Rate limiting active on public endpoints
- [ ] CORS allows only `joinruach.org` origins
- [ ] Stripe webhook signature verification active
- [ ] `COOKIE_SECURE=true` (`__Host-` prefix requires HTTPS)
- [ ] Auth policies on all POST/PUT/DELETE routes

---

## Environment Variables

### Frontend — REQUIRED

- [ ] `NEXTAUTH_SECRET` — 32+ char random string
- [ ] `NEXTAUTH_URL=https://joinruach.org`
- [ ] `NEXT_PUBLIC_STRAPI_URL` — Backend API base URL
- [ ] `STRAPI_REVALIDATE_SECRET` — Matches backend revalidation config
- [ ] `STRIPE_SECRET_KEY` — Must start with `sk_live_*`
- [ ] `STRIPE_WEBHOOK_SECRET` — From Stripe dashboard webhook config

### Frontend — OPTIONAL

- [ ] `OPENAI_API_KEY` — For AI assistant features
- [ ] `ANTHROPIC_API_KEY` — For AI assistant features
- [ ] `NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true` — Feature flag
- [ ] `NEXT_PUBLIC_RECOMMENDATIONS_ENABLED=true` — Feature flag
- [ ] `NEXT_PUBLIC_ORG_EIN` — For donation receipts
- [ ] `NEXT_PUBLIC_TRANSPARENCY_UPDATED` — Display date for transparency page

### Backend — REQUIRED

- [ ] `DATABASE_CLIENT=postgres`
- [ ] `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_NAME` / `DATABASE_USERNAME` / `DATABASE_PASSWORD`
- [ ] `DATABASE_SSL=true`
- [ ] `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`
- [ ] `JWT_SECRET` — 32+ char random string
- [ ] `ADMIN_JWT_SECRET` — 32+ char random string (different from JWT_SECRET)
- [ ] `APP_KEYS` — Comma-separated, 32+ char each
- [ ] `API_TOKEN_SALT` — 32+ char random string
- [ ] `TRANSFER_TOKEN_SALT` — 32+ char random string

### Backend — OPTIONAL

- [ ] `R2_*` — Cloudflare R2 file storage credentials
- [ ] `REMOTION_*` — Lambda rendering configuration
- [ ] `YOUTUBE_*` — YouTube social publishing credentials
- [ ] `FACEBOOK_*` — Facebook social publishing credentials
- [ ] `LOGTAIL_SOURCE_TOKEN` — Structured logging ingestion

---

## Stripe

- [ ] Webhook endpoint registered: `https://joinruach.org/api/stripe/webhook`
- [ ] Test event sent → 200 response confirmed
- [ ] Price IDs in env vars match Stripe dashboard
- [ ] Billing portal accessible with correct return URL
- [ ] End-to-end verified: checkout → webhook fires → user role updated → portal access granted

---

## Observability

- [ ] Structured JSON logging active (Winston + correlation IDs)
- [ ] Correlation IDs included in response headers (`X-Correlation-ID`)
- [ ] Error alerting configured (Logtail pipeline or manual monitoring plan)
- [ ] Health check monitoring active (DigitalOcean or external uptime monitor)
- [ ] Queue depth visible to operators (BullBoard or equivalent)

---

## Smoke Tests

### Authentication
- [ ] Login → JWT issued → protected route returns 200
- [ ] Logout → protected route returns 401
- [ ] Token refresh → new JWT issued without re-login prompt

### Payments
- [ ] Stripe checkout → webhook fires → user role updated in database
- [ ] Billing portal → subscription management works

### Content
- [ ] Content CRUD via Strapi REST API (create, read, update, delete)
- [ ] Semantic search returns relevant results for test query
- [ ] AI assistant responds with contextual answer

### Studio
- [ ] Media ingestion: upload → queued → processing → complete
- [ ] Publishing: queue job → appears in `listJobs` response
- [ ] FCP XML export → valid XML (parseable by Final Cut Pro)

---

## Chaos Scenarios (Required)

> These are **intentional failure tests**. Each must be executed and pass before launch sign-off.

### Stripe Failure
- [ ] Disable webhook endpoint → checkout completes → webhook fails → retry succeeds when re-enabled
- [ ] Send malformed webhook payload → 400 response, no state change, correlation ID logged

### Redis Outage
- [ ] Stop Redis → API remains responsive (degraded, no caching) → Restart Redis → queues resume
- [ ] Verify no data loss in BullMQ jobs after Redis restart

### Render Timeout
- [ ] Simulate Lambda timeout (60s render on 15s timeout) → job transitions to `failed` → auto-retry triggers → dead-letter after 3 failures
- [ ] Verify temp files cleaned up after timeout

### Corrupt Input
- [ ] Upload 0-byte file → `failed` status, meaningful error message, no crash
- [ ] Upload non-media file (.zip renamed to .mp4) → `failed` status, FFprobe error logged
- [ ] Submit malformed JSON to API → 400 response, Zod validation error returned

### Database Pressure
- [ ] Run 50 concurrent API requests → no connection pool exhaustion → all return within 5s

### Brownout Drill (Timed — 15 minutes)
- [ ] Artificially set render queue depth >500 (throttle workers or inject dummy jobs)
- [ ] Verify: non-essential endpoints return HTTP 503 + `Retry-After: 300`
- [ ] Verify: operator-initiated critical render still enqueues and completes
- [ ] Verify: formation events still process (separate queue, unaffected)
- [ ] Remove artificial load → system returns to normal mode without manual DB surgery or restarts
- [ ] Total drill duration: ≤15 minutes from injection to full recovery

---

## Observability Proof (Required)

> Demonstrate **one complete end-to-end trace** before launch sign-off.

- [ ] **Full trace documented:** User action → API request (correlation ID) → BullMQ job enqueued → worker picks up job → render executes → R2 upload → completion event → status update → operator notification
- [ ] Correlation ID appears in every log entry across the trace
- [ ] Trace is reproducible using only log search (no debugger required)

---

## Golden Proof Runs (Required)

> Deterministic operations must produce **identical outputs for identical inputs**. Pin the expected results. If they change, it forces a conscious version bump — not a silent drift.

### Golden Render Run
- [ ] **Input:** Known test EDL (`__fixtures__/golden-render-input.edl`) + known media files
- [ ] **Expected:** Output metadata hash matches pinned value in `__fixtures__/golden-render-expected.json`
- [ ] **Verified:** Run twice → identical output hash both times
- [ ] **Artifact:** `golden-render-expected.json` checked into repo with `{ hash, dimensions, duration, codec, lufs }`

### Golden Assembly Run
- [ ] **Input:** Known sync offsets (`__fixtures__/golden-assembly-offsets.json`) + known energy matrix
- [ ] **Expected:** Deterministic EDL cut list matches pinned value in `__fixtures__/golden-assembly-expected.json`
- [ ] **Verified:** Run twice → identical cut list (same angles, same timestamps, same confidence scores)
- [ ] **Artifact:** `golden-assembly-expected.json` checked into repo with `{ cuts, totalDuration, cameraAngles }`

### Golden Formation Run
- [ ] **Input:** Known event log slice (`__fixtures__/golden-formation-events.json`)
- [ ] **Expected:** `replayFormationEvents()` produces state matching `__fixtures__/golden-formation-state.json`
- [ ] **Verified:** Run twice → identical `FormationState` (same score, same phase, same privileges)
- [ ] **Artifact:** `golden-formation-state.json` checked into repo with `{ phase, readinessLevel, score, unlockedNodes }`

### Verification Script
- [ ] `scripts/ci/golden-run-verify.sh` runs all three, compares hashes, exits non-zero on mismatch
- [ ] Script runs in CI on every PR that touches `src/features/render/`, `src/lib/studio/`, or `src/features/formation/`

---

## Failure Recovery

### Ingestion Failure
- [ ] Corrupt file upload → status transitions to `failed`
- [ ] Retry of failed job → processes successfully
- [ ] Correlation ID present in error logs for tracing

### Render Failure
- [ ] Cancel mid-processing → status transitions to `cancelled`
- [ ] Temp files cleaned up after cancellation
- [ ] Session not stuck in processing state

### Auth Failure
- [ ] Expired JWT → 401 response
- [ ] Refresh token flow → new JWT without re-login

### Payment Failure
- [ ] Replay Stripe webhook → idempotent handling (no double-charge, no role toggle)

---

## Sign-Off

| Area | Verified By | Date | Build / Commit SHA |
|------|------------|------|--------------------|
| Infrastructure | | | |
| Security | | | |
| Environment Variables | | | |
| Stripe Integration | | | |
| Observability | | | |
| Smoke Tests | | | |
| Failure Recovery | | | |
| Chaos Scenarios | | | |
| Brownout Drill | | | |
| Observability Proof | | | |
| Golden Proof Runs | | | |

---

## Go / No-Go Rubric

> Launch is a binary decision, not a feeling. All five must be true.

| # | Condition | Status |
|---|-----------|--------|
| 1 | All 5 chaos scenarios pass without manual intervention | ☐ |
| 2 | End-to-end observability trace captured and documented (user action → render → R2 → completion → notification) | ☐ |
| 3 | All 3 golden proof runs produce expected hashes (render, assembly, formation) | ☐ |
| 4 | Replay recovery verified: kill a render worker mid-job → job resumes on restart → artifact delivered | ☐ |
| 5 | Formation event replay produces identical state on two consecutive runs from the same event log | ☐ |
| 6 | Brownout drill completes: load shed activates at >500 depth, critical renders survive, system self-recovers ≤15min | ☐ |

**Result:**
- **6/6 pass → GO.** Launch approved.
- **Any fail → NO-GO.** Fix the failing condition. Do not negotiate.

**Launch approved:** ☐ Yes ☐ No
**Approved by:** _______________
**Commit SHA:** _______________
**Date:** _______________
