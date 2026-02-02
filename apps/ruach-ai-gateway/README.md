# Ruach AI Gateway

Centralized AI service for the Ruach platform. Handles streaming chat, rate limiting, cost tracking, and provider routing.

## Architecture

```
ruach-next ──► ruach-ai-gateway ──► Anthropic/OpenAI
                     │
                     ▼
                   Redis (rate limits, budgets)
```

## Features

- **Streaming Chat (SSE)** - Real-time AI responses
- **Rate Limiting** - Per-user/tier limits via Upstash Redis
- **Cost Tracking** - Token usage and cost accounting
- **Provider Routing** - Anthropic vs OpenAI based on mode/tier
- **Auth Gating** - Unauthenticated users get signup prompts (no AI usage)

## API Endpoints

### `POST /v1/chat/stream`

Streaming chat endpoint (SSE).

**Headers:**
- `x-internal-auth` - Shared secret (required)
- `x-user-id` - User ID (required)
- `x-user-tier` - User tier: free/supporter/partner/builder/admin
- `x-user-locale` - Locale: en/es/fr/pt

**Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "mode": "pastoral",
  "maxTokens": 1024
}
```

**Response:** Server-Sent Events stream

### `GET /health`

Health check endpoint.

## Rate Limits by Tier

| Tier | Requests/Hour | Daily Tokens |
|------|--------------|--------------|
| free | 10 | 10,000 |
| supporter | 30 | 50,000 |
| partner | 100 | 200,000 |
| builder | 300 | 500,000 |
| admin | 1,000 | 2,000,000 |

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build
pnpm build

# Type check
pnpm typecheck
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
PORT=4000
INTERNAL_AUTH_SECRET=your-secret
ANTHROPIC_API_KEY=sk-ant-...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## Deployment

### DigitalOcean App Platform

Add as a new service with:
- **Build Command:** `pnpm build`
- **Run Command:** `pnpm start`
- **HTTP Port:** 4000

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
CMD ["pnpm", "start"]
EXPOSE 4000
```

## Integration with ruach-next

In ruach-next's `.env`:

```bash
AI_GATEWAY_URL=http://localhost:4000
AI_GATEWAY_SHARED_SECRET=your-secret
```

The `/api/ai/chat` route will proxy to the gateway when `AI_GATEWAY_URL` is set.
