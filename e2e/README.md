# E2E Testing Guide

## Prerequisites

The E2E tests expect the dev server to be **already running**. Playwright will attach to it, not launch it.

## Running Tests

### 1. Start the Dev Server

In a separate terminal, start the Next.js app:

```bash
pnpm --filter ruach-next dev
```

Wait until you see the "Ready" message (usually takes 10-30 seconds).

Verify the server is responding:

```bash
curl http://localhost:3000
```

### 2. Run Tests

**Frontend-only tests** (no backend required):

```bash
pnpm test:e2e
```

This runs tests that only need the Next.js frontend.

**With backend** (requires Strapi + dependencies):

```bash
pnpm test:e2e:backend
```

This runs all tests including those that need courses, auth, etc.

### Other Test Commands

- **UI Mode** (interactive): `pnpm test:e2e:ui`
- **Headed** (see browser): `pnpm test:e2e:headed`
- **Debug**: `pnpm test:e2e:debug`

## Test Architecture

Tests are split into two categories:

### Frontend-Only Tests
- `e2e/home.spec.ts` - Pure frontend tests (navigation, UI, SEO)

### Backend-Required Tests
- `e2e/courses.spec.ts` - Requires Strapi with course content
- `e2e/auth.spec.ts` - Requires NextAuth + backend

Backend tests are skipped by default unless `E2E_BACKEND=true`.

## Troubleshooting

### "Error: page.goto: net::ERR_CONNECTION_REFUSED"

✅ **This is expected** - it means the dev server isn't running.

Start it first:

```bash
pnpm --filter ruach-next dev
```

Wait for the "Ready" message, then run tests again.

### "Port 3000 already in use"

Check what's running:

```bash
lsof -i :3000
```

Kill if needed:

```bash
kill -9 <PID>
```

### Tests time out

1. Verify server is healthy: `curl http://localhost:3000`
2. Check server logs for errors
3. Ensure no port conflicts
4. Try running tests sequentially (already default)

### Course/Auth tests fail

If you're running `pnpm test:e2e` (without backend flag), these tests are expected to be skipped.

If running `pnpm test:e2e:backend`, ensure:
- Strapi is running
- Database is seeded
- All required services are up

## CI/CD

In CI, you'll need to:

1. Start the dev server in the background
2. Wait for health check
3. Run tests
4. Kill the server

Example:

```bash
pnpm --filter ruach-next dev &
SERVER_PID=$!

# Wait for server
timeout 60 bash -c 'until curl -s http://localhost:3000 > /dev/null; do sleep 1; done'

# Run tests
pnpm test:e2e

# Cleanup
kill $SERVER_PID
```

## Performance Notes

- Tests run **sequentially** (workers: 1) to avoid shared state issues
- Timeouts: 30s per test, 10s actions, 15s navigation
- Screenshots/videos only on failure
- Trace on first retry only
