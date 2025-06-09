import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    
    // Allow access to access-request page for all authenticated users
    if (pathname.startsWith('/access-request')) {
      return NextResponse.next();
    }
    
    // Allow church-members API calls with email parameter (for form population)
    if (pathname.startsWith('/api/church-members')) {
      const url = new URL(req.url);
      const email = url.searchParams.get('email');
      // If there's an email parameter, allow the call (the API will handle its own authorization)
      if (email) {
        return NextResponse.next();
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to access-request page even without a full token
        // as long as the user went through authentication
        if (pathname.startsWith('/access-request')) {
          return true;
        }
        
        // Allow church-members API calls with email parameter
        if (pathname.startsWith('/api/church-members')) {
          const url = new URL(req.url);
          const email = url.searchParams.get('email');
          if (email) {
            return true;
          }
        }
        
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    // Only apply middleware to non-API routes and non-static assets
    '/((?!api|_next/static|_next/image|favicon.ico|login|uploads|.*\\.pdf|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico).*)',
  ],
}; 