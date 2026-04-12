'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconBuilding,
  IconCalendar,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconClock,
  IconSend,
  IconFileText,
  IconSearch,
  IconDownload,
  IconFilter,
  IconLoader2,
  IconSortAscending,
  IconSortDescending,
  IconPlus,
  IconCalendarEvent,
  IconX as IconClear,
  IconMapPin,
  IconSchool,
  IconExternalLink,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

interface University {
  id: string;
  name: string;
  name_en?: string | null;
  name_cn?: string | null;
  city: string;
  province?: string | null;
  logo_url?: string | null;
}

interface Program {
  id: string;
  name: string;
  degree_level: string;
  universities: University;
}

interface StudentUser {
  id: string;
  full_name: string;
  email: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  nationality: string;
  email: string;
  users?: StudentUser | StudentUser[];
}

interface Application {
  id: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  programs: Program;
  students: Student;
}

interface ApplicationsResponse {
  applications: Application[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof IconClock; label: string }> = {
  draft: { color: 'text-muted-foreground', bg: 'bg-muted', icon: IconFileText, label: 'Draft' },
  submitted: { color: 'text-blue-600', bg: 'bg-blue-500/10', icon: IconSend, label: 'Submitted' },
  under_review: { color: 'text-amber-600', bg: 'bg-amber-500/10', icon: IconClock, label: 'Under Review' },
  document_request: { color: 'text-orange-600', bg: 'bg-orange-500/10', icon: IconAlertCircle, label: 'Document Request' },
  interview_scheduled: { color: 'text-violet-600', bg: 'bg-violet-500/10', icon: IconCalendar, label: 'Interview' },
  accepted: { color: 'text-green-600', bg: 'bg-green-500/10', icon: IconCheck, label: 'Accepted' },
  rejected: { color: 'text-red-600', bg: 'bg-red-500/10', icon: IconX, label: 'Rejected' },
  withdrawn: { color: 'text-muted-foreground', bg: 'bg-muted', icon: IconX, label: 'Withdrawn' },
};

const DEGREE_TYPES = [
  { value: 'all', label: 'All Degrees' },
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Master', label: 'Master' },
  { value: 'PhD', label: 'PhD' },
  { value: 'Chinese Language', label: 'Language Program' },
];

const SORT_OPTIONS = [
  { value: 'submitted_desc', label: 'Recently Submitted' },
  { value: 'submitted_asc', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
];

function UniversityLogo({ university, size = 'md' }: { university: University; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
  const iconSizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };

  if (university.logo_url) {
    return (
      <Avatar className={`${sizeClasses[size]} rounded-lg border bg-background`}>
        <AvatarImage src={university.logo_url} alt={university.name_en || 'University'} className="object-contain p-1" />
        <AvatarFallback className="rounded-lg bg-primary/10">
          <IconBuilding className={`${iconSizes[size]} text-primary`} />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border`}>
      <IconBuilding className={`${iconSizes[size]} text-primary`} />
    </div>
  );
}

function StudentAvatar({ student, size = 'sm' }: { student: Student; size?: 'sm' | 'md' }) {
  const sizeClasses = { sm: 'h-6 w-6', md: 'h-8 w-8' };
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase() || '?';

  return (
    <Avatar className={`${sizeClasses[size]} border bg-muted`}>
      <AvatarFallback className="text-[10px] font-medium bg-primary/5 text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PartnerV2ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('submitted_desc');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [universities, setUniversities] = useState<{ id: string; name_en: string; name_cn: string | null }[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch universities for filter dropdown
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
        const response = await fetch('/api/universities?limit=200', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUniversities(data.universities || []);
        }
      } catch {
        // Non-critical
      }
    };
    fetchUniversities();
  }, []);

  const fetchApplications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!append) setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('pageSize', '20');
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (degreeFilter !== 'all') params.append('degreeType', degreeFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);
      if (universityFilter !== 'all') params.append('universityId', universityFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/applications?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data: ApplicationsResponse = await response.json();
        if (append) {
          setApplications(prev => [...prev, ...data.applications]);
        } else {
          setApplications(data.applications || []);
        }
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setHasMore(data.hasMore || false);
      } else {
        toast.error('Failed to load applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, degreeFilter, searchQuery, sortBy, universityFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (user?.role === 'partner') {
      setPage(1);
      fetchApplications(1, false);
    }
  }, [user, statusFilter, degreeFilter, sortBy, universityFilter, dateFrom, dateTo]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (user?.role === 'partner') {
        setPage(1);
        fetchApplications(1, false);
      }
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchApplications(page + 1, true);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const params = new URLSearchParams();
      params.append('format', format);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (degreeFilter !== 'all') params.append('degreeType', degreeFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (universityFilter !== 'all') params.append('universityId', universityFilter);

      const response = await fetch(`/api/partner/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applications.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success(`Exported applications as ${format.toUpperCase()}`);
      } else {
        toast.error('Failed to export applications');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export applications');
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setDegreeFilter('all');
    setUniversityFilter('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setSortBy('submitted_desc');
  };

  const hasActiveFilters = statusFilter !== 'all' || degreeFilter !== 'all' || universityFilter !== 'all' || dateFrom || dateTo;

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

  const getUniversityName = (uni: University) => {
    return uni.name_en || uni.name;
  };

  const getStudentName = (student: Student): string => {
    const user = Array.isArray(student.users) ? student.users[0] : student.users;
    if (user?.full_name) return user.full_name;
    return `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown';
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Applications</h1>
            <p className="text-muted-foreground text-sm">
              Manage and track student applications
              {total > 0 && <span className="ml-1">({total} total)</span>}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/partner-v2/applications/new">
                <IconPlus className="h-4 w-4 mr-2" />
                Add Application
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isExporting || applications.length === 0}
            >
              {isExporting ? (
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <IconDownload className="h-4 w-4 mr-2" />
              )}
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('json')}
              disabled={isExporting || applications.length === 0}
            >
              {isExporting ? (
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <IconDownload className="h-4 w-4 mr-2" />
              )}
              JSON
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or nationality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <IconFilter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="document_request">Document Request</SelectItem>
                <SelectItem value="interview_scheduled">Interview</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={degreeFilter} onValueChange={setDegreeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Degree" />
              </SelectTrigger>
              <SelectContent>
                {DEGREE_TYPES.map((degree) => (
                  <SelectItem key={degree.value} value={degree.value}>
                    {degree.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                {sortBy.includes('desc') ? (
                  <IconSortDescending className="h-4 w-4 mr-2 text-muted-foreground" />
                ) : (
                  <IconSortAscending className="h-4 w-4 mr-2 text-muted-foreground" />
                )}
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showAdvanced ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="gap-2"
            >
              <IconCalendarEvent className="h-4 w-4" />
              More Filters
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <IconClear className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="flex flex-wrap gap-3 p-4 rounded-lg border bg-muted/30">
              <Select value={universityFilter} onValueChange={setUniversityFilter}>
                <SelectTrigger className="w-[220px]">
                  <IconBuilding className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Universities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {universities.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id}>
                      {uni.name_en || uni.name_cn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Submitted:</span>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[150px]"
                  placeholder="From"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[150px]"
                  placeholder="To"
                />
                {(dateFrom || dateTo) && (
                  <Button variant="ghost" size="icon-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                    <IconClear className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Applications List */}
      <div className="px-4 lg:px-6 pb-6">
        <Card>
          <CardContent className="p-0">
            {isLoading && applications.length === 0 ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                    <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-72 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-7 w-24 bg-muted animate-pulse rounded-full" />
                  </div>
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <IconFileText className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-lg font-medium">No applications found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/partner-v2/applications/new">
                    <IconPlus className="h-4 w-4 mr-2" />
                    Create Application
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {applications.map((app) => {
                    const uni = app.programs?.universities;
                    const studentName = getStudentName(app.students);
                    const dateLabel = formatDate(app.submitted_at || app.created_at);

                    return (
                      <Link
                        key={app.id}
                        href={`/partner-v2/applications/${app.id}`}
                        className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                      >
                        {/* University Logo */}
                        <UniversityLogo university={uni || { id: '', name: '', city: '' }} size="lg" />

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          {/* Row 1: Student name + status */}
                          <div className="flex items-center gap-3 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <StudentAvatar student={app.students} />
                              <span className="font-medium truncate">{studentName}</span>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>

                          {/* Row 2: University + Program */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground mb-1.5">
                            <span className="truncate max-w-[240px] font-medium text-foreground/80">
                              {uni ? getUniversityName(uni) : 'Unknown University'}
                            </span>
                            <span className="text-muted-foreground/50">·</span>
                            <span className="flex items-center gap-1">
                              <IconSchool className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[180px]">{app.programs?.name || 'Unknown Program'}</span>
                            </span>
                          </div>

                          {/* Row 3: Meta info */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {uni?.city && (
                              <span className="flex items-center gap-1">
                                <IconMapPin className="h-3 w-3" />
                                {uni.city}{uni.province ? `, ${uni.province}` : ''}
                              </span>
                            )}
                            {app.students.nationality && (
                              <span>{app.students.nationality}</span>
                            )}
                            {app.programs?.degree_level && (
                              <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] uppercase tracking-wide font-medium">
                                {app.programs.degree_level}
                              </span>
                            )}
                            {dateLabel && (
                              <span className="flex items-center gap-1">
                                <IconCalendar className="h-3 w-3" />
                                {dateLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconExternalLink className="h-4 w-4 text-muted-foreground" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                
                {/* Load More */}
                {hasMore && (
                  <div className="p-4 border-t text-center">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
