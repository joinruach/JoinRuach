import { z } from "zod";

// User tiers for rate limiting and cost budgets
export type UserTier = "free" | "supporter" | "partner" | "builder" | "admin";

// Chat modes for provider routing
export type ChatMode = "pastoral" | "study" | "creative" | "ops";

// Message schema
export const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

// Chat request schema
export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  userId: z.string(),
  sessionId: z.string().optional(),
  locale: z.enum(["en", "es", "fr", "pt"]).default("en"),
  mode: z.enum(["pastoral", "study", "creative", "ops"]).default("pastoral"),
  maxTokens: z.number().max(4096).default(1024),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Usage tracking
export interface UsageRecord {
  userId: string;
  sessionId?: string;
  provider: "anthropic" | "openai";
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  mode: ChatMode;
  locale: string;
  createdAt: Date;
}

// Rate limit config by tier
export const RATE_LIMITS: Record<UserTier, { requests: number; window: string }> = {
  free: { requests: 10, window: "1h" },
  supporter: { requests: 30, window: "1h" },
  partner: { requests: 100, window: "1h" },
  builder: { requests: 300, window: "1h" },
  admin: { requests: 1000, window: "1h" },
};

// Daily token budgets by tier
export const TOKEN_BUDGETS: Record<UserTier, number> = {
  free: 10_000,
  supporter: 50_000,
  partner: 200_000,
  builder: 500_000,
  admin: 2_000_000,
};

// Cost per 1K tokens (approximate, adjust as needed)
export const TOKEN_COSTS = {
  anthropic: {
    "claude-sonnet-4-20250514": { input: 0.003, output: 0.015 },
    "claude-3-5-haiku-20241022": { input: 0.0008, output: 0.004 },
  },
  openai: {
    "gpt-4o": { input: 0.005, output: 0.015 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  },
} as const;

// Internal auth context
export interface AuthContext {
  userId: string;
  tier: UserTier;
  roles: string[];
  locale: string;
}

// Gateway environment variables
export interface GatewayEnv {
  PORT: number;
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY?: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  INTERNAL_AUTH_SECRET: string;
  STRAPI_URL?: string;
  STRAPI_API_TOKEN?: string;
}
