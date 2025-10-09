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

# Copy pruned app (code + prod node_modules)
COPY --from=builder /opt/app/ ./

EXPOSE 3000
CMD ["pnpm","start"]
