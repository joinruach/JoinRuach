# Ruach Ministries — Next.js Platform

A production-ready Next.js 15 (App Router) platform for global ministry with:

## Core Features

### Internationalization (i18n)
- **4 Languages**: English, Spanish, French, Portuguese
- **next-intl** integration with App Router
- **Static message imports** to prevent tree-shaking in production builds
- **Locale-prefixed routing**: `/en`, `/es`, `/fr`, `/pt`
- **Middleware-based** locale detection and routing

### Progressive Web App (PWA)
- **Installable** on mobile and desktop
- **Offline support** with service worker
- **Asset caching** for CDN resources, images, and API responses
- **Custom install prompt** and offline indicator

### Authentication & Authorization
- **NextAuth.js** credential login (stores Strapi JWT in session)
- **Admin route protection** with middleware
- **Role-based access control** for content management

### Content Management
- **Strapi 5** headless CMS integration
- **Typed API fetchers** with Next.js caching tags
- **Webhook-based revalidation** for instant content updates
- **Media management** with Cloudflare R2 storage
- **Course platform** with lesson progress tracking
- **Certificate generator** (Satori → Resvg) with completion gates

### AI Features
- **AI-powered assistant** (Anthropic Claude)
- **Context-aware responses** about ministry content
- **Streaming chat interface** with message history

### Developer Experience
- **TypeScript** throughout
- **Tailwind CSS** with custom preset
- **Component library** (@ruach/components)
- **Shared utilities** and hooks
- **Monorepo** architecture with Turborepo
- **Docker** deployment with standalone mode

### Performance & Monitoring
- **Upstash Redis** for rate limiting and caching
- **Sentry** error tracking and performance monitoring
- **Optimized images** with Next.js Image component
- **CDN integration** for static assets

### SEO & Analytics
- **JSON-LD** structured data
- **Dynamic sitemaps** and robots.txt
- **Open Graph** meta tags
- **Plausible Analytics** integration

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9.12.0+
- PostgreSQL database (for Strapi)
- Redis instance (for rate limiting)

### Installation

1. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Visit the app**
   - Main site: http://localhost:3000
   - Redirects to: http://localhost:3000/en (default locale)

## Architecture Deep Dive

### Internationalization (i18n) Architecture

The i18n system uses `next-intl` with App Router and has been optimized for production builds:

**Key Files:**
- `src/i18n.ts` - Configuration and message loading
- `src/middleware.ts` - Locale detection and routing
- `src/messages/*.json` - Translation files for each locale
- `src/app/[locale]/` - Locale-based routing structure

**Important:** Messages are loaded using **static imports** to prevent tree-shaking in production standalone builds:

```typescript
// ✅ Static imports (included in build)
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';

// ❌ Avoid dynamic imports (tree-shaken in standalone mode)
// await import(`./messages/${locale}.json`)
```

**Middleware Flow:**
1. HTTPS enforcement (production only)
2. Admin route protection
3. i18n middleware (locale detection/redirect)
4. CSP headers for Strapi preview embedding

### Docker Deployment

The project uses **Next.js standalone mode** with multi-stage Docker builds:

**Dockerfile highlights:**
- Multi-stage build (builder + runner)
- Standalone output for minimal image size
- Static assets and public files copied explicitly
- Non-root user for security
- Health checks for container orchestration

**Build the image:**
```bash
docker build -t ruach-next -f apps/ruach-next/Dockerfile .
```

**Run the container:**
```bash
docker run -p 3000:3000 \
  -e NEXTAUTH_URL=https://your-domain.com \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXT_PUBLIC_STRAPI_URL=https://cms.your-domain.com \
  ruach-next
```

### Environment Variables

**Required:**
- `NEXTAUTH_URL` - Your application URL
- `NEXTAUTH_SECRET` - Secret for NextAuth.js (32+ chars)
- `NEXT_PUBLIC_STRAPI_URL` - Strapi CMS URL
- `STRAPI_REVALIDATE_SECRET` - Secret for webhook revalidation

**Optional:**
- `NEXT_PUBLIC_AI_ASSISTANT_ENABLED` - Enable AI assistant (true/false)
- `ANTHROPIC_API_KEY` - For AI features
- `UPSTASH_REDIS_REST_URL` - Redis URL for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis auth token
- `SENTRY_DSN` - Sentry error tracking
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` - Plausible analytics domain

### Required Strapi Content Types

- **course** - `title`, `slug`, `description`, `cover (media)`, relation to `lessons`
- **lesson** - `title`, `slug`, `order (int)`, `video_url`, relation to course
- **media-item** - `title`, `slug`, `description`, `category`, `video_url`, `thumbnail`
- **lesson-progress** - `user`, `courseSlug`, `lessonSlug`, `completed (bool)`, `secondsWatched (int)`
- **lesson-comment** - `user`, `courseSlug`, `lessonSlug`, `text`, `approved (bool)`
- **comment-report** - `user`, `commentId (string)`, `reason (text)`

> Configure Strapi permissions to return only the current user's data when authorized.

### Cache & Revalidation

Create a Strapi webhook that POSTs to `/api/strapi-revalidate`:

```javascript
// Webhook payload
{
  "model": "course",
  "entry": { "slug": "your-course-slug" }
}
```

The endpoint will:
1. Verify the `STRAPI_REVALIDATE_SECRET`
2. Extract the slug from the payload
3. Call `revalidateTag("course:your-course-slug")`
4. Return success/error response

### Recent Improvements

**i18n Routing Fix (2024)**
- Fixed middleware to preserve i18n context (no longer creates new response)
- Static imports prevent message files from being tree-shaken
- Locale routes (`/en`, `/es`, etc.) now work correctly in production

**Docker Standalone Optimization**
- Multi-stage builds reduce image size
- Proper handling of `.next/standalone` output
- Correct `server.js` entrypoint configuration

---

## Development

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)

# Building
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm typecheck        # Run TypeScript compiler check

# Testing
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
```

### Adding a New Locale

1. Add locale to `src/i18n.ts`:
   ```typescript
   export const locales = ['en', 'es', 'fr', 'pt', 'de'] as const;
   ```

2. Create message file `src/messages/de.json`

3. Add static import in `src/i18n.ts`:
   ```typescript
   import deMessages from './messages/de.json';
   const messages = { en: enMessages, ..., de: deMessages };
   ```

4. Update `generateStaticParams` in `src/app/[locale]/layout.tsx` (already handles all locales)

---
