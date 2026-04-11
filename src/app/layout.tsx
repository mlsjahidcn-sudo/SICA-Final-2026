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

// Get base URL from environment
const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Study In China Academy - Your Gateway to Chinese Education',
    template: '%s | SICA',
  },
  description:
    'Your gateway to studying in China. Discover top Chinese universities, programs, scholarships, and apply with expert guidance.',
  keywords: [
    'Study in China',
    'Chinese Universities',
    'International Students',
    'Scholarships China',
    'Chinese Programs',
    'Education China',
    'University Application',
    'Study Abroad China',
    'Beijing University',
    'Tsinghua University',
    'Chinese Government Scholarship',
  ],
  authors: [{ name: 'SICA Team' }],
  creator: 'Study In China Academy',
  publisher: 'Study In China Academy',
  generator: 'Coze Code',
  applicationName: 'Study In China Academy',
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    title: 'Study In China Academy - Your Gateway to Chinese Education',
    description:
      'Your gateway to studying in China. Discover top Chinese universities, programs, scholarships, and apply with expert guidance.',
    siteName: 'Study In China Academy',
    locale: 'en_US',
    type: 'website',
    url: baseUrl,
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Study In China Academy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@studyinchina',
    creator: '@studyinchina',
    title: 'Study In China Academy - Your Gateway to Chinese Education',
    description: 'Your gateway to studying in China. Discover top Chinese universities, programs, scholarships, and apply with expert guidance.',
    images: ['/og-default.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      'en-US': `${baseUrl}/en`,
      'zh-CN': `${baseUrl}/zh`,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
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
