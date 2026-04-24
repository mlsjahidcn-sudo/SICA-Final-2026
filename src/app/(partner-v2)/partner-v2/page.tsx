'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  IconPlus,
  IconUsers,
  IconSchool,
  IconChartBar,
  IconArrowRight,
  IconMail,
  IconPhone,
  IconMapPin,
  IconTrendingUp,
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
    name: string;
    degree_type: string;
    universities: {
      name_en: string;
      city: string;
    } | null;
  };
}

const STATUS_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof IconClock;
  label: string;
}> = {
  draft: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    icon: IconFileText,
    label: 'Draft',
  },
  submitted: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: IconSend,
    label: 'Submitted',
  },
  under_review: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: IconClock,
    label: 'Under Review',
  },
  document_request: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: IconAlertCircle,
    label: 'Document Request',
  },
  interview_scheduled: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: IconCalendar,
    label: 'Interview',
  },
  accepted: {
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: IconCheck,
    label: 'Accepted',
  },
  rejected: {
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: IconX,
    label: 'Rejected',
  },
  withdrawn: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: IconX,
    label: 'Withdrawn',
  },
};

function getInitials(first?: string, last?: string) {
  return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || '?';
}

function getTimeAgo(dateStr: string | null) {
  if (!dateStr) return 'Not submitted';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const QUICK_ACTIONS = [
  {
    label: 'New Application',
    href: '/partner-v2/applications/new',
    icon: IconPlus,
    color: 'bg-blue-500 hover:bg-blue-600',
    description: 'Start a new student application',
  },
  {
    label: 'View Students',
    href: '/partner-v2/students',
    icon: IconUsers,
    color: 'bg-violet-500 hover:bg-violet-600',
    description: 'Manage your student roster',
  },
  {
    label: 'Universities',
    href: '/partner-v2/universities',
    icon: IconSchool,
    color: 'bg-emerald-500 hover:bg-emerald-600',
    description: 'Browse university programs',
  },
  {
    label: 'Analytics',
    href: '/partner-v2/analytics',
    icon: IconChartBar,
    color: 'bg-amber-500 hover:bg-amber-600',
    description: 'View performance insights',
  },
];

export default function PartnerV2DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();

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
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Banner */}
      <div className="px-4 lg:px-6 pt-4 md:pt-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 text-primary-foreground p-6 md:p-8">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <IconTrendingUp className="h-3 w-3 mr-1" />
                  Partner Portal
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {user?.full_name || 'Partner'}
              </h1>
              <p className="text-primary-foreground/80 text-sm md:text-base max-w-lg">
                Manage your student applications, track progress, and discover new opportunities all in one place.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                <Link href="/partner-v2/applications/new">
                  <IconPlus className="h-4 w-4 mr-2" />
                  New Application
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-lg ${action.color} text-white transition-transform group-hover:scale-110`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{action.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <PartnerStatsCards stats={stats} isLoading={isLoading} />

      {/* Chart + Recent Applications Grid */}
      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Chart - takes 3 columns */}
          <div className="xl:col-span-3">
            <PartnerApplicationsChart />
          </div>

          {/* Recent Applications - takes 2 columns */}
          <div className="xl:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Recent Applications</CardTitle>
                    <CardDescription>Latest student submissions</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="text-primary">
                    <Link href="/partner-v2/applications" className="flex items-center gap-1">
                      View All <IconArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border">
                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentApplications.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
                      <IconFileText className="h-6 w-6 opacity-50" />
                    </div>
                    <p className="font-medium">No applications yet</p>
                    <p className="text-sm mt-1">Start by creating a new application</p>
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                      <Link href="/partner-v2/applications/new">
                        <IconPlus className="h-3.5 w-3.5 mr-1.5" />
                        New Application
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentApplications.map((app) => (
                      <Link
                        key={app.id}
                        href={`/partner-v2/applications/${app.id}`}
                        className="group flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/40 hover:border-primary/20 transition-all"
                      >
                        <Avatar className="h-10 w-10 shrink-0 border-2 border-background shadow-sm">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {getInitials(app.passport_first_name, app.passport_last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">
                              {app.passport_first_name} {app.passport_last_name}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                              {getTimeAgo(app.submitted_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <IconSchool className="h-3 w-3 shrink-0" />
                            <span className="truncate">{app.programs.universities?.name_en || 'Unknown University'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-0.5">
                            <span className="truncate">{app.programs.name}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {getStatusBadge(app.status)}
                          <IconEye className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
