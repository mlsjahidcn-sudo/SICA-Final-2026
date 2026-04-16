'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  IconEdit,
  IconSend,
  IconTrash,
  IconDownload,
} from '@tabler/icons-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface University {
  id: string;
  name: string;
  name_en?: string | null;
  name_cn?: string | null;
  city: string;
  province: string;
  logo_url?: string | null;
}

interface Program {
  id: string;
  name: string;
  name_en?: string | null;
  name_cn?: string | null;
  degree_level: string;
  category?: string;
  language?: string;
  duration_years?: number;
  tuition_fee_per_year?: number;
  currency?: string;
  universities: University;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  nationality: string;
  date_of_birth?: string;
  gender?: string;
  email: string;
  phone?: string;
  current_address?: string;
  permanent_address?: string;
  highest_degree?: string;
  graduation_school?: string;
  graduation_date?: string;
  gpa?: number;
  chinese_level?: string;
  chinese_test_score?: string;
  chinese_test_date?: string;
  english_level?: string;
  english_test_type?: string;
  english_test_score?: string;
  english_test_date?: string;
  passport_number?: string;
  users?: {
    id: string;
    full_name?: string;
    email?: string;
    referred_by_partner_id?: string;
  };
}

interface TimelineEvent {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by_name?: string;
  notes?: string;
}

interface Document {
  id: string;
  document_type: string;
  file_key?: string;
  file_name: string;
  file_size: number;
  content_type: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
}

interface Application {
  id: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  intake?: string;
  personal_statement?: string;
  study_plan?: string;
  notes?: string;
  priority?: number;
  profile_snapshot?: Record<string, string> | null;
  programs: Program;
  students: Student;
  application_documents: Document[];
}

const DOCUMENT_TYPES: Record<string, string> = {
  passport: 'Passport',
  diploma: 'Diploma',
  transcript: 'Transcript',
  language_certificate: 'Language Certificate',
  photo: 'Photo',
  recommendation: 'Recommendation Letter',
  cv: 'CV',
  study_plan: 'Study Plan',
  financial_proof: 'Financial Proof',
  medical_exam: 'Medical Exam',
  police_clearance: 'Police Clearance',
  other: 'Other',
};

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPartnerAdmin, setIsPartnerAdmin] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      setIsLoading(true);
      try {
        const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
        
        const response = await fetch(`/api/applications/${resolvedParams.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setApplication(data.application);
          setTimeline(data.events || []);
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

  // Check if user is partner admin
  useEffect(() => {
    const checkPartnerAdmin = async () => {
      if (user?.role !== 'partner') return;
      try {
        const { getValidToken } = await import('@/lib/auth-token');
        const token = await getValidToken();
        const response = await fetch('/api/partner/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const role = data.partner?.role;
          setIsPartnerAdmin(!role || role === 'partner_admin');
        }
      } catch {
        setIsPartnerAdmin(false);
      }
    };
    checkPartnerAdmin();
  }, [user]);

  const handleSubmit = async () => {
    if (!application) return;
    setIsSubmitting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        toast.success('Application submitted successfully');
        router.push('/partner-v2/applications');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to submit');
      }
    } catch { toast.error('Failed to submit application'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!application) return;
    setIsDeleting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success('Application deleted successfully');
        router.push('/partner-v2/applications');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to delete application');
      }
    } catch {
      toast.error('Failed to delete application');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.file_key) {
      toast.error('Document file not available');
      return;
    }
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch(`/api/documents/${doc.id}/url`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const url = data.url;
        if (url) {
          // Create a temporary link to trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.file_name;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        toast.error('Failed to get download URL');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

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

  const getUniversityName = (uni: University) => {
    return uni.name_en || uni.name;
  };

  const getProgramName = (prog: Program) => {
    return prog.name_en || prog.name;
  };

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
                {application.students.first_name} {application.students.last_name}
              </h1>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              {application.programs.universities.logo_url ? (
                <Avatar className="h-5 w-5 rounded border">
                  <AvatarImage src={application.programs.universities.logo_url} alt="" className="object-contain p-0.5" />
                  <AvatarFallback className="rounded text-[8px]">
                    <IconBuilding className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <IconBuilding className="h-4 w-4 text-muted-foreground" />
              )}
              <p className="text-muted-foreground text-sm">
                {getUniversityName(application.programs.universities)} · {getProgramName(application.programs)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Edit button visible for all non-terminal statuses */}
            {!['accepted', 'rejected', 'withdrawn'].includes(application.status) && (
              <Button variant="outline" asChild>
                <Link href={`/partner-v2/applications/${application.id}/edit`}>
                  <IconEdit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
            {/* Submit button only for draft */}
            {application.status === 'draft' && (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconSend className="h-4 w-4 mr-2" />}
                Submit
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/partner-v2/applications/${application.id}/documents`}>
                <IconFile className="h-4 w-4 mr-2" />
                Documents
              </Link>
            </Button>
            {/* Delete button for partner admins only, for allowed statuses */}
            {isPartnerAdmin && ['draft', 'submitted', 'under_review', 'document_request'].includes(application.status) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconTrash className="h-4 w-4 mr-2" />}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Application?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the application for{' '}
                      <strong>{application.students.first_name} {application.students.last_name}</strong> and all associated documents.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Application
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
                      <p className="font-medium">{application.students.first_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Name</p>
                      <p className="font-medium">{application.students.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Passport Number</p>
                      <p className="font-medium">{application.students.passport_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nationality</p>
                      <p className="font-medium">{application.students.nationality}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">
                        {application.students.date_of_birth 
                          ? new Date(application.students.date_of_birth).toLocaleDateString()
                          : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">{application.students.gender || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${application.students.email}`} className="text-primary hover:underline">
                        {application.students.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconPhone className="h-4 w-4 text-muted-foreground" />
                      <span>{application.students.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <IconMapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{application.students.current_address || 'Not provided'}</span>
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
                      <p className="font-medium">{getUniversityName(application.programs.universities)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {application.programs.universities.city}, {application.programs.universities.province}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Program</p>
                      <p className="font-medium">{getProgramName(application.programs)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Degree</p>
                      <p className="font-medium">{application.programs.degree_level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Discipline</p>
                      <p className="font-medium">{application.programs.category || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{application.programs.duration_years ? `${application.programs.duration_years} years` : 'Not specified'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Tuition</p>
                      <p className="font-medium">
                        {application.programs.currency && application.programs.tuition_fee_per_year 
                          ? `${application.programs.currency} ${application.programs.tuition_fee_per_year.toLocaleString()}/year`
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Statement & Study Plan */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconTarget className="h-4 w-4" />
                    Personal Statement & Study Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Personal Statement</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.profile_snapshot?.personal_statement || application.personal_statement || 'Not provided'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Study Plan</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.profile_snapshot?.study_plan || application.study_plan || 'Not provided'}
                    </p>
                  </div>
                  {(application.profile_snapshot?.intake || application.intake) && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">Intake</p>
                        <p className="text-sm text-muted-foreground">{application.profile_snapshot?.intake || application.intake}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Application Notes & Priority */}
              {(application.notes || (application.priority !== undefined && application.priority !== 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconTarget className="h-4 w-4" />
                      Notes & Priority
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {application.priority !== undefined && application.priority !== 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Priority</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          application.priority === 3 ? 'bg-red-500/10 text-red-600' :
                          application.priority === 2 ? 'bg-amber-500/10 text-amber-600' :
                          application.priority === 1 ? 'bg-muted text-muted-foreground' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {['Normal', 'Low', 'High', 'Urgent'][application.priority] || `P${application.priority}`}
                        </span>
                      </div>
                    )}
                    {application.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm whitespace-pre-wrap mt-1">{application.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
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
                      <p className="font-medium">{application.students.highest_degree || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GPA</p>
                      <p className="font-medium">{application.students.gpa || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Graduation School</p>
                      <p className="font-medium">{application.students.graduation_school || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Graduation Date</p>
                      <p className="font-medium">
                        {application.students.graduation_date 
                          ? new Date(application.students.graduation_date).toLocaleDateString()
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
                        <p className="font-medium">{application.students.chinese_level || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Score</p>
                        <p className="font-medium">{application.students.chinese_test_score || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {application.students.chinese_test_date 
                            ? new Date(application.students.chinese_test_date).toLocaleDateString()
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
                        <p className="font-medium">{application.students.english_test_type || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Score</p>
                        <p className="font-medium">{application.students.english_test_score || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {application.students.english_test_date 
                            ? new Date(application.students.english_test_date).toLocaleDateString()
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
                  {application.application_documents.length} document{application.application_documents.length !== 1 ? 's' : ''} uploaded
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.application_documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconFile className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {application.application_documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <IconFile className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{DOCUMENT_TYPES[doc.document_type] || doc.document_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.file_name} • 
                              {doc.file_size / 1024 / 1024 < 1 
                                ? `${(doc.file_size / 1024).toFixed(1)} KB` 
                                : `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
                              } • {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                            {doc.rejection_reason && (
                              <p className="text-sm text-destructive mt-1">
                                Rejection reason: {doc.rejection_reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleDownload(doc)}
                            title="Download document"
                          >
                            <IconDownload className="h-4 w-4" />
                          </Button>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                            ${doc.status === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : doc.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }
                          `}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Separator />
                <Button asChild>
                  <Link href={`/partner-v2/applications/${application.id}/documents`}>
                    <IconExternalLink className="h-4 w-4 mr-2" />
                    Manage Documents
                  </Link>
                </Button>
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
