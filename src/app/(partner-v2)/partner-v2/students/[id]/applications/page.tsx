/**
 * Student's Applications List Page
 * Route: /partner-v2/students/[id]/applications
 * Shows all applications for a specific student, filterable by status
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Loader2,
  GraduationCap,
  Calendar,
  MapPin,
  Filter,
  Inbox,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { getValidToken } from '@/lib/auth-token';
import type { ApplicationStatus } from '../../components/application-wizard/types';
import { APPLICATION_STATUS_MAP } from '../../components/application-wizard/types';

interface ApplicationItem {
  id: string;
  status: string;
  submitted_at?: string | null;
  created_at: string;
  notes?: string | null;
  priority?: number | null;
  intake?: string | null;
  personal_statement?: string | null;
  study_plan?: string | null;
  programs?: ProgramInfo | ProgramInfo[];
  students?: StudentInfo | null;
}

interface ProgramInfo {
  id: string;
  name: string;
  degree_level: string;
  universities?: UniversityInfo | null;
}

interface UniversityInfo {
  id: string;
  name_en: string;
  name_cn?: string | null;
  city?: string | null;
  logo_url?: string | null;
}

interface StudentInfo {
  id: string;
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface StudentDetail {
  id: string;
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'draft', 'in_progress', 'submitted_to_university', 'passed_initial_review',
  'pre_admitted', 'admitted', 'jw202_released', 'rejected', 'withdrawn'
];

export default function ApplicationsListPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState<Record<string, number>>({ total: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getValidToken();

        // Fetch student info
        const studentRes = await fetch(`/api/partner/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (studentRes.ok) {
          const studentData = await studentRes.json();
          setStudent(studentData);
        }

        // Fetch applications from partner API
        const res = await fetch(`/api/partner/applications?pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          // Filter by student user_id (URL id is users.id, students.user_id is users.id)
          const apps: ApplicationItem[] = (result.applications || []).filter(
            (app: ApplicationItem) => app.students && String(app.students.user_id) === studentId
          );
          
          // Calculate stats by iterating through apps
          const newStats: Record<string, number> = { total: apps.length };
          apps.forEach((app: ApplicationItem) => {
            const s = app.status || 'draft';
            newStats[s] = (newStats[s] || 0) + 1;
          });

          setApplications(apps);
          setStats(newStats);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (studentId) fetchData();
  }, [studentId]);

  const filteredApps = statusFilter === 'all'
    ? applications
    : applications.filter((a) => a.status === statusFilter);

  const getStatusConfig = (status: string) => {
    return APPLICATION_STATUS_MAP[status as ApplicationStatus] || APPLICATION_STATUS_MAP.draft;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'admitted':
      case 'jw202_released': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'rejected': return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'in_progress':
      case 'submitted_to_university':
      case 'passed_initial_review':
      case 'pre_admitted':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case 'draft': return <Clock className="h-3.5 w-3.5 text-blue-500" />;
      default: return <Inbox className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
        <span className="text-muted-foreground">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full">
      {/* Student Info Header */}
      {student && (
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl border p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {student.first_name?.[0]?.toUpperCase() || student.email?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {student.first_name && student.last_name
                    ? `${student.first_name} ${student.last_name}`
                    : student.email || 'Student'}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                  {student.email && <span>{student.email}</span>}
                  {student.phone && <span>{student.phone}</span>}
                  {student.nationality && <Badge variant="outline" className="text-xs">{student.nationality}</Badge>}
                </div>
              </div>
            </div>
            <div className="sm:ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/partner-v2/students/${studentId}`}>
                  <ExternalLink className="h-4 w-4 mr-1.5" /> View Profile
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg shadow-primary/25">
                <Link href={`/partner-v2/students/${studentId}/apply`}>
                  <Plus className="h-4 w-4 mr-1.5" /> New Application
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header (when no student) */}
      {!student && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/partner-v2/students">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Applications</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {stats.total} application{stats.total !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          <Button asChild className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg shadow-primary/25">
            <Link href={`/partner-v2/students/${studentId}/apply`}>
              <Plus className="h-4 w-4" /> New Application
            </Link>
          </Button>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
        <MiniStat label="Total" value={stats.total} variant="default" />
        <MiniStat label="Draft" value={stats['draft'] || 0} variant="gray" />
        <MiniStat label="Submitted" value={(stats['submitted_to_university'] || 0) + (stats['in_progress'] || 0)} variant="blue" />
        <MiniStat label="Reviewing" value={(stats['passed_initial_review'] || 0) + (stats['pre_admitted'] || 0)} variant="amber" />
        <MiniStat label="Admitted" value={(stats['admitted'] || 0) + (stats['jw202_released'] || 0)} variant="green" />
        <MiniStat label="Rejected" value={stats['rejected'] || 0} variant="red" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" /> Filter:
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {(APPLICATION_STATUS_MAP[s]?.label || s)} ({stats[s] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filteredApps.length} of {stats.total}
        </span>
      </div>

      {/* Applications list */}
      {filteredApps.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Inbox className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-semibold text-foreground">No applications found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {statusFilter !== 'all'
                ? `No applications with "${getStatusConfig(statusFilter).label}" status.`
                : "This student doesn't have any applications yet."
              }
            </p>
            <Button asChild>
              <Link href={`/partner-v2/students/${studentId}/apply`}>
                <Plus className="h-4 w-4 mr-2" /> Create First Application
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {filteredApps.map((app) => {
            const sc = getStatusConfig(app.status);
            const prog = Array.isArray(app.programs)
              ? (app.programs[0] || null)
              : app.programs;
            const uni = prog?.universities;

            return (
              <Link key={app.id}
                href={`/partner-v2/students/${studentId}/applications/${app.id}`}
                className="block"
              >
                <Card className="hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all cursor-pointer group overflow-hidden">
                  <CardContent className="py-4 md:py-5 px-4 md:px-6">
                    <div className="flex items-start gap-3 md:gap-5">
                      {/* Logo / Icon */}
                      <div className="shrink-0">
                        {uni?.logo_url ? (
                          <img src={uni.logo_url} alt="" className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover border border-border/50 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-border/50">
                            <GraduationCap className="h-6 w-6 md:h-7 md:w-7 text-primary/60" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors leading-tight">
                                {prog?.name || uni?.name_en || 'Custom Program Request'}
                              </p>
                              {!prog?.name && app.notes && (
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  — {String(app.notes).slice(0, 50)}...
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 mt-1.5 flex-wrap text-xs md:text-sm text-muted-foreground">
                              {uni?.name_en && (
                                <span className="font-medium">{uni.name_en}</span>
                              )}
                              {prog?.degree_level && (
                                <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 md:px-2 py-0 font-normal">{prog.degree_level}</Badge>
                              )}
                              {uni?.city && (
                                <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{uni.city}</span>
                              )}
                              {app.intake && (
                                <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{app.intake}</span>
                              )}
                            </div>
                          </div>

                          {/* Status badge */}
                          <Badge className={`${sc.bgColor} ${sc.color} shrink-0 flex items-center gap-1.5 px-2 md:px-2.5`}>
                            {getStatusIcon(app.status)}
                            <span className="text-[11px] md:text-xs font-medium">{sc.label}</span>
                          </Badge>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 md:gap-4 pt-2 text-[11px] md:text-xs text-muted-foreground/70">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDateShort(app.submitted_at || app.created_at)}</span>
                          {app.priority != null && app.priority > 0 && (
                            <span className="px-1.5 py-px rounded bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-medium tabular-nums">
                              P{app.priority}
                            </span>
                          )}
                          <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-primary font-medium">
                            View <Eye className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Mini stat card =====
function MiniStat({ label, value, variant }: { label: string; value: number; variant: string }) {
  const colors: Record<string, string> = {
    default: '',
    gray: 'text-gray-600 bg-gray-50 dark:bg-gray-900',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20',
    green: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
    red: 'text-red-600 bg-red-50 dark:bg-red-950/20',
  };
  return (
    <Card className={`${colors[variant] || ''}`}>
      <CardContent className="py-3 px-3 text-center space-y-0.5">
        <p className={`text-lg font-bold tabular-nums ${colors[variant]?.split(' ')[0] || ''}`}>{value}</p>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function formatDateShort(ds: string | null | undefined): string {
  if (!ds) return '';
  try { return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ds; }
}
