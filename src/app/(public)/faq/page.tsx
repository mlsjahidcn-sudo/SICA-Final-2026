'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Search,
  HelpCircle,
  FileText,
  DollarSign,
  Plane,
  CreditCard,
  Wrench,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Application Process
  {
    id: '1',
    category: 'Application Process',
    question: 'How do I apply to Chinese universities through SICA?',
    answer: 'Create a free account, browse programs, and click "Apply Now" on your chosen program. Fill out the application form, upload required documents, and submit. Our team will review your application and guide you through each step.',
  },
  {
    id: '2',
    category: 'Application Process',
    question: 'What documents do I need to apply?',
    answer: 'Typically, you need: passport copy, passport-sized photo, highest diploma/certificate, academic transcripts, language proficiency certificate (HSK/IELTS/TOEFL if applicable), and recommendation letters. Some programs may require additional documents.',
  },
  {
    id: '3',
    category: 'Application Process',
    question: 'How long does the application process take?',
    answer: 'The entire process typically takes 2-4 months from application to admission letter. This includes document review (1-2 weeks), university processing (4-8 weeks), and admission letter issuance (1-2 weeks).',
  },
  {
    id: '4',
    category: 'Application Process',
    question: 'Can I apply to multiple programs?',
    answer: 'Yes, you can apply to multiple programs simultaneously. However, we recommend focusing on 2-3 programs that best match your goals to ensure quality applications.',
  },
  {
    id: '5',
    category: 'Application Process',
    question: 'What is the application deadline?',
    answer: 'Deadlines vary by university and program. Generally, spring semester applications close in October-November, and fall semester applications close in March-May. Check specific program pages for exact deadlines.',
  },
  // Scholarships
  {
    id: '6',
    category: 'Scholarships',
    question: 'What scholarships are available for international students?',
    answer: 'Major scholarships include: Chinese Government Scholarship (CSC), Provincial Government Scholarships, University-specific scholarships, and Confucius Institute Scholarship. Coverage ranges from partial to full tuition, accommodation, and living stipend.',
  },
  {
    id: '7',
    category: 'Scholarships',
    question: 'How do I apply for scholarships?',
    answer: 'Scholarship applications are typically integrated with your program application. Indicate your scholarship interest when applying. CSC scholarships require separate applications through your local Chinese embassy.',
  },
  {
    id: '8',
    category: 'Scholarships',
    question: 'What are the eligibility criteria for scholarships?',
    answer: 'Criteria vary but generally include: academic excellence (GPA requirements), age limits (under 35 for master\'s, under 40 for PhD), language proficiency, and research ability. Some scholarships are country-specific.',
  },
  {
    id: '9',
    category: 'Scholarships',
    question: 'Can I work while studying on a scholarship?',
    answer: 'International students can work part-time with proper authorization. Scholarship recipients should check their specific scholarship terms, as some may restrict work during the scholarship period.',
  },
  // Visa & Immigration
  {
    id: '10',
    category: 'Visa & Immigration',
    question: 'What type of visa do I need to study in China?',
    answer: 'You need an X1 or X2 visa. X1 is for programs longer than 180 days (requires a residence permit). X2 is for short-term programs under 180 days. We provide guidance and documents for your visa application.',
  },
  {
    id: '11',
    category: 'Visa & Immigration',
    question: 'How do I apply for a student visa?',
    answer: 'After receiving your admission letter and JW201/JW202 form, apply at your local Chinese embassy or consulate. Submit required documents including passport, photos, admission letter, JW form, and medical examination results.',
  },
  {
    id: '12',
    category: 'Visa & Immigration',
    question: 'Can I stay in China after graduation?',
    answer: 'Graduates can apply for a work visa (Z visa) if they find employment. Some cities offer post-study work visas allowing graduates to seek employment for 6-12 months. PhD graduates may qualify for talent visas.',
  },
  {
    id: '13',
    category: 'Visa & Immigration',
    question: 'Do I need a medical examination?',
    answer: 'Yes, a medical examination is required for X1 visa applicants. The examination should be conducted at an approved hospital and results should be authenticated. We provide guidance on the specific requirements.',
  },
  // Payment & Fees
  {
    id: '14',
    category: 'Payment & Fees',
    question: 'How much does it cost to study in China?',
    answer: 'Costs vary by program and university. Tuition ranges from $2,000-$10,000/year for most programs. Living expenses average $300-$800/month depending on city. Major cities like Beijing and Shanghai are more expensive.',
  },
  {
    id: '15',
    category: 'Payment & Fees',
    question: 'What payment methods do you accept?',
    answer: 'We accept bank transfers, credit/debit cards, PayPal, and WeChat Pay. Application fees are paid during submission, while tuition is paid directly to the university after admission.',
  },
  {
    id: '16',
    category: 'Payment & Fees',
    question: 'Is there an application fee?',
    answer: 'Application fees vary by university, typically $50-$150. SICA does not charge additional service fees for standard applications. Premium services like express review may have additional charges.',
  },
  {
    id: '17',
    category: 'Payment & Fees',
    question: 'When do I need to pay tuition?',
    answer: 'Tuition is usually paid after receiving your admission letter and before registration. Most universities require payment 2-4 weeks before the semester starts. Some universities offer installment plans.',
  },
  // Living in China
  {
    id: '18',
    category: 'Living in China',
    question: 'Where will I live as an international student?',
    answer: 'Most universities offer on-campus dormitories for international students. Costs range from $100-$500/month depending on room type. Off-campus housing is also available but requires university approval.',
  },
  {
    id: '19',
    category: 'Living in China',
    question: 'Is it safe for international students in China?',
    answer: 'China is considered one of the safest countries for international students. Universities have 24/7 security, and violent crime is rare. Students should still take normal safety precautions.',
  },
  {
    id: '20',
    category: 'Living in China',
    question: 'Do I need to speak Chinese to study in China?',
    answer: 'Not necessarily. Many programs are taught entirely in English. However, learning basic Chinese will help with daily life. Universities often offer Chinese language courses for international students.',
  },
  {
    id: '21',
    category: 'Living in China',
    question: 'What about health insurance?',
    answer: 'International students are required to have health insurance. Most universities offer comprehensive insurance plans for about $100/year. This covers basic medical care, hospitalization, and accidents.',
  },
  // Technical Support
  {
    id: '22',
    category: 'Technical Support',
    question: 'I forgot my password. How do I reset it?',
    answer: 'Click "Forgot Password" on the login page. Enter your registered email, and we\'ll send a password reset link. If you don\'t receive the email, check your spam folder or contact support.',
  },
  {
    id: '23',
    category: 'Technical Support',
    question: 'How do I upload documents?',
    answer: 'Go to your application\'s documents section, select the document type, and click upload. Supported formats are PDF, JPG, and PNG. Maximum file size is 10MB per document.',
  },
  {
    id: '24',
    category: 'Technical Support',
    question: 'Can I edit my submitted application?',
    answer: 'Once submitted, applications cannot be edited directly. Contact our support team if you need to make changes. Some modifications may require submitting new documents.',
  },
];

const categories = [
  { id: 'all', label: 'All Questions', icon: HelpCircle },
  { id: 'Application Process', label: 'Application Process', icon: FileText },
  { id: 'Scholarships', label: 'Scholarships', icon: DollarSign },
  { id: 'Visa & Immigration', label: 'Visa & Immigration', icon: Plane },
  { id: 'Payment & Fees', label: 'Payment & Fees', icon: CreditCard },
  { id: 'Technical Support', label: 'Technical Support', icon: Wrench },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredFAQs = useMemo(() => {
    let faqs = faqData;

    // Filter by category
    if (activeCategory !== 'all') {
      faqs = faqs.filter((faq) => faq.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      faqs = faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    return faqs;
  }, [searchQuery, activeCategory]);

  const groupedFAQs = useMemo(() => {
    if (activeCategory !== 'all') {
      return { [activeCategory]: filteredFAQs };
    }

    const grouped: Record<string, FAQItem[]> = {};
    filteredFAQs.forEach((faq) => {
      if (!grouped[faq.category]) {
        grouped[faq.category] = [];
      }
      grouped[faq.category].push(faq);
    });
    return grouped;
  }, [filteredFAQs, activeCategory]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers to common questions about studying in China, applications, visas, and more.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 justify-center mb-12">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(cat.id)}
                  className="gap-2"
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Results Count */}
            <div className="text-center mb-8">
              <Badge variant="secondary" className="text-sm">
                {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
              </Badge>
            </div>

            {/* FAQs */}
            {filteredFAQs.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-lg mb-2">No questions found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or category filter
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedFAQs).map(([category, faqs]) => (
                  <div key={category}>
                    {activeCategory === 'all' && (
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        {categories.find((c) => c.id === category)?.icon && (
                          (() => {
                            const Icon = categories.find((c) => c.id === category)!.icon;
                            return <Icon className="h-5 w-5 text-primary" />;
                          })()
                        )}
                        {category}
                      </h2>
                    )}
                    <Card>
                      <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                          <AccordionItem key={faq.id} value={faq.id}>
                            <AccordionTrigger className="px-6 hover:no-underline">
                              <span className="text-left font-medium">
                                {faq.question}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 text-muted-foreground">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <Card className="max-w-3xl mx-auto border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Still Have Questions?</CardTitle>
              <CardDescription>
                Our team is ready to help you with any questions you may have.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/contact">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/apply">
                  Start Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
