import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Terms of Service',
  description: 'SICA Terms of Service - Terms and conditions for using our platform and services.',
};

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen py-12">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: January 1, 2024
            </p>
          </div>

          {/* Content */}
          <Card>
            <CardContent className="prose prose-slate max-w-none p-8">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                <p>
                  By accessing or using the Study In China Academy (&quot;SICA&quot;) platform, you agree to be
                  bound by these Terms of Service. If you disagree with any part of these terms, you may
                  not access the platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                <p>
                  SICA provides an online platform that connects international students with Chinese
                  universities. Our services include:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>University and program information</li>
                  <li>Application processing and management</li>
                  <li>Document submission and verification</li>
                  <li>Communication facilitation with universities</li>
                  <li>Educational consulting and guidance</li>
                  <li>Scholarship information and application support</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                
                <h3 className="text-xl font-semibold mb-3 mt-6">Account Registration</h3>
                <p>To use certain features of the platform, you must register for an account. You agree to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">Account Types</h3>
                <p>We offer different account types:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Student:</strong> For individuals seeking to apply to Chinese universities</li>
                  <li><strong>Partner:</strong> For educational agents and consultants</li>
                  <li><strong>Administrator:</strong> For platform management (internal use only)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
                <p>As a user, you agree to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Provide truthful and accurate information in all applications</li>
                  <li>Submit only authentic documents</li>
                  <li>Respect deadlines and application requirements</li>
                  <li>Communicate professionally with all parties</li>
                  <li>Not interfere with platform operations</li>
                  <li>Not attempt to circumvent security measures</li>
                  <li>Not use the platform for illegal purposes</li>
                  <li>Not harass, abuse, or harm other users</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Applications and Admissions</h2>
                
                <h3 className="text-xl font-semibold mb-3 mt-6">Application Process</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Applications are subject to university approval</li>
                  <li>SICA does not guarantee admission to any program</li>
                  <li>Application fees are non-refundable once submitted</li>
                  <li>Document verification is at the discretion of universities</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">No Guarantee</h3>
                <p>
                  While we strive to assist students in their applications, SICA does not guarantee:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Admission to any specific university or program</li>
                  <li>Scholarship awards</li>
                  <li>Visa approval</li>
                  <li>Employment outcomes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Fees and Payments</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Application fees are determined by individual universities</li>
                  <li>Tuition fees are set by universities and paid directly to them</li>
                  <li>SICA may charge service fees for premium services</li>
                  <li>All fees are displayed before payment</li>
                  <li>Refund policies are determined by individual universities</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
                <p>
                  The SICA platform, including all content, features, and functionality, is owned by
                  SICA and is protected by international copyright, trademark, and other intellectual
                  property laws.
                </p>
                <p className="mt-4">You may not:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Copy, modify, or distribute platform content without permission</li>
                  <li>Use our trademarks without authorization</li>
                  <li>Reverse engineer or attempt to extract source code</li>
                  <li>Create derivative works based on our platform</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. User Content</h2>
                <p>
                  By submitting content (documents, information, communications) to the platform,
                  you grant SICA a non-exclusive, worldwide, royalty-free license to use, process,
                  and share such content for the purpose of providing our services.
                </p>
                <p className="mt-4">You represent that you have all necessary rights to submit such content.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, SICA shall not be liable for:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>University decisions regarding admissions</li>
                  <li>Visa application outcomes</li>
                  <li>Third-party actions or inactions</li>
                  <li>Service interruptions or data loss</li>
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Any damages exceeding the fees paid by you in the past 12 months</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Disclaimers</h2>
                <p>
                  The platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
                  either express or implied. We do not warrant that:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>The platform will be uninterrupted or error-free</li>
                  <li>Defects will be corrected</li>
                  <li>The platform is free of viruses or harmful components</li>
                  <li>Information provided is accurate or complete</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
                <p>We may terminate or suspend your account and access to the platform:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>For violation of these Terms</li>
                  <li>For illegal or harmful conduct</li>
                  <li>For extended periods of inactivity</li>
                  <li>At our discretion with notice</li>
                </ul>
                <p className="mt-4">
                  Upon termination, your right to use the platform ceases immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the
                  People&apos;s Republic of China, without regard to its conflict of law provisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution</h2>
                <p>
                  Any disputes arising from these Terms or use of the platform shall be resolved
                  through good faith negotiations. If negotiations fail, disputes shall be submitted
                  to the competent courts in Beijing, China.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of
                  significant changes via email or platform notification. Continued use of the platform
                  after changes constitutes acceptance of the modified Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
                <p>For questions about these Terms, please contact us:</p>
                <ul className="list-none mt-4 space-y-1">
                  <li><strong>Email:</strong> legal@studyinchina.academy</li>
                  <li><strong>Address:</strong> Haidian District, Beijing, China</li>
                  <li><strong>Phone:</strong> +86 10 1234 5678</li>
                </ul>
              </section>
            </CardContent>
          </Card>

          {/* Back Link */}
          <div className="mt-8">
            <Button variant="outline" asChild>
              <Link href="/">
                ← Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
