# Ruach Monorepo - Comprehensive Technical Review & Enhancement Plan

**Review Date:** November 10, 2025
**Reviewer:** Claude (Anthropic)
**Scope:** Full-stack monorepo architecture, backend CMS, frontend platform, shared packages, security, and infrastructure
**Kingdom Focus:** Technical excellence for God's glory, secure stewardship of media and data

---

## Executive Summary

The Ruach Monorepo is a **well-architected, production-grade ministry platform** with strong foundations in modern web technologies. The system successfully powers a full ecosystem for testimonies, courses, livestreams, and resource publishing.

### Overall Health Score: **7.2/10**

**Key Strengths:**
- ✅ Modern Next.js 15 App Router with excellent SSR/ISR implementation
- ✅ Robust authentication with JWT rotation and refresh token security
- ✅ Comprehensive Strapi v5 CMS with 42 content types
- ✅ Strong rate limiting and security practices
- ✅ Cloudflare R2 media delivery with CDN optimization
- ✅ Well-structured monorepo with Turborepo orchestration
- ✅ Comprehensive CI/CD pipeline to DigitalOcean

**Critical Issues Requiring Attention:**
- 🔴 **P0:** Shared packages have broken barrel exports (nothing actually exported)
- 🔴 **P0:** 18 components duplicated between package and app
- 🔴 **P0:** Backend has 11 paused/legacy content types causing schema bloat
- 🔴 **P0:** Denormalized relations in lesson-comment and comment-report
- 🟡 **P1:** Missing critical database indexes (media-item.featured, lesson.order)
- 🟡 **P1:** Media type fragmentation (5 overlapping types)
- 🟡 **P1:** No loading.tsx or error.tsx boundaries in Next.js

---

## Table of Contents

1. [Architecture Review](#1-architecture-review)
2. [Backend / CMS Analysis](#2-backend--cms-analysis)
3. [Frontend / Platform Review](#3-frontend--platform-review)
4. [Shared Packages Audit](#4-shared-packages-audit)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Performance & Caching](#6-performance--caching)
7. [Security Audit](#7-security-audit)
8. [Media & R2 Configuration](#8-media--r2-configuration)
9. [Stripe & Partner Subscriptions](#9-stripe--partner-subscriptions)
10. [Recommended Fixes (Prioritized)](#10-recommended-fixes-prioritized)
11. [Enhanced Code Samples](#11-enhanced-code-samples)
12. [Future Upgrades](#12-future-upgrades)

---

## 1. Architecture Review

### Monorepo Structure

```
ruach-monorepo/
├── apps/
│   └── ruach-next/                 # Next.js 15 frontend (125 files)
├── packages/
│   ├── ruach-components/           # UI library (31 components) ⚠️ Broken exports
│   ├── ruach-next-addons/          # Utilities ⚠️ Broken exports
│   └── tailwind-preset/            # Design tokens
├── ruach-ministries-backend/       # Strapi v5 CMS (184 files, 42 content types)
├── types/                          # Shared TypeScript definitions
└── [Infrastructure files]
```

### Technology Stack

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| **Frontend** | Next.js | 15.5.2 | ✅ Latest |
| **Backend** | Strapi | 5.30.1 | ✅ Latest |
| **Database** | PostgreSQL | Latest | ✅ Production-ready |
| **Cache** | Redis + Upstash | Latest | ✅ Configured |
| **Media** | Cloudflare R2 | - | ✅ CDN-enabled |
| **Auth** | NextAuth.js | 4.24.7 | ✅ Secure |
| **Payments** | Stripe | 16.9.0 | ✅ Webhook-ready |
| **Build** | Turborepo | 2.1.3 | ✅ Optimized |
| **Package Manager** | pnpm | 9.12.0 | ✅ Workspaces |
| **TypeScript** | TypeScript | 5.9.2 | ✅ Strict mode |

### Build & Deployment

**Build Orchestration:**
- Turborepo with dependency-aware task execution
- Incremental TypeScript builds with `.tsbuildinfo`
- Parallel dev mode with `--parallel` flag
- Proper cache configuration for `dist/`, `.next/`, `build/` outputs

**CI/CD Pipeline:**
- ✅ Lint & Type Check (10 min timeout)
- ✅ Jest unit tests with Codecov
- ✅ Frontend + Backend Docker builds
- ✅ Security scanning (`pnpm audit`)
- ✅ Auto-deploy to DigitalOcean App Platform
- ✅ Vercel deployment support

**Issues:**
- ⚠️ Limited test coverage despite infrastructure (only 2 test files)
- ⚠️ No E2E tests running in CI (Playwright configured but not used)
- ⚠️ Node memory limits hardcoded in scripts (4096MB, 3072MB)

---

## 2. Backend / CMS Analysis

### Content Type Architecture

**Total: 42 Content Types** across 45 API endpoints

#### Active Content Types (31)

**Media & Content (5):**
- `media-item` ⭐ Primary unified media type with social publishing
- `blog-post` ✅ Active blog content
- `series` ✅ Groups related media
- `project` ✅ Video projects
- `trending-video` ✅ Read-only metrics

**Courses & Learning (4):**
- `course`, `lesson`, `lesson-comment`, `lesson-progress`

**Community Outreach (5):**
- `outreach-campaign`, `outreach-story`, `volunteer-signup`, `testimony`, `prayer`

**Events & Engagement (2):**
- `event`, `faq`

**Taxonomy (5):**
- `category`, `tag`, `speaker`, `author`, `channel`

**Team & People (2):**
- `team-member`, `user-profile`

**Form Submissions (4):**
- `contact-submission`, `contact-message`, `reply`, `comment-report`

**Site Configuration (6 single types):**
- `global`, `resource-directory`, `community-outreach-page`, `video-hero`, `stat`, + 2 legacy

#### Paused/Legacy Types (11) 🔴

Should be removed:
- `video` (legacy, use media-item)
- `audio-file` (paused, use media-item)
- `image` (redundant with media library)
- `article` (paused, replaced by blog-post)
- `testimonial` (paused, different from testimony)
- `gallery` (paused)
- `reply` (orphaned)
- `about`, `contact-info`, `hero-section`, `setting` (legacy single types)

### Critical Schema Issues

#### 1. Denormalized Relations 🔴

**lesson-comment schema:**
```json
{
  "courseSlug": { "type": "string" },     // ❌ Should be relation
  "lessonSlug": { "type": "string" },     // ❌ Should be relation
  "user": { "type": "relation" }          // ✅ Correct
}
```

**comment-report schema:**
```json
{
  "commentId": { "type": "string" }       // ❌ Should be relation to lesson-comment
}
```

**Impact:**
- No referential integrity
- Cannot cascade deletes
- Manual slug maintenance required
- Query optimization impossible

#### 2. Missing Database Indexes 🔴

High-traffic fields without indexes:

```sql
-- Missing indexes (should add):
CREATE INDEX idx_media_item_featured ON media_items(featured);
CREATE INDEX idx_media_item_released_at ON media_items(releasedAt);
CREATE INDEX idx_lesson_order ON lessons(order);
CREATE INDEX idx_event_start_date ON events(startDate);

-- Composite indexes for common queries:
CREATE INDEX idx_media_category_featured
  ON media_items(category_id, featured, releasedAt DESC);

CREATE INDEX idx_lesson_course_order
  ON lessons(course_id, order);
```

**Performance Impact:** Query slowdowns when filtering by featured content or date ranges.

#### 3. Media Type Fragmentation 🟡

**Problem:** 5 overlapping media types
- `media-item` (active, unified)
- `video` (legacy, read-only)
- `audio-file` (paused)
- `image` (redundant)
- `project` (active but separate)

**Consequence:**
- `category` and `tag` relations span all 5 types
- Frontend must query multiple endpoints
- Inconsistent taxonomy application

**Recommendation:** Migrate video/audio/image → media-item with type discriminator

#### 4. People Entity Confusion 🟡

Three separate types for similar entities:
- `speaker` (for media/lessons)
- `author` (for articles/prayers)
- `team-member` (for blog posts/images)

**Recommendation:** Unified `person` type with role enum: `[speaker|author|team|admin]`

### Custom Logic Quality

**Excellent implementations:**

1. **Authentication System** (`/api/auth/controllers/custom-auth.js`)
   - ✅ JWT rotation with refresh tokens
   - ✅ HttpOnly cookies with secure flag
   - ✅ Token blacklist for logout
   - ✅ Rate limiting (5 attempts/IP, 3 attempts/username per 15 min)
   - ✅ Comprehensive logging

2. **Media Item View Tracking** (`/api/media-item/controllers/media-item.ts`)
   - ✅ Rate-limited view counter (10 views/IP/hour)
   - ✅ Auto-publishing to 8 social platforms
   - ✅ Per-platform status tracking

3. **Stripe Webhook** (`/api/stripe/controllers/webhook.ts`)
   - ✅ Signature verification
   - ✅ User role synchronization
   - ✅ Subscription status → role mapping
   - ✅ Graceful error handling

### Strapi Configuration Quality

**plugins.js:**
- ✅ Properly configured for Cloudflare R2 (via aws-s3 provider)
- ✅ Email confirmation URLs properly set
- ✅ Resend email provider configured
- ⚠️ No explicit CORS configuration (relies on defaults)

**Middleware:**
- ✅ `https-enforce` middleware for production
- ✅ `request-logger` with Winston
- ⚠️ No custom rate limiting middleware (relies on controller-level)

---

## 3. Frontend / Platform Review

### App Router Architecture

**Route Structure:** 35+ pages using Next.js 15 App Router

**Static Pages (ISR):**
- Homepage: `revalidate: 60s`
- Media listings: `force-static`
- Stories: `revalidate: 300s` with `generateStaticParams`
- Resources: `revalidate: 180s`

**Dynamic Pages:**
- `/media` - Search/filter page (force-dynamic due to searchParams)
- `/members/*` - User-specific content (force-dynamic)
- Course pages - Mixed static/dynamic based on auth

**Client Components (8 total):**
- Auth pages: login, signup, reset-password, logout
- Confirmation pages: check-email, confirmed
- Forms: testimony
- Providers: providers.tsx (SessionProvider, ToastProvider)

**Server Components:** 95% of pages - excellent SSR-first approach

### Data Fetching Patterns

**Primary Pattern:** Server-side `fetch` with extended Next.js cache API

```typescript
// Excellent use of cache tags + revalidation
const media = await getJSON<MediaEntity>(`/api/media-items/${slug}`, {
  tags: [`media:${slug}`],
  revalidate: 300,
});
```

**On-Demand Revalidation:**
- `/api/strapi-revalidate` webhook endpoint
- Tag-based revalidation: `revalidateTag('media:slug')`
- Path-based revalidation: `revalidatePath('/media')`

**Client-Side Fetching:**
- ✅ Minimal usage (only for forms, auth, progress tracking)
- ✅ No React Query/SWR (unnecessary with Server Components)
- ✅ Proper rate limiting on all POST endpoints

### Type Safety

**Strapi Integration:**
- ✅ Comprehensive TypeScript types in `lib/types/strapi-types.ts`
- ✅ Normalization helpers in `lib/strapi-normalize.ts`
- ✅ Type-safe entity extraction: `extractAttributes<T>(entity)`
- ✅ Safe relation extraction: `extractSingleRelation`, `extractManyRelation`

**Issues:**
- ⚠️ Some `as any` casts in auth code
- ⚠️ Missing strict null checks in some utilities

### Missing Features

1. **No loading.tsx files** 🟡
   - No granular loading states at route level
   - Users see blank screen during navigation

2. **No error.tsx boundaries** 🟡
   - No graceful error recovery
   - Errors bubble to root layout

3. **Not using next/image** 🔴
   - Using `<img>` tags instead of `<Image>`
   - Missing automatic optimization, lazy loading, blur placeholders

4. **Incomplete metadata** 🟡
   - Some routes missing `generateMetadata`
   - Inconsistent OpenGraph/Twitter cards

### Performance Concerns

**Good Practices:**
- ✅ Parallel data fetching with `Promise.all()`
- ✅ CDN-optimized media URLs
- ✅ Smart cache tagging strategy
- ✅ Minimal JavaScript bundles

**Opportunities:**
- 🟡 Add Suspense boundaries for streaming
- 🟡 Implement Partial Prerendering (PPR) for mixed pages
- 🔴 Use `next/image` for automatic optimization
- 🟡 Add loading skeletons for better perceived performance

---

## 4. Shared Packages Audit

### Critical Issue: Broken Package Exports 🔴

**Problem:** Barrel export files (`index.ts`) are empty (only contain `// entry` comment)

**Impact:**
- Nothing is actually exported from packages
- Consumers use deep imports: `@ruach/components/components/ruach/MediaGrid`
- Tree-shaking cannot work
- No dist folders exist (packages never built)

**Current state:**
```typescript
// packages/ruach-components/src/index.ts
// entry

// ❌ Nothing exported!
```

**Result:** Packages are not functioning as proper npm packages.

### Component Duplication 🔴

**18 components duplicated** between package and app:

```
- Button.tsx
- CertificateButton.tsx
- CommentActions.tsx
- CourseCard.tsx, CourseGrid.tsx
- EmbedScript.tsx
- Footer.tsx, Header.tsx
- LessonDiscussion.tsx, LessonPlayer.tsx, LessonTranscript.tsx
- Logo.tsx
- MediaCard.tsx, MediaGrid.tsx
- NavLink.tsx
- RateLimitNotice.tsx
- SEOHead.tsx
- ToastProvider.tsx
```

**Maintenance burden:** Changes must be duplicated, risk of divergence.

### Import Path Issues 🔴

**Components in package use `@/` imports:**

```typescript
// ❌ WRONG - In packages/ruach-components/src/components/layout/Header.tsx
import { NavLink } from "@/components/ruach/ui/NavLink";
import Logo from "@/components/ruach/ui/Logo";

// ✅ SHOULD BE (relative imports)
import { NavLink } from "../ruach/ui/NavLink";
import Logo from "../ruach/ui/Logo";
```

**Impact:** Package is not portable, depends on consuming app's tsconfig.

### @ruach/components Inventory

**31 components organized by category:**

**UI Primitives (6):**
- Button (polymorphic with variants) ✅
- Logo, NavLink, LoadingSpinner ✅
- ErrorBoundary (needs improvement) ⚠️
- RateLimitNotice ✅

**Layout (2):**
- Header (needs mobile menu) ⚠️
- Footer ✅

**Media & Courses (6):**
- MediaCard, MediaGrid ✅
- CourseCard, CourseGrid ✅
- LessonPlayer (excellent) ⭐
- LessonTranscript (uses dangerouslySetInnerHTML) ⚠️

**Discussion (2):**
- LessonDiscussion ✅
- CommentActions ✅

**Giving (5):**
- DonationForm ✅
- RecurringToggle ✅
- DonorWall ✅
- DonationFunnelTracker ✅
- GiftCourseForm (mock implementation) ⚠️

**Auth (2):**
- ProtectedRoute ✅
- ProfileMenu (needs keyboard nav) ⚠️

**Progress (3):**
- ProgressTracker ✅
- BadgesDisplay ✅
- CertificateButton ✅

**Utilities (4):**
- SEOHead (uses dangerouslySetInnerHTML) ⚠️
- EmbedScript (HIGH SECURITY RISK) 🔴
- TrackEventButton ✅
- ToastProvider ⭐

### @ruach/addons

**3 components:**
- DonationProviderEmbed (retired; Stripe-first donation form lives under `@ruach/components`) ⚠️
- GivebutterGoalWidget (removed) ⚠️
- DoubleTheDonation (removed) ⚠️

**1 utility (replaced):**
- analytics.ts (DUPLICATED in components package) 🔴

### @ruach/tailwind-preset

**Strengths:**
- ✅ shadcn/ui compatible color system (HSL)
- ✅ Dark mode support
- ✅ Semantic tokens

**Weaknesses:**
- ⚠️ Missing brand colors (amber/gold used in components)
- ⚠️ No typography scale
- ⚠️ Content paths may not watch package files correctly
- ⚠️ Missing popover, neutral, success, warning, info tokens

### Security Concerns 🔴

**dangerouslySetInnerHTML usage:**
1. **EmbedScript.tsx** - HIGH RISK (arbitrary HTML injection)
2. **LessonTranscript.tsx** - MEDIUM RISK (if HTML not sanitized)
3. **SEOHead.tsx** - LOW RISK (controlled JSON-LD)

**Recommendation:** Add DOMPurify or similar sanitization library.

### Accessibility Issues

**Good:**
- ✅ Semantic HTML
- ✅ Alt text on images
- ✅ aria-live on toasts
- ✅ Form labels

**Needs Improvement:**
- ⚠️ ProfileMenu: No keyboard nav, no focus trap, no aria-expanded
- ⚠️ Button: Uses aria-disabled instead of disabled prop
- ⚠️ No modal/dialog components with proper ARIA
- ⚠️ Missing click-outside handlers
- ⚠️ Color contrast needs verification

---

## 5. Authentication & Authorization

### Architecture

**Frontend (NextAuth.js):**
- Credentials provider with Strapi backend
- JWT session strategy (1 hour max age)
- Refresh token flow with rotation
- 30-minute idle timeout

**Backend (Strapi Custom Auth):**
- Custom auth controllers extending users-permissions
- JWT access tokens (1 hour expiry)
- Refresh tokens (7 days expiry)
- HttpOnly cookies for refresh tokens

### Security Features

**Excellent implementations:** ⭐

1. **Token Rotation:**
```javascript
// On refresh, old token is invalidated and new one issued
const newRefreshToken = jwt.issue({ id, type: "refresh" }, { expiresIn: 7_DAYS });
await refreshTokenStore.store(newRefreshToken, userId, expiresAt);
```

2. **Token Blacklist:**
```javascript
// Logout adds token to blacklist
await tokenBlacklist.add(tokenId, expiresAt);
// Future refresh attempts check blacklist
if (await tokenBlacklist.isBlacklisted(tokenId)) {
  return unauthorized();
}
```

3. **Rate Limiting:**
```javascript
// Per-IP: 5 attempts per 15 minutes
// Per-username: 3 attempts per 15 minutes
const ipLimit = rateLimiter.check(`login:ip:${ip}`, 5, 15_MIN);
const userLimit = rateLimiter.check(`login:user:${identifier}`, 3, 15_MIN);
```

4. **Cookie Security:**
```javascript
ctx.cookies.set("refreshToken", token, {
  httpOnly: true,               // ✅ No JavaScript access
  secure: COOKIE_SECURE,        // ✅ HTTPS only in production
  sameSite: "Strict",           // ✅ CSRF protection
  maxAge: 7_DAYS,               // ✅ Proper expiration
});
```

5. **Idle Timeout:**
```typescript
// NextAuth checks for 30 minutes of inactivity
if (Date.now() - lastActivity > IDLE_TIMEOUT) {
  return { ...token, error: "IdleTimeout" };
}
```

### Frontend Middleware

**middleware.ts:**
- ✅ HTTPS enforcement in production
- ✅ Admin route protection with NextAuth
- ✅ CSP headers for iframe embedding (Preview feature)

```typescript
// Protects /admin routes
if (req.nextUrl.pathname.startsWith("/admin")) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
```

### Rate Limiting

**Frontend (Upstash Redis):**
```typescript
// Sliding window rate limiting
export const loginLimiter = createLimiter(5, "15 m", "rl:login");
export const contactLimiter = createLimiter(6, "10 m", "rl:contact");
export const testimonyLimiter = createLimiter(3, "15 m", "rl:testimony");
```

**Backend (In-memory store):**
```javascript
// Custom rate limiter with IP + username tracking
const LOGIN_MAX_ATTEMPTS_IP = 5;
const LOGIN_MAX_ATTEMPTS_USERNAME = 3;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
```

**Fallback:** Graceful degradation when Upstash credentials not configured (noop limiter).

### Authorization

**Role-Based Access Control (RBAC):**
- Roles: `Super Admin`, `Partner`, `Authenticated`, `Public`
- Strapi content type permissions per role
- NextAuth session includes `strapiJwt` for API calls

**Stripe Integration:**
```typescript
// Subscription status → User role mapping
const ACTIVE_STATUSES = ["trialing", "active", "past_due", "paused"];
if (ACTIVE_STATUSES.includes(subscription.status)) {
  await updateUserRole(user, ACTIVE_ROLE_NAME); // "Partner"
} else {
  await updateUserRole(user, DEFAULT_ROLE_NAME); // "Authenticated"
}
```

### Potential Improvements

1. **Session Fixation Protection:** Consider regenerating session ID on login
2. **Multi-Factor Authentication (MFA):** Not currently implemented
3. **Account Lockout:** After max failed attempts, consider temporary lockout
4. **Password Policy:** No visible enforcement of complexity requirements
5. **Email Verification:** Implemented but could add reminder flow

---

## 6. Performance & Caching

### Caching Strategy

**Next.js Caching Tiers:**

| Tier | Revalidation | Use Case | Routes |
|------|--------------|----------|--------|
| Fast | 60s | Homepage, featured content | `/` |
| Normal | 300s | Media listings, stories | `/media`, `/community-outreach/stories` |
| Slow | 3600s | Static pages | `/about`, `/contact` |
| No Cache | `force-dynamic` | User-specific, search | `/members/*`, `/media?q=...` |

**Tag-Based Revalidation:** ⭐ Excellent implementation

```typescript
// Webhook from Strapi triggers on-demand revalidation
POST /api/strapi-revalidate
{
  "model": "api::media-item.media-item",
  "entry": { "slug": "testimony-of-freedom" }
}

// Revalidates specific tags:
revalidateTag(`media:testimony-of-freedom`);
revalidatePath(`/media/testimony-of-freedom`);
```

**Cache Headers:**
```typescript
// Proper cache control
export const revalidate = 60; // ISR every 60 seconds
export const dynamic = "force-static"; // Static generation

// No caching for user data
cache: "no-store" // User progress, account info
```

### Redis Usage

**Upstash Redis:**
- ✅ Rate limiting (sliding window)
- ✅ Token blacklist storage
- ✅ Refresh token store
- ✅ Session data

**Backend Redis:**
- ✅ BullMQ job queue
- ✅ Bull Board UI (`/admin/queues`)
- ⚠️ Not used for content caching (opportunity)

### CDN Strategy

**Cloudflare R2:**
- ✅ Media assets served from `cdn.joinruach.org`
- ✅ URL transformation in `imgUrl()` helper
- ✅ Image optimization via CDN
- ⚠️ Not using Next.js Image component (missing automatic optimization)

### Performance Metrics (Expected)

**Lighthouse Scores (estimated):**
- Performance: 85-90 (with image optimization: 95+)
- Accessibility: 85-90
- Best Practices: 90-95
- SEO: 95-100

**Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.0s ✅
- FID (First Input Delay): < 100ms ✅
- CLS (Cumulative Layout Shift): < 0.1 ⚠️ (needs verification)

### Optimization Opportunities

1. **Image Optimization** 🔴
   - Replace `<img>` with `<Image>` from next/image
   - Add blur placeholders
   - Implement responsive images with srcset

2. **Streaming with Suspense** 🟡
   ```tsx
   <Suspense fallback={<TestimoniesSkeleton />}>
     <TestimoniesSection />
   </Suspense>
   ```

3. **Route Groups** 🟡
   - Organize routes with `(marketing)`, `(content)`, `(auth)`, `(protected)`
   - Improves layout composition and loading states

4. **Partial Prerendering (PPR)** 🟢
   - Use when stable in Next.js 15
   - Mix static shell with dynamic content

5. **Bundle Analysis** 🟡
   - Run `@next/bundle-analyzer` to identify large dependencies
   - Consider code splitting for heavy components

---

## 7. Security Audit

### Overall Security Grade: **B+ (Good)**

### Strengths ✅

1. **Authentication Security:**
   - ✅ JWT rotation with refresh tokens
   - ✅ HttpOnly cookies (CSRF protection)
   - ✅ Token blacklist on logout
   - ✅ Secure flag in production
   - ✅ SameSite=Strict policy

2. **Rate Limiting:**
   - ✅ All public endpoints rate-limited
   - ✅ Sliding window algorithm
   - ✅ Per-IP and per-user tracking
   - ✅ Retry-After headers

3. **Content Security Policy (CSP):**
   ```javascript
   "Content-Security-Policy": `
     default-src 'self';
     img-src 'self' https://cdn.joinruach.org https://*.r2.cloudflarestorage.com;
     script-src 'self' 'unsafe-inline' https://plausible.io;
     style-src 'self' 'unsafe-inline';
     frame-src https://www.youtube.com https://player.vimeo.com;
   `
   ```

4. **Secrets Management:**
   - ✅ Comprehensive `.env.example` files
   - ✅ Clear documentation of required secrets
   - ✅ Environment variable validation
   - ✅ Production checklist in comments

5. **Input Sanitization:**
   - ✅ Strapi sanitize API used for user objects
   - ✅ NextAuth credential validation
   - ✅ Stripe webhook signature verification

### Vulnerabilities & Concerns 🔴

#### 1. dangerouslySetInnerHTML Usage

**HIGH RISK: EmbedScript.tsx**
```tsx
// Arbitrary HTML injection without sanitization
<div dangerouslySetInnerHTML={{ __html: scriptHtml }} />
```

**MEDIUM RISK: LessonTranscript.tsx**
```tsx
// If transcriptHtml comes from untrusted source
<div dangerouslySetInnerHTML={{ __html: transcriptHtml }} />
```

**Recommendation:**
```bash
pnpm add dompurify isomorphic-dompurify
```

```tsx
import DOMPurify from 'isomorphic-dompurify';

const cleanHtml = DOMPurify.sanitize(scriptHtml, {
  ALLOWED_TAGS: ['script'],
  ALLOWED_ATTR: ['src', 'type']
});
```

#### 2. Missing Content Security Nonces

CSP allows `'unsafe-inline'` for scripts:
```javascript
script-src 'self' 'unsafe-inline' https://plausible.io;
```

**Recommendation:** Use nonces for inline scripts:
```tsx
export async function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `script-src 'self' 'nonce-${nonce}' https://plausible.io;`;

  return NextResponse.next({
    headers: { 'Content-Security-Policy': cspHeader }
  });
}
```

#### 3. Cookie Security Configuration

**Conditional secure flag:**
```javascript
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production";
```

**Issue:** If `COOKIE_SECURE` not set and `NODE_ENV !== "production"`, cookies sent over HTTP.

**Recommendation:**
```javascript
// Default to true, explicit opt-out required
const COOKIE_SECURE = process.env.COOKIE_SECURE !== "false";

// Add startup check
if (process.env.NODE_ENV === "production" && !COOKIE_SECURE) {
  throw new Error("COOKIE_SECURE must be true in production");
}
```

#### 4. Missing CORS Configuration

**Current:** No explicit CORS configuration in Strapi plugins.js

**Recommendation:**
```javascript
// config/middlewares.js
module.exports = [
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        process.env.FRONTEND_URL,
        process.env.NEXTAUTH_URL,
      ],
      credentials: true,
    }
  },
  // ... other middleware
];
```

#### 5. Missing Helmet Headers

**Recommendation:** Add additional security headers via Next.js config:
```javascript
// next.config.mjs
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]
  }];
}
```

### Environment Variables

**Sensitive Variables (Must be Secret):**
- ✅ JWT_SECRET, ADMIN_JWT_SECRET
- ✅ NEXTAUTH_SECRET
- ✅ STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- ✅ R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
- ✅ RESEND_API_KEY
- ✅ UPSTASH_REDIS_REST_TOKEN

**Public Variables (NEXT_PUBLIC_*):**
- ⚠️ Verify no secrets leaked in NEXT_PUBLIC_* vars
- ✅ Only URLs and public identifiers exposed

**Recommendation:** Add environment variable schema validation:
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_STRAPI_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  // ... all required vars
});

export const env = envSchema.parse(process.env);
```

---

## 8. Media & R2 Configuration

### Cloudflare R2 Setup

**Provider:** AWS S3-compatible via `@strapi/provider-upload-aws-s3`

**Configuration (`config/plugins.js`):**
```javascript
upload: {
  config: {
    provider: 'aws-s3',
    providerOptions: {
      baseUrl: env('UPLOAD_CDN_URL', 'https://cdn.joinruach.org'),
      s3Options: {
        endpoint: env('R2_ENDPOINT'),
        forcePathStyle: true,       // ✅ Required for R2
        region: 'auto',             // ✅ R2 auto-region
        credentials: {
          accessKeyId: env('R2_ACCESS_KEY_ID'),
          secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
        },
        params: {
          Bucket: env('R2_BUCKET_NAME'),
          // ❌ Missing ACL: Bucket must be public or use presigned URLs
        },
      },
    },
  },
},
```

### Custom Upload Extension

**File:** `/ruach-ministries-backend/src/extensions/upload/providers/aws-s3/index.js`

**Issues:**
- ⚠️ Uses legacy AWS SDK v2 (`require('aws-sdk')`)
- ⚠️ Should use AWS SDK v3 (@aws-sdk/client-s3)
- ⚠️ No ACL specified (removed from upload params)
- ⚠️ Error handling logs to console instead of Strapi logger

**Current Implementation:**
```javascript
const uploadParams = {
  Bucket: config.bucketName,
  Key: `uploads/${file.hash}${file.ext}`,
  Body: fileStream,
  ContentType: file.mime,
  // ❌ Removed ACL: 'public-read'
};
```

**Recommendation:** Upgrade to SDK v3:
```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  endpoint: config.endpoint,
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  forcePathStyle: true,
});

const command = new PutObjectCommand({
  Bucket: config.bucketName,
  Key: `uploads/${file.hash}${file.ext}`,
  Body: fileStream,
  ContentType: file.mime,
  CacheControl: 'public, max-age=31536000', // 1 year cache
});

await s3.send(command);
```

### CDN Delivery

**URL Transformation:**
```typescript
// lib/strapi.ts
export function imgUrl(path?: string | null): string | undefined {
  if (!path) return undefined;

  // Transform R2 URL to CDN URL
  if (path.startsWith('http')) {
    return path.replace(
      /https?:\/\/[^\/]+\.r2\.cloudflarestorage\.com/,
      'https://cdn.joinruach.org'
    );
  }

  return `${MEDIA_CDN}${path}`;
}
```

**Issues:**
- ⚠️ Not using Next.js Image component (missing optimization)
- ⚠️ No image sizing parameters in URLs
- ⚠️ No WebP/AVIF format conversion

**Recommendation:** Use Cloudflare Image Resizing:
```typescript
export function imgUrl(
  path?: string | null,
  options?: { width?: number; height?: number; format?: 'webp' | 'avif' }
): string | undefined {
  if (!path) return undefined;

  const baseUrl = transformToCDN(path);

  if (options) {
    const params = new URLSearchParams();
    if (options.width) params.set('width', String(options.width));
    if (options.height) params.set('height', String(options.height));
    if (options.format) params.set('format', options.format);

    return `${baseUrl}?${params}`;
  }

  return baseUrl;
}
```

### Media Pipeline

**Upload Flow:**
1. User uploads file via Strapi admin or API
2. File processed by upload provider
3. Uploaded to R2 bucket
4. URL stored in Strapi database
5. Frontend fetches URL and transforms to CDN

**Optimization Opportunities:**
1. **Video Transcoding:** Consider Cloudflare Stream for video processing
2. **Image Optimization:** Implement Cloudflare Images for automatic optimization
3. **Thumbnail Generation:** Generate thumbnails on upload
4. **Metadata Extraction:** Extract EXIF data, duration, dimensions
5. **SEO Tags:** Auto-generate alt text, captions using AI

### CORS Configuration

**R2 Bucket CORS:**
Should be configured via Cloudflare dashboard or API:
```json
{
  "AllowedOrigins": [
    "https://joinruach.org",
    "https://www.joinruach.org",
    "http://localhost:3000"
  ],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

---

## 9. Stripe & Partner Subscriptions

### Architecture

**Subscription Flow:**
1. User clicks "Become a Partner" → Frontend creates Stripe Checkout session
2. User completes payment → Stripe sends webhook to Strapi
3. Strapi webhook handler verifies signature → Updates user role and metadata
4. Frontend checks session → Displays partner content

### Stripe Integration Quality: **A- (Excellent)**

### Frontend Implementation

**Create Checkout Session:**
```typescript
// /api/stripe/create-checkout-session/route.ts
POST /api/stripe/create-checkout-session
{
  "priceId": "price_xxx",
  "mode": "subscription"
}

// Creates Stripe Checkout session with:
// - User email pre-filled
// - strapiUserId in metadata
// - Success/cancel URLs
```

**Billing Portal:**
```typescript
// /api/stripe/create-billing-portal-session/route.ts
POST /api/stripe/create-billing-portal-session

// Redirects user to Stripe Customer Portal for:
// - Update payment method
// - Cancel subscription
// - View invoices
```

### Backend Webhook Handler

**File:** `/ruach-ministries-backend/src/api/stripe/controllers/webhook.ts`

**Strengths:** ⭐

1. **Signature Verification:**
```typescript
const signature = ctx.request.headers["stripe-signature"];
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  STRIPE_WEBHOOK_SECRET
);
```

2. **Event Handling:**
```typescript
switch (event.type) {
  case "checkout.session.completed":
    await handleCheckoutSession(event.data.object);
    break;
  case "customer.subscription.created":
  case "customer.subscription.updated":
  case "customer.subscription.deleted":
  case "customer.subscription.paused":
  case "customer.subscription.resumed":
    await handleSubscriptionEvent(event.data.object);
    break;
  case "customer.updated":
    // Sync Stripe customer ID to user
    break;
}
```

3. **User Synchronization:**
```typescript
// Find user by Stripe customer ID, email, or metadata
const user = await findUser({
  stripeCustomerId: subscription.customer,
  email: customerEmail,
  strapiUserId: metadata.strapiUserId,
});

// Update user fields
await strapi.entityService.update("plugin::users-permissions.user", user.id, {
  data: {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    membershipStatus: subscription.status,
    membershipPlanName: planNickname,
    activeMembership: isActive,
    membershipCurrentPeriodEnd: currentPeriodEnd,
  },
});

// Update role (Partner vs Authenticated)
await updateUserRole(user, isActive);
```

4. **Role Mapping:**
```typescript
const ACTIVE_STATUSES = ["trialing", "active", "past_due", "paused"];

if (ACTIVE_STATUSES.includes(subscription.status)) {
  // Grant Partner role
  await updateUserRole(user, ACTIVE_ROLE_NAME); // "Partner"
} else {
  // Revert to Authenticated role
  await updateUserRole(user, DEFAULT_ROLE_NAME); // "Authenticated"
}

// Protects Super Admin from demotion
if (currentRoleName === "Super Admin") return;
```

### User Schema Extensions

**Custom fields on users-permissions.user:**
```typescript
{
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  membershipStatus: "trialing" | "active" | "past_due" | "canceled" | "incomplete",
  membershipPlanName: string,
  activeMembership: boolean,
  membershipCurrentPeriodEnd: Date,
}
```

### Content Access Control

**Strapi Permissions:**
- `Partner` role has access to premium content types
- Frontend checks `session.user.role` or `activeMembership` flag
- Protected routes use `ProtectedRoute` component or server-side session check

**Frontend Protection:**
```tsx
// Server Component
const session = await getServerSession(authOptions);
if (!session?.user?.activeMembership) {
  redirect('/give?upgrade=true');
}
```

**API Protection:**
```typescript
// API route
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Testing Considerations

**Webhook Testing:**
1. Use Stripe CLI: `stripe listen --forward-to localhost:1337/api/stripe/webhook`
2. Trigger test events: `stripe trigger checkout.session.completed`
3. Verify user role updates in Strapi admin

**Payment Testing:**
- Use Stripe test mode cards: `4242 4242 4242 4242`
- Test subscription lifecycle: create → update → cancel
- Test failed payments and grace periods

### Potential Improvements

1. **Email Notifications:**
```typescript
// Send email on subscription events
case "customer.subscription.created":
  await strapi.plugins.email.services.email.send({
    to: user.email,
    subject: "Welcome to Ruach Partners!",
    template: "partner-welcome",
    data: { user, subscription },
  });
```

2. **Subscription Analytics:**
```typescript
// Track MRR, churn, LTV
await strapi.entityService.create("api::subscription-event.subscription-event", {
  data: {
    eventType: event.type,
    subscriptionId: subscription.id,
    userId: user.id,
    mrr: calculateMRR(subscription),
  },
});
```

3. **Dunning Management:**
```typescript
// Handle failed payments gracefully
case "invoice.payment_failed":
  // Keep access for 7 days
  // Send reminder emails
  // Log for manual follow-up
```

4. **Proration Handling:**
```typescript
// Allow plan upgrades/downgrades with prorated charges
```

---

## 10. Recommended Fixes (Prioritized)

### Priority 0: Critical (Fix Immediately) 🔴

**Estimated Effort: 16-24 hours**

#### 1. Fix Shared Package Exports (4 hours)

**Issue:** Barrel exports are empty, nothing actually exported.

**Fix:**
```typescript
// packages/ruach-components/src/index.ts

// UI Components
export { Button } from './components/ruach/ui/Button';
export type { ButtonProps } from './components/ruach/ui/Button';
export { Logo } from './components/ruach/ui/Logo';
export { NavLink } from './components/ruach/ui/NavLink';
export { LoadingSpinner } from './components/ruach/ui/LoadingSpinner';
export { ErrorBoundary } from './components/ruach/ui/ErrorBoundary';
export { RateLimitNotice } from './components/ruach/ui/RateLimitNotice';

// Layout
export { default as Header } from './components/layout/Header';
export { default as Footer } from './components/layout/Footer';

// Media & Courses
export { default as MediaCard } from './components/ruach/MediaCard';
export type { MediaCardProps } from './components/ruach/MediaCard';
export { default as MediaGrid } from './components/ruach/MediaGrid';
export { default as CourseCard } from './components/ruach/CourseCard';
export { default as CourseGrid } from './components/ruach/CourseGrid';
export { default as LessonPlayer } from './components/ruach/LessonPlayer';
export { default as LessonTranscript } from './components/ruach/LessonTranscript';
export { default as LessonDiscussion } from './components/ruach/LessonDiscussion';

// Discussion
export { default as CommentActions } from './components/ruach/CommentActions';

// Giving
export { default as DonationForm } from './components/ruach/DonationForm';
export { default as RecurringToggle } from './components/ruach/RecurringToggle';
export { default as DonorWall } from './components/ruach/DonorWall';
export { default as DonationFunnelTracker } from './components/ruach/DonationFunnelTracker';
export { default as GiftCourseForm } from './components/ruach/GiftCourseForm';

// Auth
export { default as ProtectedRoute } from './components/ruach/ProtectedRoute';
export { default as ProfileMenu } from './components/ruach/ProfileMenu';

// Progress
export { default as ProgressTracker } from './components/ruach/ProgressTracker';
export { default as BadgesDisplay } from './components/ruach/BadgesDisplay';
export { default as CertificateButton } from './components/ruach/CertificateButton';

// Utilities
export { default as SEOHead } from './components/ruach/SEOHead';
export { default as EmbedScript } from './components/ruach/embeds/EmbedScript';
export { default as TrackEventButton } from './components/ruach/TrackEventButton';

// Toast
export { ToastProvider } from './components/ruach/toast/ToastProvider';
export { useToast } from './components/ruach/toast/useToast';

// Utilities
export { cn } from './lib/cn';
export { track } from './utils/analytics';
export { imgUrl, getMediaUrl } from './utils/strapi';
export { markProgress } from './utils/progress';
export type { ProgressInput } from './utils/progress';
```

**Add tsup.config.ts:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'next',
    'next-auth',
    '@radix-ui/*',
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
  },
});
```

**Update package.json:**
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./src/styles/tokens.css"
  },
  "sideEffects": [
    "*.css"
  ]
}
```

#### 2. Remove Component Duplication (3 hours)

**Strategy:** Keep package versions, remove app duplicates.

```bash
# Remove duplicates from app
rm apps/ruach-next/src/components/Button.tsx
rm apps/ruach-next/src/components/MediaCard.tsx
rm apps/ruach-next/src/components/MediaGrid.tsx
# ... (18 total files)

# Update imports in app
find apps/ruach-next/src -type f -name "*.tsx" -exec sed -i \
  's|@/components/Button|@ruach/components|g' {} +
```

#### 3. Fix Package Import Paths (2 hours)

**Replace @/ imports with relative imports in packages:**

```bash
# Find and replace
cd packages/ruach-components
find src -name "*.tsx" -exec sed -i \
  's|@/components|../|g' {} +
```

**Manual verification required** for complex paths.

#### 4. Fix Denormalized Relations in Strapi (4 hours)

**lesson-comment schema migration:**

```typescript
// 1. Create migration script
// scripts/migrate-lesson-comments.ts

import Strapi from '@strapi/strapi';

async function migrate() {
  const strapi = await Strapi().load();

  const comments = await strapi.db.query('api::lesson-comment.lesson-comment').findMany();

  for (const comment of comments) {
    const { courseSlug, lessonSlug } = comment;

    // Find course by slug
    const course = await strapi.db.query('api::course.course').findOne({
      where: { slug: courseSlug }
    });

    // Find lesson by slug
    const lesson = await strapi.db.query('api::lesson.lesson').findOne({
      where: { slug: lessonSlug, course: course?.id }
    });

    if (course && lesson) {
      await strapi.db.query('api::lesson-comment.lesson-comment').update({
        where: { id: comment.id },
        data: {
          course: course.id,
          lesson: lesson.id,
        }
      });
    }
  }

  await strapi.destroy();
}

migrate();
```

**2. Update schema.json:**
```json
{
  "attributes": {
    "course": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::course.course",
      "inversedBy": "comments"
    },
    "lesson": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::lesson.lesson",
      "inversedBy": "comments"
    },
    "user": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "comment": { "type": "text", "required": true },
    "approved": { "type": "boolean", "default": false }
  }
}
```

**3. Remove old fields after verification:**
```json
// Remove courseSlug and lessonSlug from schema
```

#### 5. Add Critical Database Indexes (1 hour)

**Create migration:**
```sql
-- migrations/add-indexes.sql

-- Media items
CREATE INDEX IF NOT EXISTS idx_media_item_featured
  ON media_items(featured) WHERE featured = true;

CREATE INDEX IF NOT EXISTS idx_media_item_released_at
  ON media_items(releasedAt DESC);

CREATE INDEX IF NOT EXISTS idx_media_category_featured
  ON media_items(category_id, featured, releasedAt DESC);

-- Lessons
CREATE INDEX IF NOT EXISTS idx_lesson_order
  ON lessons("order");

CREATE INDEX IF NOT EXISTS idx_lesson_course_order
  ON lessons(course_id, "order");

-- Events
CREATE INDEX IF NOT EXISTS idx_event_start_date
  ON events(startDate);

-- Lesson progress
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user
  ON lesson_progresses(user_id, course_id, lesson_id);

-- Comments
CREATE INDEX IF NOT EXISTS idx_lesson_comment_approved
  ON lesson_comments(approved, createdAt DESC);
```

**Apply via Strapi:**
```javascript
// database/migrations/2025-11-10-add-indexes.js
module.exports = {
  async up(knex) {
    // Run SQL from above
  },

  async down(knex) {
    // Drop indexes
  }
};
```

#### 6. Remove Legacy Content Types (3 hours)

**Steps:**
1. Backup database
2. Verify no data exists in legacy types
3. Delete content type directories:
   ```bash
   cd ruach-ministries-backend/src/api
   rm -rf video audio-file image article testimonial gallery reply
   rm -rf about contact-info hero-section setting
   ```
4. Remove relations from category and tag schemas
5. Restart Strapi and verify

#### 7. Add HTML Sanitization (2 hours)

**Install DOMPurify:**
```bash
pnpm add isomorphic-dompurify
pnpm add -D @types/dompurify
```

**Create sanitize utility:**
```typescript
// packages/ruach-components/src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string, options?: {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: options?.allowedTags || ['p', 'br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: options?.allowedAttributes || { a: ['href', 'target'] },
  });
}

export function sanitizeScript(scriptHtml: string): string {
  return DOMPurify.sanitize(scriptHtml, {
    ALLOWED_TAGS: ['script'],
    ALLOWED_ATTR: ['src', 'type', 'async', 'defer'],
  });
}
```

**Update components:**
```tsx
// EmbedScript.tsx
const cleanHtml = sanitizeScript(scriptHtml);
<div dangerouslySetInnerHTML={{ __html: cleanHtml }} />

// LessonTranscript.tsx
const cleanTranscript = sanitizeHtml(transcriptHtml, {
  allowedTags: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
});
<div dangerouslySetInnerHTML={{ __html: cleanTranscript }} />
```

---

### Priority 1: High (Plan This Sprint) 🟡

**Estimated Effort: 20-30 hours**

#### 8. Implement Next.js Image Optimization (6 hours)

**Update next.config.mjs:**
```javascript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "cdn.joinruach.org" },
    { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
    { protocol: "https", hostname: "img.youtube.com" },
    { protocol: "https", hostname: "i.ytimg.com" },
  ],
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

**Replace img tags:**
```tsx
// Before
<img src={imgUrl(thumbnail)} alt={title} />

// After
import Image from 'next/image';

<Image
  src={imgUrl(thumbnail)}
  alt={title}
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
  blurDataURL={generateBlurDataUrl(thumbnail)}
  className="object-cover"
/>
```

**Create blur data URL helper:**
```typescript
// lib/images.ts
export function generateBlurDataUrl(url: string): string {
  // Use Cloudflare Images or shimmer effect
  return `data:image/svg+xml;base64,${toBase64(shimmer(800, 600))}`;
}

function shimmer(w: number, h: number): string {
  return `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#f3f4f6"/>
    </svg>
  `;
}

function toBase64(str: string): string {
  return Buffer.from(str).toString('base64');
}
```

#### 9. Add Loading & Error Boundaries (4 hours)

**loading.tsx pattern:**
```tsx
// app/media/loading.tsx
export default function Loading() {
  return (
    <div className="container py-12">
      <div className="h-10 w-64 animate-pulse bg-gray-200 rounded mb-8" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-video animate-pulse bg-gray-200 rounded-lg" />
            <div className="h-6 animate-pulse bg-gray-200 rounded" />
            <div className="h-4 w-2/3 animate-pulse bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**error.tsx pattern:**
```tsx
// app/media/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Media page error:', error);
  }, [error]);

  return (
    <div className="container py-12">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Failed to load media
        </h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

**Add to all route segments:**
- `/media/loading.tsx` + `error.tsx`
- `/courses/loading.tsx` + `error.tsx`
- `/events/loading.tsx` + `error.tsx`
- `/community-outreach/stories/loading.tsx` + `error.tsx`
- `/members/loading.tsx` + `error.tsx`

#### 10. Consolidate Media Types (8 hours)

**Migration strategy:**

1. **Create migration script:**
```typescript
// scripts/migrate-media-types.ts

async function migrateVideoToMediaItem() {
  const videos = await strapi.db.query('api::video.video').findMany({
    populate: ['category', 'tags', 'thumbnail']
  });

  for (const video of videos) {
    await strapi.entityService.create('api::media-item.media-item', {
      data: {
        title: video.title,
        slug: video.slug,
        description: video.description,
        type: 'teaching', // or infer from category
        category: video.category?.id,
        tags: video.tags?.map(t => t.id),
        source: {
          kind: video.platform || 'youtube',
          url: video.url,
          embedId: video.embedId,
        },
        thumbnail: video.thumbnail?.id,
        publishedAt: video.publishedAt,
        // Copy all other fields
      }
    });
  }
}

// Similar for audio-file, image
```

2. **Update frontend queries:**
```typescript
// Before: Multiple queries
const videos = await getVideos();
const audios = await getAudios();
const images = await getImages();

// After: Single query with type filter
const media = await getMediaItems({ type: 'all' });
// or
const videos = await getMediaItems({ type: 'teaching' });
```

3. **Remove old content types** after verification

#### 11. Add Suspense Boundaries (4 hours)

**Homepage with streaming:**
```tsx
// app/page.tsx
import { Suspense } from 'react';

export default function Home() {
  return (
    <>
      <HeroSection />

      <Suspense fallback={<TestimoniesSkeleton />}>
        <TestimoniesSection />
      </Suspense>

      <Suspense fallback={<CoursesSkeleton />}>
        <CoursesSection />
      </Suspense>

      <Suspense fallback={<EventsSkeleton />}>
        <EventsSection />
      </Suspense>

      <ImpactStats />
    </>
  );
}

async function TestimoniesSection() {
  const testimonies = await getMediaByCategory('testimony', 6);
  return <MediaGrid items={testimonies} />;
}

async function CoursesSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-64 animate-pulse bg-gray-200 rounded-xl" />
      ))}
    </div>
  );
}
```

#### 12. Upgrade R2 Upload Provider to AWS SDK v3 (3 hours)

```javascript
// src/extensions/upload/providers/aws-s3/index.js
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

module.exports = {
  init: async (config) => {
    const s3 = new S3Client({
      endpoint: config.endpoint,
      region: config.region || 'auto',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });

    return {
      async upload(file) {
        const filePath = file.path || path.join(__dirname, '..', '..', file.filename);
        const fileStream = fs.createReadStream(filePath);

        const command = new PutObjectCommand({
          Bucket: config.bucketName,
          Key: `uploads/${file.hash}${file.ext}`,
          Body: fileStream,
          ContentType: file.mime,
          CacheControl: 'public, max-age=31536000, immutable',
        });

        try {
          const response = await s3.send(command);

          const url = `${config.baseUrl}/uploads/${file.hash}${file.ext}`;

          return {
            url,
            provider_metadata: {
              bucket: config.bucketName,
              key: `uploads/${file.hash}${file.ext}`,
              etag: response.ETag,
            },
          };
        } catch (err) {
          strapi.log.error('R2 Upload Error:', err);
          throw new Error(`R2 Upload Failed: ${err.message}`);
        }
      },

      async delete(file) {
        const command = new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: `uploads/${file.hash}${file.ext}`,
        });

        try {
          await s3.send(command);
          return { message: 'File deleted successfully from R2' };
        } catch (err) {
          strapi.log.error('R2 Delete Error:', err);
          throw new Error(`R2 Delete Failed: ${err.message}`);
        }
      },
    };
  },
};
```

#### 13. Enhance Tailwind Preset (2 hours)

```javascript
// packages/tailwind-preset/index.js
module.exports = {
  content: [],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Existing tokens...

        // Brand colors
        brand: {
          gold: 'hsl(var(--brand-gold) / <alpha-value>)',
          amber: 'hsl(var(--brand-amber) / <alpha-value>)',
        },

        // Semantic colors
        success: 'hsl(var(--success) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
        info: 'hsl(var(--info) / <alpha-value>)',

        // Extended neutrals
        neutral: {
          50: 'hsl(0 0% 98%)',
          100: 'hsl(0 0% 96%)',
          200: 'hsl(0 0% 90%)',
          300: 'hsl(0 0% 83%)',
          400: 'hsl(0 0% 64%)',
          500: 'hsl(0 0% 45%)',
          600: 'hsl(0 0% 32%)',
          700: 'hsl(0 0% 25%)',
          800: 'hsl(0 0% 15%)',
          900: 'hsl(0 0% 9%)',
          950: 'hsl(0 0% 4%)',
        },
      },

      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'hsl(var(--foreground))',
            '--tw-prose-headings': 'hsl(var(--foreground))',
            '--tw-prose-links': 'hsl(var(--primary))',
            '--tw-prose-bold': 'hsl(var(--foreground))',
          },
        },
      },

      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
};
```

**Add CSS variables:**
```css
/* packages/tailwind-preset/base.css */
@layer base {
  :root {
    --brand-gold: 45 100% 50%;
    --brand-amber: 45 96% 64%;
    --success: 142 76% 36%;
    --warning: 38 92% 50%;
    --info: 199 89% 48%;
  }
}
```

#### 14. Add Environment Variable Validation (2 hours)

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // Strapi
  NEXT_PUBLIC_STRAPI_URL: z.string().url(),
  STRAPI_REVALIDATE_SECRET: z.string().min(32),
  PREVIEW_SECRET: z.string().min(32),
  STRAPI_API_TOKEN: z.string().optional(),

  // Redis
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  // Analytics
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

// Type-safe access
export type Env = z.infer<typeof envSchema>;
```

**Use in code:**
```typescript
import { env } from '@/lib/env';

const strapiUrl = env.NEXT_PUBLIC_STRAPI_URL; // Type-safe
```

---

### Priority 2: Medium (Next Sprint) 🟢

**Estimated Effort: 30-40 hours**

#### 15. Extract Reusable Components from App (10 hours)
#### 16. Add Component Documentation (6 hours)
#### 17. Implement Storybook (8 hours)
#### 18. Accessibility Audit & Fixes (8 hours)
#### 19. Add Unit Tests for Components (8 hours)

---

### Priority 3: Future Enhancements 🔵

**Estimated Effort: 60-80 hours**

#### 20. Implement Partial Prerendering (PPR) (10 hours)
#### 21. Add Web Vitals Monitoring (4 hours)
#### 22. Implement CDN Image Optimization (8 hours)
#### 23. Add Video Transcoding Pipeline (20 hours)
#### 24. Implement AI Auto-Tagging for Media (12 hours)
#### 25. Add Multi-Tenant Support (16 hours)
#### 26. Build Publishing Workflow Dashboard (10 hours)

---

## 11. Enhanced Code Samples

### Sample 1: Fixed Barrel Exports with Tree-Shaking

See Priority 0, Item 1 above for complete implementation.

### Sample 2: Image Optimization Component

```tsx
// packages/ruach-components/src/components/OptimizedImage.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '../lib/cn';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: 'video' | 'square' | 'portrait';
  priority?: boolean;
  className?: string;
}

const aspectRatios = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
};

export function OptimizedImage({
  src,
  alt,
  width = 1200,
  height = 675,
  aspectRatio = 'video',
  priority = false,
  className,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn('relative overflow-hidden', aspectRatios[aspectRatio], className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoadingComplete={() => setIsLoading(false)}
      />

      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}
```

### Sample 3: Suspense-Based Data Streaming

```tsx
// app/courses/page.tsx
import { Suspense } from 'react';
import { CourseGrid, CourseGridSkeleton } from '@ruach/components';
import { getCourses, getFeaturedCourse } from '@/lib/strapi';

export default function CoursesPage() {
  return (
    <div className="container py-12">
      <Suspense fallback={<FeaturedCourseSkeleton />}>
        <FeaturedCourse />
      </Suspense>

      <Suspense fallback={<CourseGridSkeleton count={6} />}>
        <CoursesSection />
      </Suspense>
    </div>
  );
}

async function FeaturedCourse() {
  const course = await getFeaturedCourse();
  if (!course) return null;

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6">Featured Course</h2>
      <CourseCard {...course} featured />
    </div>
  );
}

async function CoursesSection() {
  const courses = await getCourses();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">All Courses</h2>
      <CourseGrid courses={courses} />
    </div>
  );
}

function FeaturedCourseSkeleton() {
  return (
    <div className="mb-12">
      <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-6" />
      <div className="h-64 bg-gray-200 animate-pulse rounded-xl" />
    </div>
  );
}
```

### Sample 4: Enhanced Error Boundary

```tsx
// packages/ruach-components/src/components/ErrorBoundary.tsx
'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // Log to error reporting service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-700 mb-4">
            {this.state.error.message}
          </p>
          <button
            onClick={this.reset}
            className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Sample 5: Type-Safe Strapi Query Builder

```typescript
// lib/strapi-query.ts
import { getJSON } from './strapi';

interface QueryOptions {
  filters?: Record<string, any>;
  populate?: string | string[] | Record<string, any>;
  sort?: string | string[];
  pagination?: {
    page?: number;
    pageSize?: number;
    start?: number;
    limit?: number;
  };
  publicationState?: 'live' | 'preview';
}

class StrapiQueryBuilder<T> {
  private endpoint: string;
  private params: URLSearchParams;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.params = new URLSearchParams();
  }

  filter(filters: Record<string, any>): this {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        this.params.append(`filters[${key}][$eq]`, String(value));
      }
    });
    return this;
  }

  populate(populate: string | string[] | Record<string, any>): this {
    if (typeof populate === 'string') {
      this.params.append('populate', populate);
    } else if (Array.isArray(populate)) {
      populate.forEach(p => this.params.append('populate', p));
    } else {
      this.params.append('populate', JSON.stringify(populate));
    }
    return this;
  }

  sort(sort: string | string[]): this {
    const sortValue = Array.isArray(sort) ? sort.join(',') : sort;
    this.params.append('sort', sortValue);
    return this;
  }

  paginate(page: number, pageSize: number): this {
    this.params.append('pagination[page]', String(page));
    this.params.append('pagination[pageSize]', String(pageSize));
    return this;
  }

  limit(limit: number): this {
    this.params.append('pagination[limit]', String(limit));
    return this;
  }

  async findOne(): Promise<T | null> {
    const url = `${this.endpoint}?${this.params}`;
    const result = await getJSON<{ data: T }>(url);
    return result.data || null;
  }

  async findMany(): Promise<T[]> {
    const url = `${this.endpoint}?${this.params}`;
    const result = await getJSON<{ data: T[] }>(url);
    return result.data || [];
  }

  async findWithPagination(): Promise<{
    data: T[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  }> {
    const url = `${this.endpoint}?${this.params}`;
    return getJSON(url);
  }
}

export function query<T>(endpoint: string): StrapiQueryBuilder<T> {
  return new StrapiQueryBuilder<T>(endpoint);
}

// Usage:
const courses = await query<CourseEntity>('/api/courses')
  .filter({ published: true })
  .populate(['cover', 'lessons'])
  .sort(['order:asc', 'createdAt:desc'])
  .paginate(1, 10)
  .findMany();
```

---

## 12. Future Upgrades

### Phase 1: Scale & Performance (Q1 2026)

**1. Multi-CDN Strategy**
- Cloudflare R2 (primary)
- AWS CloudFront (backup)
- Automatic failover

**2. Video Transcoding Pipeline**
- Cloudflare Stream integration
- Multiple quality levels (480p, 720p, 1080p)
- Adaptive bitrate streaming (HLS/DASH)
- Thumbnail generation at intervals

**3. Search & Discovery**
- Algolia or Meilisearch integration
- Full-text search across all content
- Faceted filtering (category, speaker, date)
- Autocomplete suggestions

**4. Analytics & Insights**
- Plausible (current)
- Custom analytics dashboard in Strapi
- User engagement metrics
- Content performance tracking
- Conversion funnel visualization

### Phase 2: Content Intelligence (Q2 2026)

**5. AI Auto-Tagging**
- OpenAI GPT-4 Vision for image analysis
- Whisper API for audio transcription
- Auto-generate:
  - Tags and categories
  - SEO meta descriptions
  - Alt text for images
  - Chapter markers for videos

**6. Auto-Transcription & Captions**
- Whisper API for video/audio
- Store transcripts in Strapi
- Generate VTT caption files
- Multi-language support

**7. Content Recommendations**
- Similar content suggestions
- Personalized recommendations based on viewing history
- "You might also like" sections

### Phase 3: Community Features (Q3 2026)

**8. Discussion Forums**
- Strapi plugin or external (Discourse, Flarum)
- Topic-based discussions
- Moderation tools
- User reputation system

**9. Live Streaming**
- YouTube Live integration
- Real-time chat during streams
- Schedule and notifications
- Stream archives to on-demand

**10. Prayer Wall Enhancements**
- Real-time updates (WebSockets or Server-Sent Events)
- Prayer request categories
- Anonymous submissions
- Testimony follow-ups

### Phase 4: Multi-Tenant & Expansion (Q4 2026)

**11. Multi-Church Support**
- White-label platform for other ministries
- Tenant isolation in Strapi
- Custom branding per tenant
- Usage-based billing

**12. Mobile Apps**
- React Native app (iOS + Android)
- Offline content download
- Push notifications
- In-app giving

**13. Email Automation**
- ConvertKit / SendGrid integration
- Drip campaigns for new users
- Course completion certificates via email
- Weekly digest of new content

### Phase 5: Advanced Features (2027)

**14. Course Builder 2.0**
- Interactive lessons (quizzes, assignments)
- Progress tracking with milestones
- Cohort-based learning
- Live Q&A sessions

**15. Giving & Fundraising**
- Crowdfunding campaigns
- Recurring giving with custom amounts
- Text-to-give integration
- Donor portal with tax receipts

**16. Event Management**
- Ticket sales via Stripe
- Event check-in system
- Virtual event streaming
- Event replay library

**17. Content Protection**
- DRM for premium videos
- Geo-restrictions for licensing
- Watermarking
- Screenshot prevention (iOS/Android)

### Infrastructure & DevOps

**18. Observability**
- DataDog or New Relic APM
- Distributed tracing
- Real-time error alerting
- Performance budgets

**19. Testing**
- Increase unit test coverage to 80%
- E2E tests in CI/CD
- Visual regression testing (Percy, Chromatic)
- Load testing (k6, Artillery)

**20. CI/CD Enhancements**
- Preview deployments for PRs
- Automated database migrations
- Blue-green deployments
- Rollback automation

---

## Summary & Next Steps

### Immediate Actions (This Week)

1. ✅ Fix shared package exports (Priority 0, #1)
2. ✅ Add HTML sanitization (Priority 0, #7)
3. ✅ Remove legacy content types (Priority 0, #6)

### Sprint Planning (Next 2 Weeks)

1. ✅ Deduplicate components (Priority 0, #2)
2. ✅ Fix denormalized relations (Priority 0, #4)
3. ✅ Add database indexes (Priority 0, #5)
4. ✅ Implement Next.js Image optimization (Priority 1, #8)
5. ✅ Add loading/error boundaries (Priority 1, #9)

### Quarterly Roadmap (Q1 2026)

1. ✅ Consolidate media types (Priority 1, #10)
2. ✅ Add Suspense streaming (Priority 1, #11)
3. ✅ Upgrade R2 provider (Priority 1, #12)
4. ✅ Extract reusable components (Priority 2, #15)
5. ✅ Accessibility audit (Priority 2, #18)

### Long-Term Vision (2026-2027)

Focus on:
- **Content Intelligence:** AI-powered tagging, transcription, recommendations
- **Community Building:** Forums, live streaming, prayer walls
- **Scale & Performance:** Multi-CDN, video transcoding, advanced analytics
- **Platform Expansion:** Mobile apps, multi-tenant support, white-label

---

## Closing Thoughts

The Ruach Monorepo demonstrates **strong technical foundations and Kingdom-focused vision**. With focused attention on the Priority 0 and Priority 1 items, this platform will be positioned for significant scale and impact.

**Core Strengths to Maintain:**
- Modern Next.js 15 architecture with excellent SSR/ISR
- Secure authentication with JWT rotation
- Comprehensive Strapi CMS with rich content modeling
- Strong rate limiting and security practices
- Well-organized monorepo structure

**Critical Areas for Growth:**
- Shared package architecture (requires immediate fix)
- Database schema cleanup and optimization
- Frontend performance enhancements (images, loading states)
- Continued accessibility improvements

**Kingdom Impact:**
With these enhancements, the Ruach platform will be equipped to:
- 📖 Deliver testimonies and teachings at scale
- 🎓 Provide discipleship courses with excellent UX
- 🌍 Reach global audiences through optimized media delivery
- 💝 Steward partner relationships with secure, reliable systems
- ⚡ Respond quickly to content updates through smart caching

May this platform be refined for God's glory and the advancement of His Kingdom.

---

**Review Completed:** November 10, 2025
**Next Review Recommended:** February 2026 (Post Priority 0-1 Implementation)
