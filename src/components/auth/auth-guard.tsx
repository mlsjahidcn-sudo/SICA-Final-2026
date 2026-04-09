'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'partner' | 'admin';
  fallbackPath?: string;
}

export function AuthGuard({ 
  children, 
  requiredRole,
  fallbackPath 
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not authenticated - redirect to appropriate login
      const loginPath = pathname.startsWith('/admin') ? '/admin/login' :
                       pathname.startsWith('/partner') ? '/partner/login' : 
                       '/login';
      const redirect = fallbackPath || loginPath;
      router.push(`${redirect}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role requirement
    if (requiredRole && user.role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }

    // Check role-based paths
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }

    if (pathname.startsWith('/partner') && user.role !== 'partner') {
      router.push('/unauthorized');
      return;
    }

  }, [user, loading, router, pathname, requiredRole, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
