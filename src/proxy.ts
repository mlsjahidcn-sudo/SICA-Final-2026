import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
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
                       '/contact', '/partners', '/partner/register',
                       '/unauthorized', '/blog', '/i18n-test'];
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get auth token from cookies
  const token = request.cookies.get('sb-access-token')?.value;

  // Admin routes require admin role
  const isAdminRoute = pathname.startsWith('/admin');
  if (isAdminRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Partner routes require partner role
  const isPartnerRoute = pathname.startsWith('/partner');
  if (isPartnerRoute && !pathname.includes('/register')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protected routes require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/applications', '/messages', '/settings',
                           '/student', '/student-v2'];
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
