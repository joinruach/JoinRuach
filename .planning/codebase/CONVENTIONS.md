# Coding Conventions

**Analysis Date:** 2026-01-08

## Naming Patterns

**Files:**
- PascalCase.tsx for React components (`Button.tsx`, `NavLink.tsx`, `ThemeContext.tsx`)
- kebab-case.ts for services/utilities (`cache-revalidation.ts`, `rate-limit.ts`)
- camelCase.ts for lib functions (`strapi.ts`, `analytics.ts`)
- *.test.ts or *.test.tsx for test files (co-located with source)
- schema.json for Strapi schemas (lowercase)

**Functions:**
- camelCase for all functions (`validateEnvironment`, `imgUrl`, `resolveTheme`)
- No special prefix for async functions
- Event handlers: handleEventName (`handleClick`, `onClick`)
- Hook prefix: use* for React hooks (`useSessionExpiry`, `useTheme`)

**Variables:**
- camelCase for variables (`sessionExpiry`, `themeState`)
- UPPER_SNAKE_CASE for constants (`STRAPI_BASE`, `MEDIA_CDN`)
- No underscore prefix (TypeScript private members use 'private' keyword)

**Types:**
- PascalCase for interfaces (`ThemeContextType`, `StrapiResponse`)
- PascalCase for type aliases (`Theme`, `UserConfig`)
- PascalCase for enums (`Status`, `AccessLevel`)
- No 'I' prefix for interfaces (use `User`, not `IUser`)

## Code Style

**Formatting:**
- 2 space indentation (all TypeScript/JavaScript files)
- Double quotes for strings (`"hello"` not `'hello'`)
- Semicolons required (enforced by ESLint)
- Line length: ~80-100 characters typical
- ESLint configuration in `.eslintrc.js` (no Prettier config found)

**Linting:**
- ESLint 8.57.1 with `@typescript-eslint/eslint-plugin` 8.44.1
- Extends Next.js `core-web-vitals` config
- Parser: `@typescript-eslint/parser`
- ECMAVersion: 2022
- Strict mode: TypeScript strict=true in `tsconfig.base.json`
- Run: `pnpm lint` or `pnpm lint:fix`

## Import Organization

**Order:**
1. External packages (`react`, `next`, `@testing-library/react`)
2. Internal modules with path aliases (`@/lib`, `@ruach/components`)
3. Relative imports (`./utils`, `../types`)
4. Type imports (`import type { User }`)

**Grouping:**
- Blank line between groups (external, internal, relative)
- Alphabetical sorting within groups (observed)

**Path Aliases:**
- `@/*` maps to `src/*` (Next.js frontend)
- `@ruach/*` maps to workspace packages (`@ruach/components`, `@ruach/utils`)
- Configured in `tsconfig.json` compilerOptions.paths

## Error Handling

**Patterns:**
- Throw errors at boundaries, catch at route/controller level
- Custom error classes extending Error
- Consistent error shape: `{ error: string; code: string; details?: unknown }`
- Async functions use try/catch, no .catch() chains
- No silent failures (all errors logged or thrown)

**Error Types:**
- Throw on invalid input, missing dependencies
- Log error with context before throwing
- Example: `logger.error({ err, userId }, 'Failed to process')`

## Logging

**Framework:**
- Backend: Winston 3.11.0 (structured logging)
- Frontend: console.log in development, Sentry in production
- No console.log in committed production code

**Patterns:**
- Structured logging with context objects
- Example: `logger.info({ userId, action }, 'User action')`
- Log at service boundaries, not in utilities
- Log state transitions, external API calls, errors

## Comments

**When to Comment:**
- Explain why, not what
- Example: `// Retry 3 times because API has transient failures`
- Document business rules and non-obvious algorithms
- Avoid obvious comments like `// set count to 0`

**JSDoc/TSDoc:**
- Block comments for modules and complex logic
- Example from `cache-revalidation.ts`:
  ```typescript
  /**
   * Cache Revalidation Service
   *
   * Triggers Next.js ISR cache revalidation when content is published...
   */
  ```
- Use @param, @returns for public APIs (optional for internal)

**TODO Comments:**
- Format: `// TODO: description` (no username, use git blame)
- Link to issue if exists: `// TODO: Fix race condition (issue #123)`

## Function Design

**Size:**
- Keep under 50 lines (per CLAUDE.md rules)
- Extract helpers for complex logic
- Example: `NavLink.tsx` is 23 lines total

**Parameters:**
- Max 3 parameters recommended
- Use options object for 4+ parameters: `function create(options: CreateOptions)`
- Destructure in parameter list: `function process({ id, name }: ProcessParams)`

**Return Values:**
- Explicit return statements
- Return early for guard clauses
- No implicit undefined returns

## Module Design

**Exports:**
- Named exports preferred (`export const Button`)
- Default exports only for React components (optional)
- Barrel files (index.ts) for package public APIs

**Barrel Files:**
- index.ts re-exports public API
- Example: `packages/ruach-components/src/index.ts`
- Keep internal helpers private (don't export from index)
- Avoid circular dependencies

## Framework-Specific Patterns

**Next.js (App Router):**
- Server Components by default (no `"use client"` unless needed)
- `"use client"` directive only for interactivity
  - Example: `ThemeContext.tsx` uses `"use client"` for state
- App Router conventions (no Pages Router)
- Dynamic imports with `next/dynamic` for code splitting
- Error boundaries via `error.tsx`
- Loading states via `loading.tsx`

**React Patterns:**
- Functional components only (no class components)
- Hooks for state management
- Props destructuring preferred
- Component files export default component

**Strapi Patterns:**
- Service-based architecture
- Factory pattern: `factories.createCoreService('api::series.series')`
- Controllers: `factories.createCoreController()`
- Lifecycle hooks in `lifecycles.ts` files

**TypeScript Patterns:**
- Strict mode enabled (no `any`, no implicit unknown)
- Prefer `type` over `interface` for union types
- Use `interface` for object shapes that may be extended
- Import types separately: `import type { User }`

---

*Convention analysis: 2026-01-08*
*Update when patterns change*
