# Tracking Issue: Cleanup Closeout

## 0) Announce & Align (Today)
- [ ] Post the Slack blurb (from Executive Summary / Communication Templates) and link the doc.
- [ ] Name DRIs per workstream (Admin/Routes/Migrations/Frontend/SEO). Confirm EOW target in-thread.
- [ ] Open a single tracking issue with the checklists below pasted verbatim.

## 1) Lock the House (Permissions + Routes)

**Admin Labels & Permissions — Content Lead + Strapi Admin**
- [ ] Rename collections in Strapi admin with status suffixes: "... (legacy)" or "... (read-only)" per Status Overview.
- [ ] Roles: Public stays read-only on approved endpoints; Editors cannot create/update/delete paused and legacy types.
- [ ] Acceptance: Non-admins can’t create/edit paused/legacy entries; labels visible in admin sidebar.

**Close Public Routes — Backend Eng**
- [ ] In `src/api/**/routes`, disable or lock public endpoints for Article, Audio File, Gallery, Testimonial, Trending Video, Reply.
- [ ] Keep Video routes open only as required for legacy UI (read-only).
- [ ] Acceptance: Hitting closed endpoints returns 404/403 in staging and prod. No unexpected access in logs.

## 2) Canonical Content Flow (Train + Enforce)

**Set the Source of Truth — Product + Eng + Content**
- [ ] Media Item = active (create/manage here).
- [ ] Video = read-only + sync until legacy UI retires.
- [ ] Blog Post becomes canonical for public blog; Article remains paused.
- [ ] Acceptance: Doc language, admin labels, and team onboarding all match this policy.

## 3) Backfills, Constraints, Indexes (Data Hygiene)

**Run Backfill Script — Backend Eng**
- [ ] Execute: `pnpm strapi console --file scripts/backfill-slugs-and-defaults.ts`.
  - Fills type, slug, featured=false, releasedAt (Media Item).
  - Generates missing slugs for Category, Tag, Speaker, Course, Event, Lesson, Video, Blog Post.
  - Populates Image altText (fallback “Description pending”).
- [ ] Acceptance: Script is idempotent; drafts republish cleanly; no duplicated UIDs.

**Apply DB Constraints/Indexes — DBA/Backend**
- [ ] Enforce UID uniqueness; add indexes (per Schema Requirements & Indexes):
  - `media_item(slug UNIQUE, type, releasedAt, category)`.
  - `video(slug UNIQUE, createdAt, trending_video)`.
  - FK indexes for joins and high-traffic filters.
- [ ] Acceptance: Duplicate slug publish fails; query plans show index usage.

## 4) Frontend Requests (Smaller, Faster)

**Replace Deep Populate — Frontend Eng**
- [ ] Update fetches to use minimal `fields[]`/`populate[]` (see API Contract examples).
- [ ] Ensure `/media` and detail pages read from Media Item responses only.
- [ ] Acceptance: Payloads shrink; no missing props; TTFB improves on `/media` vs before.

## 5) Migrations (With Guardrails)

**A) Video → Media Item — Backend Eng + Content QA**
1. [ ] Freeze Video edits (read-only for editors).
2. [ ] Sync essential fields (slug, title, thumbnail, taxonomy, source) → Media Item via script.
3. [ ] Verify `/api/media-items/:id/view` increments and that the UI reads from Media Item responses.
4. [ ] Schedule a cron or manual sync until legacy video pages migrate, then retire the Video type.
- [ ] Acceptance: Legacy UI still works; new UI uses Media Item; counters increment.

**B) Article → Blog Post — Backend Eng + Content**
1. [ ] Export Article drafts for safekeeping.
2. [ ] Import records into the Blog Post schema and regenerate unique UID slugs.
3. [ ] Re-link categories/tags and attach featured images sized for Open Graph usage.
4. [ ] Hide Article in admin and close public routes.
- [ ] Acceptance: Blog pages load with complete OG tags; no public Article routes.

## 6) SEO & Global (Consistent Cards Everywhere)

**Validate SEO Fallbacks — Marketing + Frontend**
- [ ] Ensure Global single type is complete (siteName/Description/defaultSeo).
- [ ] Treat Setting as legacy until header migration, then archive.
- [ ] Acceptance: OG previews render with title/description/image across blog & media.

## 7) Performance & Safety Switches (Config)
- [ ] Disable auto deep populate (`defaults.populateDepth = 1`).
- [ ] Enforce `fields[]` usage, enable short-TTL caching with publish/unpublish purge.
- [ ] Confirm CORS only allows production domains; keep rate limits on public routes.
- [ ] Acceptance: Config present in codebase; smoke tests pass; no accidental wide populates.

## 8) Testing (Staging → Prod)

**Functional — QA/Everyone**
- [ ] Create a Media Item → appears on `/media`; detail loads; `/view` increments.
- [ ] Attempt non-admin Article create → blocked.
- [ ] Closed routes (`/api/testimonials`) → 404/403.
- [ ] Blog Post page: OG tags complete.

**Data — QA/DBA**
- [ ] Duplicate slug publish → blocked by unique index.
- [ ] New image upload → altText required/backfilled.

**Performance — QA/FE/BE**
- [ ] Compare payload & TTFB before/after populate changes.
- [ ] Confirm DB plans use indexes (releasedAt, type, category).

## 9) Risks, Rollback, Guardrails (Pre-flight)
- [ ] Risk: Route closures break legacy pages. Guardrail: Keep Video read-only with required routes open until the new UI replaces them.
- [ ] Risk: New uniqueness stops publishes. Guardrail: Run backfill first; surface admin lint tips for slugs.
- [ ] Rollback: Revert route-closure commit, temporarily relax permissions, and restore latest DB backup.

## 10) Definition of Done (Sign-off)
- [ ] Admin shows correct (legacy)/(read-only) labels; permissions enforced.
- [ ] Closed routes are 404/403 in all envs.
- [ ] Backfill + migrations succeed; unique indexes live; zero dupes.
- [ ] Frontend uses minimal populate patterns; reads Media Item.
- [ ] Video→Media Item & Article→Blog Post migrations complete; content served from canonicals.
- [ ] SEO cards good; QA passes staging + production.
- [ ] Content, Backend, Frontend leads sign off in the PR.
