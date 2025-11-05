import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    strapiJwt?: string;
    error?: string; // Error from token refresh
    lastActivity?: number; // Timestamp of last user activity
  }

  interface User {
    strapiJwt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    strapiJwt?: string;
    accessTokenExpires?: number; // Timestamp when access token expires
    error?: string; // Error from token refresh
    lastActivity?: number; // Timestamp of last user activity
  }
}
