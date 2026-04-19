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
import { Search, FileText, Calendar, MoreHorizontal, Plus, AlertCircle, X, Filter, Clock, CheckCircle2, XCircle, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { getValidToken } from '@/lib/auth-token';
import type { ApplicationWithPartner } from '@/lib/types/admin-modules';

function IndividualApplicationsContent() {
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<ApplicationWithPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [universityId, setUniversityId] = useState(searchParams.get('university_id') || '');
  const [degreeLevel, setDegreeLevel] = useState(searchParams.get('degree_level') || '');
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
  }, [page, search, status, universityId, degreeLevel]);

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: 'secondary',
      submitted: 'default',
      under_review: 'default',
      accepted: 'default',
      rejected: 'destructive',
      document_request: 'outline',
      interview_scheduled: 'default',
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
        <Button asChild>
          <Link href="/admin/v2/applications/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Application
          </Link>
        </Button>
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
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                  <TableHead>Intake</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} className="cursor-pointer" onClick={() => window.location.href = `/admin/v2/applications/${app.id}`}>
                    <TableCell>
                      <div>
                        <Link 
                          href={`/admin/v2/applications/${app.id}`}
                          className="font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {app.student?.full_name || 'Unknown'}
                        </Link>
                        <p className="text-xs text-muted-foreground">{app.student?.email || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{app.program?.name || '-'}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{app.program?.university?.name_en || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize font-normal">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {app.program?.degree_level?.replace('_', ' ') || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {app.intake || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusColor(app.status)}
                        className={app.status === 'accepted' ? 'bg-green-100 text-green-700 hover:bg-green-100' : app.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-100' : ''}
                      >
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/v2/applications/${app.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
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
