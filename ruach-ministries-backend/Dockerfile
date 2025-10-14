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
COPY ruach-ministries-backend/package.json ruach-ministries-backend/package.json
COPY ruach-ministries-backend/pnpm-lock.yaml ruach-ministries-backend/pnpm-lock.yaml
COPY ruach-ministries-backend/.pnpmfile.cjs ruach-ministries-backend/.pnpmfile.cjs
COPY ruach-ministries-backend/scripts ruach-ministries-backend/scripts

# Install WITH devDependencies for build step
RUN pnpm --dir ruach-ministries-backend install --frozen-lockfile

# Copy the rest of the backend source and build Strapi admin
COPY . ruach-ministries-backend
RUN pnpm --dir ruach-ministries-backend run build

# Prune to production deps, copy the bundle, and rebuild node_modules for /opt/strapi
RUN pnpm --dir ruach-ministries-backend prune --prod \
 && mkdir -p /opt/strapi \
 && cp -R ruach-ministries-backend/. /opt/strapi \
 && rm -rf /opt/strapi/node_modules \
 && pnpm --dir /opt/strapi install --prod --frozen-lockfile --store-dir /opt/strapi/.pnpm-store

# ---------- Runner (prod) ----------
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /opt/strapi

# Enable pnpm for runtime scripts
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

# Copy pruned backend (code + prod node_modules + built admin)
COPY --from=builder /opt/strapi/ ./

# Strapi default port
EXPOSE 1337

# Start Strapi (uses the backend's package.json "start")
CMD ["pnpm","start"]
