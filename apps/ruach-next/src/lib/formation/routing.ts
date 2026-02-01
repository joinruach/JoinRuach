/**
 * Formation Routing Utilities
 * Handles encoding/decoding of routing data for URL transmission
 */

import type { RoutingType } from "@/components/formation/RoutingDecision";
import type { AnalysisScores, SharpeningQuestion } from "@/components/formation/AIAnalysisDisplay";

export interface RoutingData {
  reflectionId: string;
  checkpointId: string;
  sectionId: string;
  phase: string;
  depthScore: number;
  routing: RoutingType;
  scores: AnalysisScores;
  summary: string;
  sharpeningQuestions: SharpeningQuestion[];
}

/**
 * Encode routing data to base64 for URL transmission
 */
export function encodeRoutingData(data: RoutingData): string {
  try {
    const json = JSON.stringify(data);
    if (typeof window === "undefined") {
      // Node.js environment (server-side)
      return Buffer.from(json).toString("base64");
    } else {
      // Browser environment
      return btoa(unescape(encodeURIComponent(json)));
    }
  } catch (error) {
    console.error("[Routing] Failed to encode data:", error);
    return "";
  }
}

/**
 * Decode routing data from base64 URL parameter
 */
export function decodeRoutingData(encoded: string): RoutingData | null {
  try {
    if (typeof window === "undefined") {
      // Node.js environment
      const json = Buffer.from(encoded, "base64").toString("utf-8");
      return JSON.parse(json) as RoutingData;
    } else {
      // Browser environment
      const json = decodeURIComponent(escape(atob(encoded)));
      return JSON.parse(json) as RoutingData;
    }
  } catch (error) {
    console.error("[Routing] Failed to decode data:", error);
    return null;
  }
}

/**
 * Get routing color scheme based on type
 */
export function getRoutingColor(
  type: RoutingType
): "green" | "blue" | "yellow" | "red" {
  switch (type) {
    case "publish":
      return "green";
    case "journal":
      return "blue";
    case "thread":
      return "yellow";
    case "review":
      return "red";
    default:
      return "blue";
  }
}

/**
 * Get routing display name
 */
export function getRoutingDisplayName(type: RoutingType): string {
  switch (type) {
    case "publish":
      return "Ready to Publish";
    case "journal":
      return "Save to Journal";
    case "thread":
      return "Continue with Prompts";
    case "review":
      return "Revisit Your Response";
    default:
      return "Formation Feedback";
  }
}

/**
 * Calculate depth score from individual scores
 */
export function calculateDepthScore(scores: AnalysisScores): number {
  return (
    (scores.depth + scores.specificity + scores.honesty + scores.alignment) / 4
  );
}

/**
 * Get routing type from depth score
 */
export function getRoutingFromScore(score: number): RoutingType {
  if (score >= 0.8) return "publish";
  if (score >= 0.6) return "journal";
  if (score >= 0.4) return "thread";
  return "review";
}
