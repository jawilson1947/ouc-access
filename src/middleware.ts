import { NextResponse } from 'next/server';
import { auth } from './auth';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest) => {
  const { pathname } = req.nextUrl;
  
  // Allow access to login page and static assets
  if (pathname === '/login' || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/api/auth') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Protect all other routes
  return NextResponse.redirect(new URL('/login', req.url));
});

export const config = {
  matcher: [
    // Only apply middleware to non-API routes and non-static assets
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.pdf|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico).*)',
  ],
}; 