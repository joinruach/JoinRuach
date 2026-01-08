# Formation Guidebook UI

## What This Is

A complete frontend implementation of the Formation Guidebook - the spiritual formation journey system for Ruach Platform. Users read teaching nodes, submit reflections via text or voice, receive AI analysis with depth scoring, and watch canon axioms unlock as they progress through 5 formation phases. This is the core formation experience that validates the entire AI analysis pipeline.

## Core Value

**If only one thing works perfectly, it must be this:** Users can submit a checkpoint reflection and receive reliable, accurate AI analysis that determines their readiness to progress - ensuring genuine spiritual formation rather than checkbox completion.

## Requirements

### Validated

(Existing codebase - from `.planning/codebase/` analysis)

- ✓ Next.js 16 App Router with Server Components - `apps/ruach-next/`
- ✓ Strapi v5 backend with 19 formation content types - `ruach-ministries-backend/`
- ✓ Formation Engine service (event sourcing) - `ruach-ministries-backend/src/services/`
- ✓ AI Sharpening service (Claude API integration) - existing
- ✓ BullMQ workers for async job processing - existing
- ✓ NextAuth v5 with anonymous user support - `apps/ruach-next/src/lib/auth.ts`
- ✓ Complete UI/UX design specifications - `docs/RUACH-PLATFORM-ROADMAP.md`
- ✓ TypeScript strict mode, ESLint, Vitest testing - existing standards

### Active

(Current implementation goals)

- [ ] Phase landing pages with teaching node grid (5 phases: Awakening, Separation, Discernment, Commission, Stewardship)
- [ ] Guidebook node reader with scripture reference overlays
- [ ] Checkpoint submission flow:
  - [ ] Text input with rich text editor
  - [ ] Voice dictation with real-time transcription
  - [ ] Word count tracker (minimum 50 words enforced)
  - [ ] Dwell timer (minimum 2 minutes enforced)
  - [ ] Submit button disabled until requirements met
- [ ] AI analysis integration:
  - [ ] Call Formation Engine API for depth scoring
  - [ ] Display quality metrics (specificity, honesty, alignment)
  - [ ] Show AI feedback and sharpening questions
  - [ ] Full routing logic (publish/journal/thread/review decisions)
- [ ] Canon axiom unlocking system:
  - [ ] Check prerequisites before unlock
  - [ ] Persist unlocked state across sessions
  - [ ] Display locked/unlocked visual states
- [ ] Progress dashboard:
  - [ ] Checkpoint completion tracking
  - [ ] Phase readiness scoring
  - [ ] Recent activity timeline
  - [ ] Next checkpoint preview
- [ ] Error handling and validation:
  - [ ] Clean validation messages
  - [ ] No duplicate submissions on retry
  - [ ] Partial failure recovery without state corruption
- [ ] Cross-session/device persistence via NextAuth sessions

### Out of Scope

- Living Scripture Stream UI — separate project, different timeline
- Iron Chamber UI — separate project, builds after Formation Guidebook proven
- Ministry Works Reader UI — separate project, different user flow
- Achievement badges, leaderboards, streak tracking — Phase 5 (Community Features), not MVP
- Cohort formation, mentorship matching, private messaging — Phase 5 (Community Features), not MVP
- Production hardening (rate limiting, monitoring, CDN) — Phase 4, comes after frontend complete

## Context

**Existing Infrastructure:**
- Complete Strapi v5 backend with 19 formation-related content types
- Formation Engine service using event sourcing (PostgreSQL event log)
- AI Sharpening service integrated with Claude API
- BullMQ workers for async job processing
- NextAuth v5 with anonymous user cookie-based sessions
- Ministry works pipeline validated end-to-end (1/50 books imported)
- Canonical library schema proven with pgvector embeddings

**Design Specifications:**
- Complete UI/UX design system documented in roadmap
- Typography: Cormorant Garamond (headers), Charter (body)
- Color palette: Warm whites, royal blues, sacred browns, phase-specific colors
- Component library defined: Reading cards, buttons, progress indicators
- Mobile adaptations specified for all breakpoints

**Technical Context:**
- pnpm monorepo with Turbo orchestration
- TypeScript 5.3.3 strict mode
- Next.js 16 with App Router (Server Components default)
- Tailwind CSS 3.4.10 for styling
- Vitest 4.0.8 for testing
- 1,935-line `strapi.ts` API client exists (needs refactoring but works)

**Known Issues to Address:**
- XSS vulnerabilities via `dangerouslySetInnerHTML` (7 instances) - must sanitize
- Formation prerequisite validation stubbed (TODO comments) - must implement
- Like button persistence unimplemented - not blocking Formation Guidebook
- Minimal test coverage (10 test files for 318+ TS files) - improve as we build

## Constraints

- **Architecture:** Must use existing Next.js 16 App Router patterns (Server Components, server actions, middleware)
- **API Integration:** Must use existing Strapi v5 endpoints and Formation Engine API
- **Authentication:** Must work with NextAuth v5 anonymous user sessions
- **Design System:** Must follow documented UI/UX specifications (typography, colors, components)
- **Code Quality:** TypeScript strict mode, no `any` types, ESLint rules, functions ≤50 lines
- **Testing:** Add tests for all new features (80% coverage goal on business logic)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build Formation Guidebook before other UIs | Most critical user journey; validates AI analysis pipeline | — Pending |
| Include full feature set (voice, routing, unlocking) | Complete implementation proves pattern for future features | — Pending |
| Focus on individual journey only | Defer community features to Phase 5; ship core experience first | — Pending |
| Use existing 1,935-line strapi.ts despite size | Refactoring is separate concern; client works and is stable | — Pending |
| Address XSS vulnerabilities during implementation | Security fixes integrated with feature work | — Pending |

---
*Last updated: 2026-01-08 after initialization*
