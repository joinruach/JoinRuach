import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Middleware for HTTPS enforcement and route protection
 *
 * 1. HTTPS Enforcement: In production, redirects HTTP requests to HTTPS
 * 2. Auth Protection: Protects /admin routes with NextAuth
 */

export async function middleware(req: NextRequest) {
  // HTTPS Enforcement (Production Only)
  if (process.env.NODE_ENV === "production") {
    const proto = req.headers.get("x-forwarded-proto");
    const host = req.headers.get("host");

    // Redirect HTTP to HTTPS
    if (proto === "http" && host) {
      const httpsUrl = `https://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
      return NextResponse.redirect(httpsUrl, 301);
    }
  }

  // Admin route protection
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Admin routes (require auth)
    "/admin/:path*",
    // All other routes (HTTPS check only, excluding static files and API)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
