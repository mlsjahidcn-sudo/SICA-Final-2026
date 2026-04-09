'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { PartnerSidebar } from '@/components/partner-v2/partner-sidebar';
import { ChatWidget } from '@/components/chat/chat-widget';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, XCircle } from 'lucide-react';

export default function PartnerV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/partner/login');
      } else if (user.role !== 'partner') {
        router.push('/unauthorized');
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

  if (!user || user.role !== 'partner') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show pending approval screen
  if (user.approval_status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Approval Pending</CardTitle>
            <CardDescription>
              Your partner account is awaiting admin approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800">
                Your partnership application is currently under review. You will receive an email notification once an administrator reviews your application. This typically takes 1-3 business days.
              </AlertDescription>
            </Alert>
            <button
              onClick={() => {
                localStorage.removeItem('sica_auth_token');
                localStorage.removeItem('sica_user_data');
                router.push('/partner/login');
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground underline"
            >
              Sign out and return to login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show rejected screen
  if (user.approval_status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Application Rejected</CardTitle>
            <CardDescription>
              Your partner application was not approved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.rejection_reason && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Reason:</strong> {user.rejection_reason}
                </AlertDescription>
              </Alert>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('sica_auth_token');
                localStorage.removeItem('sica_user_data');
                router.push('/partner/login');
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground underline"
            >
              Sign out and return to login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <PartnerSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
      <ChatWidget />
    </SidebarProvider>
  );
}
