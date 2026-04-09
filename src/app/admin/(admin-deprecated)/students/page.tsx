'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Mail,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Eye,
  MoreHorizontal,
  UserCheck,
  Calendar,
  MapPin,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Student {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  nationality?: string;
  avatar_url?: string;
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
  }[];
  applications?: {
    total: number;
    pending: number;
    accepted: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total: number;
  active: number;
  newThisMonth: number;
  withApplications: number;
}

const ITEMS_PER_PAGE = 20;

function StudentsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, newThisMonth: 0, withApplications: 0 });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [nationalityFilter, setNationalityFilter] = useState(searchParams.get('nationality') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const nationalities = ['China', 'Nigeria', 'Pakistan', 'India', 'Bangladesh', 'Indonesia', 'Thailand', 'Vietnam', 'Russia', 'Kazakhstan'];

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(nationalityFilter !== 'all' && { nationality: nationalityFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/students?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error('Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, nationalityFilter, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSelectedStudents([]);
    fetchStudents();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setNationalityFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
    setSelectedStudents([]);
  };

  const hasActiveFilters = searchQuery || nationalityFilter !== 'all' || statusFilter !== 'all';

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (student: Student) => {
    if (student.full_name) {
      return student.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (student.students?.[0]) {
      return (student.students[0].passport_first_name[0] + student.students[0].passport_last_name[0]).toUpperCase();
    }
    return 'ST';
  };

  const getActivityStatus = (lastSignIn?: string) => {
    if (!lastSignIn) return { label: 'Never', color: 'text-muted-foreground' };
    const daysSinceLogin = Math.floor(
      (Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLogin < 7) return { label: 'Active', color: 'text-green-600' };
    if (daysSinceLogin < 30) return { label: 'Recent', color: 'text-amber-600' };
    return { label: 'Inactive', color: 'text-muted-foreground' };
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage student accounts and track their progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/applications">
              <FileText className="h-4 w-4 mr-2" />
              View Applications
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/students/new">
              <Users className="h-4 w-4 mr-2" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                <p className="text-lg md:text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Active</p>
                <p className="text-lg md:text-2xl font-bold">{stats.active.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">New</p>
                <p className="text-lg md:text-2xl font-bold">{stats.newThisMonth.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Applied</p>
                <p className="text-lg md:text-2xl font-bold">{stats.withApplications.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <form onSubmit={handleSearch} className="space-y-3 md:space-y-4">
            <div className="flex flex-col gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Quick Filters - Row on desktop, scrollable on mobile */}
              <div className="flex flex-wrap gap-2">
                <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {nationalities.map(n => (
                      <SelectItem key={n} value={n.toLowerCase()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="submit" className="flex-1 sm:flex-initial">Search</Button>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs md:text-sm text-muted-foreground">Filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    Search: {searchQuery}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                  </Badge>
                )}
                {nationalityFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {nationalityFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setNationalityFilter('all')} />
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {statusFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  Clear all
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedStudents.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
          <Checkbox
            checked={selectedStudents.length === students.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedStudents.length} selected
          </span>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Bulk Actions
                <MoreHorizontal className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Export Selected</DropdownMenuItem>
              <DropdownMenuItem>Send Email</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No students found</p>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Students will appear here once they register'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedStudents.length === students.length && students.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden md:table-cell">Nationality</TableHead>
                  <TableHead className="hidden lg:table-cell">Applications</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const activityStatus = getActivityStatus(student.last_sign_in_at);
                  return (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/students/${student.id}`)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleSelectStudent(student.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={student.avatar_url} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(student)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.full_name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {student.nationality || 'N/A'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-normal">
                            {student.applications?.total || 0} total
                          </Badge>
                          {(student.applications?.pending || 0) > 0 && (
                            <Badge variant="secondary" className="font-normal">
                              {student.applications?.pending} pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={`text-sm font-medium ${activityStatus.color}`}>
                          {activityStatus.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDate(student.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/students/${student.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/applications?student=${student.id}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                View Applications
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
          <p className="text-xs md:text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} students
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages || isLoading}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StudentsListContent />
    </Suspense>
  );
}
