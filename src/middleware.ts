import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', 
                       '/universities', '/programs', '/compare', '/about', 
                       '/contact', '/partners', '/partner/login', '/partner/register', '/admin/login',
                       '/unauthorized'];
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get auth token from cookies
  const token = request.cookies.get('sb-access-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;

  // Check for protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/applications', '/messages', '/settings'];
  const isAdminRoute = pathname.startsWith('/admin');
  const isPartnerRoute = pathname.startsWith('/partner');

  // Admin routes require admin role
  if (isAdminRoute && pathname !== '/admin/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    // Let client-side handle role check for more reliable auth
    // if (userRole !== 'admin') {
    //   return NextResponse.redirect(new URL('/unauthorized', request.url));
    // }
  }

  // Partner routes require partner role
  if (isPartnerRoute && !pathname.includes('/login') && !pathname.includes('/register')) {
    if (!token) {
      return NextResponse.redirect(new URL('/partner/login', request.url));
    }
    // Let client-side handle role check for more reliable auth
    // if (userRole !== 'partner') {
    //   return NextResponse.redirect(new URL('/unauthorized', request.url));
    // }
  }

  // Protected routes require authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
