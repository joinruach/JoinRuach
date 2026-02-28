import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasStudioAccess } from "@/lib/authorization";

const locales = ["en", "es", "fr", "pt"];
const defaultLocale = "en";

/**
 * Proxy function for Next.js middleware
 * Handles authentication, authorization, and locale redirection
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for Next.js internals, API routes, and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return;
  }

  // Check if the route is a studio route (requires authentication + authorization)
  const isStudioRoute = locales.some(
    (locale) => pathname === `/${locale}/studio` || pathname.startsWith(`/${locale}/studio/`)
  );

  if (isStudioRoute) {
    // Dev-only: bypass auth for mock EDL visual testing
    if (process.env.NEXT_PUBLIC_DEV_MOCK_EDL === 'true') {
      return NextResponse.next();
    }

    // Extract locale from pathname
    const locale = locales.find((l) => pathname.startsWith(`/${l}/`)) || defaultLocale;

    // Check authentication for studio routes
    const session = await auth();

    if (!session) {
      // Not authenticated - redirect to login
      console.log('[Proxy] No session, redirecting to login');
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Check authorization (role-based access control)
    const hasAccess = hasStudioAccess(session.role);

    if (!hasAccess) {
      // Authenticated but not authorized - redirect to unauthorized
      console.log('[Proxy] Access denied, redirecting to unauthorized');
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/unauthorized`;
      url.searchParams.set("reason", "studio_access");
      return NextResponse.redirect(url);
    }

    // Authenticated and authorized - allow access
    return NextResponse.next();
  }

  // Handle locale redirection for non-studio routes
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (hasLocale) {
    return;
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
