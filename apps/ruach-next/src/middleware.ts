import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { hasStudioAccess } from '@/lib/authorization';

/**
 * Middleware to protect studio routes with role-based access control
 *
 * This middleware runs before any page is rendered and provides
 * defense-in-depth for authentication and authorization.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Extract locale from pathname (e.g., /en/studio -> en)
  const localeMatch = pathname.match(/^\/([^/]+)/);
  const locale = localeMatch ? localeMatch[1] : 'en';

  // Check if accessing studio routes
  const isStudioRoute = pathname.includes('/studio');

  if (isStudioRoute) {
    console.log('[Middleware] Studio route accessed:', pathname);

    // Get current session
    const session = await auth();
    console.log('[Middleware] Session exists:', !!session);
    console.log('[Middleware] User role:', session?.role);

    // If not authenticated, redirect to login
    if (!session) {
      console.log('[Middleware] No session, redirecting to login');
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated but doesn't have studio access, redirect to unauthorized
    const hasAccess = hasStudioAccess(session.role);
    console.log('[Middleware] Has studio access:', hasAccess);

    if (!hasAccess) {
      console.log('[Middleware] Access denied, redirecting to unauthorized');
      const unauthorizedUrl = new URL(`/${locale}/unauthorized`, request.url);
      unauthorizedUrl.searchParams.set('reason', 'studio_access');
      return NextResponse.redirect(unauthorizedUrl);
    }

    console.log('[Middleware] Access granted, proceeding');
  }

  // Allow request to proceed
  return NextResponse.next();
}

/**
 * Matcher configuration to specify which routes this middleware runs on
 *
 * This runs on all routes that match the pattern, avoiding static files
 * and internal Next.js routes for better performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
