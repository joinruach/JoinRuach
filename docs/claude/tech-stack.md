# Tech Stack Rules
**Dense reference for framework-specific patterns**

---

## Next.js (App Router)

### Components
✅ Server Components default | ❌ `'use client'` unless interactive
✅ `error.tsx`/`loading.tsx` for boundaries | ❌ Throwing in Server Components without fallback
✅ `next/dynamic` for heavy components | ❌ Loading all components eagerly
✅ `next/image` for optimization | ❌ Raw `<img>` tags

### Data Fetching
✅ Fetch in Server Components | ❌ `useEffect` for data in Server Components
✅ Streaming with Suspense | ❌ Blocking entire page load
✅ Server Actions for mutations | ❌ API routes for simple mutations
✅ Parallel data fetching | ❌ Sequential waterfall requests

### Performance
✅ Route groups for layouts | ❌ Duplicating layout logic
✅ `loading.tsx` for instant feedback | ❌ Blank screen while loading
✅ Incremental Static Regeneration | ❌ Rebuilding entire site for updates
✅ Edge runtime where appropriate | ❌ Node.js for everything

---

## Strapi v5

### Service Layer
✅ `strapi.plugin('kie-core').service('entity')` | ❌ Direct `entityService` in routes
✅ Custom services in `src/api/[name]/services/` | ❌ Logic in controllers
✅ `afterCreate`/`beforeUpdate` hooks | ❌ Side effects in controllers
✅ Transactions for multi-step writes | ❌ Partial writes on failure

### Authentication
✅ `ctx.state.user` for auth | ❌ `ctx.request.body.user`
✅ JWT validation middleware | ❌ Trusting client-provided user IDs
✅ Role-based permissions | ❌ Open endpoints

### Query Patterns
✅ `populate: ['relation']` explicitly | ❌ Auto-populate everything
✅ Pagination with `start`/`limit` | ❌ Fetching all records
✅ Filters at DB level | ❌ Loading all + filtering in memory
✅ Select specific fields | ❌ Returning entire entities

### Data Integrity
✅ Validate before write | ❌ Mutating `ctx.request.body`
✅ Immutable request handling | ❌ Modifying request objects
✅ Explicit relations | ❌ Implicit cascades
✅ Soft deletes for audit | ❌ Hard deletes without backup

---

## Redis

### Key Patterns
✅ `env:module:id` format | ❌ Unstructured keys
✅ Namespacing by feature | ❌ Global key collisions
✅ Expire transient data ≤ 5 min | ❌ Infinite TTLs
✅ Monitor key count | ❌ Unbounded growth

### Data Handling
✅ Pipelines for multi-ops | ❌ N sequential commands
✅ Payloads ≤ 1 MB | ❌ Storing large blobs
✅ JSON.stringify for objects | ❌ `[object Object]` strings
✅ Atomic operations | ❌ Race conditions

### Monitoring
✅ `INFO` command for health | ❌ Ignoring memory usage
✅ `pnpm redis-cli MONITOR` (dev only) | ❌ MONITOR in production
✅ Track hit/miss ratio | ❌ Blind caching

---

## TypeScript

### Type Safety
✅ Strict mode enabled | ❌ `any` anywhere
✅ Explicit return types | ❌ Inferred `any`
✅ `unknown` for untrusted data | ❌ `any` for external APIs
✅ Type guards for narrowing | ❌ Type assertions without validation

### Patterns
✅ Discriminated unions | ❌ Optional properties everywhere
✅ `readonly` for immutable data | ❌ Mutable shared state
✅ Branded types for IDs | ❌ `string` for everything
✅ Utility types (`Pick`, `Omit`) | ❌ Duplicating interfaces

---

## Database (Postgres)

### Query Optimization
✅ Indexes on frequent filters | ❌ Full table scans
✅ `EXPLAIN ANALYZE` before deploy | ❌ Guessing performance
✅ Connection pooling | ❌ New connection per request
✅ Batch inserts | ❌ N individual INSERTs

### Transactions
✅ `BEGIN`/`COMMIT` for multi-step | ❌ Partial state on error
✅ Rollback on failure | ❌ Leaving dirty data
✅ Isolation levels per use case | ❌ Default for everything
✅ Keep transactions short | ❌ Long-running locks

### Schema
✅ Foreign keys for relationships | ❌ Orphaned records
✅ NOT NULL for required fields | ❌ Nullable everything
✅ Enums for fixed values | ❌ String validation in app
✅ Timestamps (created_at, updated_at) | ❌ No audit trail

---

## Testing

### Unit Tests (Vitest)
✅ Pure function tests | ❌ Testing framework internals
✅ Mock external dependencies | ❌ Real API calls in tests
✅ Arrange-Act-Assert pattern | ❌ Unclear test structure
✅ One assertion per test | ❌ Testing multiple things

### Integration Tests
✅ Test API contracts | ❌ Testing implementation details
✅ Use test database | ❌ Production/dev DB in tests
✅ Reset state between tests | ❌ Test interdependence
✅ Test error paths | ❌ Only happy path

### E2E Tests (Playwright)
✅ Critical user flows only | ❌ E2E for everything
✅ Page Object Model | ❌ Selector duplication
✅ Run in CI | ❌ Manual testing only
✅ Parallel execution | ❌ Sequential slow tests

---

## Security

### Input Validation
✅ Zod schemas at boundaries | ❌ Trusting client data
✅ Whitelist allowed fields | ❌ Accepting everything
✅ Sanitize HTML (DOMPurify) | ❌ Raw HTML injection
✅ Parameterized queries | ❌ String concatenation SQL

### Authentication
✅ JWT expiry ≤ 24h | ❌ Long-lived tokens
✅ Secure httpOnly cookies | ❌ localStorage for tokens
✅ CSRF protection | ❌ Accepting all origins
✅ Rate limiting | ❌ Unbounded requests

### Data Protection
✅ No secrets in logs | ❌ Logging passwords/tokens
✅ No PII in error messages | ❌ Exposing user data
✅ HTTPS only in production | ❌ HTTP anywhere
✅ CSP headers | ❌ Inline scripts everywhere

---

## Performance

### Frontend
✅ Code splitting by route | ❌ One giant bundle
✅ Lazy load below fold | ❌ Loading everything upfront
✅ Image optimization | ❌ Raw high-res images
✅ Streaming SSR | ❌ Blocking entire page

### Backend
✅ Database indexes | ❌ Sequential scans
✅ Redis caching | ❌ DB hit every time
✅ Pagination | ❌ Returning 10k records
✅ Background jobs | ❌ Blocking requests for slow ops

---

## Debugging

### Development
✅ `console.debug` (removed in prod) | ❌ `console.log` everywhere
✅ Structured logging | ❌ String concatenation logs
✅ Request IDs for tracing | ❌ Untrackable errors
✅ Source maps enabled | ❌ Minified stack traces

### Strapi
✅ `DEBUG=strapi:* pnpm develop` | ❌ Guessing what's wrong
✅ Check plugin services | ❌ Assuming core issue

### Redis
✅ `pnpm redis-cli MONITOR` (dev only) | ❌ MONITOR in prod
✅ Check memory with `INFO` | ❌ Ignoring OOM warnings

### Next.js
✅ `NEXT_TELEMETRY_DEBUG=1 pnpm dev` | ❌ Blind debugging
✅ React DevTools Profiler | ❌ Guessing performance issues

---

## Dependencies

### Management
✅ Audit before adding (bundle size, maintenance) | ❌ `pnpm add` everything
✅ Pin critical versions (`-E`) | ❌ Floating `^` for everything
✅ Monthly `pnpm update --latest` | ❌ Never updating
✅ Remove unused (`pnpm dlx depcheck`) | ❌ Dependency bloat

### Breaking Changes
✅ Document in `MIGRATION.md` | ❌ Silent breaking changes
✅ Version bump per semver | ❌ Patch for breaking changes
✅ Deprecation warnings | ❌ Immediate removal

---

**Load this with `core-principles.md` for building features.**
