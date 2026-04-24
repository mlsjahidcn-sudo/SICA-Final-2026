import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  redirect('/');
}
