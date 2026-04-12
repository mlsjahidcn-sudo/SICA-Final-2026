'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { I18nProvider } from '@/i18n/context';
import { TooltipProvider } from '@/components/ui/tooltip';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <I18nProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
