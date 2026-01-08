# Technology Stack

**Analysis Date:** 2026-01-08

## Languages

**Primary:**
- TypeScript 5.3.3 - All application code (`package.json`)

**Secondary:**
- JavaScript - Config files, legacy code
- SQL - PostgreSQL with pgvector extension

## Runtime

**Environment:**
- Node.js 20.x (`@types/node ^20.19.11`)
- Browser runtime (Next.js frontend)

**Package Manager:**
- pnpm 9.12.0
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**
- Next.js 16.1.1 (App Router) - Web application (`apps/ruach-next/package.json`)
- React 18.3.1 - UI library (`apps/ruach-next/package.json`)
- Strapi v5.30.1 - Headless CMS (`ruach-ministries-backend/package.json`)
- Express 5.2.1 - HTTP server (via Strapi)

**Testing:**
- Vitest 4.0.8 - Primary test runner (`package.json`)
- Jest 29.7.0 - Legacy test runner (`apps/ruach-next/package.json`, `ruach-ministries-backend/package.json`)
- Playwright 1.56.1 - E2E testing (`package.json`)
- Testing Library (@testing-library/react 16.3.0)

**Build/Dev:**
- Turbo 2.7.2 - Monorepo task orchestration (`package.json`)
- TypeScript Compiler 5.3.3 - Type checking and compilation
- Vite - Package bundling
- PostCSS 8.4.47 - CSS processing
- tsx 4.20.2 - TypeScript execution

## Key Dependencies

**Critical:**
- @ai-sdk/anthropic 2.0.44 - AI chat/assistant features (`package.json`)
- stripe 16.9.0 - Payment processing (`apps/ruach-next/package.json`)
- openai 6.8.1 - Embeddings and transcription (`package.json`)
- next-intl 4.5.1 - Internationalization (`apps/ruach-next/package.json`)
- zod 3.25.76 - Schema validation (`package.json`)

**Infrastructure:**
- pg 8.16.3 - PostgreSQL driver (`apps/ruach-next/package.json`, `ruach-ministries-backend/package.json`)
- ioredis 5.8.2 - Redis client (`package.json`)
- @upstash/redis 1.30.0 - Serverless Redis (`apps/ruach-next/package.json`)
- bullmq 5.63.0 - Job queue system (`package.json`)
- knex 3.1.0 - Query builder (via Strapi)

**UI/Styling:**
- tailwindcss 3.4.10 - Utility-first CSS (`package.json`)
- motion 12.23.26 - Animation library (`apps/ruach-next/package.json`)
- react-icons 5.5.0 - Icon library (`apps/ruach-next/package.json`)

## Configuration

**Environment:**
- `.env` files for development (`.env.example`, `.env.production.example`)
- Key environment variables: DATABASE_URL, REDIS_URL, STRIPE_SECRET_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY
- NextAuth configuration in `apps/ruach-next/src/lib/auth.ts`

**Build:**
- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript compiler options (strict mode)
- `vitest.config.ts` - Test runner configuration
- `jest.config.js` - Legacy test configuration
- `playwright.config.ts` - E2E test configuration
- `turbo.json` - Monorepo task pipeline

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js 20+)
- Docker & Docker Compose (for local PostgreSQL, Redis, MinIO)
- pnpm 9.12.0 installed globally

**Production:**
- Vercel (Next.js frontend deployment)
- Docker containers (Strapi backend)
- PostgreSQL with pgvector extension
- Redis (Upstash for serverless)
- Cloudflare R2 (object storage)
- AWS S3 (alternative storage)

---

*Stack analysis: 2026-01-08*
*Update after major dependency changes*
