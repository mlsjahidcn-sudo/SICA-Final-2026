'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Clock,
  Users,
  Globe,
  BookOpen,
  Loader2,
  ArrowLeft,
  Building2,
  DollarSign,
  FileText,
  Calendar,
  Award,
  CheckCircle2,
  TrendingUp,
  Shield,
  Star,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface University {
  id: string;
  name_en: string;
  name_cn: string | null;
  city: string;
  province: string;
  ranking_national: number | null;
  ranking_international: number | null;
  student_count: number | null;
  international_student_count: number | null;
  website: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  type: string | string[];
}

interface RelatedProgram {
  id: string;
  name_en: string;
  degree_type: string;
  tuition_per_year: number | null;
  tuition_currency: string | null;
  duration_months: number | null;
  scholarship_available: boolean;
  universities: {
    id: string;
    name_en: string;
    city: string;
    logo_url: string | null;
  };
}

interface Program {
  id: string;
  name_en: string;
  name_cn: string | null;
  degree_type: string;
  discipline: string | null;
  major: string | null;
  teaching_language: string;
  duration_months: number | null;
  duration_description: string | null;
  tuition_per_year: number | null;
  tuition_currency: string | null;
  application_fee: number | null;
  accommodation_fee_per_year: number | null;
  scholarship_available: boolean;
  scholarship_details: string | null;
  entry_requirements: string | null;
  required_documents: string[] | null;
  intake_months: string[] | null;
  application_deadline_fall: string | null;
  application_deadline_spring: string | null;
  description: string | null;
  curriculum: string | null;
  career_prospects: string | null;
  is_featured: boolean;
  is_popular: boolean;
  view_count: number;
  risk_level: string | null;
  universities: University;
}

interface ProgramDetailContentProps {
  programId: string;
}

const DEGREE_COLORS: Record<string, string> = {
  bachelor: 'bg-blue-500',
  master: 'bg-purple-500',
  phd: 'bg-red-500',
  language: 'bg-green-500',
  foundation: 'bg-orange-500',
  short_term: 'bg-gray-500',
};

const RISK_LEVELS: Record<string, { color: string; label: string; description: string }> = {
  low: { color: 'text-green-600 bg-green-50 border-green-200', label: 'Low Risk', description: 'High visa approval rate' },
  medium: { color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Medium Risk', description: 'Moderate visa requirements' },
  high: { color: 'text-red-600 bg-red-50 border-red-200', label: 'High Risk', description: 'Additional documentation needed' },
};

export function ProgramDetailContent({ programId }: ProgramDetailContentProps) {
  const router = useRouter();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [relatedPrograms, setRelatedPrograms] = useState<RelatedProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStickyApply, setShowStickyApply] = useState(false);

  useEffect(() => {
    if (programId) {
      fetchProgram();
    }
  }, [programId]);

  // Show sticky apply button on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyApply(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/programs/${programId}`);
      if (response.ok) {
        const data = await response.json();
        setProgram(data.program);
        setRelatedPrograms(data.relatedPrograms || []);
      } else {
        toast.error('Program not found');
        router.push('/programs');
      }
    } catch (error) {
      toast.error('Failed to load program');
      router.push('/programs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number | null, currency: string = 'CNY') => {
    if (!amount) return null;
    const symbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getDuration = () => {
    if (program?.duration_description) return program.duration_description;
    if (program?.duration_months) {
      const years = Math.floor(program.duration_months / 12);
      const months = program.duration_months % 12;
      if (years > 0 && months > 0) return `${years} year${years > 1 ? 's' : ''} ${months} months`;
      if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
      return `${months} months`;
    }
    return 'Contact for details';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Program Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The program you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/programs">
            <Button>Browse Programs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const university = program.universities;
  const riskInfo = program.risk_level ? RISK_LEVELS[program.risk_level.toLowerCase()] : null;

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        {university.cover_image_url && university.cover_image_url.trim() !== '' ? (
          <img
            src={university.cover_image_url}
            alt={university.name_en}
            className="w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <Link href="/programs">
            <Button variant="secondary" size="sm" className="gap-2 shadow-md">
              <ArrowLeft className="h-4 w-4" />
              Back to Programs
            </Button>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end gap-4">
              {/* University Logo */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border shadow-lg flex items-center justify-center shrink-0 overflow-hidden">
                {university.logo_url && university.logo_url.trim() !== '' ? (
                  <img
                    src={university.logo_url}
                    alt={university.name_en}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={cn('text-white', DEGREE_COLORS[program.degree_type] || 'bg-gray-500')}>
                    {program.degree_type.charAt(0).toUpperCase() + program.degree_type.slice(1)}
                  </Badge>
                  {program.is_featured && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" /> Featured
                    </Badge>
                  )}
                  {program.is_popular && (
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="h-3 w-3" /> Popular
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 line-clamp-2">
                  {program.name_en}
                </h1>
                {program.name_cn && (
                  <p className="text-muted-foreground">{program.name_cn}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Stats Bar */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 text-sm">
          <Link 
            href={`/universities/${university.id}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Building2 className="h-4 w-4" />
            <span className="font-medium text-foreground">{university.name_en}</span>
          </Link>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {university.city}, {university.province}
          </div>
          {university.ranking_national && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Rank #{university.ranking_national} in China</span>
            </div>
          )}
          {program.discipline && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              {program.discipline}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto mb-6 h-auto p-1">
                <TabsTrigger value="overview" className="px-4 py-2 whitespace-nowrap">Overview</TabsTrigger>
                <TabsTrigger value="curriculum" className="px-4 py-2 whitespace-nowrap">Curriculum</TabsTrigger>
                <TabsTrigger value="career" className="px-4 py-2 whitespace-nowrap">Career</TabsTrigger>
                <TabsTrigger value="requirements" className="px-4 py-2 whitespace-nowrap">Requirements</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Program Overview</h2>
                  {program.description ? (
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="whitespace-pre-wrap">{program.description}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No description available.</p>
                  )}
                </div>

                {/* Quick Facts */}
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Quick Facts</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium">{getDuration()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Language</p>
                        <p className="font-medium">{program.teaching_language}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tuition/Year</p>
                        <p className="font-medium">
                          {formatCurrency(program.tuition_per_year, program.tuition_currency || 'CNY') || 'Contact'}
                        </p>
                      </div>
                    </div>
                    {university.student_count && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Students</p>
                          <p className="font-medium">{university.student_count.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {university.international_student_count && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Intl. Students</p>
                          <p className="font-medium">{university.international_student_count.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {program.intake_months && program.intake_months.length > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Intakes</p>
                          <p className="font-medium">{program.intake_months.join(', ')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scholarship */}
                {program.scholarship_available && (
                  <div className="rounded-lg border border-green-200 bg-green-50/50 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-5 w-5 text-green-600" />
                      <h2 className="text-lg font-semibold text-green-800">Scholarship Available</h2>
                    </div>
                    <p className="text-green-700 whitespace-pre-wrap">
                      {program.scholarship_details || 'Scholarship opportunities available. Contact us for more details.'}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Curriculum Tab */}
              <TabsContent value="curriculum" className="space-y-6">
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Curriculum</h2>
                  {program.curriculum ? (
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="whitespace-pre-wrap">{program.curriculum}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Curriculum details not available. Please contact the university for more information.</p>
                  )}
                </div>
              </TabsContent>

              {/* Career Tab */}
              <TabsContent value="career" className="space-y-6">
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Career Prospects</h2>
                  {program.career_prospects ? (
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="whitespace-pre-wrap">{program.career_prospects}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Career information not available. Please contact the university for more details.</p>
                  )}
                </div>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-6">
                {/* Entry Requirements */}
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Entry Requirements</h2>
                  {program.entry_requirements ? (
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="whitespace-pre-wrap">{program.entry_requirements}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Entry requirements not specified. Please contact the university for details.</p>
                  )}
                </div>

                {/* Required Documents */}
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Required Documents</h2>
                  {program.required_documents && program.required_documents.length > 0 ? (
                    <ul className="space-y-2">
                      {program.required_documents.map((doc, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Document requirements not specified.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Related Programs */}
            {relatedPrograms.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Related Programs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedPrograms.map((rp) => (
                    <Link key={rp.id} href={`/programs/${rp.id}`}>
                      <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {rp.universities.logo_url && rp.universities.logo_url.trim() !== '' ? (
                              <img
                                src={rp.universities.logo_url}
                                alt={rp.universities.name_en}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium line-clamp-1">{rp.name_en}</h3>
                            <p className="text-sm text-muted-foreground">{rp.universities.name_en}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {rp.degree_type}
                              </Badge>
                              {rp.tuition_per_year && (
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(rp.tuition_per_year, rp.tuition_currency || 'CNY')}/yr
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Apply Card */}
            <div className="rounded-lg border bg-card p-6 sticky top-20">
              <div className="space-y-4 mb-6">
                <h2 className="text-lg font-semibold">Program Fees</h2>
                
                {/* Tuition */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tuition/Year</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(program.tuition_per_year, program.tuition_currency || 'CNY') || 'Contact'}
                  </span>
                </div>

                {/* Application Fee */}
                {program.application_fee && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Application Fee</span>
                    <span className="font-medium">
                      {formatCurrency(program.application_fee, program.tuition_currency || 'CNY')}
                    </span>
                  </div>
                )}

                {/* Accommodation */}
                {program.accommodation_fee_per_year && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Accommodation/Year</span>
                    <span className="font-medium">
                      {formatCurrency(program.accommodation_fee_per_year, program.tuition_currency || 'CNY')}
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Deadlines */}
              <div className="space-y-4 mb-6">
                <h2 className="text-lg font-semibold">Application Deadlines</h2>
                
                {program.application_deadline_fall && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fall Intake
                    </span>
                    <Badge variant="secondary">{program.application_deadline_fall}</Badge>
                  </div>
                )}

                {program.application_deadline_spring && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Spring Intake
                    </span>
                    <Badge variant="secondary">{program.application_deadline_spring}</Badge>
                  </div>
                )}

                {!program.application_deadline_fall && !program.application_deadline_spring && (
                  <p className="text-sm text-muted-foreground">Contact for deadline details</p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Risk Level */}
              {riskInfo && (
                <div className={cn('rounded-lg border p-3 mb-4', riskInfo.color)}>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">{riskInfo.label}</span>
                  </div>
                  <p className="text-xs mt-1">{riskInfo.description}</p>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Link href={`/apply/${program.id}`} className="block">
                  <Button className="w-full" size="lg">
                    <FileText className="h-4 w-4 mr-2" />
                    Apply Now
                  </Button>
                </Link>
                <Link href={`/universities/${university.id}`} className="block">
                  <Button variant="outline" className="w-full">
                    <Building2 className="h-4 w-4 mr-2" />
                    View University
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sticky Apply Button (Mobile) */}
      <div 
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-background border-t p-4 lg:hidden transition-transform duration-300 z-50',
          showStickyApply ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="min-w-0">
            <p className="font-medium line-clamp-1">{program.name_en}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(program.tuition_per_year, program.tuition_currency || 'CNY') || 'Contact'}/year
            </p>
          </div>
          <Link href={`/apply/${program.id}`}>
            <Button size="lg" className="shrink-0">
              Apply Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
