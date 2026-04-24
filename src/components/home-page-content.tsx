'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemGroup,
} from '@/components/ui/item';
import {
  Search,
  Award,
  Users,
  BookOpen,
  ArrowRight,
  Building2,
  MapPin,
  Star,
  Loader2,
  Globe,
  GraduationCap,
  FileText,
  MessageSquare,
  Shield,
  Clock,
  CheckCircle2,
  Sparkles,
  Heart,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  TrendingUp,
  ClipboardCheck,
  Send,
  CircleDot,
  Quote,
  Trophy,
} from 'lucide-react';
import { IconStar, IconCalendar, IconSchool, IconMapPin, IconFileTypePdf } from '@tabler/icons-react';
import { SchemaOrg } from '@/components/schema-org';
import { TestimonialsSection } from '@/components/testimonials-section';
import { PartnersSection } from '@/components/partners-section';
import { UniversityLogoSlider } from '@/components/university-logo-slider';
import { cn } from '@/lib/utils';

interface FeaturedUniversity {
  id: string;
  name_en: string;
  name_cn: string | null;
  logo_url: string | null;
  city: string;
  province: string;
  type: string[] | null;
  ranking_national: number | null;
  scholarship_available: boolean;
}

interface SuccessCase {
  id: string;
  student_name_en: string;
  student_name_cn: string | null;
  student_photo_signed_url: string | null;
  admission_notice_signed_url: string | null;
  university_name_en: string | null;
  university_name_cn: string | null;
  program_name_en: string | null;
  program_name_cn: string | null;
  admission_year: number | null;
  intake: string | null;
  is_featured: boolean;
  description_en: string | null;
  description_cn: string | null;
}

// Bento Grid Features - Each with icon, title, bullet points, and CTA
const bentoFeatures = [
  {
    icon: Building2,
    title: '200+ Universities',
    description: 'Access China\'s top institutions',
    bullets: ['985 & 211 Universities', 'Double First-Class', 'All provinces covered'],
    cta: { text: 'Browse Universities', href: '/universities' },
    size: 'large',
    badge: 'Featured',
  },
  {
    icon: BookOpen,
    title: '2,000+ Programs',
    description: 'Find your perfect program',
    bullets: ['English-taught options', 'All degree levels', 'STEM, Business, Arts'],
    cta: { text: 'Explore Programs', href: '/programs' },
    size: 'medium',
    badge: 'Popular',
  },
  {
    icon: Users,
    title: 'Expert Guidance',
    description: 'Personal support throughout',
    bullets: ['Application review', 'Document preparation', 'Visa assistance'],
    cta: { text: 'Get Started', href: '/apply' },
    size: 'small',
    badge: 'Trusted',
  },
  {
    icon: FileText,
    title: 'Easy Application',
    description: 'Streamlined process',
    bullets: ['One-click apply', 'Track status', 'Document upload'],
    cta: { text: 'Apply Now', href: '/apply' },
    size: 'small',
    badge: 'Fast',
  },
  {
    icon: MessageSquare,
    title: '24/7 Support',
    description: 'Always here to help',
    bullets: ['Live chat', 'Email support', 'Video consultations'],
    cta: { text: 'Contact Us', href: '/contact' },
    size: 'small',
    badge: 'Helpful',
  },
  {
    icon: Award,
    title: 'High Success Rate',
    description: '95% acceptance rate',
    bullets: ['Expert review', 'Interview prep', 'Document check'],
    cta: { text: 'Learn More', href: '/about' },
    size: 'small',
    badge: 'Proven',
  },
];

const universityTypes = [
  {
    title: '985 Universities',
    description: 'China\'s most prestigious research universities',
    href: '/universities?type=985',
    count: '39',
    badge: 'Top Tier',
  },
  {
    title: '211 Universities',
    description: 'Key national development universities',
    href: '/universities?type=211',
    count: '115',
    badge: 'Premium',
  },
  {
    title: 'Double First-Class',
    description: 'World-class disciplines and excellence',
    href: '/universities?type=double_first_class',
    count: '137',
    badge: 'Elite',
  },
  {
    title: 'English Programs',
    description: 'Programs taught in English',
    href: '/universities?teaching_language=English',
    count: '500+',
    badge: 'Popular',
  },
  {
    title: 'Scholarships',
    description: 'Financial aid opportunities',
    href: '/universities?scholarship=true',
    count: '200+',
    badge: 'Funded',
  },
  {
    title: 'All Programs',
    description: 'Browse all available programs',
    href: '/programs',
    count: '10K+',
    badge: 'Explore',
  },
];

export function HomePageContent() {
  // Removed API calls to fix 429 errors
  const [loading, setLoading] = useState(false);
  const [successLoading, setSuccessLoading] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000';
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 340; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };
  
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Study In China Academy',
    alternateName: 'SICA',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Your gateway to studying in China. Find universities, programs, scholarships, and apply with expert guidance.',
    sameAs: [],
  };

  return (
    <>
      <SchemaOrg schema={organizationSchema} />
      <div className="flex flex-col min-h-screen">
        {/* Hero Section - Two Column Layout */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left Column - Main Content */}
              <div className="flex flex-col space-y-6 sm:space-y-8">
                <div className="space-y-3 sm:space-y-4">
                  <Badge variant="outline" className="w-fit px-3 py-1 text-xs sm:px-4 sm:py-1 sm:text-sm">
                    Your Gateway to Chinese Education
                  </Badge>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                    Study in <span className="text-primary">China</span>
                    <br />
                    Shape Your Future
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl">
                    Discover world-class universities, find perfect programs, and get expert guidance
                    throughout your application journey.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button asChild size="lg" className="text-base h-11 sm:h-12">
                    <Link href="/universities">
                      <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Explore Universities
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-base h-11 sm:h-12">
                    <Link href="/apply">Apply Now</Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg" className="text-base h-11 sm:h-12">
                    <Link href="/assessment/apply">
                      <ClipboardCheck className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Free Assessment
                    </Link>
                  </Button>
                </div>

              </div>

              {/* Right Column - Removed for now to fix 429 errors */}
              <div className="relative hidden lg:block">
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        </section>

        {/* Announcement Card - Full Width */}
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-background border-b">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-background p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="text-xs sm:text-sm bg-primary text-primary-foreground">
                      Now Open
                    </Badge>
                    <span className="text-xs text-muted-foreground">Limited Seats</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-1">
                    September 2026 Intake Applications Open
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Apply early to secure your spot at top Chinese universities. Scholarships available for qualified students.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 text-primary font-medium">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Sept 2026</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-500 font-medium">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Seats Filling Fast</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-chart-4 font-medium">
                      <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>95% Success Rate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* University Logo Slider */}
        <UniversityLogoSlider />

        {/* Features Section - Bento Grid */}
        <section className="py-12 sm:py-16 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-12">
              <Badge variant="secondary" className="mb-3 sm:mb-4">
                How We Help You
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Your Journey, Our Expertise
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-4">
                Everything you need to study in China, all in one place. From university discovery to application success.
              </p>
            </div>

            {/* Bento Grid - Mobile optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {bentoFeatures.slice(0, 3).map((feature, index) => (
                <Card 
                  key={index} 
                  className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                        <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      {feature.badge && (
                        <Badge variant="outline" className="text-xs">
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 sm:pb-4">
                    <ItemGroup className="gap-1 sm:gap-2">
                      {feature.bullets.map((bullet, bulletIndex) => (
                        <Item key={bulletIndex} variant="muted" className="py-1 sm:py-1.5 px-2 rounded-lg">
                          <ItemMedia variant="icon">
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle className="text-xs sm:text-sm font-normal">{bullet}</ItemTitle>
                          </ItemContent>
                        </Item>
                      ))}
                    </ItemGroup>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full h-9 sm:h-10 text-sm">
                      <Link href={feature.cta.href}>
                        {feature.cta.text}
                        <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {/* Second Row - 3 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
              {bentoFeatures.slice(3, 6).map((feature, index) => (
                <Card 
                  key={index + 3} 
                  className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                        <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      {feature.badge && (
                        <Badge variant="outline" className="text-xs">
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 sm:pb-4">
                    <ItemGroup className="gap-1 sm:gap-2">
                      {feature.bullets.map((bullet, bulletIndex) => (
                        <Item key={bulletIndex} variant="muted" className="py-1 sm:py-1.5 px-2 rounded-lg">
                          <ItemMedia variant="icon">
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle className="text-xs sm:text-sm font-normal">{bullet}</ItemTitle>
                          </ItemContent>
                        </Item>
                      ))}
                    </ItemGroup>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full h-9 sm:h-10 text-sm">
                      <Link href={feature.cta.href}>
                        {feature.cta.text}
                        <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* University Types Section - Horizontal Scroll Cards */}
        <section className="hidden">
          <div className="max-w-7xl mx-auto px-4">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
              <div>
                <Badge variant="secondary" className="mb-4">
                  <Globe className="h-3.5 w-3.5 mr-1.5" />
                  Explore Options
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  Find Your Perfect Match
                </h2>
                <p className="text-muted-foreground text-lg max-w-xl">
                  Browse universities by type, language, or scholarship availability.
                </p>
              </div>
              <Button asChild variant="outline" className="w-fit">
                <Link href="/universities">
                  View All Universities
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Horizontal Scroll Cards with Navigation */}
            <div className="relative">
              {/* Navigation Buttons */}
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Scroll Container */}
              <div ref={scrollRef} className="overflow-x-auto pb-4 mx-12 scrollbar-hide">
                <div className="flex gap-4 md:gap-6 min-w-max">
                  {universityTypes.map((type, index) => (
                    <Link
                      key={index}
                      href={type.href}
                      className="group flex-shrink-0 w-[280px] md:w-[320px]"
                    >
                      <div className={`
                        relative h-48 rounded-2xl border overflow-hidden
                        transition-all duration-300
                        hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1
                        hover:border-primary/30
                      `}>
                        {/* Background Gradient - Blue for all */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                        
                        {/* Content */}
                        <div className="relative h-full flex flex-col justify-between p-5">
                          <div>
                            {/* Badge */}
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-3 bg-primary/10 text-primary">
                              {type.badge}
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                              {type.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {type.description}
                            </p>
                          </div>
                          
                          {/* Count & Arrow */}
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">{type.count}</span>
                            <div className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 sm:py-16 md:py-24 bg-card">
          <div className="max-w-7xl mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-10 sm:mb-12">
              <Badge variant="secondary" className="mb-3 sm:mb-4">
                Simple Process
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                Your journey to studying in China is just 4 simple steps away. We guide you through each stage.
              </p>
            </div>

            {/* Steps Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                {
                  step: '01',
                  icon: Search,
                  title: 'Explore Programs',
                  description: 'Browse 200+ universities and 2,000+ programs. Filter by location, degree, language, and scholarships.',
                  color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/30',
                },
                {
                  step: '02',
                  icon: ClipboardCheck,
                  title: 'Submit Application',
                  description: 'Complete our simple application form. Upload required documents and choose your preferred programs.',
                  color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/30',
                },
                {
                  step: '03',
                  icon: FileText,
                  title: 'Document Review',
                  description: 'Our experts review your application, prepare documents, and coordinate with universities on your behalf.',
                  color: 'text-orange-600 bg-orange-100 dark:bg-orange-950/30',
                },
                {
                  step: '04',
                  icon: CheckCircle2,
                  title: 'Get Accepted',
                  description: 'Receive your admission letter, visa support, and prepare for your exciting journey to China!',
                  color: 'text-green-600 bg-green-100 dark:bg-green-950/30',
                },
              ].map((item, index) => (
                <div key={index} className="relative h-full">
                  {/* Connector Line */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-border to-transparent z-0" />
                  )}
                  
                  <div className="relative bg-background border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    {/* Step Number */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <span className="text-4xl font-bold text-muted-foreground/20">
                        {item.step}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground flex-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-10 sm:mt-12">
              <Button asChild size="lg" className="text-base">
                <Link href="/apply">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Success Cases Section */}
        <section className="py-12 sm:py-16 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-10 sm:mb-12">
              <Badge variant="secondary" className="mb-3 sm:mb-4">
                <Trophy className="h-3.5 w-3.5 mr-1.5" />
                Success Stories
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Dreams Turned Into Reality
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                Meet students who achieved their dreams of studying in China through SICA
              </p>
            </div>

            {/* Success Cases Grid */}
            {successLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : successCases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No success cases available yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {successCases.map((caseItem) => (
                  <Link key={caseItem.id} href={`/success-cases/${caseItem.id}`}>
                    <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                      <div className="relative h-48 sm:h-56 bg-muted">
                        {caseItem.admission_notice_signed_url ? (
                          caseItem.admission_notice_signed_url.toLowerCase().includes('.pdf') ? (
                            <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-950/20">
                              <IconFileTypePdf className="h-14 w-14 text-red-500" />
                            </div>
                          ) : (
                            <Image
                              src={caseItem.admission_notice_signed_url}
                              alt={`${caseItem.student_name_en}'s admission notice`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <IconSchool className="h-14 w-14 text-muted-foreground/50" />
                          </div>
                        )}
                        {caseItem.is_featured && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                              <IconStar className="h-3 w-3 mr-1 fill-current" />
                              Featured
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 sm:p-5">
                        <div className="space-y-2.5">
                          <div>
                            <h3 className="font-semibold text-base sm:text-lg mb-0.5 line-clamp-1">
                              {caseItem.student_name_en}
                              {caseItem.student_name_cn && (
                                <span className="text-muted-foreground ml-1.5 text-sm">
                                  {caseItem.student_name_cn}
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <IconMapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="line-clamp-1">
                                {caseItem.university_name_en || 'University'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {caseItem.admission_year && (
                              <Badge variant="outline" className="text-xs">
                                <IconCalendar className="h-3 w-3 mr-1" />
                                {caseItem.admission_year}
                              </Badge>
                            )}
                            {caseItem.program_name_en && (
                              <Badge variant="secondary" className="text-xs line-clamp-1">
                                {caseItem.program_name_en}
                              </Badge>
                            )}
                          </div>
                          {caseItem.description_en && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {caseItem.description_en}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* View More */}
            <div className="text-center mt-8 sm:mt-10">
              <Button asChild variant="outline" size="lg">
                <Link href="/success-cases">
                  View All Success Stories
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Partners Section */}
        <PartnersSection />

        {/* CTA Section */}
        <section className="relative overflow-hidden py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4">
            <Card className="relative w-full bg-gradient-to-r from-primary via-primary to-primary/90 overflow-hidden shadow-xl">
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-primary-foreground/5 rounded-full blur-2xl" />
              </div>
              
              <CardContent className="relative px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
                  {/* Content */}
                  <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-foreground mb-2">
                      Ready to Study in China?
                    </h2>
                    <p className="text-sm sm:text-base text-primary-foreground/80 max-w-lg mx-auto lg:mx-0">
                      Join thousands of international students who have successfully started their academic journey.
                    </p>
                  </div>
                  
                  {/* Buttons - vertically centered with content */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-end shrink-0">
                    <Button 
                      asChild 
                      size="lg"
                      className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg"
                    >
                      <Link href="/register">
                        Create Free Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant="outline" 
                      size="lg"
                      className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    >
                      <Link href="/contact">
                        Contact Us
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
