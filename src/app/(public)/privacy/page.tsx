import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Privacy Policy',
  description: 'SICA Privacy Policy - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how we collect, use, and protect your personal information.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: January 1, 2024
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto">
            <Card>
              <CardContent className="prose prose-slate max-w-none p-8">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
                <p>
                  Study In China Academy (&quot;SICA&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting
                  your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
                  your information when you use our platform and services.
                </p>
                <p className="mt-4">
                  Please read this privacy policy carefully. If you do not agree with the terms of this
                  privacy policy, please do not access the platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                
                <h3 className="text-xl font-semibold mb-3 mt-6">Personal Information</h3>
                <p>We may collect personal information that you voluntarily provide to us when you:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Register on the platform</li>
                  <li>Submit an application</li>
                  <li>Contact us for support</li>
                  <li>Subscribe to our newsletter</li>
                  <li>Use our services</li>
                </ul>

                <p className="mt-4">This information may include:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Name and contact information (email, phone, address)</li>
                  <li>Educational background and academic records</li>
                  <li>Passport and identification documents</li>
                  <li>Language proficiency test scores</li>
                  <li>Payment information</li>
                  <li>Communication preferences</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">Automatically Collected Information</h3>
                <p>When you access our platform, we may automatically collect:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and location data</li>
                  <li>Pages visited and time spent</li>
                  <li>Referring website addresses</li>
                  <li>Interaction data with our services</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
                <p>We use the information we collect for various purposes:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Process and manage your university applications</li>
                  <li>Communicate with you about your application status</li>
                  <li>Provide customer support and assistance</li>
                  <li>Send notifications about programs, scholarships, and updates</li>
                  <li>Improve our platform and services</li>
                  <li>Conduct analytics and research</li>
                  <li>Prevent fraud and ensure security</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
                <p>We may share your information with:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Universities:</strong> To process your applications</li>
                  <li><strong>Service Providers:</strong> Who assist in our operations</li>
                  <li><strong>Partners:</strong> For scholarship and program opportunities</li>
                  <li><strong>Legal Authorities:</strong> When required by law</li>
                  <li><strong>Business Transfers:</strong> In case of merger or acquisition</li>
                </ul>
                <p className="mt-4">
                  We do not sell your personal information to third parties for their marketing purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal
                  information against unauthorized access, alteration, disclosure, or destruction. These
                  measures include:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments</li>
                  <li>Access controls and authentication</li>
                  <li>Secure data storage facilities</li>
                </ul>
                <p className="mt-4">
                  However, no method of transmission over the Internet is 100% secure, and we cannot
                  guarantee absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
                <p>Depending on your location, you may have the right to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                  <li><strong>Deletion:</strong> Request deletion of your data</li>
                  <li><strong>Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                  <li><strong>Withdrawal:</strong> Withdraw consent where applicable</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us at{' '}
                  <a href="mailto:privacy@studyinchina.academy" className="text-primary hover:underline">
                    privacy@studyinchina.academy
                  </a>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
                <p>
                  We use cookies and similar tracking technologies to collect information about your
                  browsing activities. You can control cookies through your browser settings. For more
                  information, see our Cookie Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
                <p>
                  We retain your personal information for as long as necessary to fulfill the purposes
                  for which it was collected, including legal, accounting, or reporting requirements.
                  After this period, we securely delete or anonymize your data.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">International Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your
                  country of residence. We ensure appropriate safeguards are in place for such transfers.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
                <p>
                  Our services are not intended for children under 18 years of age. We do not knowingly
                  collect personal information from children under 18.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
                <p>
                  We may update this privacy policy from time to time. We will notify you of any changes
                  by posting the new privacy policy on this page and updating the &quot;Last updated&quot; date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <p>If you have questions about this privacy policy, please contact us:</p>
                <ul className="list-none mt-4 space-y-1">
                  <li><strong>Email:</strong> privacy@studyinchina.academy</li>
                  <li><strong>Address:</strong> Haidian District, Beijing, China</li>
                  <li><strong>Phone:</strong> +86 10 1234 5678</li>
                </ul>
              </section>
            </CardContent>
          </Card>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/">
                ← Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
  );
}
