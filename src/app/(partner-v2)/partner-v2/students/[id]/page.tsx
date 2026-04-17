'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { ApplicationStatusBadge } from '@/components/partner-v2/application-status-badge';
import { PartnerNotes } from '@/components/partner-v2/partner-notes';
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
import {
  IconArrowLeft,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCalendar,
  IconSchool,
  IconFileText,
  IconCheck,
  IconClock,
  IconX,
  IconLoader2,
  IconUsers,
  IconBuilding,
  IconExternalLink,
  IconEPassport,
  IconBriefcase,
  IconLanguage,
  IconStar,
  IconTrophy,
  IconFlask,
  IconCurrencyDollar,
  IconBrandWechat,
  IconEdit,
  IconTrash,
  IconFile,
  IconUpload,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { CompletionBadge } from '../components/completion-badge';
import { ActivityLog } from '@/components/partner-v2/activity-log';
import type {
  EducationHistoryEntry,
  WorkExperienceEntry,
  FamilyMemberEntry,
  ExtracurricularActivityEntry,
  AwardEntry,
  PublicationEntry,
  ResearchExperienceEntry,
  ScholarshipApplicationData,
  FinancialGuaranteeData,
} from '@/lib/student-api';

const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
  passport: 'Passport',
  diploma: 'Diploma',
  transcript: 'Academic Transcript',
  language_certificate: 'Language Certificate',
  photo: 'Passport Photo',
  recommendation: 'Recommendation Letter',
  cv: 'CV/Resume',
  study_plan: 'Study Plan',
  financial_proof: 'Financial Proof',
  medical_exam: 'Medical Exam Report',
  police_clearance: 'Police Clearance',
  other: 'Other Document',
};

interface StudentProfile {
  // Personal
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  current_address?: string;
  postal_code?: string;
  permanent_address?: string;
  chinese_name?: string;
  marital_status?: string;
  religion?: string;
  // Emergency
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  // Passport
  passport_number?: string;
  passport_expiry_date?: string;
  passport_issuing_country?: string;
  // Academic
  education_history?: EducationHistoryEntry[];
  work_experience?: WorkExperienceEntry[];
  highest_education?: string;
  institution_name?: string;
  field_of_study?: string;
  graduation_date?: string;
  gpa?: string;
  // Language
  hsk_level?: number | string;
  hsk_score?: number | string;
  ielts_score?: string;
  toefl_score?: number | string;
  // Family
  family_members?: FamilyMemberEntry[];
  // Additional
  extracurricular_activities?: ExtracurricularActivityEntry[];
  awards?: AwardEntry[];
  publications?: PublicationEntry[];
  research_experience?: ResearchExperienceEntry[];
  scholarship_application?: ScholarshipApplicationData;
  financial_guarantee?: FinancialGuaranteeData;
  // Preferences
  study_mode?: string;
  funding_source?: string;
  wechat_id?: string;
}

interface Student {
  id: string;
  student_id?: string;
  email: string | null;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  nationality?: string | null;
  created_at: string;
  last_sign_in_at?: string;
  profile?: StudentProfile;
  applications: Application[];
  stats: {
    totalApplications: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
  documents?: Array<{
    id: string;
    type: string;
    file_name: string;
    file_size: number;
    status: string;
    created_at: string;
  }>;
  documentStats?: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
  };
}

interface Application {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  passport_first_name: string;
  passport_last_name: string;
  nationality: string;
  highest_degree?: string;
  gpa?: number;
  programs: {
    id: string;
    name: string;
    name_cn?: string;
    degree_type: string;
    discipline?: string;
    duration_months?: number;
    tuition_per_year?: number;
    tuition_currency?: string;
    universities: {
      id: string;
      name_en: string;
      name_cn?: string;
      city?: string;
      province?: string;
    };
  };
}

function InfoItem({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ArraySection<T>({ title, icon, items, render }: { title: string; icon: React.ReactNode; items?: T[]; render: (item: T, idx: number) => React.ReactNode }) {
  if (!items || items.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx}>
            {render(item, idx)}
            {idx < items.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      if (!token) {
        toast.error('Please sign in first');
        return;
      }

      const response = await fetch(`/api/partner/students/${resolvedParams.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Student deleted successfully');
        router.push('/partner-v2/students');
      } else {
        let errorMsg = 'Failed to delete student';
        try {
          const errData = await response.json();
          errorMsg = errData.error || `HTTP ${response.status}`;
        } catch {
          errorMsg = `HTTP ${response.status}`;
        }
        toast.error(errorMsg);
      }
    } catch {
      toast.error('Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchStudent = async () => {
      setIsLoading(true);
      try {
        const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();

        const response = await fetch(`/api/partner/students/${resolvedParams.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setStudent(data.student);
        } else {
          toast.error('Student not found');
          router.push('/partner-v2/students');
        }
      } catch (error) {
        console.error('Error fetching student:', error);
        toast.error('Failed to load student');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'partner' || user?.role === 'partner_team_member') {
      fetchStudent();
    }
  }, [user, resolvedParams.id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <IconUsers className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  const p = student.profile || {} as StudentProfile;
  const stats = student.stats || { totalApplications: 0, accepted: 0, rejected: 0, pending: 0 };
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/partner-v2/students">
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarImage src={student.avatar_url ?? undefined} alt={student.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
              {getInitials(student.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">
                {student.full_name}
                {p.chinese_name && <span className="text-lg ml-2 text-muted-foreground">({p.chinese_name})</span>}
              </h1>
              <CompletionBadge profile={student.profile} showDetails />
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-sm mt-1">
              <span>{student.email}</span>
              {student.nationality && <><span>•</span><span>{student.nationality}</span></>}
              {p.wechat_id && <><span>•</span><span className="flex items-center gap-1"><IconBrandWechat className="h-3.5 w-3.5" />{p.wechat_id}</span></>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/partner-v2/students/${student.id}/edit`}>
                <IconEdit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconTrash className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Student</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>{student.full_name}</strong>? This action cannot be undone. Students with active applications cannot be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" asChild>
              <a href={`mailto:${student.email}`}>
                <IconMail className="h-4 w-4 mr-2" />
                Contact
              </a>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><IconFileText className="h-4 w-4 text-primary" /></div><div><p className="text-2xl font-bold">{stats.totalApplications}</p><p className="text-xs text-muted-foreground">Applications</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center"><IconCheck className="h-4 w-4 text-green-600" /></div><div><p className="text-2xl font-bold">{stats.accepted}</p><p className="text-xs text-muted-foreground">Accepted</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><IconClock className="h-4 w-4 text-amber-600" /></div><div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center"><IconX className="h-4 w-4 text-red-600" /></div><div><p className="text-2xl font-bold">{stats.rejected}</p><p className="text-xs text-muted-foreground">Rejected</p></div></div></CardContent></Card>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-6 pb-6">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="family">Family</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Contact Information */}
              <Card>
                <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <InfoItem label="Email" value={student.email} icon={<IconMail className="h-4 w-4" />} />
                  <InfoItem label="Phone" value={student.phone} icon={<IconPhone className="h-4 w-4" />} />
                  <InfoItem label="WeChat ID" value={p.wechat_id} icon={<IconBrandWechat className="h-4 w-4" />} />
                  <InfoItem label="Current Address" value={p.current_address} icon={<IconMapPin className="h-4 w-4" />} />
                  <InfoItem label="Permanent Address" value={p.permanent_address} icon={<IconMapPin className="h-4 w-4" />} />
                  <InfoItem label="Postal Code" value={p.postal_code} />
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem label="Chinese Name" value={p.chinese_name} />
                    <InfoItem label="Date of Birth" value={p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : undefined} />
                    <InfoItem label="Gender" value={p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : undefined} />
                    <InfoItem label="Nationality" value={p.nationality} />
                    <InfoItem label="Marital Status" value={p.marital_status ? p.marital_status.replace('_', ' ') : undefined} />
                    <InfoItem label="Religion" value={p.religion} />
                  </div>
                </CardContent>
              </Card>

              {/* Passport Information */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><IconEPassport className="h-4 w-4" />Passport</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem label="Passport Number" value={p.passport_number} />
                    <InfoItem label="Issuing Country" value={p.passport_issuing_country} />
                    <InfoItem label="Expiry Date" value={p.passport_expiry_date ? new Date(p.passport_expiry_date).toLocaleDateString() : undefined} />
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader><CardTitle className="text-base">Emergency Contact</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem label="Name" value={p.emergency_contact_name} icon={<IconUsers className="h-4 w-4" />} />
                    <InfoItem label="Phone" value={p.emergency_contact_phone} icon={<IconPhone className="h-4 w-4" />} />
                    <InfoItem label="Relationship" value={p.emergency_contact_relationship} />
                  </div>
                </CardContent>
              </Card>

              {/* Study Preferences */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><IconSchool className="h-4 w-4" />Study Preferences</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem label="Study Mode" value={p.study_mode ? p.study_mode.replace('_', ' ') : undefined} />
                    <InfoItem label="Funding Source" value={p.funding_source ? p.funding_source.replace(/_/g, ' ') : undefined} />
                  </div>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><IconCalendar className="h-4 w-4" />Account Information</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem label="Registered" value={new Date(student.created_at).toLocaleDateString()} />
                    <InfoItem label="Last Login" value={student.last_sign_in_at ? new Date(student.last_sign_in_at).toLocaleDateString() : undefined} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Academic Tab */}
          <TabsContent value="academic" className="space-y-4">
            {/* Education History */}
            <ArraySection
              title="Education History"
              icon={<IconSchool className="h-4 w-4" />}
              items={p.education_history}
              render={(edu) => (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoItem label="Institution" value={edu.institution} />
                  <InfoItem label="Degree" value={edu.degree} />
                  <InfoItem label="Field of Study" value={edu.field_of_study} />
                  <InfoItem label="GPA" value={edu.gpa} />
                  <InfoItem label="Period" value={edu.start_date ? `${edu.start_date}${edu.end_date ? ` - ${edu.end_date}` : ' - Present'}` : undefined} />
                  <InfoItem label="Location" value={[edu.city, edu.country].filter(Boolean).join(', ') || undefined} />
                </div>
              )}
            />

            {/* Work Experience */}
            <ArraySection
              title="Work Experience"
              icon={<IconBriefcase className="h-4 w-4" />}
              items={p.work_experience}
              render={(work, idx) => (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoItem label="Company" value={work.company} />
                  <InfoItem label="Position" value={work.position} />
                  <InfoItem label="Period" value={work.start_date ? `${work.start_date}${work.end_date ? ` - ${work.end_date}` : ' - Present'}` : undefined} />
                  {work.description && <div className="col-span-2"><InfoItem label="Description" value={work.description} /></div>}
                </div>
              )}
            />

            {/* Language Scores */}
            {(p.hsk_level || p.hsk_score || p.ielts_score || p.toefl_score) && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><IconLanguage className="h-4 w-4" />Language Test Scores</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    {p.hsk_level && <div><p className="text-xs text-muted-foreground">HSK Level</p><p className="font-medium">{p.hsk_level}</p></div>}
                    {p.hsk_score && <div><p className="text-xs text-muted-foreground">HSK Score</p><p className="font-medium">{p.hsk_score}</p></div>}
                    {p.ielts_score && <div><p className="text-xs text-muted-foreground">IELTS Score</p><p className="font-medium">{p.ielts_score}</p></div>}
                    {p.toefl_score && <div><p className="text-xs text-muted-foreground">TOEFL Score</p><p className="font-medium">{p.toefl_score}</p></div>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scholarship Application */}
            {p.scholarship_application && typeof p.scholarship_application === 'object' && Object.values(p.scholarship_application).some(v => v) && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><IconCurrencyDollar className="h-4 w-4" />Scholarship Application</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem label="Type" value={p.scholarship_application.type} />
                    <InfoItem label="Name" value={p.scholarship_application.name} />
                    <InfoItem label="Coverage" value={p.scholarship_application.coverage} />
                    <InfoItem label="Status" value={p.scholarship_application.status} />
                    <InfoItem label="Notes" value={p.scholarship_application.notes} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Guarantee */}
            {p.financial_guarantee && typeof p.financial_guarantee === 'object' && Object.values(p.financial_guarantee).some(v => v) && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><IconCurrencyDollar className="h-4 w-4" />Financial Guarantee</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem label="Guarantor Name" value={p.financial_guarantee.guarantor_name} />
                    <InfoItem label="Relationship" value={p.financial_guarantee.guarantor_relationship} />
                    <InfoItem label="Occupation" value={p.financial_guarantee.guarantor_occupation} />
                    <InfoItem label="Annual Income" value={p.financial_guarantee.annual_income ? `${p.financial_guarantee.annual_income} ${p.financial_guarantee.income_currency || ''}` : undefined} />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="space-y-4">
            <ArraySection
              title="Family Members"
              icon={<IconUsers className="h-4 w-4" />}
              items={p.family_members}
              render={(member, idx) => (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoItem label="Name" value={member.name} />
                  <InfoItem label="Relationship" value={member.relationship} />
                  <InfoItem label="Occupation" value={member.occupation} />
                  <InfoItem label="Phone" value={member.phone} />
                  <InfoItem label="Email" value={member.email} />
                  <InfoItem label="Address" value={member.address} />
                </div>
              )}
            />
            {(!p.family_members || p.family_members.length === 0) && (
              <Card><CardContent className="py-8 text-center text-muted-foreground"><IconUsers className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No family member information available</p></CardContent></Card>
            )}
          </TabsContent>

          {/* Additional Tab */}
          <TabsContent value="additional" className="space-y-4">
            <ArraySection
              title="Extracurricular Activities"
              icon={<IconStar className="h-4 w-4" />}
              items={p.extracurricular_activities}
              render={(act, idx) => (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoItem label="Activity" value={act.activity} />
                  <InfoItem label="Role" value={act.role} />
                  <InfoItem label="Organization" value={act.organization} />
                  <InfoItem label="Period" value={act.start_date ? `${act.start_date}${act.end_date ? ` - ${act.end_date}` : ' - Present'}` : undefined} />
                  {act.description && <div className="col-span-2"><InfoItem label="Description" value={act.description} /></div>}
                </div>
              )}
            />

            <ArraySection
              title="Awards"
              icon={<IconTrophy className="h-4 w-4" />}
              items={p.awards}
              render={(award, idx) => (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoItem label="Title" value={award.title} />
                  <InfoItem label="Issuing Organization" value={award.issuing_organization} />
                  <InfoItem label="Date" value={award.date} />
                  {award.description && <div className="col-span-2"><InfoItem label="Description" value={award.description} /></div>}
                </div>
              )}
            />

            <ArraySection
              title="Publications"
              icon={<IconFileText className="h-4 w-4" />}
              items={p.publications}
              render={(pub, idx) => (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoItem label="Title" value={pub.title} />
                  <InfoItem label="Publisher" value={pub.publisher} />
                  <InfoItem label="Date" value={pub.publication_date} />
                  {pub.url && <InfoItem label="URL" value={pub.url} />}
                  {pub.description && <div className="col-span-2"><InfoItem label="Description" value={pub.description} /></div>}
                </div>
              )}
            />

            <ArraySection
              title="Research Experience"
              icon={<IconFlask className="h-4 w-4" />}
              items={p.research_experience}
              render={(res, idx) => (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoItem label="Topic" value={res.topic} />
                  <InfoItem label="Institution" value={res.institution} />
                  <InfoItem label="Supervisor" value={res.supervisor} />
                  <InfoItem label="Period" value={res.start_date ? `${res.start_date}${res.end_date ? ` - ${res.end_date}` : ' - Present'}` : undefined} />
                  {res.description && <div className="col-span-2"><InfoItem label="Description" value={res.description} /></div>}
                </div>
              )}
            />

            {(!p.extracurricular_activities?.length && !p.awards?.length && !p.publications?.length && !p.research_experience?.length) && (
              <Card><CardContent className="py-8 text-center text-muted-foreground"><IconStar className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No additional information available</p></CardContent></Card>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>All applications submitted by this student</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {student.applications.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No applications found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {student.applications.map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <IconBuilding className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{app.programs.universities.name_en}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="truncate max-w-[150px]">{app.programs.name}</span>
                              <span>•</span>
                              <span>{app.programs.degree_type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <ApplicationStatusBadge status={app.status} />
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/partner-v2/applications/${app.id}`}>
                              <IconExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <IconFile className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{student.documentStats?.total || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Verified</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{student.documentStats?.verified || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <IconClock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Pending</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{student.documentStats?.pending || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <IconX className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Rejected</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{student.documentStats?.rejected || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUpload className="h-4 w-4" />
                  Upload Document
                </CardTitle>
                <CardDescription>Upload documents for this student</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/partner-v2/students/${student.id}/documents`}>
                    <IconUpload className="h-4 w-4 mr-2" />
                    Go to Document Management
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Documents ({student.documents?.length || 0})</CardTitle>
                <CardDescription>
                  All documents uploaded for this student
                </CardDescription>
              </CardHeader>
              <CardContent>
                {student.documents && student.documents.length > 0 ? (
                  <div className="space-y-4">
                    {student.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${
                            doc.status === 'verified' ? 'bg-green-100 dark:bg-green-900/30' :
                            doc.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' :
                            'bg-yellow-100 dark:bg-yellow-900/30'
                          }`}>
                            <IconFile className={`h-6 w-6 ${
                              doc.status === 'verified' ? 'text-green-600' :
                              doc.status === 'rejected' ? 'text-red-600' :
                              'text-yellow-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {ALLOWED_DOCUMENT_TYPES[doc.type] || doc.type}
                              </h3>
                              <Badge className={`
                                ${doc.status === 'verified' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                  doc.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}
                              `}>
                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {doc.file_name} • {doc.file_size / 1024 / 1024 < 1 
                                ? `${(doc.file_size / 1024).toFixed(1)} KB` 
                                : `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
                              }
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/partner-v2/students/${student.id}/documents`}>
                              <IconFileText className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <IconFile className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No documents found</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload documents to support student applications
                    </p>
                    <Button asChild>
                      <Link href={`/partner-v2/students/${student.id}/documents`}>
                        <IconUpload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <PartnerNotes studentId={student.student_id} currentUserId={user?.id} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <ActivityLog
              entityType="student"
              entityId={student.id}
              title="Student Activity"
              limit={20}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
