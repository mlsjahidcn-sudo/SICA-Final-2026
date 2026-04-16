import { redirect } from 'next/navigation';

export const metadata = {
  title: 'FAQ',
  description: 'Frequently Asked Questions',
};

export default function FAQPage() {
  redirect('/');
}
