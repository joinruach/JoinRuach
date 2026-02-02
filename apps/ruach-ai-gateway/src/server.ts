import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./core/auth.js";
import { rateLimitMiddleware } from "./core/ratelimit.js";
import { chat } from "./routes/chat.js";

// Create the app
const app = new Hono();

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "https://joinruach.org",
      "https://www.joinruach.org",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "x-internal-auth", "x-user-id", "x-user-tier", "x-user-roles", "x-user-locale"],
  })
);

// Health check (no auth required)
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "ruach-ai-gateway",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// Protected routes
const v1 = new Hono();

// Apply auth and rate limiting to all v1 routes
v1.use("*", authMiddleware);
v1.use("*", rateLimitMiddleware);

// Mount routes
v1.route("/chat", chat);

// Mount v1 under /v1
app.route("/v1", v1);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("[ERROR]", err);
  return c.json({ error: "Internal server error" }, 500);
});

// Start server
const port = parseInt(process.env.PORT || "4000", 10);

console.log(`🚀 Ruach AI Gateway starting on port ${port}`);
console.log(`   Health: http://localhost:${port}/health`);
console.log(`   Chat:   http://localhost:${port}/v1/chat/stream`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
