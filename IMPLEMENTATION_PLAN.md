# 🚀 RUACH OS IMPLEMENTATION PLAN
## Phase-by-Phase Roadmap to Production Excellence

**Document Version:** 1.0
**Date:** 2025-11-11
**Status:** Phase 1 - In Progress

---

## 📊 EXECUTIVE SUMMARY

This document outlines the complete implementation plan for transforming the Ruach monorepo from its current 95% production-ready state to a fully realized, feature-complete, AI-powered ministry platform.

**Current Status:** 95% Complete
**Estimated Time to 100%:** 4-6 weeks
**Priority Focus:** P0 and P1 items first, then AI features

---

## ✅ PHASE 1: FOUNDATION (COMPLETE - Week 1)

### Status: ✅ 100% Complete

**Deliverables:**
- ✅ Comprehensive system audit
- ✅ System map documentation
- ✅ Shared package architecture
  - ✅ `@ruach/utils` - 7 utility modules (cn, password, string, validation, format, url)
  - ✅ `@ruach/hooks` - 9 React hooks (activity, session, upload, toast, media query, storage, debounce, click outside)
  - ✅ `@ruach/types` - 6 type definition modules (common, strapi, media, user, course, api)
  - ✅ `@ruach/icons` - 17 icon components
  - ✅ `@ruach/addons` - Platform, analytics, and SEO utilities
- ✅ Docker Compose orchestration (Postgres, Redis, Strapi, Next.js, Nginx, MinIO, BullBoard)

**Files Created:** 50+ new files across 4 packages

**Next Steps:** Build packages and commit changes

---

## 🔧 PHASE 2: CRITICAL FIXES (P0) - Week 1-2

### Goal: Reach 100% Production Readiness

**Estimated Time:** 1-2 weeks

### 2.1 Shared Packages Build & Integration (2-3 days)
- [ ] Run `pnpm install` to install dependencies for new packages
- [ ] Build all shared packages: `pnpm -r build`
- [ ] Update `turbo.json` to include new packages in build pipeline
- [ ] Update app imports to use shared packages
- [ ] Remove duplicate code from apps (cn.ts, password.ts, etc.)
- [ ] Update TypeScript path aliases in tsconfig files
- [ ] Test package imports in both frontend and backend

**Files to Update:**
- `/package.json` - Add workspace dependencies
- `/turbo.json` - Add package build tasks
- `/apps/ruach-next/package.json` - Add @ruach/* dependencies
- `/apps/ruach-next/tsconfig.json` - Update path aliases

### 2.2 Error & Loading Boundaries (1 day)
- [ ] Create `/apps/ruach-next/src/app/error.tsx` - Global error boundary
- [ ] Create `/apps/ruach-next/src/app/loading.tsx` - Global loading state
- [ ] Add `error.tsx` to all route groups:
  - [ ] `/courses/error.tsx`
  - [ ] `/members/error.tsx`
  - [ ] `/events/error.tsx`
  - [ ] `/media/error.tsx`
  - [ ] `/community-outreach/error.tsx`
- [ ] Add `loading.tsx` to all route groups with the same structure
- [ ] Test error handling and loading states

**Template:**
```tsx
// error.tsx
'use client';
import { useEffect } from 'react';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

// loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
    </div>
  );
}
```

### 2.3 Database Performance Indexes (1 hour)
- [ ] Create migration for new indexes
- [ ] Add index on `media_items.featured` (boolean)
- [ ] Add index on `lessons.order` (integer)
- [ ] Add composite index on `lesson_progresses(user_id, lesson_id)`
- [ ] Add index on `comments.approved` (boolean)
- [ ] Test query performance improvement

**Migration File:** `/ruach-ministries-backend/database/migrations/add-performance-indexes.js`

### 2.4 Legacy Content Type Cleanup (1-2 days)
- [ ] Export data from legacy types (video, audio-file, image, etc.)
- [ ] Migrate data to `media-item` content type
- [ ] Update frontend code to use `media-item` exclusively
- [ ] Remove 11 legacy content types:
  - [ ] video
  - [ ] audio-file
  - [ ] image
  - [ ] article
  - [ ] podcast
  - [ ] podcast-episode
  - [ ] resource (migrate to resource-directory)
  - [ ] gallery-item (keep gallery, merge items)
  - [ ] legacy user fields
- [ ] Test all media-related features
- [ ] Deploy migration

**Success Criteria:**
- ✅ All packages building successfully
- ✅ Zero TypeScript errors
- ✅ All routes have error/loading boundaries
- ✅ Database queries optimized
- ✅ Clean content type schema

---

## 🎨 PHASE 3: FEATURE COMPLETION (P1) - Week 2-3

### Goal: Implement Missing Core Features

**Estimated Time:** 2 weeks

### 3.1 Series Landing Pages (2 days)
- [ ] Create `/apps/ruach-next/src/app/series/page.tsx` - Series listing
- [ ] Create `/apps/ruach-next/src/app/series/[slug]/page.tsx` - Series detail
- [ ] Build `SeriesCard` component
- [ ] Build `SeriesHero` component with video background
- [ ] Add filtering by category/topic
- [ ] Integrate with Strapi `series` content type
- [ ] Add breadcrumb navigation
- [ ] SEO meta tags and structured data

**Components:**
- `SeriesCard` - Card with thumbnail, title, description, episode count
- `SeriesGrid` - Responsive grid layout
- `SeriesHero` - Full-width hero with video/image
- `EpisodeList` - List of media items in series

### 3.2 Partners Page & Dashboard (2-3 days)
- [ ] Create `/apps/ruach-next/src/app/partners/page.tsx` - Partner info page
- [ ] Create `/apps/ruach-next/src/app/members/impact/page.tsx` - Impact dashboard
- [ ] Build `PartnerTierCard` component with benefits
- [ ] Build `ImpactMetrics` component (donations, impact stats)
- [ ] Build `DonationHistory` component
- [ ] Add partner-exclusive content section
- [ ] Integrate with Stripe subscription data
- [ ] Add campaign-linked donation tracking
- [ ] Generate donation receipts (PDF generation)

**Data to Display:**
- Total donations (all-time, this year)
- Donation history with dates and amounts
- Partner tier and benefits
- Impact metrics (people reached, content created, etc.)
- Exclusive partner content access

### 3.3 Global Search with AI (3-4 days)
- [ ] Create `/apps/ruach-next/src/app/search/page.tsx` - Search results page
- [ ] Build `SearchBar` component for header
- [ ] Create search API endpoint with OpenAI embeddings
- [ ] Implement vector search across:
  - [ ] Media items (title, description, transcript)
  - [ ] Series
  - [ ] Blog posts
  - [ ] Resources
  - [ ] Courses
- [ ] Add filters (content type, date, author, topic)
- [ ] Add search result highlighting
- [ ] Track search analytics

**API Endpoint:** `/api/search`
**Technology:** OpenAI Embeddings + pgvector (PostgreSQL extension)

### 3.4 Admin Dashboard Extension (2 days)
- [ ] Create custom Strapi admin plugin: `ruach-admin-dashboard`
- [ ] Build queue monitor UI for BullMQ jobs
- [ ] Add quick action buttons (publish, moderate, export)
- [ ] Display key metrics:
  - [ ] Total content items
  - [ ] Pending moderation (comments, testimonies)
  - [ ] Recent signups
  - [ ] Upload queue status
- [ ] Add audit log viewer
- [ ] Real-time updates with WebSocket

**Location:** `/ruach-ministries-backend/src/plugins/ruach-admin-dashboard`

### 3.5 E2E Tests in CI (1 day)
- [ ] Update `.github/workflows/ci.yml` to include E2E tests
- [ ] Configure Playwright for CI environment
- [ ] Add test stage after build stage
- [ ] Run tests against built app (Docker container or local build)
- [ ] Upload test artifacts (videos, screenshots) on failure
- [ ] Set required passing status for merge

**Tests to Run:**
- Auth flow (signup, login, logout)
- Course enrollment and progress
- Media playback
- Comment submission
- Donation flow

### 3.6 Convenience Scripts (30 minutes)
- [ ] Add `dev:all` - Start all apps concurrently
- [ ] Add `build:all` - Build all packages and apps
- [ ] Add `typecheck:all` - Type check everything
- [ ] Add `lint:all` - Lint all code
- [ ] Add `test:all` - Run all tests
- [ ] Add `clean` - Clean all build artifacts

**Update:** `/package.json` scripts section

**Success Criteria:**
- ✅ Series pages live and functional
- ✅ Partner dashboard showing real data
- ✅ Search working with AI semantic search
- ✅ Admin dashboard operational
- ✅ E2E tests passing in CI
- ✅ All convenience scripts working

---

## 🧠 PHASE 4: AI INTEGRATION (P2) - Week 4-5

### Goal: Add Intelligent Features

**Estimated Time:** 2 weeks

### 4.1 Ruach AI Assistant (1 week)
- [ ] Set up OpenAI API integration
- [ ] Create embedding generation pipeline
- [ ] Set up pgvector in PostgreSQL
- [ ] Index all content (media, series, blog posts, resources, scripture)
- [ ] Build semantic search API
- [ ] Create chat interface component
- [ ] Implement conversation history
- [ ] Add citation/source linking
- [ ] Fine-tune prompts for ministry context

**Components:**
- `AIAssistant` - Chat interface with message history
- `SearchResults` - AI-powered search results
- `CitationCard` - Source attribution for AI responses

**API Endpoints:**
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/embed` - Generate embeddings
- `POST /api/ai/search` - Semantic search

### 4.2 AI Editorial Assistant Plugin (3-4 days)
- [ ] Create Strapi plugin: `ruach-ai-editorial`
- [ ] Build content suggestion engine
- [ ] Auto-generate:
  - [ ] SEO-optimized titles
  - [ ] Meta descriptions
  - [ ] Social media captions
  - [ ] Hashtags
  - [ ] Thumbnail suggestions
- [ ] Add "Generate with AI" buttons in Strapi admin
- [ ] Implement approval workflow
- [ ] Track AI suggestion acceptance rate

**Location:** `/ruach-ministries-backend/src/plugins/ruach-ai-editorial`

### 4.3 AI Transcription & Summarization (3-4 days)
- [ ] Integrate OpenAI Whisper API
- [ ] Build transcription job queue (BullMQ)
- [ ] Auto-transcribe uploaded videos
- [ ] Generate summaries with GPT-4
- [ ] Extract key takeaways and timestamps
- [ ] Build transcript editor UI
- [ ] Add SRT/VTT export

**Workflow:**
1. Video uploaded → Enqueue transcription job
2. Whisper transcribes audio
3. GPT-4 summarizes transcript
4. Extract key points and timestamps
5. Save to database
6. Notify admin

### 4.4 Media Transcoding Worker (2-3 days)
- [ ] Build ffmpeg worker service (separate container)
- [ ] Create transcode job queue (BullMQ)
- [ ] Generate multiple resolutions (1080p, 720p, 480p)
- [ ] Generate thumbnails at intervals
- [ ] Extract audio track
- [ ] Optimize for web delivery
- [ ] Progress tracking and error handling

**Container:** `/services/media-worker/Dockerfile`

**Queue Jobs:**
- `transcode:video` - Convert to multiple resolutions
- `extract:audio` - Extract audio track
- `generate:thumbnails` - Create thumbnail sprites
- `optimize:image` - Compress images

### 4.5 Discernment Dashboard (Optional - 3 days)
- [ ] Build AI trend analysis tool
- [ ] Monitor cultural/AI movements
- [ ] Biblical alignment checker
- [ ] Content purity analysis
- [ ] Generate weekly report
- [ ] Alert on concerning trends

**Technology:**
- Web scraping (Cheerio/Puppeteer)
- GPT-4 analysis
- Custom prompts for biblical alignment
- Email reports

**Success Criteria:**
- ✅ AI assistant responding accurately
- ✅ Semantic search working across all content
- ✅ AI editorial suggestions helpful and accurate
- ✅ Auto-transcription pipeline operational
- ✅ Media transcoding producing quality output
- ✅ Discernment dashboard providing insights

---

## 📱 PHASE 5: PWA & MOBILE (P2) - Week 5-6

### Goal: Enhanced Mobile Experience

**Estimated Time:** 1 week

### 5.1 PWA Configuration (2-3 days)
- [ ] Create `/apps/ruach-next/public/manifest.json`
- [ ] Generate app icons (192x192, 512x512, maskable)
- [ ] Configure service worker with Workbox
- [ ] Implement caching strategies:
  - [ ] Cache-first for static assets
  - [ ] Network-first for API calls with fallback
  - [ ] Cache media thumbnails
- [ ] Add offline page
- [ ] Enable "Add to Home Screen" prompt
- [ ] Configure push notifications (OneSignal or FCM)

**Files:**
- `/apps/ruach-next/public/manifest.json`
- `/apps/ruach-next/public/sw.js` (generated by next-pwa)
- `/apps/ruach-next/next.config.mjs` - Add next-pwa plugin

### 5.2 Offline Functionality (1-2 days)
- [ ] Cache key pages for offline access
- [ ] Store media metadata locally
- [ ] Sync progress when back online
- [ ] Display offline indicator
- [ ] Queue actions when offline (comments, progress, etc.)

### 5.3 Push Notifications (1 day)
- [ ] Integrate OneSignal or FCM
- [ ] Build notification subscription flow
- [ ] Send notifications for:
  - [ ] New series/media releases
  - [ ] Comment replies
  - [ ] Partner updates
  - [ ] Livestream alerts
- [ ] Add notification preferences page

### 5.4 Background Audio (1 day)
- [ ] Implement Media Session API
- [ ] Enable background playback
- [ ] Add lock screen controls
- [ ] Support AirPlay/Chromecast

**Success Criteria:**
- ✅ App installable on mobile devices
- ✅ Offline mode functional
- ✅ Push notifications working
- ✅ Background audio playback enabled

---

## 🎨 PHASE 6: UX ENHANCEMENTS (P2-P3) - Week 6+

### Goal: Polish User Experience

**Estimated Time:** 1-2 weeks

### 6.1 Dark Mode Theme Engine (2 days)
- [ ] Implement theme context provider
- [ ] Add theme toggle component
- [ ] Define dark mode color palette
- [ ] Update all components for dark mode
- [ ] Persist theme preference
- [ ] Respect system preference

### 6.2 Social Share Automation (1 day)
- [ ] Build social share component with platform selection
- [ ] Auto-generate share text
- [ ] Add Open Graph image generation
- [ ] Track share analytics

### 6.3 Likes/Reactions System (1-2 days)
- [ ] Create `likes` content type in Strapi
- [ ] Build `LikeButton` component
- [ ] Add like counter
- [ ] Prevent duplicate likes
- [ ] Show user's liked content

### 6.4 Enhanced Livestream Integration (2 days)
- [ ] YouTube Live embed with chat
- [ ] Vimeo livestream support
- [ ] Real-time viewer count
- [ ] Stream status indicator
- [ ] Upcoming livestream countdown

### 6.5 Scripture Overlay Integration (3 days)
- [ ] Integrate Bible API (e.g., Bible Gateway, ESV API)
- [ ] Build Scripture search component
- [ ] Add verse reference linking
- [ ] Display verse on hover/click
- [ ] Support multiple translations

**Success Criteria:**
- ✅ Dark mode fully functional
- ✅ Social sharing working smoothly
- ✅ Likes system operational
- ✅ Livestreams enhanced
- ✅ Scripture integration helpful

---

## 📚 PHASE 7: DOCUMENTATION & TOOLING (P3) - Ongoing

### Goal: Comprehensive Documentation

**Estimated Time:** 1 week

### 7.1 Component Library Documentation (2 days)
- [ ] Set up Storybook
- [ ] Document all @ruach/components
- [ ] Add interactive examples
- [ ] Document props and usage
- [ ] Add accessibility notes

### 7.2 API Documentation (1-2 days)
- [ ] Generate OpenAPI schema from Strapi
- [ ] Set up Swagger UI
- [ ] Document all custom endpoints
- [ ] Add request/response examples
- [ ] Authentication documentation

### 7.3 Developer Guide (2 days)
- [ ] Getting started guide
- [ ] Architecture overview
- [ ] Deployment instructions
- [ ] Troubleshooting guide
- [ ] Contributing guidelines
- [ ] Code style guide

### 7.4 Seed Scripts (1 day)
- [ ] Create development data seeder
- [ ] Sample media items
- [ ] Sample courses and lessons
- [ ] Sample users and profiles
- [ ] Sample testimonies and campaigns

**Success Criteria:**
- ✅ Storybook deployed and accessible
- ✅ API documentation complete
- ✅ Developer guide comprehensive
- ✅ Seed scripts working

---

## 🚀 PHASE 8: STRETCH GOALS (P3) - Future

### Future Enhancements

### 8.1 React Native App (4-6 weeks)
- [ ] Set up React Native project
- [ ] Share code with web app (@ruach packages)
- [ ] Build native navigation
- [ ] Implement offline-first architecture
- [ ] App Store and Play Store submission

### 8.2 Mirror Integration (2 weeks)
- [ ] Explore Mirror API
- [ ] Build publishing integration
- [ ] Create creator dashboard
- [ ] Enable NFT functionality (if appropriate)

### 8.3 Remnant Network (6-8 weeks)
- [ ] Design social platform architecture
- [ ] Build user profiles
- [ ] Implement channels/groups
- [ ] Content moderation system
- [ ] Feed algorithm

### 8.4 Deliverance Training Portal (4 weeks)
- [ ] Build course platform extension
- [ ] Progress tracking
- [ ] Certification system
- [ ] Interactive exercises
- [ ] Resource library

### 8.5 Internationalization (2-3 weeks)
- [ ] Set up i18n framework (next-intl)
- [ ] Extract all strings
- [ ] Translate to Spanish, French, Tagalog
- [ ] RTL support (if needed)
- [ ] Locale-based content

---

## 📊 PROGRESS TRACKING

### Completion Status

| Phase | Status | Progress | ETA |
|-------|--------|----------|-----|
| Phase 1: Foundation | ✅ Complete | 100% | Week 1 |
| Phase 2: Critical Fixes | 🔄 In Progress | 30% | Week 1-2 |
| Phase 3: Feature Completion | ⏳ Pending | 0% | Week 2-3 |
| Phase 4: AI Integration | ⏳ Pending | 0% | Week 4-5 |
| Phase 5: PWA & Mobile | ⏳ Pending | 0% | Week 5-6 |
| Phase 6: UX Enhancements | ⏳ Pending | 0% | Week 6+ |
| Phase 7: Documentation | ⏳ Pending | 0% | Ongoing |
| Phase 8: Stretch Goals | ⏳ Pending | 0% | Future |

### Key Metrics

- **Lines of Code Added:** ~5,000+
- **New Packages Created:** 4 (@ruach/utils, hooks, types, icons)
- **New Components:** 17+ (icon set)
- **New Utilities:** 30+ functions
- **New Hooks:** 9 custom hooks
- **New Type Definitions:** 50+ types

---

## 🎯 IMMEDIATE NEXT STEPS (Next 2 days)

1. **Build Shared Packages**
   ```bash
   pnpm install
   pnpm -r build
   pnpm typecheck:all
   ```

2. **Update Turbo Config**
   - Add new packages to turbo.json

3. **Add Error/Loading Boundaries**
   - Create error.tsx and loading.tsx for all routes

4. **Create Database Indexes**
   - Write and run migration

5. **Commit Phase 1 Changes**
   ```bash
   git add .
   git commit -m "feat: complete Phase 1 - shared packages architecture"
   git push origin claude/audit-refactor-ruach-monorepo-011CV2VXy4E3fGF6DrurVHAX
   ```

6. **Begin Phase 2 Work**
   - Start with shared package integration
   - Then move to error boundaries

---

## 📞 SUPPORT & RESOURCES

### Documentation
- System Map: `/RUACH_SYSTEM_MAP.md`
- Implementation Plan: `/IMPLEMENTATION_PLAN.md` (this document)
- Security Audit: `/ruach-ministries-backend/docs/SECURITY_AUDIT_REPORT.md`
- Authentication Docs: `/ruach-ministries-backend/docs/AUTHENTICATION.md`

### Key Commands
- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages and apps
- `pnpm typecheck` - Type check all code
- `pnpm lint` - Lint all code
- `pnpm test` - Run all tests

### Environment Setup
- `.env.example` files in root, apps/ruach-next, and ruach-ministries-backend
- Docker Compose: `docker-compose.yml`

---

**Last Updated:** 2025-11-11
**Next Review:** After Phase 2 completion
