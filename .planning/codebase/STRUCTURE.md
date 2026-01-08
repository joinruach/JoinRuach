# Codebase Structure

**Analysis Date:** 2026-01-08

## Directory Layout

```
ruach-monorepo/
├── apps/                        # Applications
│   └── ruach-next/             # Next.js frontend
├── packages/                    # Shared libraries
│   ├── ruach-components/       # UI components & hooks
│   ├── ruach-utils/            # Utility functions
│   ├── ruach-types/            # TypeScript types
│   ├── ruach-formation/        # Formation engine
│   ├── ruach-ai/               # AI features
│   ├── ruach-icons/            # Icons
│   ├── ruach-hooks/            # React hooks
│   ├── ruach-next-addons/      # Next.js addons
│   ├── guidebook-*/            # Guidebook system
│   └── tailwind-preset/        # Tailwind config
├── ruach-ministries-backend/   # Strapi backend
│   ├── src/                    # Source code
│   ├── config/                 # Strapi configuration
│   ├── database/               # Migrations
│   ├── scripts/                # Utility scripts
│   └── public/                 # Static files
├── docs/                        # Documentation
├── e2e/                         # Playwright tests
├── docker/                      # Docker configs
├── .planning/                   # Project planning (GSD)
├── package.json                 # Root workspace
├── pnpm-workspace.yaml          # Workspace config
├── turbo.json                   # Build orchestration
├── CODEX.md                     # AI operation rules
└── CLAUDE.md                    # Project instructions
```

## Directory Purposes

**apps/ruach-next/**
- Purpose: Next.js 16 frontend application
- Contains: App Router pages, API routes, components, lib utilities
- Key files: `src/app/layout.tsx`, `src/middleware.ts`, `next.config.mjs`
- Subdirectories: `src/app/`, `src/components/`, `src/lib/`, `src/hooks/`, `src/contexts/`

**packages/** (13 shared libraries)
- Purpose: Reusable code across apps (published as @ruach/*)
- Contains: Components, utilities, types, hooks, AI features
- Key files: Each package has `src/index.ts` barrel export
- Subdirectories: One per package (ruach-components, ruach-utils, etc.)

**ruach-ministries-backend/**
- Purpose: Strapi v5 headless CMS backend
- Contains: API content types, services, controllers, plugins
- Key files: `src/index.ts`, `config/database.js`, `config/server.js`
- Subdirectories: `src/api/` (84 content types), `src/services/`, `src/plugins/`

**docs/**
- Purpose: Project documentation
- Contains: Architecture diagrams, API docs, guides
- Key files: `RUACH-PLATFORM-ROADMAP.md`

**e2e/**
- Purpose: End-to-end tests with Playwright
- Contains: Test specs, fixtures, helpers
- Config: `playwright.config.ts`

**docker/**
- Purpose: Docker configuration files
- Contains: Dockerfiles, compose configs, nginx configs
- Key files: `docker-compose.yml` (root level)

**.planning/**
- Purpose: GSD project planning and codebase documentation
- Contains: PROJECT.md, roadmap, plans
- Created by: /gsd:map-codebase workflow

## Key File Locations

**Entry Points:**
- `apps/ruach-next/src/app/layout.tsx` - Next.js root layout
- `apps/ruach-next/src/middleware.ts` - Request middleware
- `ruach-ministries-backend/src/index.ts` - Strapi TypeScript entry
- `ruach-ministries-backend/src/index.js` - Strapi JS fallback

**Configuration:**
- `package.json` - Root workspace manifest
- `pnpm-workspace.yaml` - Workspace definition
- `turbo.json` - Build task orchestration
- `tsconfig.json` - TypeScript compiler options
- `apps/ruach-next/next.config.mjs` - Next.js configuration
- `ruach-ministries-backend/config/*.js` - Strapi configs
- `vitest.config.ts` - Test runner configuration
- `jest.config.js` - Legacy test configuration
- `playwright.config.ts` - E2E test configuration

**Core Logic:**

*Frontend:*
- `apps/ruach-next/src/lib/strapi.ts` - Strapi API client (1,935 lines)
- `apps/ruach-next/src/lib/auth.ts` - NextAuth configuration
- `apps/ruach-next/src/lib/stripe.ts` - Stripe integration
- `apps/ruach-next/src/app/api/` - Next.js API routes
- `apps/ruach-next/src/components/` - React components

*Backend:*
- `ruach-ministries-backend/src/api/` - 84 Strapi content types
- `ruach-ministries-backend/src/services/` - Queue managers, utilities
- `ruach-ministries-backend/src/plugins/` - Custom Strapi plugins
- `ruach-ministries-backend/scripts/` - Ingestion scripts

**Testing:**
- `apps/ruach-next/src/**/*.test.ts` - Co-located test files
- `ruach-ministries-backend/src/**/*.test.ts` - Backend tests
- `e2e/` - Playwright E2E tests
- `__fixtures__/` - Test fixtures (various locations)

**Documentation:**
- `CLAUDE.md` - Project instructions for Claude Code
- `CODEX.md` - AI operation guidelines
- `README.md` - Project overview
- `docs/RUACH-PLATFORM-ROADMAP.md` - Platform roadmap

## Naming Conventions

**Files:**
- `PascalCase.tsx` - React components
- `camelCase.ts` - TypeScript services, utilities
- `kebab-case.ts` - Strapi content types
- `*.test.ts` - Test files (co-located with source)
- `*.spec.ts` - Alternative test naming
- `schema.json` - Strapi schema definitions
- `lifecycles.ts` - Strapi lifecycle hooks

**Directories:**
- `kebab-case/` - Most directories
- `PascalCase/` - React component directories (optional)
- `[locale]/` - Next.js dynamic segments
- `api/` - Lowercase for Strapi content types
- `@ruach/` - Scoped package names

**Special Patterns:**
- `index.ts` - Barrel exports for packages and API directories
- `route.ts` - Next.js API route handlers
- `page.tsx` - Next.js page components
- `layout.tsx` - Next.js layout components
- `error.tsx` - Next.js error boundaries
- `loading.tsx` - Next.js loading states

## Where to Add New Code

**New Frontend Page:**
- Primary code: `apps/ruach-next/src/app/[locale]/[page-name]/page.tsx`
- Layout (if needed): `apps/ruach-next/src/app/[locale]/[page-name]/layout.tsx`
- Tests: Co-located `page.test.tsx`

**New API Route:**
- Implementation: `apps/ruach-next/src/app/api/[route-name]/route.ts`
- Tests: `apps/ruach-next/src/app/api/[route-name]/route.test.ts`

**New React Component:**
- Implementation: `apps/ruach-next/src/components/[feature]/[ComponentName].tsx`
- Shared component: `packages/ruach-components/src/components/[ComponentName].tsx`
- Tests: Co-located `[ComponentName].test.tsx`

**New Strapi Content Type:**
- Controllers: `ruach-ministries-backend/src/api/[type]/controllers/`
- Routes: `ruach-ministries-backend/src/api/[type]/routes/`
- Services: `ruach-ministries-backend/src/api/[type]/services/`
- Schema: `ruach-ministries-backend/src/api/[type]/content-types/[type]/schema.json`
- Lifecycles: `ruach-ministries-backend/src/api/[type]/content-types/[type]/lifecycles.ts`

**New Service:**
- Frontend: `apps/ruach-next/src/lib/[service-name].ts`
- Backend: `ruach-ministries-backend/src/services/[service-name].ts`

**New Utility:**
- Shared: `packages/ruach-utils/src/[category]/[utility-name].ts`
- Frontend-specific: `apps/ruach-next/src/lib/utils/[utility-name].ts`
- Backend-specific: `ruach-ministries-backend/src/utils/[utility-name].ts`

**New Type Definitions:**
- Shared: `packages/ruach-types/src/[category].ts`
- Frontend-specific: `apps/ruach-next/src/lib/types/[type-name].ts`
- Strapi: Generated in `ruach-ministries-backend/types/generated/`

**New Background Job:**
- Queue definition: `ruach-ministries-backend/src/services/[name]-queue.ts`
- Worker: Same file or separate worker file
- Registration: `ruach-ministries-backend/src/index.ts`

## Special Directories

**apps/ruach-next/src/app/[locale]/**
- Purpose: Internationalized routes (i18n with next-intl)
- Source: Dynamic routing based on locale parameter
- Committed: Yes

**ruach-ministries-backend/src/api/**
- Purpose: Strapi content types (84 total)
- Source: Strapi Content-Type Builder + manual code
- Committed: Yes

**ruach-ministries-backend/types/generated/**
- Purpose: Auto-generated TypeScript types from Strapi schemas
- Source: Generated by Strapi on build
- Committed: Yes (for type safety across deploys)

**packages/**
- Purpose: Shared libraries (pnpm workspace packages)
- Source: Manual development, published to workspace
- Committed: Yes

**.planning/codebase/**
- Purpose: Codebase documentation for GSD workflow
- Source: Generated by /gsd:map-codebase
- Committed: Yes

**node_modules/, dist/, .next/, build/**
- Purpose: Build artifacts and dependencies
- Source: Auto-generated during build/install
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-01-08*
*Update when directory structure changes*
