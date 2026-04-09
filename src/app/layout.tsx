import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { Providers } from '@/components/providers';
import { ChatWidget } from '@/components/chat-widget';
import { FloatingAssessmentButton } from '@/components/floating-assessment-button';
import { Ubuntu } from "next/font/google";
import { cn } from "@/lib/utils";

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: {
    default: 'Study In China Academy - SICA',
    template: '%s | SICA',
  },
  description:
    'Your gateway to studying in China. Find universities, programs, scholarships, and apply with expert guidance.',
  keywords: [
    'Study in China',
    'Chinese Universities',
    'International Students',
    'Scholarships China',
    'Chinese Programs',
    'Education China',
    'University Application',
    'Study Abroad China',
  ],
  authors: [{ name: 'SICA Team' }],
  generator: 'Coze Code',
  openGraph: {
    title: 'Study In China Academy - SICA',
    description:
      'Your gateway to studying in China. Find universities, programs, scholarships, and apply with expert guidance.',
    siteName: 'Study In China Academy',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", ubuntu.variable)}>
      <body className={`antialiased min-h-screen`} suppressHydrationWarning>
        <Providers>
          {isDev && <Inspector />}
          {children}
          <FloatingAssessmentButton />
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
