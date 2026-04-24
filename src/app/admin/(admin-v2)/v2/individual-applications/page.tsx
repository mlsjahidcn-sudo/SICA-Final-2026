'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { Search, FileText, Calendar, MoreHorizontal, Plus, AlertCircle, X, Filter, Clock, CheckCircle2, XCircle, GraduationCap, RefreshCw, Star, ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getValidToken } from '@/lib/auth-token';
import type { ApplicationWithPartner } from '@/lib/types/admin-modules';
import { toast } from 'sonner';
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

const STATUS_CONFIG: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'secondary', icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: 'In Progress', color: 'default', icon: <Clock className="h-3 w-3" /> },
  submitted_to_university: { label: 'Submitted to University', color: 'default', icon: <AlertTriangle className="h-3 w-3" /> },
  passed_initial_review: { label: 'Passed Initial Review', color: 'default', icon: <CheckCircle2 className="h-3 w-3 text-teal-500" /> },
  pre_admitted: { label: 'Pre Admitted', color: 'default', icon: <Calendar className="h-3 w-3 text-purple-500" /> },
  admitted: { label: 'Admitted', color: 'default', icon: <CheckCircle2 className="h-3 w-3 text-emerald-500" /> },
  jw202_released: { label: 'JW202 Released', color: 'default', icon: <CheckCircle2 className="h-3 w-3 text-emerald-600" /> },
  rejected: { label: 'Rejected', color: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  withdrawn: { label: 'Withdrawn', color: 'secondary', icon: <XCircle className="h-3 w-3" /> },
};

function IndividualApplicationsContent() {
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<ApplicationWithPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [universityId, setUniversityId] = useState(searchParams.get('university_id') || '');
  const [degreeLevel, setDegreeLevel] = useState(searchParams.get('degree_level') || '');
  const [studentId, setStudentId] = useState(searchParams.get('student_id') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    underReview: 0,
    accepted: 0,
    rejected: 0,
  });
  const [universities, setUniversities] = useState<{ id: number; name_en: string }[]>([]);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(status && { status }),
        ...(universityId && { university_id: universityId }),
        ...(degreeLevel && { degree_level: degreeLevel }),
        ...(studentId && { student_id: studentId }),
      });

      const response = await fetch(`/api/admin/individual-applications?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setStats(data.stats || stats);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || `Failed to load applications (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const token = await getValidToken();
      const response = await fetch('/api/admin/universities?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUniversities(data.universities || []);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [page, search, status, universityId, degreeLevel, studentId]);

  // Reset page when student_id changes (e.g., navigating from student detail)
  useEffect(() => {
    if (studentId) {
      setPage(1);
    }
  }, [studentId]);

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: 'secondary',
      in_progress: 'default',
      submitted_to_university: 'default',
      passed_initial_review: 'default',
      pre_admitted: 'default',
      admitted: 'default',
      jw202_released: 'default',
      rejected: 'destructive',
      withdrawn: 'secondary',
    };
    return colors[status] || 'default';
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Individual Applications</h2>
          <p className="text-muted-foreground">
            Applications from self-registered students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchApplications} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/v2/applications/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Application
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.underReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            {(search || status || universityId || degreeLevel) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatus('');
                  setUniversityId('');
                  setDegreeLevel('');
                  setPage(1);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by student or program..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="max-w-sm"
              />
            </div>
            <Select value={status} onValueChange={(value) => {
              setStatus(value === 'all' ? '' : value);
              setPage(1);
            }}>
              <SelectTrigger className={`w-[160px] ${status ? 'border-primary bg-primary/5' : ''}`}>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="submitted_to_university">Submitted to University</SelectItem>
                <SelectItem value="passed_initial_review">Passed Initial Review</SelectItem>
                <SelectItem value="pre_admitted">Pre Admitted</SelectItem>
                <SelectItem value="admitted">Admitted</SelectItem>
                <SelectItem value="jw202_released">JW202 Released</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={universityId} onValueChange={(value) => {
              setUniversityId(value === 'all' ? '' : value);
              setPage(1);
            }}>
              <SelectTrigger className={`w-[200px] ${universityId ? 'border-primary bg-primary/5' : ''}`}>
                <SelectValue placeholder="All Universities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.map((uni) => (
                  <SelectItem key={uni.id} value={String(uni.id)}>
                    {uni.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={degreeLevel} onValueChange={(value) => {
              setDegreeLevel(value === 'all' ? '' : value);
              setPage(1);
            }}>
              <SelectTrigger className={`w-[150px] ${degreeLevel ? 'border-primary bg-primary/5' : ''}`}>
                <SelectValue placeholder="All Degrees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Degrees</SelectItem>
                <SelectItem value="bachelor">Bachelor</SelectItem>
                <SelectItem value="master">Master</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Active filters summary */}
          {(search || status || universityId || degreeLevel) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {search && (
                <Badge variant="secondary" className="gap-1">
                  Search: {search}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setSearch(''); setPage(1); }} />
                </Badge>
              )}
              {status && (
                <Badge variant="secondary" className="gap-1">
                  Status: {status.replace('_', ' ')}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setStatus(''); setPage(1); }} />
                </Badge>
              )}
              {universityId && (
                <Badge variant="secondary" className="gap-1">
                  University: {universities.find(u => String(u.id) === universityId)?.name_en || universityId}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setUniversityId(''); setPage(1); }} />
                </Badge>
              )}
              {degreeLevel && (
                <Badge variant="secondary" className="gap-1">
                  Degree: {degreeLevel}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setDegreeLevel(''); setPage(1); }} />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Applications ({applications.length})
              </CardTitle>
              <CardDescription>
                Self-registered student applications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={fetchApplications} className="ml-auto">Retry</Button>
            </div>
          )}
          {loading && !applications.length ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Loading applications...</p>
            </div>
          ) : !loading && applications.length === 0 && !error ? (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No individual applications found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
                  return (
                    <TableRow key={app.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Link href={`/admin/v2/applications/${app.id}`} className="flex items-center gap-2 hover:text-primary">
                          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{app.student?.full_name?.charAt(0)?.toUpperCase() || 'S'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-sm">{app.student?.full_name || 'Unknown'}</span>
                            <p className="text-xs text-muted-foreground">{app.student?.email || '-'}</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/v2/applications/${app.id}`} className="hover:text-primary text-sm font-medium">
                          {app.program?.name || '-'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{app.program?.university?.name_en || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal capitalize">
                          {app.program?.degree_level || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">Direct</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: app.priority || 0 }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          ))}
                          {(!app.priority || app.priority === 0) && <span className="text-xs text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.color} className="gap-1 text-xs">
                          {statusCfg.icon}
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Link href={`/admin/v2/applications/${app.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function IndividualApplicationsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
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
          <SiteHeader title="Individual Applications" />
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <IndividualApplicationsContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
