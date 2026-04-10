import { Metadata } from 'next';
import { HomePageContent } from '@/components/home-page-content';
import { OrganizationSchema, WebsiteSchema } from '@/components/seo/json-ld';

const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy';

export const metadata: Metadata = {
  title: 'Study In China Academy | Your Gateway to Chinese Education',
  description: 'Discover world-class universities in China, find perfect programs, and get expert guidance throughout your application journey. Study in China with SICA.',
  keywords: [
    'study in china',
    'chinese universities',
    'scholarships china',
    'study abroad china',
    'international students china',
    'chinese government scholarship',
    'beijing university',
    'tsinghua university',
    'application china university',
  ],
  openGraph: {
    title: 'Study In China Academy | Your Gateway to Chinese Education',
    description: 'Discover world-class universities in China, find perfect programs, and get expert guidance throughout your application journey.',
    type: 'website',
    url: baseUrl,
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Study In China Academy - Gateway to Chinese Universities',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Study In China Academy | Your Gateway to Chinese Education',
    description: 'Discover world-class universities in China, find perfect programs, and get expert guidance throughout your application journey.',
    images: ['/og-default.jpg'],
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function HomePage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <OrganizationSchema />
      <WebsiteSchema />
      <HomePageContent />
    </>
  );
}
