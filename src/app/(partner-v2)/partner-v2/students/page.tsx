'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/auth-context';
import {
  IconSearch,
  IconUsers,
  IconFileText,
  IconCheck,
  IconClock,
  IconLoader2,
  IconPlus,
  IconTrash,
  IconEdit,
  IconX as IconClear,
  IconDownload,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActionsBar } from '@/components/partner-v2/bulk-actions-bar';
import { MultiSelectFilter } from '@/components/partner-v2/multi-select-filter';
import { CompletionBadge } from './components/completion-badge';
import { StudentListSkeleton, EmptyStudentList } from './components/student-list-skeleton';
import type { StudentProfile } from './lib/types';

interface Student {
  id: string;
  email: string | null;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  nationality?: string | null;
  created_at: string;
  application_count: number;
  stats: {
    total: number;
    accepted: number;
    pending: number;
  };
  profile?: StudentProfile;
  completion_percentage?: number;
}

interface StudentsResponse {
  students: Student[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export default function PartnerV2StudentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [nationalityFilters, setNationalityFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [availableNationalities, setAvailableNationalities] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Extract unique nationalities from students
  useEffect(() => {
    if (students.length > 0) {
      const nationalities = [...new Set(students.map(s => s.nationality).filter(Boolean))] as string[];
      setAvailableNationalities(nationalities.sort());
    }
  }, [students]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      if (!token) {
        toast.error('Please sign in first');
        return;
      }

      const response = await fetch('/api/partner/students/export', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        toast.error('Failed to export students');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Students exported successfully');
    } catch {
      toast.error('Failed to export students');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      if (!token) {
        toast.error('Please sign in first');
        return;
      }

      const response = await fetch(`/api/partner/students/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Student deleted successfully');
        setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
        setTotal(prev => prev - 1);
      } else {
        let errorMsg = 'Failed to delete student';
        try {
          const errData = await response.json();
          errorMsg = errData.error || `HTTP ${response.status}`;
        } catch {
          errorMsg = `HTTP ${response.status}`;
        }
        toast.error(errorMsg);
      }
    } catch {
      toast.error('Failed to delete student');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Bulk selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredStudents.map(s => s.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} students? This action cannot be undone.`)) return;
    setIsBulkLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch('/api/partner/students/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          studentIds: Array.from(selectedIds),
        }),
      });
      if (response.ok) {
        toast.success(`Deleted ${selectedIds.size} students`);
        clearSelection();
        fetchStudents(1, false);
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to delete students');
      }
    } catch (error) {
      toast.error('Failed to delete students');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const fetchStudents = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!append) setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      if (!token) {
        toast.error('Please sign in first');
        return;
      }

      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('pageSize', '20');
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/partner/students?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data: StudentsResponse = await response.json();
        if (append) {
          setStudents(prev => [...prev, ...data.students]);
        } else {
          setStudents(data.students || []);
        }
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setHasMore(data.hasMore || false);
      } else {
        let errorMsg = 'Failed to load students';
        try {
          const errData = await response.json();
          errorMsg = errData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch (parseErr) {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('Failed to load students:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (user?.role === 'partner' || user?.role === 'partner_team_member') {
      setPage(1);
      fetchStudents(1, false);
    }
  }, [user]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (user?.role === 'partner' || user?.role === 'partner_team_member') {
        setPage(1);
        fetchStudents(1, false);
      }
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchStudents(page + 1, true);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Client-side filtering for nationality and status
  const filteredStudents = students.filter((student) => {
    // Nationality filter
    if (nationalityFilters.length > 0 && !nationalityFilters.includes(student.nationality || '')) {
      return false;
    }
    // Status filter
    if (statusFilters.length > 0) {
      const hasAccepted = student.stats.accepted > 0;
      const hasPending = student.stats.pending > 0;
      const hasNoApps = student.stats.total === 0;

      if (statusFilters.includes('accepted') && !hasAccepted) return false;
      if (statusFilters.includes('pending') && !hasPending) return false;
      if (statusFilters.includes('no_applications') && !hasNoApps) return false;

      // If status filter is active, student must match at least one
      const matchesStatus = statusFilters.some((s) => {
        if (s === 'accepted') return hasAccepted;
        if (s === 'pending') return hasPending;
        if (s === 'no_applications') return hasNoApps;
        return false;
      });
      if (!matchesStatus) return false;
    }
    return true;
  });

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Students</h1>
            <p className="text-muted-foreground text-sm">
              View and manage your students
              {total > 0 && <span className="ml-1">({total} total)</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={isExporting || students.length === 0}
            >
              {isExporting ? (
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <IconDownload className="h-4 w-4 mr-2" />
              )}
              Export
            </Button>
            <Button asChild>
              <Link href="/partner-v2/students/new">
                <IconPlus className="h-4 w-4 mr-2" />
                Add Student
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Search and Filters */}
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

            {availableNationalities.length > 0 && (
              <MultiSelectFilter
                options={availableNationalities.map(n => ({ value: n, label: n }))}
                selected={nationalityFilters}
                onChange={setNationalityFilters}
                placeholder="Nationality"
                label="Nationality"
                className="w-[160px]"
              />
            )}

            <MultiSelectFilter
              options={[
                { value: 'accepted', label: 'Accepted' },
                { value: 'pending', label: 'Pending' },
                { value: 'no_applications', label: 'No Applications' },
              ]}
              selected={statusFilters}
              onChange={setStatusFilters}
              placeholder="App Status"
              label="Status"
              className="w-[150px]"
            />

            {(nationalityFilters.length > 0 || statusFilters.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNationalityFilters([]);
                  setStatusFilters([]);
                }}
                className="gap-1 text-muted-foreground"
              >
                <IconClear className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="px-4 lg:px-6 pb-6">
        {isLoading && students.length === 0 ? (
          <StudentListSkeleton />
        ) : filteredStudents.length === 0 ? (
          <EmptyStudentList
            hasSearch={!!(searchQuery || nationalityFilters.length > 0 || statusFilters.length > 0)}
          />
        ) : (
          <>
            <Card>
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-[auto_2fr_1.5fr_1fr_0.8fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground rounded-t-lg">
                <Checkbox
                  checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                  onCheckedChange={() => {
                    if (selectedIds.size === filteredStudents.length) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
                    }
                  }}
                  aria-label="Select all"
                />
                <span>Student</span>
                <span>Email</span>
                <span>Nationality</span>
                <span>Completion</span>
                <span>Applications</span>
                <span>Status</span>
                <span className="w-[72px]">Actions</span>
              </div>
              {/* Rows */}
              <div className="divide-y">
                {filteredStudents.map((student) => {
                  const isSelected = selectedIds.has(student.id);
                  return (
                  <div
                    key={student.id}
                    className={`grid grid-cols-1 md:grid-cols-[auto_2fr_1.5fr_1fr_0.8fr_1fr_1fr_auto] items-center gap-2 md:gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('[data-checkbox]')) return;
                      router.push(`/partner-v2/students/${student.id}`);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && router.push(`/partner-v2/students/${student.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Checkbox */}
                    <div data-checkbox onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(student.id)}
                        aria-label={`Select ${student.full_name}`}
                      />
                    </div>
                    {/* Student */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={student.avatar_url ?? undefined} alt={student.full_name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate">{student.full_name}</span>
                    </div>
                    {/* Email */}
                    <span className="text-sm text-muted-foreground truncate">{student.email}</span>
                    {/* Nationality */}
                    <span className="text-sm text-muted-foreground truncate">{student.nationality || '—'}</span>
                    {/* Completion */}
                    <div className="flex items-center">
                      <CompletionBadge profile={student.profile} />
                    </div>
                    {/* Applications */}
                    <div className="flex items-center gap-1.5 text-sm">
                      <IconFileText className="h-4 w-4 text-muted-foreground" />
                      <span>{student.stats.total}</span>
                    </div>
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {student.stats.accepted > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          <IconCheck className="h-3 w-3" />{student.stats.accepted}
                        </span>
                      )}
                      {student.stats.pending > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          <IconClock className="h-3 w-3" />{student.stats.pending}
                        </span>
                      )}
                      {student.stats.accepted === 0 && student.stats.pending === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/partner-v2/students/${student.id}/edit`}>
                          <IconEdit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(student);
                        }}
                      >
                        <IconTrash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </Card>
            
            {/* Load More */}
            {hasMore && (
              <div className="mt-6 text-center">
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
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.full_name}</strong>? This action cannot be undone. Students with active applications cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        totalCount={students.length}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onDelete={handleBulkDelete}
        isLoading={isBulkLoading}
        entityType="students"
      />
    </>
  );
}
