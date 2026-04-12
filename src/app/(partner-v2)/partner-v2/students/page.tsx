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
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  nationality?: string;
  created_at: string;
  application_count: number;
  stats: {
    total: number;
    accepted: number;
    pending: number;
  };
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
    } catch (error) {
      toast.error('Failed to delete student');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
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

      console.log('Fetching students with params:', params.toString());
      const response = await fetch(`/api/partner/students?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log('Students API response status:', response.status);
      if (response.ok) {
        const data: StudentsResponse = await response.json();
        console.log('Students data:', data);
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
          <Button asChild>
            <Link href="/partner-v2/students/new">
              <IconPlus className="h-4 w-4 mr-2" />
              Add Student
            </Link>
          </Button>
        </div>
        
        {/* Search */}
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
        </div>
      </div>

      {/* Students List */}
      <div className="px-4 lg:px-6 pb-6">
        {isLoading && students.length === 0 ? (
          <Card>
            <div className="divide-y">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : students.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <IconUsers className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">No students found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Click "Add Student" to create your first student'}
              </p>
            </div>
          </Card>
        ) : (
          <>
            <Card>
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground rounded-t-lg">
                <span>Student</span>
                <span>Email</span>
                <span>Nationality</span>
                <span>Applications</span>
                <span>Status</span>
                <span className="w-[72px]">Actions</span>
              </div>
              {/* Rows */}
              <div className="divide-y">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] items-center gap-2 md:gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/partner-v2/students/${student.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && router.push(`/partner-v2/students/${student.id}`)}
                    role="button"
                    tabIndex={0}
                  >
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
                ))}
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
    </>
  );
}
