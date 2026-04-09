import { Metadata } from 'next';
import { HomePageContent } from '@/components/home-page-content';

export const metadata: Metadata = {
  title: 'Study In China Academy | Your Gateway to Chinese Education',
  description: 'Discover world-class universities in China, find perfect programs, and get expert guidance throughout your application journey. Study in China with SICA.',
  openGraph: {
    title: 'Study In China Academy | Your Gateway to Chinese Education',
    description: 'Discover world-class universities in China, find perfect programs, and get expert guidance throughout your application journey.',
    type: 'website',
  },
};

export default function HomePage() {
  return <HomePageContent />;
}
