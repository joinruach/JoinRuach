# ---------- Builder (Debian base; avoids native segfaults) ----------
FROM node:20-bookworm-slim AS builder
ENV NODE_ENV=development
WORKDIR /repo

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

# Native build tools (for any deps like sharp, bcrypt, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# ---- Better layer caching: copy manifests first ----
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY .pnpmfile.cjs .pnpmfile.cjs
COPY scripts ./scripts

# Install WITH devDependencies for build step
RUN pnpm install --frozen-lockfile

# Copy the rest of the backend source and build Strapi admin
COPY . .
RUN pnpm run build

# Prune to production deps, copy the bundle, and rebuild node_modules for /opt/strapi
RUN pnpm prune --prod \
 && mkdir -p /opt/strapi \
 && tar -C . -cf - . | tar -C /opt/strapi -xf - \
 && rm -rf /opt/strapi/node_modules \
 && pnpm --dir /opt/strapi install --prod --frozen-lockfile --store-dir /opt/strapi/.pnpm-store

# ---------- Runner (prod) ----------
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /opt/strapi

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# Enable pnpm for runtime scripts
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

# Create non-root user for security
RUN groupadd -r strapi && useradd -r -g strapi -s /bin/false strapi

# Copy pruned backend (code + prod node_modules + built admin)
COPY --from=builder /opt/strapi/ ./

# Change ownership to non-root user
RUN chown -R strapi:strapi /opt/strapi

# Switch to non-root user
USER strapi

# Strapi default port
EXPOSE 1337

# Healthcheck - verify Strapi is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:1337/_health || exit 1

# Start Strapi (uses the backend's package.json "start")
CMD ["pnpm","start"]
