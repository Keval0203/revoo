import { NextRequest, NextResponse } from 'next/server';

const publicAuthRoutes = ['/login', '/signup', '/verify-email', '/error', '/onboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicAuthRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/'))
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (anything with a file extension)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
