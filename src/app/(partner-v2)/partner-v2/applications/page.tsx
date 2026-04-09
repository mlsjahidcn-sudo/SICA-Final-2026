'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconEye,
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
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  status: string;
  submitted_at: string | null;
  passport_first_name: string;
  passport_last_name: string;
  nationality: string;
  email: string;
  programs: {
    name_en: string;
    degree_type: string;
    universities: {
      name_en: string;
      city: string;
    };
  };
}

interface ApplicationsResponse {
  applications: Application[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof IconClock; label: string }> = {
  draft: { color: 'bg-gray-500/10 text-gray-600', icon: IconFileText, label: 'Draft' },
  submitted: { color: 'bg-blue-500/10 text-blue-600', icon: IconSend, label: 'Submitted' },
  under_review: { color: 'bg-amber-500/10 text-amber-600', icon: IconClock, label: 'Under Review' },
  document_request: { color: 'bg-orange-500/10 text-orange-600', icon: IconAlertCircle, label: 'Document Request' },
  interview_scheduled: { color: 'bg-purple-500/10 text-purple-600', icon: IconCalendar, label: 'Interview' },
  accepted: { color: 'bg-green-500/10 text-green-600', icon: IconCheck, label: 'Accepted' },
  rejected: { color: 'bg-red-500/10 text-red-600', icon: IconX, label: 'Rejected' },
  withdrawn: { color: 'bg-gray-500/10 text-gray-500', icon: IconX, label: 'Withdrawn' },
};

const DEGREE_TYPES = [
  { value: 'all', label: 'All Degrees' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
  { value: 'language', label: 'Language Program' },
];

const SORT_OPTIONS = [
  { value: 'submitted_desc', label: 'Recently Submitted' },
  { value: 'submitted_asc', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
];

interface University {
  id: string;
  name_en: string;
  name_cn: string | null;
}

interface Program {
  id: string;
  name_en: string;
  name_cn: string | null;
  university_id: string;
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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  


  const fetchApplications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!append) setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('pageSize', '20');
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (degreeFilter !== 'all') params.append('degreeType', degreeFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);

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
  }, [statusFilter, degreeFilter, searchQuery, sortBy]);

  useEffect(() => {
    if (user?.role === 'partner') {
      setPage(1);
      fetchApplications(1, false);
    }
  }, [user, statusFilter, degreeFilter, sortBy]);

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
      const token = localStorage.getItem('sica_auth_token');
      const params = new URLSearchParams();
      params.append('format', format);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (degreeFilter !== 'all') params.append('degreeType', degreeFilter);
      if (searchQuery) params.append('search', searchQuery);

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


  
  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
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
          
          {/* Export Buttons */}
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
              Export CSV
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
              Export JSON
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
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
            <SelectTrigger className="w-[160px]">
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
        </div>
      </div>

      {/* Applications List */}
      <div className="px-4 lg:px-6 pb-6">
        <Card>
          <CardContent className="p-0">
            {isLoading && applications.length === 0 ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No applications found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <IconBuilding className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {app.passport_first_name} {app.passport_last_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="truncate max-w-[200px]">{app.programs.universities.name_en}</span>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{app.programs.name_en}</span>
                            <span>•</span>
                            <span>{app.nationality}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {getStatusBadge(app.status)}
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/partner-v2/applications/${app.id}`}>
                            <IconEye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
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
