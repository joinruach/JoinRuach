# Architecture

**Analysis Date:** 2026-01-08

## Pattern Overview

**Overall:** pnpm Monorepo with Layered + Microservices Hybrid Architecture

**Key Characteristics:**
- Headless CMS backend (Strapi v5) serving Next.js frontend
- BFF pattern via Next.js API routes for auth and file operations
- Job queue system (BullMQ + Redis) for background processing
- Shared workspace packages for cross-app code reuse
- Turbo-powered build orchestration

## Layers

**Presentation Layer:**
- Purpose: User interface and server-side rendering
- Contains: Next.js App Router components, pages, layouts
- Location: `apps/ruach-next/src/app/`
- Depends on: API layer, shared components
- Used by: End users (browsers)

**API Layer (BFF):**
- Purpose: Authentication, file uploads, ingestion orchestration
- Contains: Next.js API routes, server actions
- Location: `apps/ruach-next/src/app/api/`
- Depends on: Backend services, shared utilities
- Used by: Frontend components, external webhooks

**Service Layer:**
- Purpose: Business logic, data fetching, external integrations
- Contains: Strapi services, queue managers, utilities
- Location: `apps/ruach-next/src/lib/`, `ruach-ministries-backend/src/services/`
- Depends on: Data layer, external APIs
- Used by: API routes, Strapi controllers

**Data Layer:**
- Purpose: Persistence and caching
- Contains: PostgreSQL (via Strapi EntityService), Redis (sessions/queues)
- Location: `ruach-ministries-backend/database/`, Redis instances
- Depends on: Nothing (infrastructure)
- Used by: Service layer

**Shared Libraries:**
- Purpose: Reusable code across apps
- Contains: Components, utilities, types, hooks
- Location: `packages/` (13 @ruach/* packages)
- Depends on: External dependencies only
- Used by: Frontend app, backend admin UI

## Data Flow

**Authenticated User Request:**

1. Client sends request to Next.js frontend
2. Middleware checks authentication state (`src/middleware.ts`)
3. Server component or API route fetches data from Strapi
4. Strapi service queries PostgreSQL via EntityService
5. Response normalized and cached (`apps/ruach-next/src/lib/strapi.ts`)
6. Data returned to component for rendering
7. HTML/JSON sent to client

**Content Ingestion Pipeline:**

1. User uploads file via POST /api/ingestion/upload
2. File stored to S3/R2 with presigned URL
3. POST /api/ingestion/review enqueues job to BullMQ
4. unified-ingestion-queue worker spawns child process
5. Scripture extraction script parses content
6. Library records created (chunk, citation, document)
7. Data persisted to PostgreSQL via Strapi
8. Client polls /api/ingestion/versions for status

**State Management:**
- Server-side: PostgreSQL for persistent state, Redis for sessions/tokens
- Client-side: React state, NextAuth session, minimal Redux usage

## Key Abstractions

**Strapi Content Type:**
- Purpose: Represents a data model with CRUD operations
- Examples: `api::video.video`, `api::course.course`, `api::scripture-verse.scripture-verse`
- Pattern: Controllers + Routes + Services + Schema + Lifecycles
- Location: `ruach-ministries-backend/src/api/*/`

**BullMQ Queue:**
- Purpose: Asynchronous job processing
- Examples: `unified-ingestion-queue`, `library-ingestion-queue`, `donation-thankyou-queue`
- Pattern: Queue initialization in `src/index.ts`, worker processors in `src/services/`
- Location: `ruach-ministries-backend/src/services/*-queue.ts`

**Next.js API Route:**
- Purpose: Thin BFF layer for auth and orchestration
- Examples: `/api/auth/[...nextauth]`, `/api/ingestion/upload`, `/api/checkout/donation`
- Pattern: Route handlers in `route.ts` files
- Location: `apps/ruach-next/src/app/api/*/route.ts`

**Shared Package:**
- Purpose: Cross-app code reuse (UI, utils, types)
- Examples: `@ruach/components`, `@ruach/utils`, `@ruach/formation`
- Pattern: Barrel exports via `index.ts`, published to workspace
- Location: `packages/ruach-*/src/`

## Entry Points

**Frontend:**
- Location: `apps/ruach-next/src/app/layout.tsx`
- Triggers: Browser navigation to app
- Responsibilities: Root layout, providers, middleware routing

**Backend:**
- Location: `ruach-ministries-backend/src/index.ts`
- Triggers: Strapi bootstrap process
- Responsibilities: Register hooks, initialize queues (donation, ingestion)

**API Routes:**
- Location: `apps/ruach-next/src/app/api/*/route.ts`
- Triggers: HTTP requests to /api/*
- Responsibilities: Auth, file upload, ingestion workflow

**Middleware:**
- Location: `apps/ruach-next/src/middleware.ts`
- Triggers: Every request to Next.js app
- Responsibilities: Locale routing, studio auth check

## Error Handling

**Strategy:** Throw errors at boundaries, catch at route/controller level

**Patterns:**
- Frontend: Error boundaries (`error.tsx`), try/catch in server actions
- Backend: Strapi error middleware, custom error classes
- Logging: Winston (backend), console (frontend development)

## Cross-Cutting Concerns

**Logging:**
- Backend: Winston v3.11.0 (structured logging)
- Frontend: console.log in development, Sentry in production
- Location: `ruach-ministries-backend` (Winston), Sentry SDK in `apps/ruach-next`

**Validation:**
- Zod schemas at API boundaries
- Strapi schema validation (content types)
- Custom validators: `ruach-ministries-backend/src/validators/`

**Authentication:**
- NextAuth v5 (JWT sessions) in frontend
- Strapi JWT tokens for API access
- Middleware: `src/middleware.ts` (Next.js), policies (Strapi)
- Token storage: Redis (refresh tokens), httpOnly cookies (session)

**Authorization:**
- Policies: `require-access-level.ts`, `is-authenticated-or-admin.ts`
- Read-only locks: `register-read-only-locks.ts` (prevents mutations)
- Role-based access via Strapi users-permissions plugin

**Caching:**
- Multi-layer: Redis (sessions, rate limiting), Next.js revalidation
- Strapi client with cache tags: `apps/ruach-next/src/lib/strapi.ts`

**Rate Limiting:**
- Upstash rate limiting (@upstash/ratelimit)
- Middleware: `ruach-ministries-backend/src/middlewares/rate-limit.ts`

---

*Architecture analysis: 2026-01-08*
*Update when major patterns change*
