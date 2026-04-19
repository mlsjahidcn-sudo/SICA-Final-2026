'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  ArrowLeft,
  Pencil,
  FileText,
  Users,
  GraduationCap,
  Globe,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  Loader2,
  ExternalLink,
  Trash2,
  Plus,
} from 'lucide-react';

import { getValidToken } from '@/lib/auth-token';
import type { PartnerStudentDetail } from '../lib/types';
import {
  formatDate,
  getGenderLabel,
  getNationalityLabel,
  getStudyModeLabel,
  getFundingSourceLabel,
  maskPassportNumber,
  calculateAge,
} from '../lib/student-utils';
import { StudentDocumentsSection } from '../components/student-documents-section';

function StudentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<PartnerStudentDetail | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const token = await getValidToken();
        const response = await fetch(`/api/partner/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          setStudent(result.data);
          setDocumentsCount(result.data.documents_count || 0);
        }
      } catch (error) {
        console.error('Error fetching student:', error);
      } finally {
        setLoading(false);
      }
    }

    if (studentId) fetchStudent();
  }, [studentId]);

  const handleDelete = async () => {
    if (!student) return;

    setDeleting(true);
    try {
      const token = await getValidToken();
      const response = await fetch(`/api/partner/students/${student.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (response.ok) {
        router.push('/partner-v2/students');
      } else {
        alert(result.error || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('An error occurred while deleting the student');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading student details...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground mb-4">Student not found or you do not have access.</p>
        <Button asChild>
          <Link href="/partner-v2/students">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
          </Link>
        </Button>
      </div>
    );
  }

  const age = calculateAge(student.date_of_birth);

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/partner-v2/students">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{student.full_name}</h1>
              <Badge variant={student.is_active ? 'default' : 'secondary'}>
                {student.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Student since {formatDate(student.created_at)}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline">
            <Link href={`/partner-v2/students/${student.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/partner-v2/students/${student.id}/applications`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Applications ({student.applications.total})
            </Link>
          </Button>
          <Button asChild className="gap-1.5">
            <Link href={`/partner-v2/students/${student.id}/apply`}>
              <Plus className="h-4 w-4" />
              New Application
            </Link>
          </Button>
          <Button
            variant={showDocuments ? 'default' : 'outline'}
            onClick={() => setShowDocuments(!showDocuments)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Documents ({documentsCount || student.documents_count || 0})
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Full Name" value={student.full_name} />
                <InfoRow label="Email" value={student.email} icon={<Mail className="h-3.5 w-3.5" />} />
                <InfoRow label="Phone" value={student.phone || '-'} icon={<Phone className="h-3.5 w-3.5" />} />
                <InfoRow label="Gender" value={getGenderLabel(student.gender)} />
                <InfoRow label="Date of Birth" value={formatDate(student.date_of_birth)} />
                <InfoRow label="Age" value={age ? `${age} years` : '-'} />
                <InfoRow label="Nationality" value={getNationalityLabel(student.nationality)} />
                <InfoRow label="Chinese Name" value={student.chinese_name || '-'} />
                <InfoRow label="Marital Status" value={student.marital_status || '-'} />
                <InfoRow label="Religion" value={student.religion || '-'} />
                <InfoRow label="WeChat ID" value={student.wechat_id || '-'} />

                {/* Address */}
                <div className="sm:col-span-2 pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Address</p>
                  <p className="text-sm">
                    {[student.current_address, student.city, student.country, student.postal_code]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </p>
                </div>

                {/* Emergency Contact */}
                {(student.emergency_contact_name || student.emergency_contact_phone) && (
                  <div className="sm:col-span-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Emergency Contact
                    </p>
                    <p className="text-sm">
                      {student.emergency_contact_name}
                      {student.emergency_contact_phone && ` (${student.emergency_contact_phone})`}
                      {student.emergency_contact_relationship && ` - ${student.emergency_contact_relationship}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Passport Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" /> Passport & Visa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoRow label="Passport Number" value={maskPassportNumber(student.passport_number)} monospace />
                <InfoRow label="Expiry Date" value={formatDate(student.passport_expiry_date)} />
                <InfoRow label="Issuing Country" value={student.passport_issuing_country || '-'} />
              </div>
            </CardContent>
          </Card>

          {/* Academic Background */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" /> Academic Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Education Info */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow label="Highest Education" value={student.highest_education || '-'} />
                <InfoRow label="Institution" value={student.institution_name || '-'} />
                <InfoRow label="Field of Study" value={student.field_of_study || '-'} />
                <InfoRow label="GPA" value={student.gpa || '-'} />
                <InfoRow label="Graduation Date" value={formatDate(student.graduation_date)} />

                {/* Language Scores */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Language Proficiency</p>
                  <div className="flex flex-wrap gap-2">
                    {student.hsk_level && <Badge variant="secondary">HSK Level {student.hsk_level}</Badge>}
                    {student.hsk_score && <Badge variant="outline">HSK: {student.hsk_score}</Badge>}
                    {student.ielts_score && <Badge variant="secondary">IELTS: {student.ielts_score}</Badge>}
                    {student.toefl_score && <Badge variant="outline">TOEFL: {student.toefl_score}</Badge>}
                    {!student.hsk_level && !student.hsk_score && !student.ielts_score && !student.toefl_score && (
                      <span className="text-sm text-muted-foreground">No scores recorded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Education History */}
              {student.education_history && student.education_history.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Education History</p>
                    <div className="space-y-3">
                      {student.education_history.map((edu, idx) => (
                        <div key={idx} className="p-3 border rounded-lg text-sm">
                          <div className="font-medium">{edu.degree} - {edu.institution}</div>
                          <div className="text-muted-foreground">
                            {edu.field_of_study} | {edu.start_date} - {edu.end_date || 'Present'}
                            {edu.gpa && ` | GPA: ${edu.gpa}`}
                          </div>
                          {edu.city && edu.country && (
                            <div className="text-xs text-muted-foreground mt-1">{edu.city}, {edu.country}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Work Experience */}
              {student.work_experience && student.work_experience.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Work Experience</p>
                    <div className="space-y-3">
                      {student.work_experience.map((work, idx) => (
                        <div key={idx} className="p-3 border rounded-lg text-sm">
                          <div className="font-medium">{work.position} at {work.company}</div>
                          <div className="text-muted-foreground">
                            {work.start_date} - {work.end_date || 'Present'}
                          </div>
                          {work.description && (
                            <p className="text-xs text-muted-foreground mt-1">{work.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Family Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" /> Family Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.family_members && student.family_members.length > 0 ? (
                <div className="space-y-3">
                  {student.family_members.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                          <span>{member.relationship}</span>
                          {member.occupation && <span>Occupation: {member.occupation}</span>}
                          {member.phone && <span>Phone: {member.phone}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No family members added.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Applications</span>
                <Badge variant="secondary" className="font-mono">{student.applications.total}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Apps</span>
                <Badge variant="secondary" className="font-mono text-amber-600">{student.applications.pending}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Approved</span>
                <Badge variant="default" className="font-mono">{student.applications.approved}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Documents</span>
                <Badge variant="outline" className="font-mono">{student.documents_count || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Study Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground block mb-1">Study Mode</span>
                <Badge variant="outline">{getStudyModeLabel(student.study_mode)}</Badge>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground block mb-1">Funding Source</span>
                <Badge variant="outline">{getFundingSourceLabel(student.funding_source)}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href={`/partner-v2/students/${student.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                </Link>
              </Button>
              <Button
                className="w-full justify-start"
                variant={showDocuments ? 'default' : 'outline'}
                onClick={() => setShowDocuments(!showDocuments)}
              >
                <FileText className="mr-2 h-4 w-4" /> Manage Documents
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href={`/partner-v2/students/${student.id}/applications`}>
                  <ExternalLink className="mr-2 h-4 w-4" /> View Applications ({student.applications.total})
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-1.5" variant="outline">
                <Link href={`/partner-v2/students/${student.id}/apply`}>
                  <Plus className="h-4 w-4" /> New Application
                </Link>
              </Button>
              <Button
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Student
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Documents Section */}
      {showDocuments && (
        <div className="mt-6">
          <StudentDocumentsSection
            studentId={student.id}
            studentName={student.full_name}
            onDocumentsChange={() => setDocumentsCount((prev) => prev + 1)}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{student.full_name}</strong>? This action cannot be undone.
              {student.applications.total > 0 && (
                <span className="block mt-2 text-red-600">
                  This student has {student.applications.total} application(s). Please withdraw or delete all applications first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || student.applications.total > 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Reusable info row component
function InfoRow({ label, value, icon, monospace }: { label: string; value: string; icon?: React.ReactNode; monospace?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        {icon}{label}
      </p>
      {monospace ? (
        <code className="text-sm bg-muted px-2 py-0.5 rounded block overflow-hidden text-ellipsis">{value}</code>
      ) : (
        <p className="text-sm font-medium">{value}</p>
      )}
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StudentDetailContent />
    </Suspense>
  );
}
