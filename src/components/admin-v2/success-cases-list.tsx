'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconStar,
  IconStarOff,
  IconLoader2,
  IconEye,
  IconFileText,
  IconSchool,
  IconFileTypePdf,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface SuccessCase {
  id: string;
  student_name_en: string;
  student_name_cn: string | null;
  student_photo_url: string | null;
  university_name_en: string | null;
  university_name_cn: string | null;
  program_name_en: string | null;
  program_name_cn: string | null;
  admission_year: number | null;
  intake: string | null;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  display_order: number;
  admission_notice_url: string | null;
  jw202_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  draft: { color: 'text-gray-600', bgColor: 'bg-gray-500/10', label: 'Draft' },
  published: { color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Published' },
  archived: { color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Archived' },
};

const ITEMS_PER_PAGE = 20;

export default function SuccessCasesList() {
  const router = useRouter();
  const [cases, setCases] = useState<SuccessCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, draft: 0, published: 0, archived: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; caseItem: SuccessCase | null }>({
    open: false,
    caseItem: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      setIsLoading(true);
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/success-cases?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch success cases');

      const data = await response.json();
      setCases(data.success_cases);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching success cases:', error);
      toast.error('Failed to load success cases');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleToggleFeatured = async (caseItem: SuccessCase) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      const formData = new FormData();
      formData.append('is_featured', (!caseItem.is_featured).toString());

      const response = await fetch(`/api/admin/success-cases/${caseItem.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update case');

      toast.success(caseItem.is_featured ? 'Removed from featured' : 'Added to featured');
      fetchCases();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update case');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.caseItem) return;

    try {
      setIsDeleting(true);
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      const response = await fetch(`/api/admin/success-cases/${deleteDialog.caseItem.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete case');

      toast.success('Success case deleted successfully');
      setDeleteDialog({ open: false, caseItem: null });
      fetchCases();
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error('Failed to delete success case');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <IconSchool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <IconEye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <IconFileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <IconFileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or university..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/admin/v2/success-cases/new">
          <Button>
            <IconPlus className="h-4 w-4 mr-2" />
            Add Success Case
          </Button>
        </Link>
      </div>

      {/* Cases Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>University / Program</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <IconLoader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No success cases found.</p>
                  <Link href="/admin/v2/success-cases/new">
                    <Button variant="link" className="mt-2">
                      Add your first success case
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              cases.map((caseItem) => (
                <TableRow key={caseItem.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted">
                        {caseItem.admission_notice_url ? (
                          caseItem.admission_notice_url.toLowerCase().endsWith('.pdf') ? (
                            <div className="w-full h-full flex items-center justify-center bg-red-50">
                              <IconFileTypePdf className="h-5 w-5 text-red-500" />
                            </div>
                          ) : (
                            <Image
                              src={caseItem.admission_notice_url}
                              alt={`${caseItem.student_name_en}'s admission notice`}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IconFileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{caseItem.student_name_en}</p>
                        {caseItem.student_name_cn && (
                          <p className="text-xs text-muted-foreground">{caseItem.student_name_cn}</p>
                        )}
                        {caseItem.is_featured && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            <IconStar className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{caseItem.university_name_en || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">
                        {caseItem.program_name_en || 'N/A'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{caseItem.admission_year || 'N/A'}</p>
                      {caseItem.intake && (
                        <p className="text-xs text-muted-foreground">{caseItem.intake}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${STATUS_CONFIG[caseItem.status].bgColor} ${STATUS_CONFIG[caseItem.status].color}`}
                    >
                      {STATUS_CONFIG[caseItem.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {caseItem.admission_notice_url && (
                        <Badge variant="outline" className="text-xs">Notice</Badge>
                      )}
                      {caseItem.jw202_url && (
                        <Badge variant="outline" className="text-xs">JW202</Badge>
                      )}
                      {!caseItem.admission_notice_url && !caseItem.jw202_url && (
                        <span className="text-xs text-muted-foreground">No docs</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(caseItem.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFeatured(caseItem)}
                        title={caseItem.is_featured ? 'Remove from featured' : 'Add to featured'}
                      >
                        {caseItem.is_featured ? (
                          <IconStarOff className="h-4 w-4" />
                        ) : (
                          <IconStar className="h-4 w-4" />
                        )}
                      </Button>
                      <Link href={`/admin/v2/success-cases/${caseItem.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <IconEdit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, caseItem })}
                      >
                        <IconTrash className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} cases
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, caseItem: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Success Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the success case for "{deleteDialog.caseItem?.student_name_en}"?
              This action cannot be undone and will also delete all associated documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
