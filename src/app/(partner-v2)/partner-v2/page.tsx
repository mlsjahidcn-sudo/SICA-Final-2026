'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@tabler/icons-react';
import { PartnerStatsCards } from '@/components/partner-v2/partner-stats-cards';
import { PartnerApplicationsChart } from '@/components/partner-v2/partner-applications-chart';
import { toast } from 'sonner';

interface DashboardStats {
  totalApplications: number;
  pending: number;
  underReview: number;
  accepted: number;
  rejected: number;
  thisMonth: number;
  lastMonth: number;
}

interface RecentApplication {
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

export default function PartnerV2DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const statsResponse = await fetch(`/api/partner/dashboard?days=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.stats);
        setRecentApplications(data.recentApplications || []);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (user?.role === 'partner') {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

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
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Partner Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back, {user?.full_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/partner-v2/applications">
              View All Applications
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <PartnerStatsCards stats={stats} isLoading={isLoading} />

      {/* Chart */}
      <div className="px-4 lg:px-6 py-4 md:py-6">
        <PartnerApplicationsChart />
      </div>

      {/* Recent Applications Table */}
      <div className="px-4 lg:px-6 py-4 md:py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Latest student applications submitted</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/partner-v2/applications">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No applications found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconBuilding className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {app.passport_first_name} {app.passport_last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{app.programs.universities.name_en}</span>
                          <span>•</span>
                          <span>{app.programs.name_en}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
