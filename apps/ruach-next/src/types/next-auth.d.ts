import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    strapiJwt?: string;
    error?: string; // Error from token refresh
    lastActivity?: number; // Timestamp of last user activity
    role?: string; // User role from Strapi
    userId?: string; // Strapi user ID
  }

  interface User {
    strapiJwt?: string;
    role?: string; // User role from Strapi
    userId?: string; // Strapi user ID
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    strapiJwt?: string;
    accessTokenExpires?: number; // Timestamp when access token expires
    error?: string; // Error from token refresh
    lastActivity?: number; // Timestamp of last user activity
    role?: string; // User role from Strapi
    userId?: string; // Strapi user ID
  }
}
