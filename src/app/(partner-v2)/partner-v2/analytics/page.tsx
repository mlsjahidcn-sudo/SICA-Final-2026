'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconChartLine,
  IconChartPie,
  IconChartBar,
  IconDownload,
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconSchool,
  IconRefresh,
  IconPrinter,
} from '@tabler/icons-react';
import { ApplicationsTrendChart } from '@/components/partner-v2/charts/applications-trend-chart';
import { StatusDistributionChart } from '@/components/partner-v2/charts/status-distribution-chart';
import { UniversityRankingChart } from '@/components/partner-v2/charts/university-ranking-chart';
import { ProgramAnalyticsChart } from '@/components/partner-v2/charts/program-analytics-chart';
import { ConversionFunnel } from '@/components/partner-v2/charts/conversion-funnel';
import { toast } from 'sonner';

interface AnalyticsData {
  overview: {
    totalApplications: number;
    acceptanceRate: number;
    pendingRate: number;
    growth: number;
  };
  trend: Array<{
    date: string;
    applications: number;
    accepted: number;
    rejected: number;
  }>;
  distribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  universities: Array<{
    name: string;
    applications: number;
    accepted: number;
    acceptanceRate: number;
  }>;
  programs: Array<{
    name: string;
    degree: string;
    applications: number;
  }>;
  funnel: {
    submitted: number;
    underReview: number;
    interview: number;
    accepted: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch(`/api/partner/analytics?days=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        toast.error('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/partner/export?format=${format}&type=analytics&days=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeRange}d-report.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`Exported as ${format.toUpperCase()}`);
      } else {
        const result = await response.json().catch(() => ({}));
        toast.error(result.error || 'Export failed');
      }
    } catch {
      toast.error('Export failed');
    }
  };

  const isPositiveGrowth = (data?.overview.growth ?? 0) >= 0;

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          /* Hide sidebar, header, nav, and interactive elements */
          [data-slot="sidebar"],
          [data-slot="sidebar-inset"] > header,
          [data-slot="site-header"],
          .no-print,
          button,
          select,
          [role="combobox"] {
            display: none !important;
          }
          /* Make main content full width */
          [data-slot="sidebar-inset"] {
            margin-left: 0 !important;
          }
          /* Ensure cards print nicely */
          .print-break-inside-avoid {
            break-inside: avoid;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Comprehensive insights and reporting for your applications
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <Button variant="outline" size="sm" onClick={() => fetchAnalytics()}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <IconPrinter className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <IconDownload className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
              <IconDownload className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {isLoading ? (
          // Loading skeletons
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardDescription className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="print-break-inside-avoid">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <IconChartLine className="h-4 w-4" />
                  Total Applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.overview.totalApplications.toLocaleString() ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time applications received
                </p>
              </CardContent>
            </Card>

            <Card className="print-break-inside-avoid">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <IconTrendingUp className="h-4 w-4" />
                  Acceptance Rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.overview.acceptanceRate ?? 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Of total applications
                </p>
              </CardContent>
            </Card>

            <Card className="print-break-inside-avoid">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <IconUsers className="h-4 w-4" />
                  Pending Rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.overview.pendingRate ?? 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting review
                </p>
              </CardContent>
            </Card>

            <Card className="print-break-inside-avoid">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  {isPositiveGrowth ? (
                    <IconTrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <IconTrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  Growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {isPositiveGrowth ? '+' : ''}{data?.overview.growth ?? 0}%
                  </span>
                  <Badge variant={isPositiveGrowth ? 'default' : 'destructive'} className="text-xs">
                    {isPositiveGrowth ? 'Up' : 'Down'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  vs previous period
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 py-6 lg:grid-cols-2">
        {/* Applications Trend */}
        <Card className="lg:col-span-2 print-break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartLine className="h-5 w-5" />
              Applications Trend
            </CardTitle>
            <CardDescription>
              Track application submissions and outcomes over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationsTrendChart data={data?.trend} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="print-break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartPie className="h-5 w-5" />
              Status Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of applications by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDistributionChart data={data?.distribution} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="print-break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingUp className="h-5 w-5" />
              Conversion Funnel
            </CardTitle>
            <CardDescription>
              Application journey from submission to acceptance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConversionFunnel data={data?.funnel} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* University Ranking */}
        <Card className="print-break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSchool className="h-5 w-5" />
              Top Universities
            </CardTitle>
            <CardDescription>
              Most popular universities by applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UniversityRankingChart data={data?.universities} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Program Analytics */}
        <Card className="print-break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartBar className="h-5 w-5" />
              Popular Programs
            </CardTitle>
            <CardDescription>
              Top programs by application count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgramAnalyticsChart data={data?.programs} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
