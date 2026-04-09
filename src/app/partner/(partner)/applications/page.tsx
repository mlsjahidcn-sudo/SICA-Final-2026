'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
import { toast } from 'sonner';

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
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  draft: { color: 'bg-gray-500/10 text-gray-600', icon: FileText, label: 'Draft' },
  submitted: { color: 'bg-blue-500/10 text-blue-600', icon: Send, label: 'Submitted' },
  under_review: { color: 'bg-amber-500/10 text-amber-600', icon: Clock, label: 'Under Review' },
  document_request: { color: 'bg-orange-500/10 text-orange-600', icon: AlertCircle, label: 'Document Request' },
  interview_scheduled: { color: 'bg-purple-500/10 text-purple-600', icon: Calendar, label: 'Interview' },
  accepted: { color: 'bg-green-500/10 text-green-600', icon: CheckCircle2, label: 'Accepted' },
  rejected: { color: 'bg-red-500/10 text-red-600', icon: XCircle, label: 'Rejected' },
  withdrawn: { color: 'bg-gray-500/10 text-gray-500', icon: XCircle, label: 'Withdrawn' },
};

const ITEMS_PER_PAGE = 10;

export default function PartnerApplicationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/partner/login');
    } else if (user && user.role !== 'partner') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'partner') {
      fetchApplications();
    }
  }, [user, statusFilter, currentPage, searchQuery]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/applications?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        setTotalCount(data.total || 0);
      } else {
        toast.error('Failed to load applications');
      }
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
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
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (authLoading || !user || user.role !== 'partner') {
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
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Applications</h1>
          <p className="text-muted-foreground">
            View and track student applications
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {applications.filter(a => ['submitted', 'under_review'].includes(a.status)).length}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {applications.filter(a => a.status === 'accepted').length}
              </div>
              <p className="text-sm text-muted-foreground">Accepted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {applications.filter(a => a.status === 'rejected').length}
              </div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">New (Submitted)</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No applications found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No applications to view at this time'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Applicant</th>
                      <th className="text-left p-4 font-medium">Program</th>
                      <th className="text-left p-4 font-medium">University</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Submitted</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((application) => (
                      <tr key={application.id} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">
                              {application.passport_first_name} {application.passport_last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{application.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{application.programs.name_en}</p>
                            <p className="text-sm text-muted-foreground">{application.programs.degree_type}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{application.programs.universities.name_en}</p>
                            <p className="text-sm text-muted-foreground">{application.programs.universities.city}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(application.status)}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {application.submitted_at ? formatDate(application.submitted_at) : '-'}
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/partner/applications/${application.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
