# Build Requirements for JoinRuach.org

## Critical: Strapi API Must Be Reachable During Build

### The Problem

The Next.js app uses **Incremental Static Regeneration (ISR)** to pre-render pages at build time. During the build:

1. Next.js calls `generateStaticParams()` to pre-render all locale routes (`/en`, `/es`, `/fr`, `/pt`)
2. Each page component fetches data from Strapi during pre-rendering
3. **If Strapi is unreachable**, pages are generated with `404` status in their `.meta` files
4. These 404 pages are then served to users, even though ISR should regenerate them

### The Solution

**Ensure the Strapi API is reachable during the build process.**

### Environment Variables Required

```bash
# Core URLs
NEXTAUTH_URL=https://joinruach.org
NEXTAUTH_SECRET=<cryptographically-secure-random-string-min-32-chars>

# CRITICAL: Must be a reachable Strapi API endpoint during build
# This should be your actual Strapi server, NOT a CDN
NEXT_PUBLIC_STRAPI_URL=https://your-strapi-api.example.com

# Strapi Revalidation
STRAPI_REVALIDATE_SECRET=<random-string-min-16-chars>
```

### Build Order

The build requires these packages in order:

```bash
# 1. Build workspace packages
pnpm --filter @ruach/ai run build
pnpm --filter @ruach/components run build
pnpm --filter @ruach/addons run build

# 2. Build Next.js app
cd apps/ruach-next
pnpm run build
```

### Dockerfile Considerations

**CRITICAL FIX APPLIED:** The Dockerfile has been updated to use the correct startup command for standalone mode:

```dockerfile
# ❌ OLD (causes crash):
CMD ["pnpm","start"]

# ✅ NEW (correct for standalone):
CMD ["node", "apps/ruach-next/server.js"]
```

Also ensure:

1. **Build-time environment variables** are provided as ARGs
2. **Strapi URL** points to a reachable API endpoint (not a CDN)
3. Network access to Strapi is available during the Docker build
4. **All workspace packages** are built in correct order (ai → components → addons → next)

### Alternative: Skip Static Generation (Not Recommended)

If Strapi cannot be reached during build, you can disable static generation:

```typescript
// apps/ruach-next/src/app/[locale]/page.tsx

// Remove or comment out:
// export const dynamicParams = false;
// export function generateStaticParams() { ... }

// Add:
export const dynamic = 'force-dynamic'; // Server-render on every request
```

**⚠️ Warning**: This defeats the purpose of ISR and will increase server load.

### Testing Locally

To test the build locally:

1. Create `.env.local` with valid environment variables
2. Ensure Strapi is running and reachable
3. Run `pnpm run build`
4. Check that `.next/server/app/en.meta` shows `status: 200` (not `404`)

```bash
# Check build status
cat apps/ruach-next/.next/server/app/en.meta
# Should show: {"status":200,...} or no status field
# NOT: {"status":404,...}
```

## Summary

**The 404 error on `/en` occurs when the production build cannot reach Strapi during static generation.** Ensure your deployment pipeline:

- ✅ Has `NEXT_PUBLIC_STRAPI_URL` pointing to a reachable Strapi API
- ✅ Allows network access to Strapi during build
- ✅ Uses the correct build order (workspace packages → Next.js app)
- ✅ Provides all required environment variables
