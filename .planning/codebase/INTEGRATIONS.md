# External Integrations

**Analysis Date:** 2026-01-08

## APIs & External Services

**Payment Processing:**
- Stripe - Subscription billing, one-time donations, course payments
  - SDK/Client: stripe npm package v16.9.0
  - Auth: API key in STRIPE_SECRET_KEY env var
  - Implementation: `apps/ruach-next/src/lib/stripe.ts`, `apps/ruach-next/src/app/api/checkout/*/route.ts`
  - Webhooks: `ruach-ministries-backend/src/api/stripe/controllers/webhook.ts`
  - Config: STRIPE_PRICE_ID, STRIPE_CHECKOUT_SUCCESS_URL, STRIPE_WEBHOOK_SECRET

**Email Services:**
- SendGrid - Transactional emails (prayer requests, contact forms)
  - SDK/Client: @sendgrid/mail v8.1.6
  - Auth: SENDGRID_API_KEY env var
  - Implementation: `apps/ruach-next/src/lib/email/sendPrayerRequest.ts`
  - From address: EMAIL_FROM, PRAYER_TEAM_EMAIL

- Resend - Alternative email provider (Strapi)
  - Provider: @strapi/provider-email-resend
  - Auth: RESEND_API_KEY env var
  - Config: EMAIL_PROVIDER selection

**External AI APIs:**
- Anthropic Claude - AI chat assistant, content generation
  - SDK/Client: @ai-sdk/anthropic v2.0.44
  - Auth: ANTHROPIC_API_KEY env var
  - Implementation: `apps/ruach-next/src/app/api/chat/route.ts`, `apps/ruach-next/src/components/ai/RuachAssistant.tsx`

- OpenAI - Embeddings, transcription, semantic search
  - SDK/Client: openai v6.8.1
  - Auth: OPENAI_API_KEY env var
  - Used for: Vector embeddings, audio transcription

**Social Media Publishing:**
- YouTube - Video publishing and management
  - SDK/Client: googleapis v140.0.1
  - Auth: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
  - Endpoint: `/api/youtube/callback`

- Facebook/Instagram - Social posts via Graph API
  - Auth: FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_PAGE_ID
  - Config: FACEBOOK_API_VERSION, INSTAGRAM_BUSINESS_ACCOUNT_ID

- X (Twitter) - Social media publishing
  - Auth: X_API_BEARER_TOKEN

- Truth Social, Patreon, Locals, Rumble
  - Auth: Platform-specific access tokens in env vars
  - Plugin: `ruach-ministries-backend/src/plugins/ruach-publisher`

**Knowledge Management:**
- Notion - Canon audit system integration
  - SDK/Client: @notionhq/client v5.6.0
  - Auth: NOTION_API_KEY, NOTION_DATABASE_ID

**Newsletter & Email Marketing:**
- ConvertKit - Newsletter subscriptions
  - Auth: NEXT_PUBLIC_CONVERTKIT_FORM_ID, NEXT_PUBLIC_CONVERTKIT_API_KEY, CONVERTKIT_API_SECRET
  - Client-side integration

## Data Storage

**Databases:**
- PostgreSQL with pgvector - Primary data store
  - Connection: DATABASE_URL env var
  - Client: pg v8.16.3, Knex v3.1.0 (via Strapi)
  - Docker: pgvector/pgvector:pg15 image (`docker-compose.yml`)
  - Migrations: Strapi migrations system

**File Storage:**
- Cloudflare R2 - Primary object storage (S3-compatible)
  - Provider: strapi-provider-upload-cloudflare-r2 v1.0.2
  - Auth: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY
  - Buckets: CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_PUBLIC_URL

- AWS S3 - Alternative object storage
  - SDK/Client: @aws-sdk/client-s3, @aws-sdk/s3-request-presigner

- DigitalOcean Spaces - Build logs storage
  - Auth: DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_BUCKET
  - Config: DO_SPACES_REGION, DO_SPACES_ENDPOINT

- MinIO - Local S3-compatible development storage
  - Docker: `docker-compose.yml` (minio service)
  - Ports: 9000 (API), 9001 (console)

**Caching:**
- Redis - Session storage, caching, job queues
  - Connection: REDIS_URL env var
  - Client: ioredis v5.8.2
  - Docker: redis:7-alpine (`docker-compose.yml`)

- Upstash Redis - Serverless Redis (production)
  - SDK/Client: @upstash/redis v1.30.0, @upstash/ratelimit v1.0.2
  - Auth: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
  - Implementation: `apps/ruach-next/src/lib/redis.ts`

## Authentication & Identity

**Auth Provider:**
- NextAuth v5 (beta) - JWT-based authentication
  - Implementation: `apps/ruach-next/src/lib/auth.ts`
  - Token storage: httpOnly cookies
  - Session management: JWT refresh tokens
  - Config: NEXTAUTH_SECRET, NEXTAUTH_URL

- Strapi Users & Permissions - Backend authentication
  - Plugin: @strapi/plugin-users-permissions
  - JWT_SECRET, ADMIN_JWT_SECRET env vars
  - Policies: `ruach-ministries-backend/src/policies/`

**OAuth Integrations:**
- Social providers configured via NextAuth
- YouTube OAuth for video publishing

## Monitoring & Observability

**Error Tracking:**
- Sentry - Frontend and backend error tracking
  - SDK: @sentry/nextjs v10.32.1
  - DSN: Configured in Sentry dashboard

**Analytics:**
- Plausible Analytics - Privacy-focused web analytics
  - Configuration: NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  - Implementation: `apps/ruach-next/src/app/[locale]/layout.tsx`
  - Script: https://plausible.io/js/script.js

**Logs:**
- Winston v3.11.0 - Structured logging (backend)
  - Implementation: `ruach-ministries-backend`
- Logtail (BetterStack) - Log aggregation
  - Configuration: LOGTAIL_SOURCE_TOKEN

## CI/CD & Deployment

**Hosting:**
- Vercel - Next.js frontend hosting
  - Deployment: Automatic on main branch push
  - Environment vars: Configured in Vercel dashboard

- Docker Containers - Strapi backend deployment
  - Dockerfiles: `ruach-ministries-backend/Dockerfile`, `apps/ruach-next/Dockerfile`
  - Orchestration: `docker-compose.yml`

**CI Pipeline:**
- GitHub Actions (inferred from typical Next.js/monorepo setup)
  - Test scripts: `pnpm test`, `pnpm test:ci`
  - Lint: `pnpm lint`
  - Type check: `pnpm typecheck`

## Environment Configuration

**Development:**
- Required env vars: See `.env.example` and `.env.production.example`
- Secrets location: Local `.env` files (gitignored)
- Mock services: MinIO (S3), local PostgreSQL, local Redis via Docker

**Production:**
- Secrets management: Vercel environment variables, Docker secrets
- Database: PostgreSQL with pgvector extension
- Storage: Cloudflare R2 or AWS S3
- Redis: Upstash (serverless)

## Webhooks & Callbacks

**Incoming:**
- Stripe - Payment webhooks
  - Endpoint: `ruach-ministries-backend/src/api/stripe/controllers/webhook.ts`
  - Verification: Signature validation via stripe.webhooks.constructEvent
  - Events: payment_intent.succeeded, customer.subscription.*, etc.

- YouTube OAuth - OAuth2 callback
  - Endpoint: `/api/youtube/callback`

**Outgoing:**
- Social media publishing webhooks (via ruach-publisher plugin)
- Email notifications (SendGrid/Resend)

---

*Integration audit: 2026-01-08*
*Update when adding/removing external services*
