# ---------- Builder ----------
FROM node:20-bookworm-slim AS builder
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo

# Install pnpm globally (avoid runtime Corepack downloads)
RUN npm install -g pnpm@9.9.0

# Native deps helpers (safe & small)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# Better layer caching: copy manifests first
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY .npmrc .npmrc
COPY apps/ruach-next/package.json apps/ruach-next/package.json
COPY packages/ruach-ai/package.json packages/ruach-ai/package.json
COPY packages/ruach-components/package.json packages/ruach-components/package.json
COPY packages/ruach-hooks/package.json packages/ruach-hooks/package.json
COPY packages/ruach-icons/package.json packages/ruach-icons/package.json
COPY packages/ruach-next-addons/package.json packages/ruach-next-addons/package.json
COPY packages/ruach-types/package.json packages/ruach-types/package.json
COPY packages/ruach-utils/package.json packages/ruach-utils/package.json
COPY packages/tailwind-preset/package.json packages/tailwind-preset/package.json

# Install with devDependencies
RUN pnpm install --no-frozen-lockfile

# Now copy the rest of the repo and build
COPY . .

# Promote build-time env vars so Next.js validates successfully inside Docker
ARG NEXTAUTH_URL=http://localhost:3000
ARG NEXTAUTH_SECRET=dev_dev_dev_dev_dev_dev_123456789012
ARG NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
ARG STRAPI_REVALIDATE_SECRET=dev-revalidate-secret

ENV NEXTAUTH_URL=${NEXTAUTH_URL} \
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
    NEXT_PUBLIC_STRAPI_URL=${NEXT_PUBLIC_STRAPI_URL} \
    STRAPI_REVALIDATE_SECRET=${STRAPI_REVALIDATE_SECRET}

RUN pnpm --filter @ruach/ai run build \
 && pnpm --filter @ruach/components run build \
 && pnpm --filter @ruach/addons run build \
 && pnpm --filter ruach-next... run build

# Produce a pruned production bundle for just the Next app
# (includes only prod deps + built .next)
RUN pnpm deploy --filter ruach-next /opt/app

# ---------- Runner (prod) ----------
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_HOME=/tmp/corepack \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/false nodejs

# Copy pruned app from builder
# The pnpm deploy command creates a flat structure at /opt/app
COPY --from=builder /opt/app/ ./

# Copy static assets and public files from the original build
# These are needed for standalone mode but not included in pnpm deploy
COPY --from=builder /repo/apps/ruach-next/.next/standalone ./
COPY --from=builder /repo/apps/ruach-next/.next/static ./apps/ruach-next/.next/static
COPY --from=builder /repo/apps/ruach-next/public ./apps/ruach-next/public

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Healthcheck - verify Next.js is responding
# Uses $PORT environment variable (defaults to 3000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Use node to run the standalone server directly
# This is required for output: 'standalone' mode
CMD ["node", "apps/ruach-next/server.js"]
