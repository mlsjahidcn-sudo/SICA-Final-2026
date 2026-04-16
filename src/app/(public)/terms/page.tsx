import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using our platform and services.',
};

export default function TermsOfServicePage() {
  redirect('/');
}
