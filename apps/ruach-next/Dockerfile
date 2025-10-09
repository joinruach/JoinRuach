# ---------- Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

# Copy whole monorepo so workspaces resolve
COPY . .

# Install & build via workspaces
RUN pnpm -w install --frozen-lockfile \
 && pnpm -w --filter @ruach/components run build \
 && pnpm -w --filter @ruach/addons run build \
 && pnpm -w --filter ruach-next... run build

# ---------- Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

# Copy only the built app + runtime files
COPY --from=builder /app/apps/ruach-next/.next ./.next
COPY --from=builder /app/apps/ruach-next/public ./public
COPY --from=builder /app/apps/ruach-next/package.json ./package.json
COPY --from=builder /app/apps/ruach-next/next.config.* ./  # mjs/cjs supported

# Install prod deps for the app
RUN pnpm install --prod --no-optional

EXPOSE 3000
CMD ["pnpm","start"]
