'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AppSidebar,
} from '@/components/dashboard-v2-sidebar';
import { SiteHeader } from '@/components/dashboard-v2-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';

import {
  ArrowLeft,
  Pencil,
  FileText,
  UserCheck,
  Globe,
  Mail,
  Calendar,
  Loader2,
  ExternalLink,
  MapPin,
  GraduationCap,
  Building2,
  Clock,
  Hash,
  User,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Download,
  Eye,
  Trash2,
  Upload,
} from 'lucide-react';

import { getValidToken } from '@/lib/auth-token';
import type { ApplicationWithPartner } from '@/lib/types/admin-modules';

interface ApplicationDetail extends Omit<ApplicationWithPartner, 'notes'> {
  notes?: string;
}

const STATUS_FLOW = [
  { key: 'draft', label: 'Draft', icon: Clock },
  { key: 'in_progress', label: 'In Progress', icon: Clock },
  { key: 'submitted_to_university', label: 'Submitted to University', icon: Send },
  { key: 'passed_initial_review', label: 'Passed Initial Review', icon: CheckCircle2 },
  { key: 'pre_admitted', label: 'Pre Admitted', icon: GraduationCap },
  { key: 'admitted', label: 'Admitted', icon: CheckCircle2 },
  { key: 'jw202_released', label: 'JW202 Released', icon: FileText },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
  { key: 'withdrawn', label: 'Withdrawn', icon: XCircle },
];

function ApplicationDetailContent() {
  const params = useParams();
  const appId = params.id as string;

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isIndividual, setIsIndividual] = useState<boolean>(true);

  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [docToDelete, setDocToDelete] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [docToChange, setDocToChange] = useState<any>(null);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeFile, setChangeFile] = useState<File | null>(null);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    async function fetchApplication() {
      if (!appId) return;
      setLoading(true);
      setError(null);
      try {
        const token = await getValidToken();

        // Step 1: First call the general API to get basic info and determine application type
        const basicResponse = await fetch(`/api/admin/applications/${appId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!basicResponse.ok) {
          if (basicResponse.status === 404) {
            setError('Application not found');
          } else {
            const errData = await basicResponse.json().catch(() => ({}));
            setError(errData.error || 'Failed to load application');
          }
          setLoading(false);
          return;
        }

        const basicData = await basicResponse.json();
        const isIndividualApp = basicData.isIndividual === true || basicData.partner_id === null;
        setIsIndividual(isIndividualApp);

        // Step 2: Call the appropriate detailed API based on application type
        const apiEndpoint = isIndividualApp
          ? `/api/admin/individual-applications/${appId}`
          : `/api/admin/partner-applications?id=${appId}`;

        const response = await fetch(apiEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setApp(data);
        } else if (response.status === 404) {
          setError('Application not found');
        } else {
          const errData = await response.json().catch(() => ({}));
          setError(errData.error || 'Failed to load application');
        }
      } catch (err) {
        console.error('Error fetching application:', err);
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }

    fetchApplication();
  }, [appId]);

  // Fetch documents for this application (by app_id and by student_id)
  useEffect(() => {
    async function fetchDocs() {
      if (!appId || !app?.student?.id) return;
      setDocsLoading(true);
      try {
        const token = await getValidToken();
        const [appRes, studentRes] = await Promise.all([
          fetch(`/api/admin/documents?application_id=${appId}&limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/admin/documents?student_id=${app.student.id}&limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        let allDocs: any[] = [];
        if (appRes.ok) {
          const appData = await appRes.json();
          allDocs = [...(appData.documents || [])];
        }
        if (studentRes.ok) {
          const studentData = await studentRes.json();
          const studentDocs = studentData.documents || [];
          const seen = new Set(allDocs.map((d: any) => d.id));
          studentDocs.forEach((d: any) => {
            if (!seen.has(d.id)) {
              allDocs.push(d);
              seen.add(d.id);
            }
          });
        }
        setDocuments(allDocs);
      } catch (e) {
        console.error('Error fetching documents:', e);
      } finally {
        setDocsLoading(false);
      }
    }
    fetchDocs();
  }, [app?.id, app?.student?.id]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { color: 'secondary', label: 'Draft' },
      in_progress: { color: 'default', label: 'In Progress' },
      submitted_to_university: { color: 'default', label: 'Submitted to University' },
      passed_initial_review: { color: 'default', label: 'Passed Initial Review' },
      pre_admitted: { color: 'default', label: 'Pre Admitted' },
      admitted: { color: 'default', label: 'Admitted' },
      jw202_released: { color: 'default', label: 'JW202 Released' },
      rejected: { color: 'destructive', label: 'Rejected' },
      withdrawn: { color: 'secondary', label: 'Withdrawn' },
    };
    const c = config[status] || { color: 'outline' as const, label: status };
    return <Badge variant={c.color}>{c.label}</Badge>;
  };

  const handleDeleteDoc = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`/api/documents?id=${docToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
        toast.success('Document deleted');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to delete document');
      }
    } catch (e) {
      toast.error('Failed to delete document');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setDocToDelete(null);
    }
  };

  const handleChangeDoc = async () => {
    if (!docToChange || !changeFile) return;
    setChanging(true);
    try {
      const token = await getValidToken();
      const formData = new FormData();
      formData.append('student_id', docToChange.student_id);
      formData.append('document_type', docToChange.document_type || docToChange.type);
      formData.append('file', changeFile);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments((prev) =>
          prev.map((d) => (d.id === docToChange.id ? { ...d, ...data.document } : d))
        );
        toast.success('Document updated');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to update document');
      }
    } catch (e) {
      toast.error('Failed to update document');
    } finally {
      setChanging(false);
      setChangeOpen(false);
      setDocToChange(null);
      setChangeFile(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold">Application Not Found</h3>
        <p className="text-muted-foreground mt-2">{error || 'This application may have been deleted.'}</p>
        <Button className="mt-4" asChild><Link href="/admin/v2/individual-applications"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
      </div>
    );
  }

  const currentStatusIdx = STATUS_FLOW.findIndex((s) => s.key === app.status);

  const isFinal = ['jw202_released', 'rejected', 'withdrawn'].includes(app.status);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === app.status) return;
    if (confirm(`Change status from "${app.status.replace(/_/g, ' ')}" to "${newStatus.replace(/_/g, ' ')}"?`)) {
      try {
        const token = await getValidToken();
        const statusEndpoint = isIndividual
          ? `/api/admin/individual-applications/${appId}/status`
          : `/api/admin/partner-applications/${appId}/status`;
        const res = await fetch(statusEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          toast.success(`Status changed to ${newStatus.replace(/_/g, ' ')}`);
          // Refresh application data
          const refreshEndpoint = isIndividual
            ? `/api/admin/individual-applications/${appId}`
            : `/api/admin/partner-applications?id=${appId}`;
          const refreshRes = await fetch(refreshEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setApp(refreshData);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || 'Failed to change status');
        }
      } catch (error) {
        console.error('Error changing status:', error);
        toast.error('Network error. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/v2/individual-applications"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              {app.program?.name || 'Unknown Program'}
            </h2>
            <p className="text-muted-foreground mt-0.5">
              {app.program?.university?.name_en || 'Unknown University'} &middot;{' '}
              <span className="capitalize">{app.program?.degree_level || 'N/A'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFinal ? (
            getStatusBadge(app.status)
          ) : (
            <Select value={app.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue>{getStatusBadge(app.status)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
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
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Program Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-amber-500" />
                Program Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={<GraduationCap className="h-4 w-4" />} label="Program Name" value={app.program?.name || '-'} />
                <InfoItem icon={<Building2 className="h-4 w-4" />} label="University" value={app.program?.university?.name_en || '-'} />
                <InfoItem icon={<Hash className="h-4 w-4" />} label="Degree Level" value={app.program?.degree_level?.replace('_', ' ') || '-'} />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Location" value={
                  app.program?.university?.city
                    ? `${app.program.university.city}${app.program.university.province ? ', ' + app.program.university.province : ''}`
                    : '-'
                } />
                <InfoItem icon={<Star className="h-4 w-4" />} label="Priority" value={
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < (app.priority || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                    ))}
                    <span className="ml-1.5 text-sm text-muted-foreground">({app.priority || 0})</span>
                  </div>
                } />
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Created" value={new Date(app.created_at).toLocaleDateString()} />
              </div>
              {app.notes && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{app.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Applicant Information
              </CardTitle>
              <CardDescription className="text-xs">Self-registered (individual) student</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={<User className="h-4 w-4" />} label="Full Name" value={app.student?.full_name || '-'} />
                <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={app.student?.email || '-'} />
                <InfoItem icon={<Globe className="h-4 w-4" />} label="Nationality" value={app.student?.nationality ? (app.student.nationality.charAt(0).toUpperCase() + app.student.nationality.slice(1)) : '-'} />
                <InfoItem icon={<User className="h-4 w-4" />} label="Gender" value={app.student?.gender ? app.student.gender.charAt(0).toUpperCase() + app.student.gender.slice(1) : '-'} />
                <InfoItem icon={<Building2 className="h-4 w-4" />} label="Highest Education" value={app.student?.highest_education || '-'} />
              </div>
              {app.student?.user_id && (
                <div className="mt-4 pt-4 border-t">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/v2/students/${app.student!.user_id}`}>
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      View Full Student Profile
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Documents
                {documents.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{documents.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No documents uploaded yet
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{doc.document_type_label || doc.type}</span>
                          <span className="text-xs text-muted-foreground">&middot;</span>
                          <span className="text-xs text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant={doc.status === 'verified' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs shrink-0 capitalize">
                        {doc.status}
                      </Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        {doc.file_url && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="View">
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Change"
                          onClick={() => { setDocToChange(doc); setChangeOpen(true); }}
                        >
                          <Upload className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Delete"
                          onClick={() => { setDocToDelete(doc); setDeleteOpen(true); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow label="Current Status" value={getStatusBadge(app.status)} />
              <Separator />
              <StatRow label="Priority" value={<Badge variant={app.priority >= 4 ? 'destructive' : app.priority >= 3 ? 'default' : 'secondary'}>{app.priority || 0}</Badge>} />
              <Separator />
              <StatRow label="Source" value={<Badge variant="secondary">Individual</Badge>} />
            </CardContent>
          </Card>

          {/* Timeline */}
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
                          {idx === currentStatusIdx && app.status === 'accepted' && (
                            <p className="text-xs text-emerald-600 font-medium mt-1">Application approved</p>
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

          {/* Application ID */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow label="App ID" value={<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{app.id.slice(0, 12)}...</code>} />
              {app.partner_id && (
                <StatRow label="Partner ID" value={<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{app.partner_id.slice(0, 8)}...</code>} />
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href={`/admin/v2/applications/${app.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit Application
                </Link>
              </Button>
              {app.student?.user_id && (
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href={`/admin/v2/students/${app.student.user_id}`}>
                    <UserCheck className="mr-2 h-4 w-4" /> View Student Profile
                  </Link>
                </Button>
              )}
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/admin/v2/individual-applications">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold">Delete Document</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete <strong>{docToDelete?.file_name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => { setDeleteOpen(false); setDocToDelete(null); }}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteDoc} disabled={deleting}>
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Document Dialog */}
      {changeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold">Change Document</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Replace <strong>{docToChange?.file_name}</strong> with a new file.
            </p>
            <input
              type="file"
              className="mt-4 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              onChange={(e) => setChangeFile(e.target.files?.[0] || null)}
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => { setChangeOpen(false); setDocToChange(null); setChangeFile(null); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleChangeDoc} disabled={!changeFile || changing}>
                {changing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
function InfoItem({ icon, label, value, className }: { icon: React.ReactNode; label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-3 ${className || ''}`}>
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <span className="font-medium text-sm mt-0.5">{value}</span>
      </div>
    </div>
  );
}

function StatRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
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

export default function ApplicationDetailPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Application Details" />
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <ApplicationDetailContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
