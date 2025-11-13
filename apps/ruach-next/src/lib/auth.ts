import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;
const CONFIRM_REDIRECT = process.env.STRAPI_EMAIL_CONFIRM_REDIRECT || (process.env.NEXTAUTH_URL + "/confirmed");

// JWT expiration times
const JWT_MAX_AGE = 60 * 60; // 1 hour (in seconds)
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days (in seconds)
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes (in milliseconds)

// Type definitions for JWT token
interface JWTToken {
  strapiJwt?: string;
  accessTokenExpires?: number;
  lastActivity?: number;
  error?: 'RefreshAccessTokenError' | 'IdleTimeout';
  sub?: string;
  email?: string;
  name?: string;
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
      error: undefined
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError"
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = credentials.email;
        const password = credentials.password;

        const r = await fetch(`${STRAPI}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password }),
          credentials: "include" // Include cookies for refresh token
        });

        const j = await r.json() as StrapiResponse;

        if (!r.ok || isStrapiError(j)) {
          // If not confirmed, bubble up message
          throw new Error(j.error?.message || "Login failed");
        }

        // Expect Strapi returns { jwt, user }
        // Refresh token is set in httpOnly cookie by backend
        return {
          id: String(j.user.id),
          name: j.user.username || j.user.email,
          email: j.user.email,
          strapiJwt: j.jwt
        };
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
        return {
          ...token,
          strapiJwt: (user as { strapiJwt?: string }).strapiJwt,
          accessTokenExpires: Date.now() + JWT_MAX_AGE * 1000,
          lastActivity: Date.now(),
          error: undefined
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
      };
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
};
