import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname === '/api/auth'
  ) {
    return NextResponse.next();
  }
  const auth = request.cookies.get('tc_auth');
  if (!auth || auth.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/', '/api/:path*'] };
