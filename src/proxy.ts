import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy (middleware) for request logging, security headers, and authentication
 * Runs before all API routes and pages
 */
export function proxy(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  
  // Generate unique request ID for tracking
  const requestId = crypto.randomUUID();
  
  // Log incoming request
  console.log(`[${requestId}] ${request.method} ${pathname}`, {
    query: Object.fromEntries(request.nextUrl.searchParams),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent')?.substring(0, 100),
  });

  // Skip static files and API routes for auth checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    const response = NextResponse.next();
    addSecurityHeaders(response, requestId, startTime);
    return response;
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', 
                       '/universities', '/programs', '/compare', '/about', 
                       '/contact', '/partners', '/partner/register',
                       '/unauthorized', '/blog', '/i18n-test',
                       '/auth/callback'];
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    const response = NextResponse.next();
    addSecurityHeaders(response, requestId, startTime);
    return response;
  }

  // Get auth token from cookies
  const token = request.cookies.get('sb-access-token')?.value;

  // Admin routes require admin role
  const isAdminRoute = pathname.startsWith('/admin');
  if (isAdminRoute) {
    if (!token) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      addSecurityHeaders(response, requestId, startTime);
      return response;
    }
  }

  // Partner routes require partner role
  const isPartnerRoute = pathname.startsWith('/partner');
  if (isPartnerRoute && !pathname.includes('/register')) {
    if (!token) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      addSecurityHeaders(response, requestId, startTime);
      return response;
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
      const response = NextResponse.redirect(new URL('/login', request.url));
      addSecurityHeaders(response, requestId, startTime);
      return response;
    }
  }

  const response = NextResponse.next();
  addSecurityHeaders(response, requestId, startTime);
  return response;
}

/**
 * Add security headers and logging to response
 */
function addSecurityHeaders(response: NextResponse, requestId: string, startTime: number) {
  // Add request ID to response headers for debugging
  response.headers.set('X-Request-ID', requestId);

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy (adjust based on your needs)
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isDevelopment) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://maqzxlcsgfpwnfyleoga.supabase.co wss://maqzxlcsgfpwnfyleoga.supabase.co;"
    );
  }

  // Log response time
  const duration = Date.now() - startTime;
  console.log(`[${requestId}] Response: ${response.status} (${duration}ms)`);
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
