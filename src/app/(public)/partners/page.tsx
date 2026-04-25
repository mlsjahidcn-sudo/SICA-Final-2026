import { Metadata } from 'next';
import PartnersPageContent from './PartnersPageContent';

export const metadata: Metadata = {
  title: 'Our Partners | Study In China Academy',
  description: 'Discover our trusted partners including governments, universities, and organizations worldwide who help us provide the best educational opportunities.',
  openGraph: {
    title: 'Our Partners | Study In China Academy',
    description: 'Working with leading institutions, governments, and organizations worldwide.',
    type: 'website',
  },
};

export default function PartnersPage() {
  return <PartnersPageContent />;
}
