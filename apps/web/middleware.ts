import { authMiddleware } from '@/lib/auth/middleware';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
