'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Redirect to v2 dashboard
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        if (user.role === 'partner') {
          router.replace('/partner-v2');
        } else {
          router.replace('/unauthorized');
        }
      } else {
        router.replace('/partner/login');
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
