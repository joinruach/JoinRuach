import NextAuth, { type User, type Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { fetchUserRole } from './authorization';

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;
const CONFIRM_REDIRECT = process.env.STRAPI_EMAIL_CONFIRM_REDIRECT || (process.env.NEXTAUTH_URL + "/confirmed");

// JWT expiration times
const JWT_MAX_AGE = 60 * 60; // 1 hour (in seconds)
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days (in seconds)
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes (in milliseconds)

// Type definitions for JWT token
interface JWTToken extends JWT {
  strapiJwt?: string;
  accessTokenExpires?: number;
  lastActivity?: number;
  error?: 'RefreshAccessTokenError' | 'IdleTimeout';
  role?: string;
  userId?: string;
}

// Strapi API response types
interface StrapiLoginResponse {
  jwt: string;
  user: {
    id: number;
    username: string | null;
    email: string;
    confirmed: boolean;
  };
}

interface StrapiErrorResponse {
  error?: {
    status: number;
    name: string;
    message: string;
  };
}

type StrapiResponse = StrapiLoginResponse | StrapiErrorResponse;

interface RefreshedToken {
  jwt: string;
  user?: {
    id: number;
    email: string;
    username?: string;
  };
}

interface ExtendedUser extends User {
  strapiJwt?: string;
  role?: string;
  userId?: string;
}

function isStrapiError(response: StrapiResponse): response is StrapiErrorResponse {
  return 'error' in response;
}

// Helper to refresh the access token using refresh token from Strapi
async function refreshAccessToken(token: JWTToken): Promise<JWTToken> {
  try {
    const response = await fetch(`${STRAPI}/api/auth/refresh-token`, {
      method: "GET",
      credentials: "include", // Include cookies (refresh token)
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const refreshedTokens = await response.json() as RefreshedToken;

    return {
      ...token,
      strapiJwt: refreshedTokens.jwt,
      accessTokenExpires: Date.now() + JWT_MAX_AGE * 1000,
      error: undefined,
      // Preserve role and userId during token refresh
      role: token.role,
      userId: token.userId,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError"
    };
  }
}

const nextAuth = NextAuth({
  trustHost: true, // Trust the host header in production (required for proxied environments)
  useSecureCookies: process.env.NODE_ENV === 'production', // Use secure cookies in production
  cookies: {
    csrfToken: {
      name: '__Host-next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          console.log("[Auth] Attempting login for:", email);
          console.log("[Auth] Strapi URL:", STRAPI);

          const r = await fetch(`${STRAPI}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: email, password }),
            credentials: "include" // Include cookies for refresh token
          });

          console.log("[Auth] Strapi response status:", r.status);

          let responsePayload: StrapiResponse | null = null;
          try {
            responsePayload = (await r.json()) as StrapiResponse;
          } catch (err) {
            console.error("[Auth] Failed to parse Strapi response:", err);
          }

          if (!responsePayload) {
            const fallbackMessage = r.statusText || "Login failed";
            const fallbackStatus = r.status;
            console.error("[Auth] Strapi error:", fallbackMessage, {
              status: fallbackStatus,
              payload: null,
            });

            const isClientError = fallbackStatus >= 400 && fallbackStatus < 500;
            if (isClientError) {
              return null;
            }

            throw new Error(fallbackMessage);
          }

          const strapiError = isStrapiError(responsePayload)
            ? responsePayload.error
            : undefined;

          const errorMessage = strapiError?.message || r.statusText || "Login failed";
          const statusCode = strapiError?.status || r.status;

          if (!r.ok || strapiError) {
            console.error("[Auth] Strapi error:", errorMessage, {
              status: statusCode,
              payload: responsePayload,
            });

            const isClientError = statusCode >= 400 && statusCode < 500;
            if (isClientError) {
              return null;
            }

            throw new Error(errorMessage);
          }

          const loginResponse = responsePayload as StrapiLoginResponse;

          console.log("[Auth] Login successful for user:", loginResponse.user.id);

          // Fetch user role from Strapi
          const userRole = await fetchUserRole(
            STRAPI,
            loginResponse.jwt,
            String(loginResponse.user.id)
          );

          console.log("[Auth] User role determined:", userRole);

          // Expect Strapi returns { jwt, user }
          // Refresh token is set in httpOnly cookie by backend
          return {
            id: String(loginResponse.user.id),
            name: loginResponse.user.username || loginResponse.user.email,
            email: loginResponse.user.email,
            strapiJwt: loginResponse.jwt,
            role: userRole,
            userId: String(loginResponse.user.id),
          } as ExtendedUser;
        } catch (error) {
          console.error("[Auth] Login error:", error);
          throw new Error(error instanceof Error ? error.message : "Internal Server Error");
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: JWT_MAX_AGE // 1 hour session
  },
  jwt: {
    maxAge: JWT_MAX_AGE // 1 hour JWT expiration
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        const extendedUser = user as ExtendedUser;
        return {
          ...token,
          strapiJwt: extendedUser.strapiJwt,
          accessTokenExpires: Date.now() + JWT_MAX_AGE * 1000,
          lastActivity: Date.now(),
          error: undefined,
          role: extendedUser.role,
          userId: extendedUser.userId,
        };
      }

      // Update activity on session update
      if (trigger === "update") {
        return {
          ...token,
          lastActivity: Date.now(),
        };
      }

      // Check idle timeout
      const lastActivity = (token.lastActivity as number | undefined) || Date.now();
      const now = Date.now();

      if (now - lastActivity > IDLE_TIMEOUT) {
        // User has been idle for > 30 minutes
        console.log("Session expired due to inactivity");
        return {
          ...token,
          error: "IdleTimeout"
        };
      }

      // Return previous token if the access token has not expired yet
      const accessTokenExpires = token.accessTokenExpires as number | undefined;
      if (accessTokenExpires && Date.now() < accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      console.log("Access token expired, refreshing...");
      return refreshAccessToken(token as JWTToken);
    },
    async session({ session, token }) {
      const typedToken = token as JWTToken;

      return {
        ...session,
        strapiJwt: typedToken.strapiJwt,
        error: typedToken.error,
        lastActivity: typedToken.lastActivity,
        role: typedToken.role,
        userId: typedToken.userId,
      } as Session & { strapiJwt?: string; error?: string; lastActivity?: number; role?: string; userId?: string };
    }
  },
  pages: {
    signIn: "/login"
  },
  events: {
    async signOut() {
      // Call backend logout endpoint to clear refresh token
      try {
        await fetch(`${STRAPI}/api/auth/logout`, {
          method: "POST",
          credentials: "include"
        });
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
  }
});

export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth;
export const signIn: typeof nextAuth.signIn = nextAuth.signIn as any;
export const signOut = nextAuth.signOut;

// For backward compatibility, export authOptions
export const authOptions = {
  providers: [],
  // ... other options
};
