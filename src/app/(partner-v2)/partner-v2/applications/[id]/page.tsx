'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { ApplicationStatusBadge } from '@/components/partner-v2/application-status-badge';
import { ApplicationTimeline } from '@/components/partner-v2/application-timeline';
import { PartnerNotes } from '@/components/partner-v2/partner-notes';
import {
  IconArrowLeft,
  IconExternalLink,
  IconMail,
  IconPhone,
  IconMapPin,
  IconSchool,
  IconFileText,
  IconLanguage,
  IconTarget,
  IconFile,
  IconLoader2,
  IconBuilding,
  IconUser,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Personal Info
  passport_number: string;
  passport_first_name: string;
  passport_last_name: string;
  nationality: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone: string;
  current_address: string;
  permanent_address: string;
  
  // Education
  highest_degree: string;
  graduation_school: string;
  graduation_date: string;
  gpa: number;
  
  // Language
  chinese_level: string;
  chinese_test_score: string;
  chinese_test_date: string;
  english_level: string;
  english_test_type: string;
  english_test_score: string;
  english_test_date: string;
  
  // Study Plan
  study_plan: string;
  research_interest: string;
  career_goals: string;
  
  // Documents
  passport_copy_url: string;
  diploma_url: string;
  transcript_url: string;
  recommendation_letter_1_url: string;
  recommendation_letter_2_url: string;
  language_certificate_url: string;
  study_plan_url: string;
  photo_url: string;
  medical_certificate_url: string;
  other_documents: string[];
  
  // Relations
  programs: {
    id: string;
    name_en: string;
    name_cn: string;
    degree_type: string;
    discipline: string;
    duration_months: number;
    tuition_per_year: number;
    tuition_currency: string;
    universities: {
      id: string;
      name_en: string;
      name_cn: string;
      city: string;
      province: string;
    };
  };
  users: {
    id: string;
    full_name: string;
    email: string;
  };
  partner: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface TimelineEvent {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by_name?: string;
  notes?: string;
}

const DOCUMENT_LABELS: Record<string, string> = {
  passport_copy_url: 'Passport Copy',
  diploma_url: 'Diploma',
  transcript_url: 'Transcript',
  recommendation_letter_1_url: 'Recommendation Letter 1',
  recommendation_letter_2_url: 'Recommendation Letter 2',
  language_certificate_url: 'Language Certificate',
  study_plan_url: 'Study Plan',
  photo_url: 'Photo',
  medical_certificate_url: 'Medical Certificate',
};

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('sica_auth_token');
        
        const response = await fetch(`/api/applications/${resolvedParams.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setApplication(data.application);
          
          // Fetch timeline
          const timelineResponse = await fetch(`/api/applications/${resolvedParams.id}/timeline`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (timelineResponse.ok) {
            const timelineData = await timelineResponse.json();
            setTimeline(timelineData.events || []);
          }
        } else {
          toast.error('Application not found');
          router.push('/partner-v2/applications');
        }
      } catch (error) {
        console.error('Error fetching application:', error);
        toast.error('Failed to load application');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'partner') {
      fetchApplication();
    }
  }, [user, resolvedParams.id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">Application not found</p>
      </div>
    );
  }

  const documents = Object.entries(DOCUMENT_LABELS)
    .filter(([key]) => {
      const appRecord = application as unknown as Record<string, unknown>;
      return appRecord[key];
    })
    .map(([key, label]) => ({
      key,
      label,
      url: (application as unknown as Record<string, string>)[key],
    }));

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/partner-v2/applications">
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">
                {application.passport_first_name} {application.passport_last_name}
              </h1>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {application.programs.universities.name_en} • {application.programs.name_en}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/partner-v2/applications/${application.id}/documents`}>
                <IconFile className="h-4 w-4 mr-2" />
                Documents
              </Link>
            </Button>
            <Button asChild>
              <a href={`mailto:${application.email}`}>
                <IconMail className="h-4 w-4 mr-2" />
                Contact
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-6 pb-6">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconUser className="h-4 w-4" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">First Name</p>
                      <p className="font-medium">{application.passport_first_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Name</p>
                      <p className="font-medium">{application.passport_last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Passport Number</p>
                      <p className="font-medium">{application.passport_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nationality</p>
                      <p className="font-medium">{application.nationality}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">
                        {application.date_of_birth 
                          ? new Date(application.date_of_birth).toLocaleDateString()
                          : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">{application.gender || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${application.email}`} className="text-primary hover:underline">
                        {application.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconPhone className="h-4 w-4 text-muted-foreground" />
                      <span>{application.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <IconMapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{application.current_address || 'Not provided'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Program Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconSchool className="h-4 w-4" />
                    Program Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">University</p>
                    <div className="flex items-center gap-2 mt-1">
                      <IconBuilding className="h-4 w-4 text-primary" />
                      <p className="font-medium">{application.programs.universities.name_en}</p>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {application.programs.universities.city}, {application.programs.universities.province}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Program</p>
                      <p className="font-medium">{application.programs.name_en}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Degree</p>
                      <p className="font-medium">{application.programs.degree_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Discipline</p>
                      <p className="font-medium">{application.programs.discipline}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{application.programs.duration_months} months</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Tuition</p>
                      <p className="font-medium">
                        {application.programs.tuition_currency} {application.programs.tuition_per_year?.toLocaleString()}/year
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Study Plan */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconTarget className="h-4 w-4" />
                    Study Plan & Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Study Plan</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.study_plan || 'Not provided'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Research Interest</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.research_interest || 'Not provided'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Career Goals</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.career_goals || 'Not provided'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Education Background */}
              <Card>
                <CardHeader>
                  <CardTitle>Education Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Highest Degree</p>
                      <p className="font-medium">{application.highest_degree || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GPA</p>
                      <p className="font-medium">{application.gpa || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Graduation School</p>
                      <p className="font-medium">{application.graduation_school || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Graduation Date</p>
                      <p className="font-medium">
                        {application.graduation_date 
                          ? new Date(application.graduation_date).toLocaleDateString()
                          : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Language Proficiency */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconLanguage className="h-4 w-4" />
                    Language Proficiency
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Chinese</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Level</p>
                        <p className="font-medium">{application.chinese_level || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Score</p>
                        <p className="font-medium">{application.chinese_test_score || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {application.chinese_test_date 
                            ? new Date(application.chinese_test_date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">English</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Test Type</p>
                        <p className="font-medium">{application.english_test_type || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Score</p>
                        <p className="font-medium">{application.english_test_score || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {application.english_test_date 
                            ? new Date(application.english_test_date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconFile className="h-4 w-4" />
                  Uploaded Documents
                </CardTitle>
                <CardDescription>
                  Click to view or download documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No documents uploaded</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.key}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <IconFileText className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{doc.label}</span>
                        </div>
                        <Button variant="ghost" size="icon-sm" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <IconExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <ApplicationTimeline events={timeline} />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <PartnerNotes 
              applicationId={application.id}
              currentUserId={user?.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
