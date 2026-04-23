import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  IconHelpCircle,
  IconSchool,
  IconFileCheck,
  IconBook,
  IconPlane,
  IconHeartHandshake,
  IconMessageCircle,
  IconArrowRight,
} from '@tabler/icons-react';

export const metadata = {
  title: 'FAQs | SICA',
  description: 'Frequently asked questions about studying in China with SICA.',
};

const categories = [
  {
    id: 'general',
    icon: IconHelpCircle,
    title: 'General Questions',
    faqs: [
      {
        question: 'What is SICA?',
        answer:
          'SICA (Study in China Academy) is a comprehensive education consultancy platform that helps international students find, apply to, and enroll in Chinese universities. We partner with over 500 universities across China to provide students with accurate information and dedicated application support.',
      },
      {
        question: 'Is SICA a free service?',
        answer:
          'Yes, our core services including university search, program matching, and application guidance are completely free for students. We earn commissions from our partner universities, so you never pay anything to use our platform.',
      },
      {
        question: 'Who can apply through SICA?',
        answer:
          'Anyone who meets the basic eligibility requirements for studying in China can apply through SICA. This includes high school graduates looking for bachelor programs, university graduates seeking master or PhD programs, and transfer students.',
      },
      {
        question: 'Which countries do you support?',
        answer:
          'We support students from all countries worldwide. Our platform and support team communicate in multiple languages including English, Chinese, French, Arabic, and Russian to assist students from diverse backgrounds.',
      },
    ],
  },
  {
    id: 'admissions',
    icon: IconFileCheck,
    title: 'Admissions',
    faqs: [
      {
        question: 'What are the basic requirements to study in China?',
        answer:
          'Generally, you need to be a non-Chinese citizen in good health, hold the required academic credentials (high school diploma for bachelor, bachelor degree for master, master degree for PhD), and meet the language requirements (HSK for Chinese-taught programs, IELTS/TOEFL for English-taught programs).',
      },
      {
        question: 'When should I apply?',
        answer:
          'Most Chinese universities have two intakes: September (Fall) and March (Spring). For the September intake, applications typically open in January and close by June. For the March intake, applications open around October and close by December. We recommend applying at least 4-6 months before your desired intake.',
      },
      {
        question: 'What documents do I need to prepare?',
        answer:
          'Common documents include a valid passport, academic transcripts and certificates, language proficiency test scores, personal statement or study plan, recommendation letters, and a physical examination form. Specific requirements vary by university and program.',
      },
      {
        question: 'Do I need to know Chinese to study in China?',
        answer:
          'Not necessarily. Many universities offer English-taught programs at bachelor, master, and PhD levels. However, if you choose a Chinese-taught program, you will typically need HSK level 4 or above. We can help you find English-taught programs that match your field of study.',
      },
      {
        question: 'How long does the application process take?',
        answer:
          'The timeline varies by university, but generally it takes 4-8 weeks from document submission to receiving an admission letter. After that, the visa process takes about 2-4 weeks. We recommend starting your application at least 4-6 months before your intended intake.',
      },
    ],
  },
  {
    id: 'programs',
    icon: IconBook,
    title: 'Programs & Scholarships',
    faqs: [
      {
        question: 'What programs are available?',
        answer:
          'Chinese universities offer a wide range of programs across all disciplines: Engineering, Medicine, Business, Computer Science, Economics, Law, Arts, Humanities, and more. Both Chinese-taught and English-taught options are available at bachelor, master, and PhD levels.',
      },
      {
        question: 'Are scholarships available for international students?',
        answer:
          'Yes! The Chinese government offers several scholarship programs including the Chinese Government Scholarship (CSC), Confucius Institute Scholarship, and provincial/municipal scholarships. Many universities also offer their own merit-based and need-based scholarships.',
      },
      {
        question: 'How can I apply for scholarships?',
        answer:
          'You can apply for scholarships through SICA during your university application process. Our team will guide you on which scholarships you are eligible for and help you prepare the required scholarship application materials alongside your university application.',
      },
      {
        question: 'What is the average tuition fee?',
        answer:
          'Tuition fees vary by program and university. English-taught bachelor programs typically range from ¥15,000 to ¥40,000 per year. Master programs range from ¥20,000 to ¥50,000 per year. Medical programs (MBBS) range from ¥25,000 to ¥60,000 per year.',
      },
    ],
  },
  {
    id: 'visa',
    icon: IconPlane,
    title: 'Visa & Living in China',
    faqs: [
      {
        question: 'What type of visa do I need?',
        answer:
          'International students need an X1 visa (for programs longer than 180 days) or X2 visa (for programs shorter than 180 days). After arriving in China, X1 visa holders must convert their visa to a Residence Permit within 30 days.',
      },
      {
        question: 'Can I work while studying in China?',
        answer:
          'International students in China can take part-time jobs or internships off-campus if they obtain the necessary approval from their university and the local exit-entry administration. On-campus work is generally allowed with university approval.',
      },
      {
        question: 'What is the cost of living in China?',
        answer:
          'Living costs vary by city. In smaller cities, you can live comfortably on ¥1,500-2,500 per month. In major cities like Beijing or Shanghai, expect ¥3,000-5,000 per month including accommodation, food, transport, and personal expenses.',
      },
      {
        question: 'Is accommodation provided?',
        answer:
          'Most universities offer on-campus dormitories for international students at affordable rates (typically ¥500-1,500 per month). You can also choose to live off-campus, though this may require additional registration with local authorities.',
      },
    ],
  },
  {
    id: 'partners',
    icon: IconHeartHandshake,
    title: 'For Partners',
    faqs: [
      {
        question: 'How can I become a SICA partner?',
        answer:
          'You can apply to become a partner through our Partner Portal. We welcome education consultants, agencies, and influencers who want to help students study in China. Partners get access to our university network, commission tracking, and dedicated support.',
      },
      {
        question: 'What commission structure do you offer?',
        answer:
          'Our commission structure is competitive and varies based on partner tier and volume. Partners earn commissions for each successful student enrollment. Contact our partnership team through the Partner Portal for detailed commission rates.',
      },
      {
        question: 'Do you provide training for partners?',
        answer:
          'Yes, we provide comprehensive training materials, webinars, and a dedicated partner support team to help you understand the Chinese education system, university offerings, and the application process.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-6">
            <IconHelpCircle className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to the most common questions about studying in China with SICA.
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-12">
          {categories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center gap-2 mb-4">
                <category.icon className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{category.title}</h2>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {category.faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`${category.id}-${idx}`}>
                    <AccordionTrigger className="text-left text-sm sm:text-base font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section className="py-12 md:py-16 border-t">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <IconMessageCircle className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is here to help. Reach out and we will get back to you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild>
              <Link href="/contact">
                Contact Us
                <IconArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/assessment/apply">
                <IconSchool className="h-4 w-4 mr-2" />
                Free Assessment
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
