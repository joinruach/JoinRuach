# ---------- Builder (Debian base; avoids native segfaults) ----------
FROM node:20-bookworm-slim AS builder
ENV NODE_ENV=development
WORKDIR /repo

# Install pnpm globally (avoid runtime Corepack downloads)
RUN npm install -g pnpm@9.12.0

# Native build tools (for any deps like sharp, bcrypt, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git python3 make g++ pkg-config libvips-dev \
 && rm -rf /var/lib/apt/lists/*

# ---- Better layer caching: copy manifests first ----
# Build context is monorepo root, so paths are relative to root
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
# Workspace integrity: root package.json depends on this workspace package.
COPY packages/guidebook-renderer/package.json ./packages/guidebook-renderer/package.json
COPY packages/guidebook-parser/package.json ./packages/guidebook-parser/package.json
COPY ruach-ministries-backend/package.json ./ruach-ministries-backend/package.json
COPY ruach-ministries-backend/.pnpmfile.cjs ./ruach-ministries-backend/.pnpmfile.cjs
COPY ruach-ministries-backend/scripts ./ruach-ministries-backend/scripts

# Install WITH devDependencies for backend workspace only
RUN pnpm install --frozen-lockfile --filter=ruach-ministries-backend...

# Copy backend source files
COPY ruach-ministries-backend ./ruach-ministries-backend

# Build the Strapi admin panel
WORKDIR /repo/ruach-ministries-backend
RUN pnpm run build

# Produce a pruned production bundle with dependencies (includes build artifacts)
RUN pnpm deploy --filter ruach-ministries-backend /opt/strapi \
 && if [ -d ./dist ]; then cp -r ./dist /opt/strapi/dist; fi

# ---------- Runner (prod) ----------
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /opt/strapi

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl libvips \
 && rm -rf /var/lib/apt/lists/*

# Install pnpm globally for runtime (match builder version)
RUN npm install -g pnpm@9.12.0

# Create non-root user for security
RUN groupadd -r strapi \
 && useradd -r -g strapi -d /home/strapi -s /bin/false strapi \
 && mkdir -p /home/strapi \
 && chown strapi:strapi /home/strapi

ENV HOME=/home/strapi

# Copy pruned production bundle (code + node_modules)
COPY --from=builder --chown=strapi:strapi /opt/strapi ./

# Switch to non-root user
USER strapi

# Strapi default port
EXPOSE 1337

# Healthcheck - verify Strapi is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:1337/_health || exit 1

# Start Strapi
CMD ["pnpm", "start"]
