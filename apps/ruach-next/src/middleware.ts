import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

/**
 * Middleware for i18n, HTTPS enforcement, route protection, and Preview CSP headers
 *
 * 1. Internationalization: Handles locale routing and detection
 * 2. HTTPS Enforcement: In production, redirects HTTP requests to HTTPS
 * 3. Auth Protection: Protects /admin routes with NextAuth
 * 4. Preview CSP: Allows embedding in Strapi admin panel for Preview feature
 */

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export async function middleware(req: NextRequest) {
  // Skip i18n for API routes, static files, and Next.js internals
  const pathname = req.nextUrl.pathname;
  const shouldSkipI18n =
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    /\..+$/.test(pathname); // has file extension

  // HTTPS Enforcement (Production Only) - must run before i18n
  if (process.env.NODE_ENV === "production") {
    const proto = req.headers.get("x-forwarded-proto");
    const host = req.headers.get("host");

    // Redirect HTTP to HTTPS
    if (proto === "http" && host) {
      const httpsUrl = `https://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
      return NextResponse.redirect(httpsUrl, 301);
    }
  }

  // Admin route protection - must run before i18n
  if (pathname.startsWith("/admin") || pathname.match(/^\/[a-z]{2}\/admin/)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Apply i18n middleware and capture its response
  let response: NextResponse;

  if (!shouldSkipI18n) {
    // intlMiddleware always returns a response (either redirect or next())
    response = intlMiddleware(req);
  } else {
    // For skipped paths, create a basic next() response
    response = NextResponse.next();
  }

  // Allow embedding in Strapi admin panel for Preview feature
  // The frame-ancestors directive controls which domains can embed this page in an iframe
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

  // Extract the origin from the Strapi URL
  let strapiOrigin = strapiUrl;
  try {
    const url = new URL(strapiUrl);
    strapiOrigin = url.origin;
  } catch {
    // If URL parsing fails, use the raw value
  }

  // Set Content-Security-Policy header on the i18n response
  // frame-ancestors 'self' allows same-origin embedding
  // Adding the Strapi origin allows embedding from Strapi admin panel
  response.headers.set(
    'Content-Security-Policy',
    `frame-ancestors 'self' ${strapiOrigin}`
  );

  return response;
}

export const config = {
  matcher: [
    // Admin routes (require auth)
    "/admin/:path*",
    // All other routes (HTTPS check only, excluding static files and API)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
