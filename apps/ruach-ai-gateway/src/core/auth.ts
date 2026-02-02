import type { Context, Next } from "hono";
import type { AuthContext, UserTier } from "../types/index.js";

const INTERNAL_AUTH_SECRET = process.env.INTERNAL_AUTH_SECRET || "dev-secret-change-me";

/**
 * Middleware to verify internal auth from ruach-next
 * Extracts user identity from headers
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("x-internal-auth");

  if (!authHeader || authHeader !== INTERNAL_AUTH_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Extract user identity from headers (set by ruach-next proxy)
  const userId = c.req.header("x-user-id");
  const tier = (c.req.header("x-user-tier") || "free") as UserTier;
  const roles = c.req.header("x-user-roles")?.split(",") || [];
  const locale = c.req.header("x-user-locale") || "en";

  if (!userId) {
    return c.json({ error: "Missing user identity" }, 401);
  }

  // Attach auth context
  c.set("auth", {
    userId,
    tier,
    roles,
    locale,
  } satisfies AuthContext);

  await next();
}

/**
 * Get auth context from request
 */
export function getAuthContext(c: Context): AuthContext {
  return c.get("auth") as AuthContext;
}

/**
 * Check if user has admin role
 */
export function isAdmin(ctx: AuthContext): boolean {
  return ctx.tier === "admin" || ctx.roles.includes("admin");
}

/**
 * Check if user has specific role
 */
export function hasRole(ctx: AuthContext, role: string): boolean {
  return ctx.roles.includes(role) || isAdmin(ctx);
}
