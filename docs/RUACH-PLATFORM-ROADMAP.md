# Ruach Formation Platform - Complete Roadmap

**Project:** Ruach Ministries Formation Platform
**Vision:** Scripture + AI-Sharpened Insights + Formation Journey
**Status:** Infrastructure Complete, Content Population Phase

---

## 🎯 Executive Summary

The Ruach Platform integrates three powerful systems:

1. **Living Scripture Stream (LSS)** - 103-book YahScriptures translation with reading modes
2. **Iron Chamber** - AI-sharpened margin reflections with community validation
3. **Formation Engine** - Event-sourced spiritual formation journey with gated unlocking

**Architecture:** Strapi v5 (CMS) + PostgreSQL (event store) + Redis (BullMQ) + Claude API (AI) + Next.js 16 (frontend)

---

## ✅ Phase 1: Foundation (COMPLETE)

### Infrastructure Built
- ✅ Strapi v5 backend operational
- ✅ PostgreSQL database configured
- ✅ Redis + BullMQ queue system
- ✅ Next.js 16 frontend (App Router)
- ✅ NextAuth v5 with anonymous user support
- ✅ Digital Ocean deployment pipeline

### Strapi Content Types (17 schemas)

**YahScriptures (8 types):**
- scripture-work, scripture-book, scripture-verse
- scripture-token, scripture-lemma, scripture-alignment
- scripture-theme, glossary-term

**Iron Chamber (4 types):**
- iron-insight, insight-vote
- margin-reflection, living-commentary

**Formation Engine (5 types):**
- formation-phase, guidebook-node, canon-axiom, canon-release
- formation-event (existing), formation-journey (existing), formation-reflection (existing)

### Services Implemented
- ✅ Formation Engine service (event sourcing)
- ✅ AI Sharpening service (Claude API integration)
- ✅ BullMQ worker processes (async jobs)
- ✅ Formation Engine API (5 endpoints)
- ✅ Iron Chamber API (7 endpoints)

### Scripts Created
- ✅ YahScriptures PDF extraction (Python)
- ✅ Strapi import script (TypeScript)
- ✅ Supports all 103 books (66 canonical + 37 Apocrypha)

**Location:** `docs/FORMATION-ENGINE-IMPLEMENTATION.md`

---

## 🔄 Phase 2: Content Population (IN PROGRESS)

### Scripture Data Extraction
```bash
# Status: Running extraction now
python extract-yahscriptures.py yahscriptures.pdf output/
python extract-yahscriptures.py Apocrypha.pdf output/
```

**Expected Output:**
- 103 scripture-work records
- ~31,000 scripture-verse records
- Paleo-Hebrew divine names preserved

### Import to Strapi
```bash
export STRAPI_API_TOKEN=your_token_here
pnpm tsx import-to-strapi.ts output/
```

**Timeline:** 1-2 hours for extraction + import

### Formation Content Authoring

**Phase Nodes to Create (5 phases):**
1. Awakening (8-10 nodes)
2. Separation (8-10 nodes)
3. Discernment (10-12 nodes)
4. Commission (10-12 nodes)
5. Stewardship (12-15 nodes)

**Canon Axioms to Define:**
- Covenant foundations (10-15 axioms)
- Kingdom theology (10-15 axioms)
- Holiness and sanctification (8-12 axioms)
- Redemption and grace (8-12 axioms)
- Ecclesiology and eschatology (10-15 axioms)

**Canon Releases (Gated Content):**
- Advanced teachings (5-10 releases)
- Prophetic insights (3-5 releases)
- Strategic vision (3-5 releases)

**Timeline:** 4-6 weeks of content writing

**Location:** Strapi Admin → Content Manager

---

## 🚀 Phase 3: Frontend Integration (NEXT)

### Living Scripture Stream UI
```
Features to Build:
├── Scripture browser (by book, chapter)
├── Search functionality (full-text + thematic)
├── Reading modes:
│   ├── Canonical (straight through)
│   ├── Thematic (by theme tags)
│   └── Spirit-led (random meaningful passage)
├── Paleo-Hebrew divine name display
└── Verse sharing and bookmarking
```

**Timeline:** 2-3 weeks

### Formation Guidebook UI
```
Features to Build:
├── Phase landing pages (5 phases)
├── Guidebook node reader (teaching content)
├── Checkpoint submission flow
│   ├── Reflection prompt display
│   ├── Text/voice input
│   ├── Dwell timer (minimum 2 min)
│   ├── Word count tracker (minimum 50 words)
│   └── AI analysis feedback
├── Progress dashboard
│   ├── Checkpoints completed
│   ├── Reflections submitted
│   ├── Days in phase
│   ├── Current readiness level
│   └── Unlocked content
└── Canon axiom library (unlocked)
```

**Timeline:** 3-4 weeks

### Iron Chamber UI
```
Features to Build:
├── Margin reflection submission
│   ├── Verse context display
│   ├── Reflection editor (rich text)
│   ├── Submit for AI sharpening
│   └── Routing status (publish/journal/thread/review)
├── Published insights feed
│   ├── Filterable by theme
│   ├── Sortable by vote score
│   ├── Depth score badges
│   └── Teaching moments display
├── Insight voting interface
│   ├── Helpful / Profound / Needs Work
│   ├── Optional comment
│   └── Privilege check (Discernment+ phase)
├── Living Commentary viewer
│   ├── Curated wisdom by verse
│   ├── Multiple commentary types
│   ├── Contributor attribution
│   └── Source insight links
└── Thread discussions (routed insights)
```

**Timeline:** 4-5 weeks

**Total Frontend Timeline:** 9-12 weeks

---

## 🔒 Phase 4: Production Hardening (LATER)

### Security & Performance
- [ ] Rate limiting on all public API endpoints
- [ ] Input sanitization and validation (Zod schemas)
- [ ] Redis persistence configuration
- [ ] Claude API retry logic and fallbacks
- [ ] CDN setup for scripture assets
- [ ] Database query optimization and indexing

### Monitoring & Observability
- [ ] BullBoard dashboard (queue monitoring)
- [ ] Sentry error tracking
- [ ] Analytics integration (PostHog or similar)
- [ ] Log aggregation (Datadog or similar)
- [ ] Uptime monitoring (UptimeRobot)

### Data Integrity
- [ ] Automated database backups
- [ ] Event log backup strategy
- [ ] State recomputation testing
- [ ] Migration rollback procedures
- [ ] Data validation scripts

**Timeline:** 2-3 weeks

---

## 🌟 Phase 5: Community Features (FUTURE)

### Enhanced Collaboration
- [ ] User profiles with formation badges
- [ ] Cohort formation (automatic grouping)
- [ ] Thread discussions on insights
- [ ] Private messaging between users
- [ ] Formation mentorship matching

### Advanced AI Features
- [ ] Personalized reading recommendations
- [ ] Progress prediction and pacing guidance
- [ ] Comparative analysis (user vs. phase average)
- [ ] Teaching moment curriculum generation
- [ ] Automated insight synthesis (weekly digests)

### Gamification (Optional)
- [ ] Achievement system (badges)
- [ ] Streak tracking (daily engagement)
- [ ] Leaderboards (by phase, by insights)
- [ ] Challenges and collaborative goals

**Timeline:** 6-8 weeks

---

## 📊 Current Status Dashboard

### ✅ Completed (Phase 1)
- Strapi backend: 100%
- Database schema: 100%
- Formation Engine service: 100%
- AI Sharpening service: 100%
- BullMQ workers: 100%
- API endpoints: 100%
- Extraction scripts: 100%
- Anonymous user system: 100%

### 🔄 In Progress (Phase 2)
- Scripture extraction: **RUNNING NOW**
- Scripture import: 0% (pending extraction)
- Formation content authoring: 0%
- Canon axiom definitions: 0%

### ⏳ Upcoming (Phase 3)
- Frontend UI development: 0%

---

## 🗂️ Documentation Index

### Technical Documentation
- **FORMATION-ENGINE-IMPLEMENTATION.md** - Complete architecture guide (13KB)
- **formation-strapi-schema.md** - Original Strapi schema design (7.4KB)
- **scripture-extraction/README.md** - Extraction script usage
- **scripture-extraction/EXTRACTION_GUIDE.md** - Apocrypha support guide

### Development Standards
- **TYPESCRIPT_STANDARDS.md** - TypeScript coding standards (14KB)
- **TESTING.md** - Testing guidelines (9.6KB)
- **100-PERCENT-COVERAGE-IMPLEMENTATION.md** - Coverage strategy (14KB)

### Infrastructure Guides
- **DIGITALOCEAN_SPACES_SETUP.md** - Media storage setup (8.9KB)
- **TROUBLESHOOTING_BUILD_BUCKET.md** - Build troubleshooting (4.4KB)

---

## 🚦 Decision Points

### Immediate Decisions Needed
1. ✅ Scripture extraction approach (DECIDED: Running now)
2. ⏳ Formation content authoring workflow (Who writes? How?)
3. ⏳ Canon axiom prioritization (Which doctrines first?)
4. ⏳ UI/UX design direction (Mockups needed?)

### Strategic Decisions (Future)
1. Mobile app vs. PWA vs. responsive web
2. Subscription model vs. free + donations
3. Community moderation approach (AI + human curators?)
4. Localization strategy (languages beyond English?)

---

## 📈 Success Metrics

### Phase 2 (Content) Success Criteria
- [ ] 103 scripture works imported
- [ ] ~31,000 verses searchable
- [ ] 50+ formation nodes authored
- [ ] 50+ canon axioms defined
- [ ] 10+ canon releases created

### Phase 3 (Frontend) Success Criteria
- [ ] Users can read scripture seamlessly
- [ ] Users can enter covenant and submit reflections
- [ ] AI analysis routes insights correctly
- [ ] Progress tracking accurate across sessions
- [ ] Anonymous users persist via cookies

### Phase 4 (Production) Success Criteria
- [ ] 99.9% uptime
- [ ] < 200ms API response time (p95)
- [ ] Zero data loss in event log
- [ ] AI analysis < 5s per reflection
- [ ] Queue processing < 1 min latency

---

## 🔗 Key Resources

### Code Repositories
- **Monorepo Root:** `/Users/marcseals/Developer/ruach-new/ruach-monorepo`
- **Strapi Backend:** `ruach-ministries-backend/`
- **Next.js Frontend:** `apps/ruach-next/`
- **Formation Package:** `packages/ruach-formation/`

### API Endpoints (Local)
- Strapi Admin: `http://localhost:1337/admin`
- Formation API: `http://localhost:1337/api/formation/*`
- Iron Chamber API: `http://localhost:1337/api/iron-chamber/*`
- Scripture API: `http://localhost:1337/api/scripture-*`

### Production URLs (When Deployed)
- Frontend: `https://joinruach.org`
- API: `https://api.joinruach.org`
- Admin: `https://api.joinruach.org/admin`

---

## 🎉 Next Immediate Steps

1. **Monitor scripture extraction** (running now)
2. **Run Strapi import** (once extraction completes)
3. **Verify data integrity** (check verse counts, Paleo-Hebrew preservation)
4. **Start formation content authoring** (Awakening phase first)
5. **Design frontend mockups** (Living Scripture Stream priority)

---

**Last Updated:** December 28, 2024
**Version:** 1.0.0
**Status:** Infrastructure Complete, Content Population In Progress

**🔥 The foundation is rock-solid. Now we build on it!**
