'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  programs: {
    id: string;
    name: string;
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

export default function StudentApplicationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/student/login');
    } else if (user && user.role !== 'student') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchApplications();
    }
  }, [user, statusFilter]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

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

  if (authLoading || !user || user.role !== 'student') {
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Applications</h1>
            <p className="text-muted-foreground">
              Track and manage your university applications
            </p>
          </div>
          <Link href="/programs">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </Link>
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
              <div className="text-2xl font-bold text-gray-500">
                {applications.filter(a => a.status === 'draft').length}
              </div>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your journey by applying to a program
              </p>
              <Link href="/programs">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Programs
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{application.programs.name}</h3>
                          <p className="text-muted-foreground">
                            {application.programs.universities.name_en} • {application.programs.universities.city}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {getStatusBadge(application.status)}
                            <span className="text-sm text-muted-foreground">
                              {application.submitted_at 
                                ? `Submitted ${formatDate(application.submitted_at)}`
                                : `Created ${formatDate(application.created_at)}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {application.status === 'draft' && (
                        <Link href={`/apply/${application.programs.id}?edit=${application.id}`}>
                          <Button>Continue</Button>
                        </Link>
                      )}
                      <Link href={`/student/applications/${application.id}`}>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
