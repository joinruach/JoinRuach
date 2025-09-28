import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;
const CONFIRM_REDIRECT = process.env.STRAPI_EMAIL_CONFIRM_REDIRECT || (process.env.NEXTAUTH_URL + "/confirmed");

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        const r = await fetch(`${STRAPI}/api/auth/local`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password })
        });
        const j = await r.json();
        if (!r.ok) {
          // If not confirmed, bubble up message
          throw new Error(j?.error?.message || "Login failed");
        }
        // Expect Strapi returns { jwt, user }
        return { id: ""+j.user.id, name: j.user.username || j.user.email, email: j.user.email, strapiJwt: j.jwt };
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as any).strapiJwt = (user as any).strapiJwt;
      return token;
    },
    async session({ session, token }) {
      (session as any).strapiJwt = (token as any).strapiJwt;
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};
