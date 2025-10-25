# ---------- Builder ----------
FROM node:20-bookworm-slim AS builder
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

# Native deps helpers (safe & small)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# Better layer caching: copy manifests first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc .npmrc
COPY apps/ruach-next/package.json apps/ruach-next/package.json
COPY packages/ruach-components/package.json packages/ruach-components/package.json
COPY packages/ruach-next-addons/package.json packages/ruach-next-addons/package.json
COPY packages/tailwind-preset/package.json packages/tailwind-preset/package.json

# Install with devDependencies
RUN pnpm install --frozen-lockfile

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

RUN pnpm --filter @ruach/components run build \
 && pnpm --filter @ruach/addons run build \
 && pnpm --filter ruach-next... run build

# Produce a pruned production bundle for just the Next app
# (includes only prod deps + built .next)
RUN pnpm deploy --filter ruach-next /opt/app

# ---------- Runner (prod) ----------
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# Enable pnpm for runtime
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/false nodejs

# Copy pruned app (code + prod node_modules)
COPY --from=builder /opt/app/ ./

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Healthcheck - verify Next.js is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["pnpm","start"]
