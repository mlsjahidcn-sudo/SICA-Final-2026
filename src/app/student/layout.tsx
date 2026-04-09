'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('[StudentLayout] State:', { loading, user: user ? { email: user.email, role: user.role } : null });
    
    if (!loading) {
      if (!user) {
        console.log('[StudentLayout] No user, redirecting to login');
        router.push('/login');
      } else if (user.role !== 'student') {
        console.log('[StudentLayout] User role is not student:', user.role);
        // Redirect to their respective portal
        if (user.role === 'admin') {
          router.replace('/admin');
        } else if (user.role === 'partner') {
          router.replace('/partner');
        } else {
          router.push('/unauthorized');
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {children}
    </div>
  );
}
