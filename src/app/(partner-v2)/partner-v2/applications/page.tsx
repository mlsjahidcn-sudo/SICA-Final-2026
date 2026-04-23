/**
 * Partner Applications List Page
 * Route: /partner-v2/applications
 * Redesigned with table view similar to Admin portal
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  GraduationCap,
  Calendar,
  MapPin,
  Filter,
  Inbox,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Plus,
  Loader2,
  Search,
  User,
  Building2,
  FileText,
  X,
  RefreshCw,
  Star,
} from 'lucide-react';
import { getValidToken } from '@/lib/auth-token';
import type { ApplicationStatus } from '../students/components/application-wizard/types';
import { APPLICATION_STATUS_MAP } from '../students/components/application-wizard/types';

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
  duration?: string | null;
  universities?: UniversityInfo | null;
}

interface UniversityInfo {
  id: string;
  name_en: string;
  name_cn?: string | null;
  city?: string | null;
  province?: string | null;
  logo_url?: string | null;
}

interface StudentInfo {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  nationality: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'secondary', icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: 'In Progress', color: 'default', icon: <Clock className="h-3 w-3" /> },
  submitted_to_university: { label: 'Submitted to University', color: 'default', icon: <AlertTriangle className="h-3 w-3" /> },
  passed_initial_review: { label: 'Passed Initial Review', color: 'default', icon: <CheckCircle2 className="h-3 w-3 text-teal-500" /> },
  pre_admitted: { label: 'Pre Admitted', color: 'default', icon: <Calendar className="h-3 w-3 text-purple-500" /> },
  admitted: { label: 'Admitted', color: 'default', icon: <CheckCircle2 className="h-3 w-3 text-emerald-500" /> },
  jw202_released: { label: 'JW202 Released', color: 'default', icon: <CheckCircle2 className="h-3 w-3 text-emerald-600" /> },
  rejected: { label: 'Rejected', color: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  withdrawn: { label: 'Withdrawn', color: 'secondary', icon: <XCircle className="h-3 w-3" /> },
};

const STATUS_OPTIONS: ApplicationStatus[] = [
  'draft', 'in_progress', 'submitted_to_university', 'passed_initial_review',
  'pre_admitted', 'admitted', 'jw202_released', 'rejected', 'withdrawn'
];

const DEGREE_OPTIONS = [
  { value: 'all', label: 'All Degrees' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
];

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [degreeFilter, setDegreeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<Record<string, number>>({ total: 0 });
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`/api/partner/applications?pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        const apps: ApplicationItem[] = result.applications || [];
        
        // Calculate stats
        const newStats: Record<string, number> = { total: apps.length };
        apps.forEach((app: ApplicationItem) => {
          const s = app.status || 'draft';
          newStats[s] = (newStats[s] || 0) + 1;
        });

        setApplications(apps);
        setStats(newStats);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Listen for real-time application updates from admin status changes
  useEffect(() => {
    const handleApplicationUpdate = () => {
      fetchApplications();
    };
    window.addEventListener('partner-application-update', handleApplicationUpdate);
    return () => {
      window.removeEventListener('partner-application-update', handleApplicationUpdate);
    };
  }, [fetchApplications]);

  const handleNewApplication = () => {
    setFetchingStudents(true);
    setShowStudentPicker(true);
    
    async function fetchStudents() {
      try {
        const token = await getValidToken();
        const res = await fetch('/api/partner/students?pageSize=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          setStudents(result.students || []);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setFetchingStudents(false);
      }
    }
    fetchStudents();
  };

  const filteredApps = applications.filter((a) => {
    // Status filter
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    
    // Degree filter
    if (degreeFilter !== 'all') {
      const prog = Array.isArray(a.programs) ? a.programs[0] : a.programs;
      if (prog?.degree_level?.toLowerCase() !== degreeFilter) return false;
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const prog = Array.isArray(a.programs) ? a.programs[0] : a.programs;
      const uni = prog?.universities;
      
      const searchable = [
        prog?.name,
        uni?.name_en,
        uni?.name_cn,
        a.students?.full_name,
        a.students?.email,
        a.notes,
      ].filter(Boolean).map(String).join(' ').toLowerCase();
      
      if (!searchable.includes(query)) return false;
    }
    
    return true;
  });

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 w-full bg-muted/10 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground text-sm">
            Manage applications for your students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchApplications()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleNewApplication} className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg shadow-primary/25">
            <Plus className="h-4 w-4" /> New Application
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.draft || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.submitted || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.accepted || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.rejected || 0}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student, program, or university..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {APPLICATION_STATUS_MAP[s]?.label || s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={degreeFilter} onValueChange={setDegreeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Degrees" />
              </SelectTrigger>
              <SelectContent>
                {DEGREE_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications List</CardTitle>
          <CardDescription>
            {filteredApps.length} of {stats.total} total applications
            {(statusFilter !== 'all' || degreeFilter !== 'all' || searchQuery) && ' (filtered)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading applications...
                    </TableCell>
                  </TableRow>
                ) : filteredApps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <Inbox className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      No applications found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApps.map((app) => {
                    const statusCfg = getStatusConfig(app.status);
                    const prog = Array.isArray(app.programs) ? (app.programs[0] || null) : app.programs;
                    const uni = prog?.universities;
                    const student = app.students;
                    const studentId = app.students?.id;

                    return (
                      <TableRow key={app.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          {student ? (
                            <Link 
                              href={studentId ? `/partner-v2/students/${studentId}` : '#'} 
                              className="flex items-center gap-2 hover:text-primary"
                            >
                              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {student.full_name || student.email || 'Unknown Student'}
                                </span>
                                {student.full_name && student.email && (
                                  <span className="text-xs text-muted-foreground">
                                    {student.email}
                                  </span>
                                )}
                              </div>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={studentId ? `/partner-v2/students/${studentId}/applications/${app.id}` : '#'}
                            className="hover:text-primary text-sm font-medium"
                          >
                            {prog?.name || '-'}
                          </Link>
                          {!prog?.name && app.notes && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {String(app.notes).slice(0, 30)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {uni?.name_en ? (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {uni.name_en}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {prog?.degree_level ? (
                            <Badge variant="secondary" className="text-xs font-normal capitalize">
                              {prog.degree_level}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusCfg.color} className="gap-1 text-xs">
                            {statusCfg.icon}
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: app.priority || 0 }).map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            ))}
                            {(!app.priority || app.priority === 0) && (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(app.submitted_at || app.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Link href={studentId ? `/partner-v2/students/${studentId}/applications/${app.id}` : '#'}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}