'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface LanguageProficiency {
  chinese?: { level?: string; score?: string };
  english?: { level?: string; score?: string; testType?: string };
}

interface StudentApplication {
  id: string;
  status: string;
  submitted_at: string | null;
  programs?: {
    id: string;
    name_en: string;
    degree_type: string;
    universities?: {
      id: string;
      name_en: string;
    };
  };
}

interface StudentMeeting {
  id: string;
  title: string;
  status: string;
  scheduled_at: string;
  meeting_url?: string;
}

interface StudentDocument {
  id: string;
  document_type: string;
  uploaded_at: string;
  verified: boolean;
  file_url: string;
}

interface StudentDetails {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  nationality?: string;
  created_at: string;
  last_sign_in_at?: string;
  students?: {
    id: string;
    passport_first_name: string;
    passport_last_name: string;
    passport_number?: string;
    date_of_birth?: string;
    gender?: string;
    city?: string;
    province?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    education_level?: string;
    gpa?: number;
    language_proficiency?: LanguageProficiency;
  }[];
  applications: StudentApplication[];
  documents: StudentDocument[];
  meetings: StudentMeeting[];
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  draft: { color: 'bg-gray-500/10 text-gray-600', icon: FileText, label: 'Draft' },
  submitted: { color: 'bg-blue-500/10 text-blue-600', icon: Clock, label: 'Submitted' },
  under_review: { color: 'bg-amber-500/10 text-amber-600', icon: Clock, label: 'Under Review' },
  document_request: { color: 'bg-orange-500/10 text-orange-600', icon: AlertCircle, label: 'Document Request' },
  interview_scheduled: { color: 'bg-purple-500/10 text-purple-600', icon: Calendar, label: 'Interview' },
  accepted: { color: 'bg-green-500/10 text-green-600', icon: CheckCircle2, label: 'Accepted' },
  rejected: { color: 'bg-red-500/10 text-red-600', icon: XCircle, label: 'Rejected' },
  withdrawn: { color: 'bg-gray-500/10 text-gray-500', icon: XCircle, label: 'Withdrawn' },
};

function StudentDetailContent() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudentDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/students/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudent(data.student);
      } else {
        toast.error('Student not found');
        router.push('/admin/students');
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error('Failed to load student details');
    } finally {
      setIsLoading(false);
    }
  }, [studentId, router]);

  useEffect(() => {
    fetchStudentDetails();
  }, [fetchStudentDetails]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Student not found</p>
        <Button onClick={() => router.push('/admin/students')} className="mt-4">
          Back to Students
        </Button>
      </div>
    );
  }

  const studentProfile = student.students?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{student.full_name}</h1>
          <p className="text-muted-foreground">{student.email}</p>
        </div>
        <Button asChild>
          <a href={`mailto:${student.email}`}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </a>
        </Button>
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={student.avatar_url} />
                <AvatarFallback className="text-lg">
                  {getInitials(student.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-lg">{student.full_name}</p>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              {student.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.phone}</span>
                </div>
              )}
              {student.nationality && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{student.nationality}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatDate(student.created_at)}</span>
              </div>
              {student.last_sign_in_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Last active {formatDate(student.last_sign_in_at)}</span>
                </div>
              )}
            </div>

            {studentProfile && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium">Passport Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">First Name</p>
                    <p>{studentProfile.passport_first_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Name</p>
                    <p>{studentProfile.passport_last_name}</p>
                  </div>
                  {studentProfile.passport_number && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Passport Number</p>
                      <p>{studentProfile.passport_number}</p>
                    </div>
                  )}
                  {studentProfile.date_of_birth && (
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p>{formatDate(studentProfile.date_of_birth)}</p>
                    </div>
                  )}
                  {studentProfile.gender && (
                    <div>
                      <p className="text-muted-foreground">Gender</p>
                      <p className="capitalize">{studentProfile.gender}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {studentProfile?.emergency_contact_name && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium">Emergency Contact</h4>
                <div className="text-sm">
                  <p>{studentProfile.emergency_contact_name}</p>
                  {studentProfile.emergency_contact_phone && (
                    <p className="text-muted-foreground">{studentProfile.emergency_contact_phone}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="applications">
            <TabsList className="mb-4">
              <TabsTrigger value="applications">
                Applications ({student.applications?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="meetings">
                Meetings ({student.meetings?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="documents">
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Applications</CardTitle>
                  <CardDescription>Student&apos;s program applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {!student.applications || student.applications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No applications yet
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Program</TableHead>
                          <TableHead>University</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {student.applications.map((app) => {
                          const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
                          return (
                            <TableRow key={app.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{app.programs?.name_en || 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {app.programs?.degree_type}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{app.programs?.universities?.name_en || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge className={statusConfig.color}>
                                  <statusConfig.icon className="h-3 w-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {app.submitted_at ? formatDate(app.submitted_at) : 'Not submitted'}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/admin/applications/${app.id}`}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meetings">
              <Card>
                <CardHeader>
                  <CardTitle>Meetings</CardTitle>
                  <CardDescription>Scheduled interviews and meetings</CardDescription>
                </CardHeader>
                <CardContent>
                  {!student.meetings || student.meetings.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No meetings scheduled
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {student.meetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Video className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{meeting.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(meeting.scheduled_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={meeting.status === 'scheduled' ? 'default' : 'secondary'}>
                              {meeting.status}
                            </Badge>
                            {meeting.meeting_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">
                                  Join
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Uploaded documents and certificates</CardDescription>
                </CardHeader>
                <CardContent>
                  {!student.documents || student.documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No documents uploaded
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {student.documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium capitalize">
                              {doc.document_type?.replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                            <TableCell>
                              {doc.verified ? (
                                <Badge className="bg-green-500/10 text-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StudentDetailContent />
    </Suspense>
  );
}
