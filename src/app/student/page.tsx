'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Redirect to v2 dashboard
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        if (user.role === 'student') {
          router.replace('/student-v2');
        } else {
          router.replace('/unauthorized');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [user, authLoading, router]);
  
  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
