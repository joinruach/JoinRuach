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

# Install pnpm globally so platforms that override CMD with "pnpm start" still work
RUN npm install -g pnpm@9.12.0

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/false nodejs

# Copy the standalone Next.js build (includes server.js + minimal node_modules)
COPY --from=builder /repo/apps/ruach-next/.next/standalone ./

# Ensure .next/static directory exists and copy static assets
# Next.js standalone doesn't include static files, so we copy them separately
RUN mkdir -p ./apps/ruach-next/.next/static
COPY --from=builder /repo/apps/ruach-next/.next/static ./apps/ruach-next/.next/static

# Copy public files
RUN mkdir -p ./apps/ruach-next/public
COPY --from=builder /repo/apps/ruach-next/public ./apps/ruach-next/public

# Replace package.json in the app directory with correct start script for standalone
# The standalone build copies the original package.json which has "next start"
# but standalone doesn't include the next CLI, only server.js
RUN echo '{"name":"ruach-next","scripts":{"start":"node server.js"}}' > ./apps/ruach-next/package.json

# Create a minimal package.json at root as backup
RUN echo '{"scripts":{"start":"node apps/ruach-next/server.js"}}' > package.json

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Healthcheck - verify Next.js is responding
# Uses $PORT environment variable (defaults to 3000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Use Next.js standalone entrypoint in the monorepo structure
# Change to the app directory so server.js can find .next and other files
WORKDIR /app/apps/ruach-next
CMD ["node", "server.js"]
