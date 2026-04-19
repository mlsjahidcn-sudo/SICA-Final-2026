'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Mail,
  Globe,
  MapPin,
  GraduationCap,
  Building2,
  FileText,
  ExternalLink,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Hash,
  Star,
  Send,
  User,
  Edit,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { getValidToken } from '@/lib/auth-token';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ApplicationDetail {
  id: string;
  status: string;
  priority: number;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string | null;
  partner_id: string | null;
  created_by: string | null;
  created_by_partner: { id: string; full_name: string; email: string; company_name?: string } | null;
  updated_by: string | null;
  updated_by_partner: { id: string; full_name: string; email: string; company_name?: string } | null;
  program: {
    id: string;
    name: string;
    degree_level: string;
    university: { id: string; name_en: string; city: string; province: string } | null;
  } | null;
  student: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    nationality: string | null;
    highest_education: string | null;
    source: string;
    referred_by_partner: { id: string; full_name: string; email: string; company_name?: string } | null;
  };
}

const STATUS_FLOW = [
  { key: 'draft', label: 'Draft', icon: Clock },
  { key: 'in_progress', label: 'In Progress', icon: Clock },
  { key: 'submitted_to_university', label: 'Submitted to University', icon: Send },
  { key: 'passed_initial_review', label: 'Passed Initial Review', icon: CheckCircle2 },
  { key: 'pre_admitted', label: 'Pre Admitted', icon: GraduationCap },
  { key: 'admitted', label: 'Admitted', icon: CheckCircle2 },
  { key: 'jw202_released', label: 'JW202 Released', icon: CheckCircle2 },
];

function ApplicationDetailContent() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    if (appId) fetchApplication();
  }, [appId]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`/api/admin/partner-applications?id=${appId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.application) setApplication(data.application);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleApprove = async () => {
    setActioning(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`/api/admin/partner-applications/${appId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success('Application approved!');
        fetchApplication();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Approval failed');
      }
    } catch (e) { toast.error('Approval failed'); }
    finally { setActioning(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.length < 5) {
      toast.error('Please provide a rejection reason (min 5 characters)');
      return;
    }
    setActioning(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`/api/admin/partner-applications/${appId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason.trim(), notes: rejectNote.trim() }),
      });
      if (res.ok) {
        toast.success('Application rejected');
        fetchApplication();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Rejection failed');
      }
    } catch (e) { toast.error('Rejection failed'); }
    finally { setActioning(false); }
  };

  const getStatusIndex = (status: string) => STATUS_FLOW.findIndex((s) => s.key === status);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold">Application Not Found</h3>
        <p className="text-muted-foreground mt-2">This application may have been deleted.</p>
        <Button className="mt-4" asChild><Link href="/admin/v2/partner-applications"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
      </div>
    );
  }

  const currentStatusIdx = getStatusIndex(application.status);
  // JW202 Released is the final status - no more actions needed
  const isFinal = ['jw202_released', 'rejected', 'withdrawn'].includes(application.status);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/v2/partner-applications"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              {application.program?.name || 'Unknown Program'}
            </h2>
            <p className="text-muted-foreground mt-0.5">
              {application.program?.university?.name_en || 'Unknown University'} &middot;{' '}
              <span className="capitalize">{application.program?.degree_level || 'N/A'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isFinal ? (['jw202_released', 'admitted', 'pre_admitted', 'passed_initial_review'].includes(application.status) ? 'default' : 'destructive') : 'secondary'}
            className="text-sm px-3 py-1"
          >
            {application.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Program Name" value={application.program?.name || '-'} />
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="University" value={application.program?.university?.name_en || '-'} />
                <InfoRow icon={<Hash className="h-4 w-4" />} label="Degree Level" value={application.program?.degree_level?.replace('_', ' ') || '-'} capitalize />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location" value={
                  application.program?.university?.city
                    ? `${application.program.university.city}${application.program?.university?.province ? ', ' + application.program.university.province : ''}`
                    : '-'
                } />
                <InfoRow icon={<Star className="h-4 w-4" />} label="Priority" value={
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < (application.priority || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                    ))}
                    <span className="ml-1.5 text-sm text-muted-foreground">({application.priority || 0})</span>
                  </div>
                } />
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created" value={new Date(application.created_at).toLocaleDateString()} />
              </div>
              {application.notes && (
                <div className="mt-4 p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{application.notes}</p>
                </div>
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
                              {application.updated_at
                                ? new Date(application.updated_at).toLocaleString()
                                : application.created_at
                                  ? new Date(application.created_at).toLocaleString()
                                  : ''
                              }
                            </p>
                          )}
                          {idx === currentStatusIdx && application.status === 'accepted' && (
                            <p className="text-xs text-emerald-600 font-medium mt-1">Approved by admin</p>
                          )}
                          {idx === currentStatusIdx && application.status === 'rejected' && (
                            <p className="text-xs text-red-600 font-medium mt-1">Rejected by admin</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Status Change Panel */}
          {!isFinal && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Admin Status Management
                </CardTitle>
                <CardDescription>Update the application status. Partners and students can view but not change.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[250px]">
                    <Label htmlFor="status-select">Change Status</Label>
                    <Select 
                      value={application.status} 
                      onValueChange={async (newStatus) => {
                        if (newStatus === application.status) return;
                        
                        // Confirm before changing status
                        if (confirm(`Change status from "${application.status.replace(/_/g, ' ')}" to "${newStatus.replace(/_/g, ' ')}"?`)) {
                          setActioning(true);
                          try {
                            const token = await getValidToken();
                            const res = await fetch(`/api/admin/partner-applications/${appId}/status`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ status: newStatus }),
                            });
                            if (res.ok) {
                              toast.success(`Status changed to ${newStatus.replace(/_/g, ' ')}`);
                              fetchApplication();
                            } else {
                              const err = await res.json();
                              toast.error(err.error || 'Status change failed');
                            }
                          } catch (e) {
                            toast.error('Status change failed');
                          } finally {
                            setActioning(false);
                          }
                        }
                      }}
                    >
                      <SelectTrigger id="status-select" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="submitted_to_university">Submitted to University</SelectItem>
                        <SelectItem value="passed_initial_review">Passed Initial Review</SelectItem>
                        <SelectItem value="pre_admitted">Pre Admitted</SelectItem>
                        <SelectItem value="admitted">Admitted</SelectItem>
                        <SelectItem value="jw202_released">JW202 Released</SelectItem>
                        <SelectItem value="rejected" className="text-red-600">Rejected</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <ShieldX className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-[480px]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject this application?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You are rejecting <strong>{application.student?.full_name}</strong>&apos;s application for{' '}
                          <strong>{application.program?.name}</strong>. A reason must be provided.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-3 my-4">
                        <div className="grid gap-2">
                          <Label htmlFor="reason">Rejection Reason *</Label>
                          <Textarea
                            id="reason"
                            placeholder="Explain why this application is being rejected..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground">{rejectReason.length}/500 (min 5)</p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="note">Internal Notes (optional)</Label>
                          <Textarea
                            id="note"
                            placeholder="Any additional internal comments..."
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={actioning}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => { e.preventDefault(); handleReject(); }}
                          disabled={actioning || rejectReason.length < 5}
                        >
                          {actioning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Reject Application
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Final Status Display */}
          {isFinal && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {application.status === 'jw202_released' ? (
                    <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> JW202 Released - Complete</>
                  ) : application.status === 'admitted' ? (
                    <><CheckCircle2 className="h-4 w-4 text-green-500" /> Admitted</>
                  ) : application.status === 'rejected' ? (
                    <><XCircle className="h-4 w-4 text-red-500" /> Rejected</>
                  ) : (
                    <><XCircle className="h-4 w-4" /> Withdrawn</>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm opacity-80">
                  {application.status === 'jw202_released'
                    ? 'This application is complete. The JW202 form has been released.'
                    : application.status === 'admitted'
                    ? 'The student has been officially admitted.'
                    : application.status === 'rejected'
                    ? 'This application was rejected. The rejection reason should be communicated to the partner.'
                    : 'This application has been withdrawn.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Applicant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/admin/v2/partner-students/${application.student?.user_id || application.student?.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {(application.student?.full_name || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {application.student?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{application.student?.email}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                </div>
              </Link>
              <Separator className="my-3" />
              <div className="space-y-2 text-sm">
                <StatRow label="Nationality" value={application.student?.nationality || '-'} capitalize />
                <StatRow label="Education" value={application.student?.highest_education || '-'} />
                <StatRow label="Source" value={
                  <Badge variant="outline" className="text-xs capitalize">{application.student?.source?.replace('_', ' ') || '-'}</Badge>
                } />
              </div>
            </CardContent>
          </Card>

          {/* Partner Info */}
          {application.student?.referred_by_partner && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Referring Partner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {(application.student.referred_by_partner.full_name || 'P').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{application.student.referred_by_partner.company_name || application.student.referred_by_partner.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{application.student.referred_by_partner.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <StatRow icon={<Hash className="h-3.5 w-3.5" />} label="App ID" value={<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{application.id.slice(0, 12)}...</code>} />
              <StatRow icon={<Calendar className="h-3.5 w-3.5" />} label="Created At" value={new Date(application.created_at).toLocaleString()} />
              {application.created_by_partner && (
                <StatRow
                  icon={<User className="h-3.5 w-3.5" />}
                  label="Added by"
                  value={
                    <div className="text-right">
                      <span className="font-medium text-xs">{application.created_by_partner.full_name}</span>
                      {application.created_by_partner.company_name && (
                        <p className="text-xs text-muted-foreground">{application.created_by_partner.company_name}</p>
                      )}
                    </div>
                  }
                />
              )}
              <StatRow icon={<Calendar className="h-3.5 w-3.5" />} label="Last Updated" value={application.updated_at ? new Date(application.updated_at).toLocaleString() : '-'} />
              {application.updated_by_partner && (
                <StatRow
                  icon={<Edit className="h-3.5 w-3.5" />}
                  label="Updated by"
                  value={
                    <div className="text-right">
                      <span className="font-medium text-xs">{application.updated_by_partner.full_name}</span>
                      {application.updated_by_partner.company_name && (
                        <p className="text-xs text-muted-foreground">{application.updated_by_partner.company_name}</p>
                      )}
                    </div>
                  }
                />
              )}
              <StatRow icon={<Send className="h-3.5 w-3.5" />} label="Status" value={
                <Badge variant="secondary" className="text-xs capitalize">{application.status.replace(/_/g, ' ')}</Badge>
              } />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href="/admin/v2/partner-applications">
                  <ChevronRight className="mr-2 h-4 w-4" /> All Partner Applications
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href={`/admin/v2/partner-students/${application.student?.user_id || application.student?.id}`}>
                  <User className="mr-2 h-4 w-4" /> View Student Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper components
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

function StatRow({ label, value, icon, capitalize }: { label: string; value: React.ReactNode; icon?: React.ReactNode; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={`font-medium text-sm ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  );
}

export default function AdminApplicationDetailPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>;
  }
  if (!user || user.role !== 'admin') return null;

  return (
    <TooltipProvider>
      <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Application Details" />
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ApplicationDetailContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
