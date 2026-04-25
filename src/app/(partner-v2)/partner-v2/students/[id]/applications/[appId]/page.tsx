/**
 * Application Detail Page
 * Route: /partner-v2/students/[id]/applications/[appId]
 * Shows full details of a single application with clean two-column layout
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ApplicationPaymentSection } from '@/app/(partner-v2)/partner-v2/components/application-payment-section';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

import {
  ArrowLeft,
  Loader2,
  GraduationCap,
  MapPin,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Building2,
  Award,
  BookOpen,
  Globe,
  DollarSign,
  Timer,
  Flag,
  ExternalLink,
  Pencil,
  RotateCcw,
  User,
  Hash,
} from 'lucide-react';

import { getValidToken } from '@/lib/auth-token';
import type { ApplicationStatus } from '../../../components/application-wizard/types';
import { APPLICATION_STATUS_MAP, PRIORITY_OPTIONS } from '../../../components/application-wizard/types';
import { StudentDocumentsSection } from '../../../components/student-documents-section';

// ─── Data types ─────────────────────────────

interface AppDetailProgram {
  id: string;
  name: string;
  degree_level: string;
  duration?: string | null;
  language?: string | null;
  description?: string | null;
  tuition_min?: number | null;
  tuition_max?: number | null;
  scholarship_available?: boolean | null;
  min_gpa?: number | null;
  application_deadline?: string | null;
  universities?: AppDetailUniversity | null;
}

interface AppDetailUniversity {
  id: string;
  name_en: string;
  name_cn?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  ranking?: number | null;
  founded_year?: number | null;
  type?: string | null;
}

interface ApplicationDetail {
  id: string;
  status: string;
  submitted_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  notes?: string | null;
  requested_university_program_note?: string | null;
  priority?: number | null;
  intake?: string | null;
  personal_statement?: string | null;
  study_plan?: string | null;
  profile_snapshot?: Record<string, unknown> | null;
  programs?: AppDetailProgram | AppDetailProgram[] | null;
  students?: {
    id: string;
    user_id: string;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    email?: string | null;
  } | null;
}

// ─── Status timeline ────────────────────────
// Must match ApplicationStatus keys from APPLICATION_STATUS_MAP
const STATUS_FLOW = [
  { key: 'draft', label: 'Draft', icon: Clock },
  { key: 'in_progress', label: 'In Progress', icon: AlertTriangle },
  { key: 'submitted_to_university', label: 'Submitted to University', icon: Send },
  { key: 'passed_initial_review', label: 'Passed Initial Review', icon: CheckCircle2 },
  { key: 'pre_admitted', label: 'Pre Admitted', icon: Award },
  { key: 'admitted', label: 'Admitted', icon: GraduationCap },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
];

// ─── Page component ──────────────────────────

export default function ApplicationDetailPage() {
  const params = useParams();
  const appId = params.appId as string;
  const studentId = params.id as string;

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this application? Once submitted, you cannot make changes.')) {
      return;
    }

    setSubmitting(true);
    try {
      const token = await getValidToken();
      const response = await fetch(`/api/applications/${appId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
        const res = await fetch(`/api/partner/applications?pageSize=200`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          const found = (result.applications || []).find(
            (a: ApplicationDetail) => String(a.id) === String(appId)
          );
          if (found) setApp(found);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchApp() {
      try {
        const token = await getValidToken();
        const res = await fetch(`/api/partner/applications?pageSize=200`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          const found = (result.applications || []).find(
            (a: ApplicationDetail) => String(a.id) === String(appId)
          );
          if (found) setApp(found);
        }
      } catch (err) {
        console.error('Error fetching application:', err);
      } finally {
        setLoading(false);
      }
    }

    if (appId) fetchApp();
  }, [appId]);

  // Listen for real-time application updates from admin status changes
  useEffect(() => {
    const handleApplicationUpdate = () => {
      async function fetchApp() {
        try {
          const token = await getValidToken();
          const res = await fetch(`/api/applications?pageSize=200`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const result = await res.json();
            const found = (result.applications || []).find(
              (a: ApplicationDetail) => String(a.id) === String(appId)
            );
            if (found) setApp(found);
          }
        } catch (err) {
          console.error('Error fetching application:', err);
        }
      }
      fetchApp();
    };
    window.addEventListener('partner-application-update', handleApplicationUpdate);
    return () => window.removeEventListener('partner-application-update', handleApplicationUpdate);
  }, [appId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
        <span className="text-muted-foreground">Loading application...</span>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold">Application Not Found</h3>
        <p className="text-muted-foreground mt-2">This application may have been deleted or you don&apos;t have access.</p>
        <Button className="mt-4" asChild>
          <Link href={`/partner-v2/students/${studentId}/applications`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
          </Link>
        </Button>
      </div>
    );
  }

  // Extract program / university
  const progArray: AppDetailProgram[] = Array.isArray(app.programs)
    ? app.programs
    : app.programs
      ? [app.programs]
      : [];
  const prog = progArray[0] || null;
  const uni = prog?.universities || null;

  // Status config
  const statusConfig = APPLICATION_STATUS_MAP[app.status as ApplicationStatus] || APPLICATION_STATUS_MAP.draft;
  const currentStatusIdx = STATUS_FLOW.findIndex((s) => s.key === app.status);
  const priorityLabel = PRIORITY_OPTIONS.find((p) => p.value === app.priority)?.label;
  const isFinal = ['accepted', 'rejected'].includes(app.status);

  // Student info
  const studentName = app.students?.full_name || [app.students?.first_name, app.students?.last_name].filter(Boolean).join(' ') || 'Unknown';
  const studentInitial = studentName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/partner-v2/students/${studentId}/applications`}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              {prog?.name || uni?.name_en || 'Application'}
            </h2>
            <p className="text-muted-foreground mt-0.5">
              {uni?.name_en || 'Unknown University'} &middot;{' '}
              <span className="capitalize">{prog?.degree_level || 'N/A'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isFinal ? (app.status === 'accepted' ? 'default' : 'destructive') : 'secondary'}
            className="text-sm px-3 py-1"
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Program Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Program Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Program Name" value={prog?.name || '-'} />
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="University" value={uni?.name_en || '-'} />
                <InfoRow icon={<Hash className="h-4 w-4" />} label="Degree Level" value={prog?.degree_level?.replace('_', ' ') || '-'} capitalize />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location" value={[uni?.city, uni?.province, uni?.country].filter(Boolean).join(', ') || '-'} />
                <InfoRow icon={<Timer className="h-4 w-4" />} label="Duration" value={prog?.duration || '-'} />
                <InfoRow icon={<Globe className="h-4 w-4" />} label="Language" value={prog?.language || '-'} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Tuition" value={
                  prog?.tuition_min != null
                    ? `$${prog.tuition_min.toLocaleString()}${prog.tuition_max ? ` – $${prog.tuition_max.toLocaleString()}` : ''}`
                    : 'N/A'
                } />
                <InfoRow icon={<Award className="h-4 w-4" />} label="Scholarship" value={prog?.scholarship_available ? 'Available' : 'Not specified'} />
                {uni?.ranking != null && (
                  <InfoRow icon={<Flag className="h-4 w-4" />} label="Ranking" value={`#${uni.ranking}`} />
                )}
                {prog?.min_gpa != null && (
                  <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Min GPA" value={`${prog.min_gpa}`} />
                )}
                {prog?.application_deadline && (
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Deadline" value={formatDate(prog.application_deadline)} />
                )}
              </div>

              {/* Description */}
              {prog?.description && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">About this Program</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{prog.description}</p>
                  </div>
                </>
              )}

              {/* Custom program note fallback */}
              {!prog && app.requested_university_program_note && (
                <>
                  <Separator className="my-4" />
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Custom Program Request</p>
                    <p className="text-sm">{app.requested_university_program_note}</p>
                  </div>
                </>
              )}

              {app.notes && !app.requested_university_program_note && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{app.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-border" />

                <div className="space-y-6">
                  {STATUS_FLOW.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx <= currentStatusIdx;
                    const isCurrent = idx === currentStatusIdx;

                    return (
                      <div key={step.key} className="flex items-start gap-4">
                        <div className={`relative z-10 h-5 w-5 rounded-full flex items-center justify-center border-2 shadow-sm shrink-0 ${
                          isActive
                            ? isCurrent
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-primary/80 border-primary/80 text-primary-foreground'
                            : 'bg-background border-muted-foreground/40 text-muted-foreground/50'
                        }`}>
                          <Icon className="h-2.5 w-2.5" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className={`font-medium text-sm leading-none ${isActive ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {app.updated_at
                                ? new Date(app.updated_at).toLocaleString()
                                : app.created_at
                                  ? new Date(app.created_at).toLocaleString()
                                  : ''
                              }
                            </p>
                          )}
                          {idx === currentStatusIdx && app.status === 'admitted' && (
                            <p className="text-xs text-emerald-600 font-medium mt-1">Application admitted</p>
                          )}
                          {idx === currentStatusIdx && app.status === 'jw202_released' && (
                            <p className="text-xs text-emerald-600 font-medium mt-1">JW202 Released</p>
                          )}
                          {idx === currentStatusIdx && app.status === 'rejected' && (
                            <p className="text-xs text-red-600 font-medium mt-1">Application rejected</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statements */}
          {(app.personal_statement || app.study_plan) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Statements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {app.personal_statement && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Personal Statement</p>
                    <div className="rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-[280px] overflow-y-auto">
                      {app.personal_statement}
                    </div>
                  </div>
                )}
                {app.study_plan && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Study Plan</p>
                    <div className="rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-[280px] overflow-y-auto">
                      {app.study_plan}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents Section */}
          <StudentDocumentsSection
            studentId={studentId}
            studentName={studentName || 'Student'}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Applicant Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Applicant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {studentInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{studentName}</p>
                  <p className="text-xs text-muted-foreground truncate">{app.students?.email || '-'}</p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2 text-sm">
                <StatRow label="Intake" value={app.intake || '-'} />
                <StatRow label="Priority" value={priorityLabel || '-'} />
                <StatRow label="Created" value={formatDate(app.created_at)} />
              </div>
            </CardContent>
          </Card>

          {/* University Card */}
          {uni && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> University
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {uni.logo_url && (
                  <img
                    src={uni.logo_url}
                    alt={uni.name_en}
                    className="w-full h-16 object-contain rounded-lg bg-muted/50 p-2"
                  />
                )}
                <p className="text-sm font-medium">{uni.name_en}</p>
                {uni.name_cn && <p className="text-xs text-muted-foreground">{uni.name_cn}</p>}

                {[uni.city, uni.province, uni.country].filter(Boolean).length > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[uni.city, uni.province, uni.country].filter(Boolean).join(', ')}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {uni.type && <Badge variant="outline" className="text-[10px]">{uni.type}</Badge>}
                  {uni.founded_year && <Badge variant="secondary" className="text-[10px]">Est. {uni.founded_year}</Badge>}
                  {uni.ranking && <Badge variant="secondary" className="text-[10px]">Rank #{uni.ranking}</Badge>}
                </div>

                {uni.website_url && (
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <a href={uni.website_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Visit Website
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Tracking */}
          <ApplicationPaymentSection applicationId={appId} />

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {app.status === 'draft' && (
                <>
                  <Button asChild variant="outline" className="w-full justify-start" size="sm">
                    <Link href={`/partner-v2/students/${studentId}/apply?edit=${app.id}`}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit Application
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSubmit} disabled={submitting} className="w-full">
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" /> Submit Application</>
                    )}
                  </Button>
                  <Separator className="my-2" />
                </>
              )}
              {(app.status === 'submitted_to_university' || app.status === 'passed_initial_review' || app.status === 'pre_admitted' || app.status === 'in_progress') && (
                <Button variant="outline" size="sm" className="w-full text-amber-600 hover:text-amber-700">
                  <RotateCcw className="mr-2 h-4 w-4" /> Withdraw Application
                </Button>
              )}
</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Helper components ─────────────────────

function InfoRow({ icon, label, value, capitalize }: { icon: React.ReactNode; label: string; value: React.ReactNode; capitalize?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <span className={`font-medium text-sm mt-0.5 ${capitalize ? 'capitalize' : ''}`}>{value}</span>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}

function formatDate(ds: string | null | undefined): string {
  if (!ds) return '-';
  try {
    return new Date(ds).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return ds;
  }
}
