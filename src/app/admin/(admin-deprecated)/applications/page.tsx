'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import {
  FileText,
  Loader2,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  Send,
  ChevronLeft,
  ChevronRight,
  FileUp,
  LayoutGrid,
  List,
  MoreHorizontal,
  GraduationCap,
  MapPin,
  Mail,
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

interface Application {
  id: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  passport_first_name: string;
  passport_last_name: string;
  nationality: string;
  email: string;
  programs: {
    id: string;
    name_en: string;
    degree_type: string;
    universities: {
      id: string;
      name_en: string;
      city: string;
    };
  };
  users: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface Stats {
  total: number;
  submitted: number;
  under_review: number;
  document_request: number;
  interview_scheduled: number;
  accepted: number;
  rejected: number;
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: typeof Clock; label: string }> = {
  draft: { color: 'text-gray-600', bgColor: 'bg-gray-500/10', icon: FileText, label: 'Draft' },
  submitted: { color: 'text-blue-600', bgColor: 'bg-blue-500/10', icon: Send, label: 'Submitted' },
  under_review: { color: 'text-amber-600', bgColor: 'bg-amber-500/10', icon: Clock, label: 'Under Review' },
  document_request: { color: 'text-orange-600', bgColor: 'bg-orange-500/10', icon: AlertCircle, label: 'Document Request' },
  interview_scheduled: { color: 'text-purple-600', bgColor: 'bg-purple-500/10', icon: Calendar, label: 'Interview' },
  accepted: { color: 'text-green-600', bgColor: 'bg-green-500/10', icon: CheckCircle2, label: 'Accepted' },
  rejected: { color: 'text-red-600', bgColor: 'bg-red-500/10', icon: XCircle, label: 'Rejected' },
  withdrawn: { color: 'text-gray-500', bgColor: 'bg-gray-500/10', icon: XCircle, label: 'Withdrawn' },
};

const KANBAN_COLUMNS = ['submitted', 'under_review', 'document_request', 'interview_scheduled', 'accepted', 'rejected'];

const ITEMS_PER_PAGE = 15;

function ReviewApplicationsContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, submitted: 0, under_review: 0, document_request: 0, interview_scheduled: 0, accepted: 0, rejected: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin/applications' : '/partner/applications';

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (universityFilter !== 'all') params.append('university_id', universityFilter);
      if (degreeFilter !== 'all') params.append('degree_type', degreeFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage.toString());
      params.append('limit', viewMode === 'kanban' ? '100' : ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/${isAdmin ? 'admin/' : ''}applications?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        setTotalCount(data.total || 0);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error('Failed to load applications');
      }
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, universityFilter, degreeFilter, searchQuery, currentPage, viewMode, isAdmin]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(isAdmin ? '/admin/login' : '/partner/login');
    } else if (user && !['admin', 'partner'].includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router, isAdmin]);

  useEffect(() => {
    if (user && ['admin', 'partner'].includes(user.role)) {
      fetchApplications();
    }
  }, [fetchApplications, user]);

  const handleReview = (application: Application) => {
    setSelectedApplication(application);
    setReviewStatus('');
    setReviewComment('');
    setReviewDialog(true);
  };

  const submitReview = async () => {
    if (!selectedApplication || !reviewStatus) {
      toast.error('Please select a status');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reviewStatus,
          comment: reviewComment,
        }),
      });

      if (response.ok) {
        toast.success('Application reviewed successfully');
        setReviewDialog(false);
        fetchApplications();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to review application');
      }
    } catch {
      toast.error('Failed to review application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={cn(config.color, config.bgColor)}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setUniversityFilter('all');
    setDegreeFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || universityFilter !== 'all' || degreeFilter !== 'all';

  // Group applications by status for Kanban view
  const kanbanGroups = KANBAN_COLUMNS.reduce((acc, status) => {
    acc[status] = applications.filter(a => a.status === status);
    return acc;
  }, {} as Record<string, Application[]>);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (authLoading || !user || !['admin', 'partner'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">
            Review and process student applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-3">
            <div className="text-xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('submitted')}>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-blue-600">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">New</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('under_review')}>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-amber-600">{stats.under_review}</div>
            <p className="text-xs text-muted-foreground">Review</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('document_request')}>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-orange-600">{stats.document_request}</div>
            <p className="text-xs text-muted-foreground">Docs</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('interview_scheduled')}>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-purple-600">{stats.interview_scheduled}</div>
            <p className="text-xs text-muted-foreground">Interview</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('accepted')}>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-green-600">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="p-3">
            <div className="text-xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">New</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="document_request">Doc Request</SelectItem>
                  <SelectItem value="interview_scheduled">Interview</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={degreeFilter} onValueChange={setDegreeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Degree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Degrees</SelectItem>
                  <SelectItem value="Bachelor">Bachelor</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => { setCurrentPage(1); fetchApplications(); }}>
                Apply
              </Button>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {STATUS_CONFIG[statusFilter]?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                </Badge>
              )}
              {degreeFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {degreeFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setDegreeFilter('all')} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
          {KANBAN_COLUMNS.map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            const apps = kanbanGroups[status] || [];
            return (
              <div key={status} className="min-w-[280px]">
                <div className={cn('flex items-center gap-2 p-3 rounded-t-lg', config.bgColor)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                  <span className="font-medium text-sm">{config.label}</span>
                  <Badge variant="secondary" className="ml-auto">{apps.length}</Badge>
                </div>
                <Card className="rounded-t-none">
                  <CardContent className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                    {apps.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No applications</p>
                    ) : (
                      apps.map((app) => (
                        <div
                          key={app.id}
                          className="p-3 rounded-lg border bg-card hover:shadow-sm cursor-pointer transition-shadow"
                          onClick={() => router.push(`${basePath}/${app.id}`)}
                        >
                          <p className="font-medium text-sm">
                            {app.passport_first_name} {app.passport_last_name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {app.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {app.programs.name_en}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <GraduationCap className="h-3 w-3" />
                            {app.programs.universities.name_en}
                          </p>
                          {isAdmin && ['submitted', 'under_review', 'document_request', 'interview_scheduled'].includes(app.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              onClick={(e) => { e.stopPropagation(); handleReview(app); }}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No applications found</p>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters ? 'Try adjusting your filters' : 'Applications will appear here once submitted'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead className="hidden md:table-cell">Program</TableHead>
                    <TableHead className="hidden lg:table-cell">University</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`${basePath}/${app.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {app.passport_first_name} {app.passport_last_name}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {app.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <p className="font-medium">{app.programs.name_en}</p>
                          <p className="text-sm text-muted-foreground">{app.programs.degree_type}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div>
                          <p className="font-medium">{app.programs.universities.name_en}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {app.programs.universities.city}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(app.status)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {app.submitted_at ? formatDate(app.submitted_at) : '-'}
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
                              <Link href={`${basePath}/${app.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`${basePath}/${app.id}/documents`}>
                                <FileUp className="mr-2 h-4 w-4" />
                                Documents
                              </Link>
                            </DropdownMenuItem>
                            {isAdmin && ['submitted', 'under_review', 'document_request', 'interview_scheduled'].includes(app.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleReview(app)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Review
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {viewMode === 'table' && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{' '}
            {totalCount} applications
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
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
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Update the status for {selectedApplication?.passport_first_name} {selectedApplication?.passport_last_name}&apos;s application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="document_request">Request Documents</SelectItem>
                  <SelectItem value="interview_scheduled">Schedule Interview</SelectItem>
                  <SelectItem value="accepted">Accept</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment (Optional)</label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add a comment for the student..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={isSubmitting || !reviewStatus}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function ReviewApplicationsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ReviewApplicationsPage() {
  return (
    <Suspense fallback={<ReviewApplicationsLoading />}>
      <ReviewApplicationsContent />
    </Suspense>
  );
}
