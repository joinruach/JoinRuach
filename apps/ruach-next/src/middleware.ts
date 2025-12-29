import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const locales = ["en", "es", "fr", "pt"];
const defaultLocale = "en";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for Next.js internals, API routes, and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return;
  }

  // Check if the route is a studio route (requires authentication)
  const isStudioRoute = locales.some(
    (locale) => pathname === `/${locale}/studio` || pathname.startsWith(`/${locale}/studio/`)
  );

  if (isStudioRoute) {
    // Check authentication for studio routes
    const session = await auth();

    if (!session) {
      // Not authenticated - redirect to login
      const locale = locales.find((l) => pathname.startsWith(`/${l}/`)) || defaultLocale;
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Authenticated - allow access
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
