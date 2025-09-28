import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Fallback limiter when Upstash credentials are not configured.
type LimitResult = Awaited<ReturnType<Ratelimit["limit"]>>;

type Limiter = {
  limit: (identifier: string) => Promise<LimitResult>;
};

function noopLimiter(limit: number): Limiter {
  return {
    async limit(): Promise<LimitResult> {
      return {
        success: true,
        remaining: limit,
        limit,
        reset: Date.now() + 60_000,
      };
    },
  };
}

function createLimiter(count: number, window: string, prefix: string): Limiter {
  if (!redis) {
    return noopLimiter(count);
  }
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(count, window), prefix });
}

export const signupLimiter = createLimiter(5, "10 m", "rl:signup");
export const resendLimiter = createLimiter(8, "10 m", "rl:resend");
export const reportsLimiter = createLimiter(5, "10 m", "rl:reports");
export const volunteerLimiter = createLimiter(5, "10 m", "rl:volunteer");
export const contactLimiter = createLimiter(6, "10 m", "rl:contact");
export const newsletterLimiter = createLimiter(10, "10 m", "rl:newsletter");

export function ipFromHeaders(h: Headers) {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
