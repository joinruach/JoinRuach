# ----------------------
# 1. Builder
# ----------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Install workspace dependencies
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY .npmrc .npmrc

# Copy all package.json files for proper workspace resolution
COPY apps/ruach-next/package.json apps/ruach-next/package.json
COPY packages/ruach-ai/package.json packages/ruach-ai/package.json
COPY packages/ruach-components/package.json packages/ruach-components/package.json
COPY packages/ruach-hooks/package.json packages/ruach-hooks/package.json
COPY packages/ruach-icons/package.json packages/ruach-icons/package.json
COPY packages/ruach-next-addons/package.json packages/ruach-next-addons/package.json
COPY packages/ruach-types/package.json packages/ruach-types/package.json
COPY packages/ruach-utils/package.json packages/ruach-utils/package.json
COPY packages/tailwind-preset/package.json packages/tailwind-preset/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the entire monorepo
COPY . .

# Build-time environment variables (with safe defaults)
ARG NEXTAUTH_URL=http://localhost:3000
ARG NEXTAUTH_SECRET=dev_dev_dev_dev_dev_dev_123456789012
ARG NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
ARG STRAPI_REVALIDATE_SECRET=dev-revalidate-secret

ENV NEXTAUTH_URL=${NEXTAUTH_URL} \
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
    NEXT_PUBLIC_STRAPI_URL=${NEXT_PUBLIC_STRAPI_URL} \
    STRAPI_REVALIDATE_SECRET=${STRAPI_REVALIDATE_SECRET} \
    NEXT_TELEMETRY_DISABLED=1

# Build workspace packages first, then the Next.js app
RUN pnpm --filter @ruach/ai build \
 && pnpm --filter @ruach/components build \
 && pnpm --filter @ruach/addons build \
 && pnpm --filter ruach-next build

# ----------------------
# 2. Runner
# ----------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy package files for production dependencies
COPY --from=builder /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/.npmrc ./.npmrc
COPY --from=builder /app/apps/ruach-next/package.json ./apps/ruach-next/package.json
COPY --from=builder /app/packages/ruach-ai/package.json ./packages/ruach-ai/package.json
COPY --from=builder /app/packages/ruach-components/package.json ./packages/ruach-components/package.json
COPY --from=builder /app/packages/ruach-hooks/package.json ./packages/ruach-hooks/package.json
COPY --from=builder /app/packages/ruach-icons/package.json ./packages/ruach-icons/package.json
COPY --from=builder /app/packages/ruach-next-addons/package.json ./packages/ruach-next-addons/package.json
COPY --from=builder /app/packages/ruach-types/package.json ./packages/ruach-types/package.json
COPY --from=builder /app/packages/ruach-utils/package.json ./packages/ruach-utils/package.json
COPY --from=builder /app/packages/tailwind-preset/package.json ./packages/tailwind-preset/package.json

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built packages from builder
COPY --from=builder /app/packages ./packages

# Copy Next.js build output
COPY --from=builder /app/apps/ruach-next/.next ./apps/ruach-next/.next
COPY --from=builder /app/apps/ruach-next/public ./apps/ruach-next/public
COPY --from=builder /app/apps/ruach-next/next.config.mjs ./apps/ruach-next/next.config.mjs

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Run Next.js start command
CMD ["pnpm", "--filter", "ruach-next", "start"]
