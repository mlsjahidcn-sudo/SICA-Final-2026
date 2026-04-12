'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  FileText,
  CreditCard,
  Loader2,
  Clock,
  Building2,
  BookOpen,
  Sparkles,
  HelpCircle,
  ChevronRight,
  User,
  Upload,
  CheckCircle,
  Circle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectedProgram {
  id: string;
  name: string;
  degree_level: string;
  language: string;
  tuition_fee_per_year: number;
  currency: string;
  universities: {
    id: string;
    name_en: string;
    name_cn: string | null;
    city: string;
    logo_url: string | null;
  };
}

interface SelectedUniversity {
  id: string;
  name_en: string;
  name_cn: string | null;
  logo_url: string | null;
  city: string;
  province: string;
  ranking_national: number | null;
  tuition_min: number | null;
  tuition_currency: string | null;
}

function ApplyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const universityId = searchParams.get('university_id');
  const programId = searchParams.get('program_id');
  
  const [selectedProgram, setSelectedProgram] = useState<SelectedProgram | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<SelectedUniversity | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const fetchSelectionDetails = async () => {
      setLoading(true);
      try {
        if (programId) {
          const res = await fetch(`/api/programs/${programId}`);
          if (res.ok) {
            const data = await res.json();
            setSelectedProgram(data.program);
          }
        } else if (universityId) {
          const res = await fetch(`/api/universities/${universityId}`);
          if (res.ok) {
            const data = await res.json();
            setSelectedUniversity(data.university);
          }
        }
      } catch (error) {
        console.error('Error fetching selection details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSelectionDetails();
  }, [universityId, programId]);

  const steps = [
    {
      number: 1,
      title: 'Create Account',
      description: 'Sign up or log in to your SICA account',
      icon: User,
      estimatedTime: '2-3 min',
      action: 'Sign Up',
      href: '/register',
      details: 'Create your personal account to start the application process',
    },
    {
      number: 2,
      title: 'Complete Profile',
      description: 'Fill in your personal and academic information',
      icon: GraduationCap,
      estimatedTime: '10-15 min',
      action: 'Complete Profile',
      href: '/student-v2/profile',
      details: 'Provide your educational background and personal details',
    },
    {
      number: 3,
      title: 'Upload Documents',
      description: 'Submit required documents for verification',
      icon: Upload,
      estimatedTime: '5-10 min',
      action: 'Upload Documents',
      href: '/student-v2/documents',
      details: 'Upload passport, transcripts, certificates and other documents',
    },
    {
      number: 4,
      title: 'Submit Application',
      description: 'Review and submit your application',
      icon: FileText,
      estimatedTime: '3-5 min',
      action: 'Start Application',
      href: '/student-v2/applications',
      details: 'Review your information and submit your application',
    },
    {
      number: 5,
      title: 'Pay Service Fee',
      description: 'Complete payment to process your application',
      icon: CreditCard,
      estimatedTime: '2-3 min',
      action: 'Pay Now',
      href: '/student-v2/applications',
      details: 'Pay the application service fee to submit',
    },
  ];

  const requirements = [
    { name: 'Valid passport', required: true, category: 'Personal' },
    { name: 'High school diploma or equivalent', required: true, category: 'Academic' },
    { name: 'Academic transcripts', required: true, category: 'Academic' },
    { name: 'Language proficiency certificate (HSK/IELTS/TOEFL)', required: true, category: 'Academic' },
    { name: 'Personal statement', required: true, category: 'Documents' },
    { name: 'Two recommendation letters', required: false, category: 'Documents' },
    { name: 'Health examination form', required: true, category: 'Medical' },
    { name: 'Non-criminal record certificate', required: true, category: 'Personal' },
  ];

  const totalSteps = steps.length;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Hero Section */}
      <div className="bg-primary/5 border-b w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">Apply</span>
            </nav>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  Start Your Application Journey
                </h1>
                <p className="text-lg text-muted-foreground">
                  {selectedProgram || selectedUniversity
                    ? 'Complete the steps below to submit your application'
                    : 'Follow our guided process to apply to your dream university'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5 text-sm py-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  ~30-35 min
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Selection Alert or Program/University Preview */}
          {loading ? (
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : selectedProgram ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Selected Program
                    </CardTitle>
                    <CardDescription>You're applying for this program</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/programs">Change</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg border bg-background flex items-center justify-center overflow-hidden shrink-0">
                    {selectedProgram.universities.logo_url ? (
                      <img
                        src={selectedProgram.universities.logo_url}
                        alt={selectedProgram.universities.name_en}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold">{selectedProgram.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedProgram.universities.name_en}
                      {selectedProgram.universities.name_cn && ` (${selectedProgram.universities.name_cn})`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedProgram.degree_level}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {selectedProgram.language}
                      </Badge>
                      {selectedProgram.tuition_fee_per_year && (
                        <Badge variant="outline" className="text-xs">
                          {selectedProgram.currency || '¥'} {selectedProgram.tuition_fee_per_year.toLocaleString()}/year
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : selectedUniversity ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Selected University
                    </CardTitle>
                    <CardDescription>You're applying to this university</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/universities">Change</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg border bg-background flex items-center justify-center overflow-hidden shrink-0">
                    {selectedUniversity.logo_url ? (
                      <img
                        src={selectedUniversity.logo_url}
                        alt={selectedUniversity.name_en}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold">{selectedUniversity.name_en}</h3>
                    {selectedUniversity.name_cn && (
                      <p className="text-sm text-muted-foreground mb-2">{selectedUniversity.name_cn}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedUniversity.city}, {selectedUniversity.province}
                      </Badge>
                      {selectedUniversity.ranking_national && (
                        <Badge variant="secondary" className="text-xs">
                          #{selectedUniversity.ranking_national} National
                        </Badge>
                      )}
                      {selectedUniversity.tuition_min && (
                        <Badge variant="outline" className="text-xs">
                          {selectedUniversity.tuition_currency || '¥'} {selectedUniversity.tuition_min.toLocaleString()}/year
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Program Selected</AlertTitle>
              <AlertDescription>
                You haven&apos;t selected a program yet.{' '}
                <Link href="/universities" className="text-primary hover:underline font-medium">
                  Browse universities
                </Link>{' '}
                or{' '}
                <Link href="/programs" className="text-primary hover:underline font-medium">
                  explore programs
                </Link>{' '}
                to get started.
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Application Progress</CardTitle>
                  <CardDescription>Complete all steps to submit your application</CardDescription>
                </div>
                <Badge variant="secondary">
                  Step {currentStep + 1} of {totalSteps}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercentage} className="h-2 mb-4" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Getting started</span>
                <span>Application submitted</span>
              </div>
            </CardContent>
          </Card>

          {/* Steps Timeline */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isPending = index > currentStep;
              
              return (
                <Card
                  key={step.number}
                  className={cn(
                    "transition-all duration-200",
                    isCurrent && "border-primary shadow-md",
                    isCompleted && "opacity-75",
                    isPending && "opacity-60"
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Step Icon */}
                      <div className="flex-shrink-0 relative">
                        <div className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                          isCompleted && "bg-primary text-primary-foreground",
                          isCurrent && "bg-primary/10 border-2 border-primary",
                          isPending && "bg-muted"
                        )}>
                          {isCompleted ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <step.icon className={cn(
                              "h-6 w-6",
                              isCurrent && "text-primary",
                              isPending && "text-muted-foreground"
                            )} />
                          )}
                        </div>
                        {index < steps.length - 1 && (
                          <div className={cn(
                            "absolute left-1/2 top-12 w-0.5 h-12 -translate-x-1/2",
                            isCompleted ? "bg-primary" : "bg-muted"
                          )} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Step {step.number}
                              </span>
                              {isCurrent && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                              {isCompleted && (
                                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold">{step.title}</h3>
                          </div>
                          {step.estimatedTime && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              <Clock className="h-3 w-3 mr-1" />
                              {step.estimatedTime}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {step.description}
                        </p>
                        
                        <p className="text-xs text-muted-foreground mb-3">
                          {step.details}
                        </p>

                        {isCurrent && (
                          <Button asChild className="mt-2">
                            <Link href={step.href}>
                              {step.action}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Requirements Grid */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Required Documents
                  </CardTitle>
                  <CardDescription>
                    Prepare these documents before starting your application
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {requirements.filter(r => r.required).length} required
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {requirements.map((req, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-lg border transition-colors",
                      req.required ? "bg-background" : "bg-muted/30"
                    )}
                  >
                    {req.required ? (
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{req.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {req.category}
                        </Badge>
                        {!req.required && (
                          <span className="text-[10px] text-muted-foreground">Optional</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Help & Support Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Need Help?
                </CardTitle>
                <CardDescription>
                  Our team is here to assist you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Have questions about the application process? We're here to help!
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/help">
                    Visit Help Center
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Why Apply with SICA?
                </CardTitle>
                <CardDescription>
                  Benefits of using our platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Free application support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Document review & verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Real-time application tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Visa assistance included</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplyLoading() {
  return (
    <div className="min-h-screen bg-muted/30 py-12 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading application details...</p>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<ApplyLoading />}>
      <ApplyContent />
    </Suspense>
  );
}
