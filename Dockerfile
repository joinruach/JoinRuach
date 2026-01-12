# ---------- Builder ----------
FROM node:20-bookworm-slim AS builder
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo

# Force rebuild when needed (even if unused)
ARG FORCE_REBUILD=0

# Install pnpm globally for consistency
RUN npm install -g pnpm@9.9.0

# Install native build deps for sharp/swc
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# Copy manifests for better caching
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY .npmrc .npmrc
COPY apps/ruach-next/package.json apps/ruach-next/package.json
COPY packages/guidebook-agent/package.json packages/guidebook-agent/package.json
COPY packages/guidebook-parser/package.json packages/guidebook-parser/package.json
COPY packages/guidebook-renderer/package.json packages/guidebook-renderer/package.json
COPY packages/ruach-ai/package.json packages/ruach-ai/package.json
COPY packages/ruach-components/package.json packages/ruach-components/package.json
COPY packages/ruach-hooks/package.json packages/ruach-hooks/package.json
COPY packages/ruach-icons/package.json packages/ruach-icons/package.json
COPY packages/ruach-formation/package.json packages/ruach-formation/package.json
COPY packages/ruach-next-addons/package.json packages/ruach-next-addons/package.json
COPY packages/ruach-types/package.json packages/ruach-types/package.json
COPY packages/ruach-utils/package.json packages/ruach-utils/package.json
COPY packages/tailwind-preset/package.json packages/tailwind-preset/package.json
COPY ruach-ministries-backend/package.json ruach-ministries-backend/package.json
COPY ruach-ministries-backend/scripts/link-dependencies.js ruach-ministries-backend/scripts/link-dependencies.js
COPY ruach-ministries-backend/scripts/patch-review-workflows.js ruach-ministries-backend/scripts/patch-review-workflows.js

# Install dependencies (need devDeps for build; some platforms set NODE_ENV=production during build)
RUN pnpm install --no-frozen-lockfile --prod=false

# Copy full repo contents
COPY . .

# Build-time env defaults for Next.js validation
ARG NEXTAUTH_URL=http://localhost:3000
ARG NEXTAUTH_SECRET=dev_dev_dev_dev_dev_dev_123456789012
ARG NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
ARG STRAPI_REVALIDATE_SECRET=dev-revalidate-secret
ARG STRAPI_API_TOKEN=

ENV NEXTAUTH_URL=${NEXTAUTH_URL} \
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
    NEXT_PUBLIC_STRAPI_URL=${NEXT_PUBLIC_STRAPI_URL} \
    STRAPI_REVALIDATE_SECRET=${STRAPI_REVALIDATE_SECRET} \
    STRAPI_API_TOKEN=${STRAPI_API_TOKEN}

# Ensure prod env for build after dev deps are installed
ENV NODE_ENV=production

# Build shared packages and Next.js app
RUN pnpm --filter @ruach/ai run build \
 && pnpm --filter @ruach/components run build \
 && pnpm --filter @ruach/addons run build \
 && pnpm --filter ./apps/ruach-next run build

# ---------- Runner ----------
FROM node:20-bookworm-slim AS runner
ARG STRAPI_API_TOKEN
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STRAPI_API_TOKEN=${STRAPI_API_TOKEN}
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# Non-root user for runtime
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/false nodejs

# Copy standalone Next.js output
COPY --from=builder /repo/apps/ruach-next/.next/standalone ./
COPY --from=builder /repo/apps/ruach-next/.next/static ./apps/ruach-next/.next/static
COPY --from=builder /repo/apps/ruach-next/public ./apps/ruach-next/public

# Fix ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

# Health check to ensure server responds
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Run the standalone Next.js server via absolute path
CMD ["node", "/app/apps/ruach-next/server.js"]
