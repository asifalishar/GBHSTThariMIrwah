import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/change-password'];
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));
  const isApi = pathname.startsWith('/api/');

  // Allow API routes and public pages through
  if (isApi || isPublic) {
    // If already logged in and visiting /login, redirect to dashboard
    if (pathname === '/login' && sessionCookie) {
      try {
        const session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
        if (session?.id) {
          if (session.requiresPasswordChange) {
            return NextResponse.redirect(new URL('/change-password', request.url));
          }
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch { /* invalid cookie */ }
    }
    return NextResponse.next();
  }

  // Protected routes — check for session
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());

    if (!session?.id) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Force password change before accessing any protected page
    if (session.requiresPasswordChange && pathname !== '/change-password') {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid cookie — clear and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
