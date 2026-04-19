'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppSidebar } from '@/components/dashboard-v2-sidebar';
import { SiteHeader } from '@/components/dashboard-v2-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FileText,
  Calendar,
  MoreHorizontal,
  Eye,
  Search,
  RefreshCw,
  User,
  Building2,
  UserCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { getValidToken } from '@/lib/auth-token';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ApplicationSource {
  type: 'individual' | 'partner';
  id: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  priority: number | null;
  program: {
    id: string;
    name: string;
    degree_level: string;
    university?: { name_en: string } | null;
  } | null;
  student: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
  } | null;
  created_by_partner?: { full_name: string; company_name?: string } | null;
  referred_by_partner?: { full_name: string; company_name?: string } | null;
}

interface PartnerOption {
  id: string;
  full_name: string;
  company_name?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'secondary', icon: <Clock className="h-3 w-3" /> },
  submitted: { label: 'Submitted', color: 'default', icon: <AlertTriangle className="h-3 w-3" /> },
  under_review: { label: 'Under Review', color: 'default', icon: <Search className="h-3 w-3" /> },
  accepted: { label: 'Accepted', color: 'default', icon: <CheckCircle2 className="h-3 w-3 text-emerald-500" /> },
  rejected: { label: 'Rejected', color: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  document_request: { label: 'Doc Request', color: 'outline', icon: <FileText className="h-3 w-3" /> },
  interview_scheduled: { label: 'Interview', color: 'default', icon: <Calendar className="h-3 w-3" /> },
  withdrawn: { label: 'Withdrawn', color: 'secondary', icon: <XCircle className="h-3 w-3" /> },
};

function AllApplicationsContent() {
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<ApplicationSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') || '');
  const [partnerFilter, setPartnerFilter] = useState(searchParams.get('partner_id') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, individual: 0, partner: 0, pending: 0, underReview: 0, accepted: 0, rejected: 0 });
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getValidToken();

      // Fetch both individual and partner applications in parallel
      const [indRes, partnerRes] = await Promise.all([
        fetch(`/api/admin/individual-applications?page=${page}&limit=50&search=${encodeURIComponent(search)}&status=${status}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/partner-applications?page=${page}&limit=50&search=${encodeURIComponent(search)}&status=${status}${partnerFilter ? `&partner_id=${partnerFilter}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const indData = indRes.ok ? await indRes.json() : { applications: [], stats: { total: 0 } };
      const partnerData = partnerRes.ok ? await partnerRes.json() : { applications: [], stats: { total: 0 } };

      // Mark individual applications
      const individualApps: ApplicationSource[] = (indData.applications || []).map((a: Record<string, unknown>) => ({
        type: 'individual' as const,
        id: a.id as string,
        status: a.status as string,
        submitted_at: (a.submitted_at as string) || null,
        created_at: a.created_at as string,
        priority: (a.priority as number) || null,
        program: a.program as ApplicationSource['program'],
        student: a.student as ApplicationSource['student'],
        created_by_partner: null,
        referred_by_partner: null,
      }));

      // Mark partner applications
      const partnerApps: ApplicationSource[] = (partnerData.applications || []).map((a: Record<string, unknown>) => ({
        type: 'partner' as const,
        id: a.id as string,
        status: a.status as string,
        submitted_at: (a.submitted_at as string) || null,
        created_at: a.created_at as string,
        priority: (a.priority as number) || null,
        program: a.program as ApplicationSource['program'],
        student: a.student as ApplicationSource['student'],
        created_by_partner: (a.created_by_partner as { full_name: string; company_name?: string }) || null,
        referred_by_partner: (a.referred_by_partner as { full_name: string; company_name?: string }) || null,
      }));

      // Combine
      let combined: ApplicationSource[] = [...individualApps, ...partnerApps];

      // Apply source filter
      if (sourceFilter === 'individual') {
        combined = combined.filter(a => a.type === 'individual');
      } else if (sourceFilter === 'partner') {
        combined = combined.filter(a => a.type === 'partner');
      }

      // Sort by created_at desc
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setApplications(combined);

      // Calculate combined stats
      const indStats = indData.stats || { total: 0, pending: 0, underReview: 0, accepted: 0, rejected: 0 };
      const partnerStats = partnerData.stats || { total: 0, pending: 0, underReview: 0, accepted: 0, rejected: 0 };

      setStats({
        total: (indStats.total || 0) + (partnerStats.total || 0),
        individual: indStats.total || 0,
        partner: partnerStats.total || 0,
        pending: (indStats.pending || 0) + (partnerStats.pending || 0),
        underReview: (indStats.underReview || 0) + (partnerStats.underReview || 0),
        accepted: (indStats.accepted || 0) + (partnerStats.accepted || 0),
        rejected: (indStats.rejected || 0) + (partnerStats.rejected || 0),
      });

      setTotalPages(Math.ceil(((indStats.total || 0) + (partnerStats.total || 0)) / 50));

    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sourceFilter, partnerFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const token = await getValidToken();
        const res = await fetch('/api/admin/partners?limit=100&status=approved', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPartners(data.partners.map((p: { id: string; full_name: string; company_name?: string }) => ({
            id: p.id,
            full_name: p.full_name,
            company_name: p.company_name,
          })));
        }
      } catch (e) { console.error(e); }
    };
    loadPartners();
  }, []);

  const handleApprove = async (app: ApplicationSource) => {
    setActioningId(app.id);
    try {
      const token = await getValidToken();
      const apiEndpoint = app.type === 'individual'
        ? `/api/admin/individual-applications/${app.id}/approve`
        : `/api/admin/partner-applications/${app.id}/approve`;

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success('Application approved successfully');
        fetchApplications();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to approve application');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve application');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (app: ApplicationSource) => {
    setActioningId(app.id);
    try {
      const token = await getValidToken();
      const apiEndpoint = app.type === 'individual'
        ? `/api/admin/individual-applications/${app.id}/reject`
        : `/api/admin/partner-applications/${app.id}/reject`;

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Rejected by administrator' }),
      });
      if (res.ok) {
        toast.success('Application rejected successfully');
        fetchApplications();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to reject application');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject application');
    } finally {
      setActioningId(null);
    }
  };

  const getDetailUrl = (app: ApplicationSource) => {
    return app.type === 'individual'
      ? `/admin/v2/applications/${app.id}`
      : `/admin/v2/partner-applications/${app.id}`;
  };

  const getStudentDetailUrl = (app: ApplicationSource) => {
    return app.type === 'individual'
      ? `/admin/v2/students/${app.student?.id}`
      : `/admin/v2/partner-students/${app.student?.user_id || app.student?.id}`;
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 overflow-auto bg-muted/10">
          <div className="flex flex-col gap-4 p-4 md:p-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">All Applications</h1>
                <p className="text-muted-foreground text-sm">
                  View all applications from individual registrations and partner referrals
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fetchApplications()}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Individual</CardTitle>
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.individual}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Partner</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.partner}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.pending}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.accepted}</div></CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or program..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-9"
                    />
                  </div>
                  <Select value={sourceFilter} onValueChange={(val) => {
                    setSourceFilter(val === 'all' ? '' : val);
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={status} onValueChange={(val) => {
                    setStatus(val === 'all' ? '' : val);
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-full sm:w-[170px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="document_request">Doc Request</SelectItem>
                      <SelectItem value="interview_scheduled">Interview</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={partnerFilter} onValueChange={(val) => {
                    setPartnerFilter(val === 'all' ? '' : val);
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="All Partners" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Partners</SelectItem>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.company_name || p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Applications Table */}
            <Card>
              <CardHeader>
                <CardTitle>Applications List</CardTitle>
                <CardDescription>
                  {applications.length} of {stats.total} total applications
                  {(status || sourceFilter || partnerFilter || search) && ' (filtered)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>University</TableHead>
                        <TableHead>Degree</TableHead>
                        <TableHead>Added by</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading && applications.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                            Loading applications...
                          </TableCell>
                        </TableRow>
                      ) : applications.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            No applications found matching your filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        applications.map((app) => {
                          const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
                          return (
                            <TableRow key={`${app.type}-${app.id}`} className="hover:bg-muted/50 transition-colors">
                              <TableCell>
                                <Badge variant={app.type === 'individual' ? 'secondary' : 'outline'} className="text-xs">
                                  {app.type === 'individual' ? (
                                    <><UserCircle className="h-3 w-3 mr-1" /> Individual</>
                                  ) : (
                                    <><Building2 className="h-3 w-3 mr-1" /> Partner</>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Link href={getStudentDetailUrl(app)} className="flex items-center gap-2 hover:text-primary">
                                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="font-semibold text-sm">{app.student?.full_name || 'Unknown'}</span>
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Link href={getDetailUrl(app)} className="hover:text-primary text-sm font-medium">
                                  {app.program?.name || '-'}
                                </Link>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{app.program?.university?.name_en || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs font-normal capitalize">
                                  {app.program?.degree_level || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {app.type === 'partner' && app.created_by_partner ? (
                                  <div className="flex flex-col">
                                    <span className="font-medium">{app.created_by_partner.full_name}</span>
                                    {app.created_by_partner.company_name && (
                                      <span className="text-xs text-muted-foreground">{app.created_by_partner.company_name}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusCfg.color} className="gap-1 text-xs">
                                  {statusCfg.icon}
                                  {statusCfg.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: app.priority || 0 }).map((_, i) => (
                                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  ))}
                                  {(!app.priority || app.priority === 0) && <span className="text-xs text-muted-foreground">-</span>}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-1 justify-end">
                                  <Link href={getDetailUrl(app)}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>

                                  {/* Quick Action Buttons - Only for partner applications and non-final statuses */}
                                  {app.type === 'partner' && !['accepted', 'rejected'].includes(app.status) && (
                                    <>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Approve">
                                            <CheckCircle2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Approve Application?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will mark the application for <strong>{app.student?.full_name}</strong>&apos;s
                                              <strong> {app.program?.name}</strong> program as <strong className="text-emerald-600">Accepted</strong>.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel disabled={actioningId === app.id}>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={(e) => { e.preventDefault(); handleApprove(app); }}
                                              disabled={actioningId === app.id}
                                              className="bg-emerald-600 hover:bg-emerald-700"
                                            >
                                              {actioningId === app.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              ) : (
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                              )}
                                              Approve
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>

                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Reject">
                                            <XCircle className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Reject Application?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will mark the application for <strong>{app.student?.full_name}</strong>&apos;s
                                              <strong> {app.program?.name}</strong> program as <strong className="text-red-600">Rejected</strong>.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel disabled={actioningId === app.id}>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={(e) => { e.preventDefault(); handleReject(app); }}
                                              disabled={actioningId === app.id}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              {actioningId === app.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              ) : (
                                                <XCircle className="mr-2 h-4 w-4" />
                                              )}
                                              Reject
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{(page - 1) * 50 + 1}</span> to <span className="font-medium">{Math.min(page * 50, stats.total)}</span> of <span className="font-medium">{stats.total}</span> applications
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AllApplicationsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" /><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <TooltipProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <AllApplicationsContent />
      </Suspense>
    </TooltipProvider>
  );
}
