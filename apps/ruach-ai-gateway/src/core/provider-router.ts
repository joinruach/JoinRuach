import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { ChatMode, UserTier } from "../types/index.js";

// Initialize providers
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = process.env.OPENAI_API_KEY
  ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Model selection by mode
const MODEL_MAP: Record<ChatMode, { provider: "anthropic" | "openai"; model: string }> = {
  pastoral: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  study: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  creative: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  ops: { provider: "anthropic", model: "claude-3-5-haiku-20241022" }, // Faster for ops tasks
};

// Fallback models for cost optimization
const COST_OPTIMIZED_MODELS: Record<UserTier, { provider: "anthropic" | "openai"; model: string }> = {
  free: { provider: "anthropic", model: "claude-3-5-haiku-20241022" },
  supporter: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  partner: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  builder: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  admin: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
};

export interface ProviderSelection {
  provider: "anthropic" | "openai";
  model: string;
  languageModel: ReturnType<typeof anthropic> | ReturnType<typeof createOpenAI>;
}

/**
 * Select the appropriate provider and model based on mode and tier
 */
export function selectProvider(mode: ChatMode, tier: UserTier): ProviderSelection {
  // Free tier always gets cost-optimized model
  if (tier === "free") {
    const selection = COST_OPTIMIZED_MODELS.free;
    return {
      provider: selection.provider,
      model: selection.model,
      languageModel: anthropic(selection.model),
    };
  }

  // Select based on mode
  const selection = MODEL_MAP[mode];

  if (selection.provider === "openai" && !openai) {
    // Fallback to Anthropic if OpenAI not configured
    console.warn("OpenAI not configured, falling back to Anthropic");
    return {
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      languageModel: anthropic("claude-sonnet-4-20250514"),
    };
  }

  return {
    provider: selection.provider,
    model: selection.model,
    languageModel:
      selection.provider === "anthropic"
        ? anthropic(selection.model)
        : openai!(selection.model),
  };
}

/**
 * Get system prompt based on mode
 */
export function getSystemPrompt(mode: ChatMode, locale: string): string {
  const basePrompt = `You are a helpful assistant for Ruach Ministries, a faith-based community focused on spiritual growth and discipleship.

Language: Respond in ${locale === "en" ? "English" : locale === "es" ? "Spanish" : locale === "fr" ? "French" : "Portuguese"}.

Be warm, encouraging, and grounded in Scripture. Offer practical guidance while respecting the user's spiritual journey.`;

  const modePrompts: Record<ChatMode, string> = {
    pastoral: `${basePrompt}

You are providing pastoral care and spiritual guidance. Listen with compassion, offer biblical wisdom, and pray with those who are hurting. Be gentle and non-judgmental.`,

    study: `${basePrompt}

You are helping with Bible study and theological questions. Provide accurate biblical context, cross-references, and help users understand Scripture more deeply. Cite verses when relevant.`,

    creative: `${basePrompt}

You are helping with creative projects for ministry - writing, content creation, teaching materials. Be creative while staying true to biblical principles.`,

    ops: `${basePrompt}

You are helping with operational tasks - scheduling, planning, organization. Be efficient and practical while maintaining a ministry mindset.`,
  };

  return modePrompts[mode];
}

/**
 * Build context from RAG retrieval (placeholder)
 */
export async function buildContext(
  query: string,
  locale: string,
  mode: ChatMode
): Promise<string | null> {
  // TODO: Implement RAG retrieval
  // 1. Embed the query
  // 2. Search vector store
  // 3. Return relevant context

  return null;
}
