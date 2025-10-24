import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;
const CONFIRM_REDIRECT = process.env.STRAPI_EMAIL_CONFIRM_REDIRECT || (process.env.NEXTAUTH_URL + "/confirmed");

// JWT expiration times
const JWT_MAX_AGE = 60 * 60; // 1 hour (in seconds)
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days (in seconds)

// Helper to refresh the access token using refresh token from Strapi
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${STRAPI}/api/auth/refresh-token`, {
      method: "GET",
      credentials: "include", // Include cookies (refresh token)
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const refreshedTokens = await response.json();

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
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        const r = await fetch(`${STRAPI}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password }),
          credentials: "include" // Include cookies for refresh token
        });
        const j = await r.json();
        if (!r.ok) {
          // If not confirmed, bubble up message
          throw new Error(j?.error?.message || "Login failed");
        }
        // Expect Strapi returns { jwt, user }
        // Refresh token is set in httpOnly cookie by backend
        return {
          id: ""+j.user.id,
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
          strapiJwt: (user as any).strapiJwt,
          accessTokenExpires: Date.now() + JWT_MAX_AGE * 1000,
          error: undefined
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to refresh it
      console.log("Access token expired, refreshing...");
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      (session as any).strapiJwt = (token as any).strapiJwt;
      (session as any).error = token.error;

      // If there's a refresh error, the session is invalid
      if (token.error) {
        console.error("Session has refresh error:", token.error);
      }

      return session;
    }
  },
  pages: {
    signIn: "/login"
  },
  events: {
    async signOut({ token }) {
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
