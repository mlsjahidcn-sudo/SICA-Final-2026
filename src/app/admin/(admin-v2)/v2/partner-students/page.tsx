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
  Users,
  FileText,
  Calendar,
  MoreHorizontal,
  ArrowRight,
  Eye,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  User,
} from 'lucide-react';
import { getValidToken } from '@/lib/auth-token';
import { toast } from 'sonner';
import type { PartnerStudent } from '@/lib/types/admin-modules';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StudentTransferDialog } from '@/components/admin/student-transfer-dialog';
import { AdminStudentCreateDialog } from '@/components/admin/admin-student-create-dialog';

interface PartnerOption {
  id: string;
  full_name: string;
  company_name?: string;
}

function PartnerStudentsContent() {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<PartnerStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [nationality, setNationality] = useState(searchParams.get('nationality') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [partnerFilter, setPartnerFilter] = useState(searchParams.get('partner_id') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
    withApplications: 0,
  });
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(nationality && { nationality }),
        ...(partnerFilter && { partner_id: partnerFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/partner-students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
        setTotalPages(data.pagination.totalPages);
        setFilteredTotal(data.pagination.total || 0);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, nationality, partnerFilter, statusFilter]);

  const fetchPartners = async () => {
    try {
      const token = await getValidToken();
      const response = await fetch('/api/admin/partners?limit=100&status=approved', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners.map((p: { id: string; full_name: string; company_name?: string }) => ({
          id: p.id,
          full_name: p.full_name,
          company_name: p.company_name,
        })));
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchPartners();
  }, []);

  const toggleStudentStatus = async (studentId: string, currentStatus: boolean) => {
    setTogglingId(studentId);
    try {
      const token = await getValidToken();
      const response = await fetch(`/api/admin/partner-students/${studentId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Student ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchStudents();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling student status:', error);
      toast.error('Failed to update student status');
    } finally {
      setTogglingId(null);
    }
  };

  const getStatusBadgeVariant = (isActive: boolean): "default" | "secondary" | "destructive" | "outline" => {
    return isActive ? 'default' : 'secondary';
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
                <h1 className="text-2xl font-bold tracking-tight">Partner Students</h1>
                <p className="text-muted-foreground text-sm">
                  Manage all students referred by partner organizations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fetchStudents()}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <AdminStudentCreateDialog onCreateComplete={fetchStudents} />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.active}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.newThisMonth}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">With Applications</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.withApplications}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-9"
                    />
                  </div>
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
                        <SelectItem key={p.id} value={p.id}>
                          {p.company_name || p.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(val) => {
                    setStatusFilter(val === 'all' ? '' : val);
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={nationality} onValueChange={(val) => {
                    setNationality(val === 'all' ? '' : val);
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-full sm:w-[170px]">
                      <SelectValue placeholder="Nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Nationalities</SelectItem>
                      <SelectItem value="china">China</SelectItem>
                      <SelectItem value="nigeria">Nigeria</SelectItem>
                      <SelectItem value="pakistan">Pakistan</SelectItem>
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="bangladesh">Bangladesh</SelectItem>
                      <SelectItem value="kenya">Kenya</SelectItem>
                      <SelectItem value="ghana">Ghana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Students Table */}
            <Card>
              <CardHeader>
                <CardTitle>Students List</CardTitle>
                <CardDescription>
                  {students.length} of {filteredTotal || stats.total} partner-referred students
                  {(statusFilter || nationality || partnerFilter) && ' (filtered)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Added by</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>Applications</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading && students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                            Loading students...
                          </TableCell>
                        </TableRow>
                      ) : students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            No students found matching your filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        students.map((student) => (
                          <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/admin/v2/partner-students/${student.id}`}
                                className="font-semibold hover:text-primary transition-colors hover:underline"
                              >
                                {student.full_name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{student.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {student.referred_by_partner?.company_name || student.referred_by_partner?.full_name || 'Unassigned'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {student.created_by_partner ? (
                                <div className="flex flex-col">
                                  <span className="font-medium">{student.created_by_partner.full_name}</span>
                                  {student.created_by_partner.company_name && (
                                    <span className="text-xs text-muted-foreground">{student.created_by_partner.company_name}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm capitalize">{student.nationality || '-'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {student.applications.total}
                                </Badge>
                                {student.applications.pending > 0 && (
                                  <Badge variant="outline" className="text-xs font-normal">
                                    {student.applications.pending} pending
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(student.is_active)} className="cursor-pointer select-none">
                                {student.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(student.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/v2/partner-students/${student.id}`} className="cursor-pointer">
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => toggleStudentStatus(student.id, student.is_active)}
                                    disabled={togglingId === student.id}
                                    className="cursor-pointer"
                                  >
                                    {togglingId === student.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : student.is_active ? (
                                      <UserX className="mr-2 h-4 w-4" />
                                    ) : (
                                      <UserCheck className="mr-2 h-4 w-4" />
                                    )}
                                    {student.is_active ? 'Deactivate' : 'Activate'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <StudentTransferDialog
                                    studentId={student.id}
                                    studentName={student.full_name}
                                    currentPartnerId={student.referred_by_partner_id ?? undefined}
                                    onTransferComplete={fetchStudents}
                                    trigger={
                                      <button className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground w-full">
                                        <ArrowRight className="mr-2 h-4 w-4" />
                                        Transfer to Partner
                                      </button>
                                    }
                                  />
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
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
                  Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to <span className="font-medium">{Math.min(page * 20, filteredTotal || stats.total)}</span> of <span className="font-medium">{filteredTotal || stats.total}</span> students
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
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

export default function PartnerStudentsPage() {
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
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <PartnerStudentsContent />
      </Suspense>
    </TooltipProvider>
  );
}
