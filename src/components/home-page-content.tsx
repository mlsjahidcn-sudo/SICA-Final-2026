'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { SchemaOrg } from '@/components/schema-org';
import { TestimonialsSection } from '@/components/testimonials-section';
import { PartnersSection } from '@/components/partners-section';
import { cn } from '@/lib/utils';

interface FeaturedUniversity {
  id: string;
  name_en: string;
  name_cn: string | null;
  logo_url: string | null;
  city: string;
  province: string;
  type: string | null;
  ranking_national: number | null;
  scholarship_available: boolean;
}

// Bento Grid Features - Each with icon, title, bullet points, and CTA
const bentoFeatures = [
  {
    icon: Building2,
    title: '500+ Universities',
    description: 'Access China\'s top institutions',
    bullets: ['985 & 211 Universities', 'Double First-Class', 'All provinces covered'],
    cta: { text: 'Browse Universities', href: '/universities' },
    size: 'large',
    badge: 'Featured',
  },
  {
    icon: BookOpen,
    title: '10,000+ Programs',
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

const heroStats = [
  { value: '50K+', label: 'Students Placed' },
  { value: '500+', label: 'Partner Universities' },
  { value: '95%', label: 'Success Rate' },
  { value: '100+', label: 'Countries' },
];

export function HomePageContent() {
  const [featuredUniversities, setFeaturedUniversities] = useState<FeaturedUniversity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedUniversities();
  }, []);

  const fetchFeaturedUniversities = async () => {
    try {
      const response = await fetch('/api/universities?limit=3&featured=true');
      const data = await response.json();
      setFeaturedUniversities(data.universities || []);
    } catch (error) {
      console.error('Error fetching featured universities:', error);
    } finally {
      setLoading(false);
    }
  };

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
                </div>

                {/* Stats - Mobile optimized */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-4 border-t">
                  {heroStats.map((stat, index) => (
                    <div key={index} className="flex flex-col p-2 sm:p-0">
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Featured Universities (Desktop only) */}
              <div className="relative hidden lg:block">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-bold">Featured Universities</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Top institutions for international students</p>
                  </div>
                  <Link 
                    href="/universities" 
                    className="group flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    View All 
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
                
                {/* Cards */}
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : featuredUniversities.length > 0 ? (
                    featuredUniversities.map((university) => (
                      <Link key={university.id} href={`/universities/${university.id}`} className="block group">
                        <div className={`
                          relative overflow-hidden rounded-xl border bg-card transition-all duration-300
                          hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/30
                        `}>
                          <div className="p-4">
                            <div className="flex items-start gap-4">
                              {/* Logo */}
                              <div className="flex-shrink-0">
                                {university.logo_url && university.logo_url.trim() !== '' ? (
                                  <img
                                    src={university.logo_url}
                                    alt={university.name_en}
                                    className="w-14 h-14 rounded-lg object-cover border shadow-sm"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border">
                                    <Building2 className="h-7 w-7 text-primary" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                                      {university.name_en}
                                    </h3>
                                    {university.name_cn && (
                                      <p className="text-xs text-muted-foreground mt-0.5">{university.name_cn}</p>
                                    )}
                                  </div>
                                  
                                  {/* Ranking Badge */}
                                  {university.ranking_national && (
                                    <div className="flex-shrink-0 flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md">
                                      <Star className="h-3.5 w-3.5 fill-primary/20" />
                                      <span className="text-sm font-bold">#{university.ranking_national}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Meta info */}
                                <div className="flex items-center flex-wrap gap-2 mt-2">
                                  {/* Type Badge */}
                                  {university.type && (
                                    <span
                                      className={`
                                        inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                        ${university.type === '985' ? 'bg-destructive/10 text-destructive' : ''}
                                        ${university.type === '211' ? 'bg-primary/10 text-primary' : ''}
                                        ${university.type === 'Double First-Class' ? 'bg-chart-3/10 text-chart-3' : ''}
                                        ${university.type === 'Provincial' ? 'bg-chart-2/10 text-chart-2' : ''}
                                      `}
                                    >
                                      {university.type === 'Double First-Class' ? 'DOUBLE FIRST CLASS' : university.type.toUpperCase()}
                                    </span>
                                  )}
                                  
                                  {/* Location */}
                                  <span className="inline-flex items-center text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {university.city}
                                  </span>
                                  
                                  {/* Scholarship */}
                                  {university.scholarship_available && (
                                    <span className="inline-flex items-center text-xs text-chart-4 font-medium">
                                      <Award className="h-3 w-3 mr-1" />
                                      Scholarship
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No featured universities available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        </section>

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
              {bentoFeatures.map((feature, index) => (
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

        {/* Why Trust Us Section */}
        <section className="py-12 sm:py-16 md:py-24 bg-card">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              {/* Left - Content */}
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <Badge variant="secondary" className="mb-3 sm:mb-4">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    Why Trust Us
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                    Your Success is Our Mission
                  </h2>
                  <p className="text-muted-foreground text-base sm:text-lg">
                    We&apos;ve helped thousands of international students achieve their dreams of studying in China. Our comprehensive support ensures a smooth journey from application to enrollment.
                  </p>
                </div>

                {/* Trust Points */}
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { icon: Clock, title: 'Quick Response', desc: 'Get answers within 24 hours' },
                    { icon: Heart, title: 'Personal Support', desc: 'Dedicated consultant for your journey' },
                    { icon: Shield, title: 'Secure Process', desc: 'Your data is safe with us' },
                    { icon: GraduationCap, title: 'High Success Rate', desc: '95% of our students get accepted' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base">{item.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Visual Stats */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1">50K+</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Students Placed</div>
                    </div>
                    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-muted border">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">95%</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-8">
                    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-muted border">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">500+</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Partner Universities</div>
                    </div>
                    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1">100+</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Countries</div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative */}
                <div className="hidden sm:block absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10" />
                <div className="hidden sm:block absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
              </div>
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
