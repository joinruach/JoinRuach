# Ruach Monorepo Test Coverage Matrix

**Generated:** 2025-11-10
**Status:** Pre-Implementation Audit

## Executive Summary

- **Total Source Files:** ~348 TypeScript/JavaScript files
- **Current Test Files:** 2 (validate-env.test.ts, rate-limiter.test.ts)
- **Current Coverage:** ~1-2%
- **Target Coverage:** 100%
- **Console.logs Found:** 117 occurrences across 36 files
- **TODOs/FIXMEs:** 3 files with technical debt markers

---

## Apps & Packages Coverage

### 1. apps/ruach-next (Next.js 15 App)

| Module | Files | Tests | Coverage | Priority | Status |
|--------|-------|-------|----------|----------|--------|
| **App Routes** | 20+ routes | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - /courses | Dynamic routes | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - /watch | Media player | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - /partner | Partner portal | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - /api/auth | Auth routes | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - /api/stripe | Payment webhooks | 0 | 0% | 🔴 Critical | ❌ Not Started |
| **Server Actions** | ~15 actions | 0 | 0% | 🔴 Critical | ❌ Not Started |
| **Components** | ~30 components | 0 | 0% | 🟡 High | ❌ Not Started |
| - CourseCard.tsx | 1 | 0 | 0% | 🟡 High | ❌ Not Started |
| - LessonPlayer.tsx | 1 | 0 | 0% | 🟡 High | ❌ Not Started |
| - StripeSubscriptionButtons | 1 | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - ContactForm.tsx | 1 | 0 | 0% | 🟡 High | ❌ Not Started |
| - FileUpload.tsx | 1 | 0 | 0% | 🟡 High | ❌ Not Started |
| **Lib/Utils** | ~25 files | 1 | 5% | 🟡 High | ⚠️ Partial |
| - validate-env.ts | 1 | 1 | ✅ 100% | 🟡 High | ✅ Complete |
| - auth.ts | 1 | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - strapi-user.ts | 1 | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - redis.ts | 1 | 0 | 0% | 🟡 High | ❌ Not Started |
| **Middleware** | 1 file | 0 | 0% | 🔴 Critical | ❌ Not Started |
| **Total** | ~120 files | 1 | ~1% | | |

### 2. ruach-ministries-backend (Strapi v5)

| Module | Files | Tests | Coverage | Priority | Status |
|--------|-------|-------|----------|----------|--------|
| **API Controllers** | 43+ types | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - /auth | Auth controller | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - /course | Course CRUD | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - /lesson | Lesson CRUD | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - /media-item | Media upload | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - /testimony | Testimony mgmt | 0 | 0% | 🟡 High | ❌ Not Started |
| - /stripe | Stripe webhooks | 0 | 0% | 🔴 Critical | ❌ Not Started |
| - /presigned-upload | R2 uploads | 0 | 0% | 🔴 Critical | ❌ Not Started |
| **Services** | 43+ services | 1 | 2% | 🔴 Critical | ⚠️ Partial |
| - rate-limiter.ts | 1 | 1 | ✅ 100% | 🟡 High | ✅ Complete |
| **Policies** | ~10 policies | 0 | 0% | 🔴 Critical | ❌ Not Started |
| **Middleware** | ~5 files | 0 | 0% | 🔴 Critical | ❌ Not Started |
| **Plugins** | 2 plugins | 0 | 0% | 🟢 Medium | ❌ Not Started |
| - ruach-publisher | Social media | 0 | 0% | 🟢 Medium | ❌ Not Started |
| **Extensions** | Upload provider | 0 | 0% | 🟡 High | ❌ Not Started |
| **Total** | ~186 files | 1 | ~1% | | |

### 3. packages/ruach-components

| Module | Files | Tests | Coverage | Priority | Status |
|--------|-------|-------|----------|----------|--------|
| **Layout Components** | 2 files | 0 | 0% | 🟡 High | ❌ Not Started |
| - Header.tsx | 1 | 0 | 0% | 🟡 High | ❌ Not Started |
| - Footer.tsx | 1 | 0 | 0% | 🟡 High | ❌ Not Started |
| **UI Components** | ~15 files | 0 | 0% | 🟡 High | ❌ Not Started |
| - LoadingSpinner.tsx | 1 | 0 | 0% | 🟢 Medium | ❌ Not Started |
| - NavLink.tsx | 1 | 0 | 0% | 🟢 Medium | ❌ Not Started |
| - Logo.tsx | 1 | 0 | 0% | 🟢 Medium | ❌ Not Started |
| - ErrorBoundary.tsx | 1 | 0 | 0% | 🔴 Critical | ❌ Not Started |
| **Business Components** | ~10 files | 0 | 0% | 🟡 High | ❌ Not Started |
| - CourseCard.tsx | 1 | 0 | 0% | 🟡 High | ❌ Not Started |
| - LessonPlayer.tsx | 1 | 0 | 0% | 🟡 High | ❌ Not Started |
| - BadgesDisplay.tsx | 1 | 0 | 0% | 🟢 Medium | ❌ Not Started |
| **Total** | ~30 files | 0 | 0% | | |

### 4. packages/ruach-next-addons

| Module | Files | Tests | Coverage | Priority | Status |
|--------|-------|-------|----------|----------|--------|
| **Utilities** | ~10 files | 0 | 0% | 🟡 High | ❌ Not Started |
| **Total** | ~10 files | 0 | 0% | | |

### 5. packages/tailwind-preset

| Module | Files | Tests | Coverage | Priority | Status |
|--------|-------|-------|----------|----------|--------|
| **Config** | 2 files | 0 | 0% | 🟢 Medium | ❌ Not Started |
| **Total** | ~2 files | 0 | 0% | | |

---

## High-Impact Testing Priorities

### 🔴 Critical (Must Have 100% Coverage)

1. **Authentication Flow**
   - apps/ruach-next/src/lib/auth.ts
   - ruach-ministries-backend/src/api/auth/
   - Email confirmation flow
   - JWT validation
   - Session management

2. **Payment Processing**
   - apps/ruach-next/src/app/api/stripe/
   - ruach-ministries-backend/src/api/stripe/
   - Checkout session creation
   - Webhook handling
   - Partner subscription sync

3. **Media Upload & Storage**
   - ruach-ministries-backend/src/api/presigned-upload/
   - ruach-ministries-backend/src/api/media-item/
   - Cloudflare R2 integration
   - File validation
   - Presigned URL generation

4. **Course & Lesson Management**
   - ruach-ministries-backend/src/api/course/
   - ruach-ministries-backend/src/api/lesson/
   - Content relationships
   - Progress tracking
   - Permissions

### 🟡 High (Target 100% Coverage)

5. **User Interface Components**
   - All shared components in @ruach/components
   - Critical UI components in ruach-next
   - Form validation
   - Error boundaries

6. **API Routes & Server Actions**
   - All Next.js API routes
   - Server actions for data mutations
   - Rate limiting
   - Error handling

### 🟢 Medium (Target 80%+ Coverage)

7. **Utility Functions**
   - Helper functions
   - Formatters
   - Validators

8. **Configuration**
   - Tailwind preset
   - Build configurations

---

## Code Quality Issues

### Console.log Statements (117 occurrences)

**Files with most console statements:**
- apps/ruach-next/src/lib/validate-env.ts (8)
- ruach-ministries-backend/config/middlewares.js (5)
- apps/ruach-next/src/lib/auth.ts (5)
- apps/ruach-next/src/components/ruach/FileUpload.tsx (4)

**Action Required:** Replace console.logs with proper logging (Winston for backend, structured logging for frontend)

### TODO/FIXME Comments

**Files requiring attention:**
1. ruach-ministries-backend/src/plugins/ruach-publisher/server/services/providers/truthsocial.js
2. CROSS-PLATFORM-PUBLISHING.md (documentation)
3. apps/ruach-next/src/app/icon.svg (metadata)

---

## Test Infrastructure Status

### ✅ Configured
- Jest for apps/ruach-next
- Jest for ruach-ministries-backend
- Playwright for E2E tests (config only, no tests)
- CI/CD pipeline with test jobs

### ❌ Missing
- Vitest configuration for packages
- Test fixtures and seed data
- Integration test setup
- E2E test implementation
- Coverage thresholds in CI
- Docker Compose test services

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Configure Vitest for all packages
- [ ] Set up test fixtures and factories
- [ ] Create test database seeding
- [ ] Add Docker Compose test services

### Phase 2: Critical Path Tests (Week 2-3)
- [ ] Auth flow tests (login, registration, email confirmation)
- [ ] Stripe integration tests (checkout, webhooks, portal)
- [ ] Media upload tests (R2, validation, presigned URLs)
- [ ] Course/Lesson CRUD tests

### Phase 3: Component & UI Tests (Week 4)
- [ ] Shared component tests (@ruach/components)
- [ ] Page component tests
- [ ] Form validation tests
- [ ] Error boundary tests

### Phase 4: Integration Tests (Week 5)
- [ ] Frontend → Backend API tests
- [ ] Backend → R2 storage tests
- [ ] Backend → Database tests
- [ ] Email service tests

### Phase 5: E2E Tests (Week 6)
- [ ] User registration journey
- [ ] Partner subscription journey
- [ ] Course enrollment journey
- [ ] Media upload journey
- [ ] Testimony submission journey

### Phase 6: Coverage & Polish (Week 7)
- [ ] Achieve 100% coverage on critical paths
- [ ] Remove console.logs, replace with proper logging
- [ ] Resolve all TODOs
- [ ] Add Zod schemas for validation
- [ ] Update CI/CD with coverage gates

---

## Coverage Goals by Module

| Module | Current | Target | Deadline |
|--------|---------|--------|----------|
| apps/ruach-next | 1% | 100% | Week 4 |
| ruach-ministries-backend | 1% | 100% | Week 5 |
| packages/ruach-components | 0% | 100% | Week 4 |
| packages/ruach-next-addons | 0% | 100% | Week 3 |
| E2E Test Suites | 0% | 100% | Week 6 |

---

## Success Metrics

- ✅ All critical paths have 100% test coverage
- ✅ All tests pass in CI/CD pipeline
- ✅ Coverage badges show 100% in README
- ✅ No console.log statements in production code
- ✅ All TODOs resolved or documented
- ✅ E2E tests cover all user journeys
- ✅ Integration tests verify all external services
- ✅ CI fails if coverage drops below 100%

---

**Next Steps:** Begin Phase 2 implementation with test infrastructure setup.
