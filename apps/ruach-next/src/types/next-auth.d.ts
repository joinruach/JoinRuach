import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    strapiJwt?: string;
  }

  interface User {
    strapiJwt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    strapiJwt?: string;
  }
}
