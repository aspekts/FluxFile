import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Paths that require authentication
 */
const protectedPaths = ['/dashboard', '/dashboard/settings'];

/**
 * Paths that should redirect to dashboard if already authenticated
 */
const authPaths = ['/login', '/signup'];

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie (BetterAuth stores session as a cookie)
  const sessionCookie = request.cookies.get('better-auth.session_token');
  const isAuthenticated = !!sessionCookie;

  // Redirect unauthenticated users away from protected pages
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (authPaths.some((path) => pathname.startsWith(path))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}
