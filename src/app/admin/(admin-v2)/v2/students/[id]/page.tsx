'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard-v2-sidebar';
import { SiteHeader } from '@/components/dashboard-v2-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Calendar,
  Hash,
  MapPin,
  User,
  FileText,
  ExternalLink,
  Edit,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { getValidToken } from '@/lib/auth-token';
import { toast } from 'sonner';

interface StudentDetail {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  nationality: string | null;
  gender: string | null;
  date_of_birth: string | null;
  country: string | null;
  city: string | null;
  current_address: string | null;
  wechat_id: string | null;
  passport_number: string | null;
  highest_education: string | null;
  institution_name: string | null;
  created_at: string;
  updated_at: string | null;
}

interface StudentApplication {
  id: string;
  status: string;
  priority: number | null;
  program_name?: string;
  degree_level?: string;
  university_name?: string;
  submitted_at: string | null;
  created_at: string;
  student?: {
    id?: string;
    user_id?: string;
  };
}

function StudentDetailContent() {
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudent = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      console.log('[StudentDetail] Fetching student with ID:', studentId);

      // Fetch student data and applications in parallel
      const [studentRes, appsRes] = await Promise.all([
        fetch(`/api/admin/individual-students?id=${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/individual-applications?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      console.log('[StudentDetail] Student API status:', studentRes.status);

      if (studentRes.ok) {
        const data = await studentRes.json();
        console.log('[StudentDetail] Response data:', data);
        if (data.id) {
          setStudent(data);
        } else if (data.error) {
          console.error('[StudentDetail] API error:', data.error);
          setError(data.error);
        }
      } else {
        const errData = await studentRes.json().catch(() => ({}));
        console.error('[StudentDetail] HTTP error:', studentRes.status, errData);
        setError(`Failed to load student (HTTP ${studentRes.status})`);
      }

      // Filter applications for this student
      if (appsRes.ok) {
        const data = await appsRes.json();
        const studentApps = (data.applications || [])
          .filter(
            (a: Record<string, unknown>) =>
              (a.student as Record<string, unknown>)?.user_id === studentId || (a.student as Record<string, unknown>)?.id === studentId
          )
          .map((a: Record<string, unknown>) => ({
            id: a.id as string,
            status: a.status as string,
            priority: (a.priority as number) || null,
            program_name: (a.program as Record<string, unknown>)?.name as string || undefined,
            degree_level: (a.program as Record<string, unknown>)?.degree_level as string || undefined,
            university_name: ((a.program as Record<string, unknown>)?.university as Record<string, unknown>)?.name_en as string || undefined,
            submitted_at: a.submitted_at as string | null,
            created_at: a.created_at as string,
          }));
        console.log('[StudentDetail] Found applications:', studentApps.length);
        setApplications(studentApps);
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      setError('Network error while loading student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchStudent();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <User className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold">Student Not Found</h3>
        <p className="text-muted-foreground mt-2">
          {error || 'This student may have been deleted or does not exist.'}
        </p>
        {error && (
          <p className="text-xs text-destructive/70 mt-1 max-w-md">
            Student ID: {studentId} | Open browser console (F12) for details
          </p>
        )}
        <Button className="mt-4" asChild>
          <Link href="/admin/v2/individual-students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: 'secondary',
      submitted: 'default',
      under_review: 'default',
      accepted: 'default',
      rejected: 'destructive',
      document_request: 'outline',
      interview_scheduled: 'default',
      withdrawn: 'secondary',
    };
    return map[status] || 'outline';
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/v2/individual-students">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {student.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </AvatarFallback>
              </Avatar>
              {student.full_name}
              <Badge variant={student.is_active ? 'default' : 'secondary'} className="text-xs">
                {student.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </h2>
            <p className="text-muted-foreground mt-1">{student.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/v2/students/${student.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={student.email} />
                <InfoItem icon={<Phone className="h-4 w-4" />} label="Phone" value={student.phone || '-'} />
                <InfoItem icon={<Globe className="h-4 w-4" />} label="Nationality" value={student.nationality || '-'} capitalize />
                <InfoItem icon={<User className="h-4 w-4" />} label="Gender" value={student.gender || '-'} capitalize />
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'} />
                <InfoItem icon={<Hash className="h-4 w-4" />} label="Passport No." value={student.passport_number || '-'} />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Country" value={student.country || '-'} capitalize />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="City" value={student.city || '-'} />
                <InfoItem icon={<Building2 className="h-4 w-4" />} label="Education" value={student.highest_education || '-'} />
                <InfoItem icon={<Building2 className="h-4 w-4" />} label="Institution" value={student.institution_name || '-'} />
                {student.wechat_id && (
                  <InfoItem icon={<Hash className="h-4 w-4" />} label="WeChat ID" value={student.wechat_id} />
                )}
                {student.current_address && (
                  <InfoItem icon={<MapPin className="h-4 w-4" />} label="Address" value={student.current_address} className="sm:col-span-2" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Source Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Registration Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-500 text-white text-sm">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">Individual Student</p>
                  <p className="text-sm text-muted-foreground">Self-registered student (not referred by partner)</p>
                </div>
                <Badge variant="outline" className="border-blue-300 text-blue-700">Direct</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500" />
                Applications ({applications.length})
              </CardTitle>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/admin/v2/individual-applications?student_id=${studentId}`}>
                  View All
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/admin/v2/applications/${app.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">
                              {app.program_name || 'Unknown Program'}
                              {app.degree_level && (
                                <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {app.degree_level.replace('_', ' ')}
                                </span>
                              )}
                            </p>
                            {app.university_name && (
                              <p className="text-xs text-muted-foreground mt-0.5">{app.university_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Draft'}
                          </span>
                          <Badge variant={getStatusColor(app.status)} className="text-xs">
                            {app.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Activity & Meta */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow label="Total Applications" value={applications.length.toString()} />
              <StatRow
                label="Submitted Apps"
                value={applications.filter((a) => a.status !== 'draft').length.toString()}
              />
              <StatRow
                label="Pending Review"
                value={applications.filter((a) => ['submitted', 'under_review'].includes(a.status)).length.toString()}
              />
              <StatRow
                label="Accepted"
                value={applications.filter((a) => a.status === 'accepted').length.toString()}
              />
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Created"
                value={new Date(student.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              />
              <StatRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Last Updated"
                value={student.updated_at
                  ? new Date(student.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'Never'
                }
              />
              <Separator />
              <StatRow
                label="User ID"
                value={
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {student.user_id.slice(0, 8)}...
                  </code>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Reusable components for the detail page
function InfoItem({
  icon,
  label,
  value,
  className,
  capitalize,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
  capitalize?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 ${className || ''}`}>
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <span className={`font-medium text-sm mt-0.5 break-words ${capitalize ? 'capitalize' : ''}`}>{value}</span>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}

export default function AdminStudentDetailPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Student Details" />
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <StudentDetailContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
