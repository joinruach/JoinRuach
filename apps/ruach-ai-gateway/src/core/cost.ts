import { TOKEN_COSTS, type UsageRecord, type ChatMode } from "../types/index.js";

/**
 * Calculate estimated cost for token usage
 */
type ModelCost = { input: number; output: number };

export function calculateCost(
  provider: "anthropic" | "openai",
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const costs = TOKEN_COSTS[provider];
  const modelCosts = (costs as Record<string, ModelCost>)[model];

  if (!modelCosts) {
    // Fallback to most expensive model pricing
    console.warn(`Unknown model ${model} for ${provider}, using fallback pricing`);
    return (promptTokens / 1000) * 0.01 + (completionTokens / 1000) * 0.03;
  }

  const inputCost = (promptTokens / 1000) * modelCosts.input;
  const outputCost = (completionTokens / 1000) * modelCosts.output;

  return inputCost + outputCost;
}

/**
 * Create usage record for logging/storage
 */
export function createUsageRecord(params: {
  userId: string;
  sessionId?: string;
  provider: "anthropic" | "openai";
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  mode: ChatMode;
  locale: string;
}): UsageRecord {
  const totalTokens = params.promptTokens + params.completionTokens;
  const estimatedCostUsd = calculateCost(
    params.provider,
    params.model,
    params.promptTokens,
    params.completionTokens
  );

  return {
    userId: params.userId,
    sessionId: params.sessionId,
    provider: params.provider,
    model: params.model,
    promptTokens: params.promptTokens,
    completionTokens: params.completionTokens,
    totalTokens,
    estimatedCostUsd,
    latencyMs: params.latencyMs,
    mode: params.mode,
    locale: params.locale,
    createdAt: new Date(),
  };
}

/**
 * Log usage to Strapi and console
 */
export async function logUsage(record: UsageRecord): Promise<void> {
  console.log("[USAGE]", JSON.stringify({
    userId: record.userId,
    provider: record.provider,
    model: record.model,
    tokens: record.totalTokens,
    cost: `$${record.estimatedCostUsd.toFixed(4)}`,
    latency: `${record.latencyMs}ms`,
    mode: record.mode,
  }));

  // Store in Strapi if configured
  const strapiUrl = process.env.STRAPI_URL;
  const strapiToken = process.env.STRAPI_API_TOKEN;

  if (strapiUrl && strapiToken) {
    try {
      const response = await fetch(`${strapiUrl}/api/ai-usages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${strapiToken}`,
        },
        body: JSON.stringify({
          data: {
            userId: record.userId,
            sessionId: record.sessionId,
            provider: record.provider,
            model: record.model,
            promptTokens: record.promptTokens,
            completionTokens: record.completionTokens,
            totalTokens: record.totalTokens,
            estimatedCostUsd: record.estimatedCostUsd,
            latencyMs: record.latencyMs,
            mode: record.mode,
            locale: record.locale,
            requestDate: record.createdAt.toISOString().split('T')[0],
          },
        }),
      });

      if (!response.ok) {
        console.error("[USAGE] Failed to log to Strapi:", response.status);
      }
    } catch (error) {
      console.error("[USAGE] Strapi logging error:", error);
      // Don't throw - logging failure shouldn't break the request
    }
  }
}

/**
 * Get aggregated usage stats for a user
 */
export async function getUserStats(userId: string): Promise<{
  todayTokens: number;
  todayCost: number;
  requestCount: number;
}> {
  // TODO: Query from database
  return {
    todayTokens: 0,
    todayCost: 0,
    requestCount: 0,
  };
}
