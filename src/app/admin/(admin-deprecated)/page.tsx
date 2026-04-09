'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  
  // Redirect to v2 dashboard
  useEffect(() => {
    router.replace('/admin/v2');
  }, [router]);
  
  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
