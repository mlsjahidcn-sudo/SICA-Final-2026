'use client';

import { useEffect, useState, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import {
  GraduationCap,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Star,
  Loader2,
  Building2,
  LayoutGrid,
  List,
  MoreHorizontal,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface University {
  id: string;
  name_en: string;
  name_cn: string | null;
  short_name: string | null;
  logo_url: string | null;
  province: string;
  city: string;
  type: string | string[];
  category: string | null;
  ranking_national: number | null;
  scholarship_available: boolean;
  is_active: boolean;
  view_count: number;
  created_at: string;
  _count?: {
    programs: number;
  };
}

interface Stats {
  total: number;
  active: number;
  withScholarship: number;
  totalPrograms: number;
}

const ITEMS_PER_PAGE = 12;

export default function AdminUniversitiesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, withScholarship: 0, totalPrograms: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const provinces = ['Beijing', 'Shanghai', 'Guangdong', 'Jiangsu', 'Zhejiang', 'Shandong', 'Hubei', 'Sichuan', 'Tianjin', 'Chongqing'];

  const fetchUniversities = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('is_active', statusFilter);
      if (provinceFilter !== 'all') params.append('province', provinceFilter);

      const response = await fetch(`/api/admin/universities?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUniversities(data.universities || []);
        setTotalCount(data.total || 0);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error('Failed to load universities');
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
      toast.error('Failed to load universities');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, statusFilter, provinceFilter]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    } else if (user && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUniversities();
    }
  }, [fetchUniversities, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUniversities();
  };

  const handleToggle = async () => {
    if (!selectedUniversity) return;

    setIsToggling(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const newStatus = !selectedUniversity.is_active;
      const response = await fetch(`/api/admin/universities/${selectedUniversity.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (response.ok) {
        toast.success(`University ${newStatus ? 'activated' : 'deactivated'} successfully`);
        setToggleDialogOpen(false);
        setSelectedUniversity(null);
        fetchUniversities();
      } else {
        const data = await response.json();
        toast.error(data.error || `Failed to ${newStatus ? 'activate' : 'deactivate'} university`);
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUniversity) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/universities/${selectedUniversity.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('University permanently deleted');
        setDeleteDialogOpen(false);
        setSelectedUniversity(null);
        fetchUniversities();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete university');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const openToggleDialog = (university: University) => {
    setSelectedUniversity(university);
    setToggleDialogOpen(true);
  };

  const openDeleteDialog = (university: University) => {
    setSelectedUniversity(university);
    setDeleteDialogOpen(true);
  };

  const getTypeBadge = (type: string | string[]) => {
    const normalizedType = Array.isArray(type) ? type[0] : type;
    if (!normalizedType) return null;

    const typeMap: Record<string, string> = {
      'REGULAR': 'public',
      'DOUBLE FIRST-CLASS': 'double_first_class',
    };

    const finalType = typeMap[normalizedType.toUpperCase()] || normalizedType.toLowerCase();

    const typeColors: Record<string, string> = {
      '985': 'text-red-600 bg-red-500/10',
      '211': 'text-blue-600 bg-blue-500/10',
      'double_first_class': 'text-purple-600 bg-purple-500/10',
      'public': 'text-green-600 bg-green-500/10',
      'private': 'text-orange-600 bg-orange-500/10',
    };

    const displayLabels: Record<string, string> = {
      '985': '985',
      '211': '211',
      'double_first_class': 'Double First-Class',
      'public': 'Public',
      'private': 'Private',
    };

    return (
      <Badge variant="outline" className={cn(typeColors[finalType] || '')}>
        {displayLabels[finalType] || finalType.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (authLoading || !user || user.role !== 'admin') {
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
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Universities</h1>
          <p className="text-muted-foreground">
            Manage university listings and information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/admin/universities/new">
              <Plus className="h-4 w-4 mr-2" />
              Add University
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scholarships</p>
                <p className="text-2xl font-bold">{stats.withScholarship}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Programs</p>
                <p className="text-2xl font-bold">{stats.totalPrograms}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search universities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {provinces.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : universities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No universities found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or add a new university
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((uni) => (
            <Card key={uni.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {/* Header */}
                <div className={cn(
                  'p-4 border-b',
                  uni.is_active ? 'bg-background' : 'bg-muted/50'
                )}>
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {uni.logo_url ? (
                        <img
                          src={uni.logo_url}
                          alt={uni.name_en}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <GraduationCap className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold truncate">{uni.name_en}</h3>
                          {uni.name_cn && (
                            <p className="text-sm text-muted-foreground">{uni.name_cn}</p>
                          )}
                        </div>
                        <Badge variant={uni.is_active ? 'default' : 'secondary'} className="ml-2 shrink-0">
                          {uni.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeBadge(uni.type)}
                        {uni.ranking_national && (
                          <Badge variant="outline" className="text-xs">
                            #{uni.ranking_national}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{uni.city}, {uni.province}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{uni._count?.programs || 0} programs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{uni.view_count} views</span>
                    </div>
                  </div>
                  {uni.scholarship_available && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Star className="h-4 w-4" />
                      <span>Scholarship available</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/universities/${uni.id}`} target="_blank">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/admin/universities/${uni.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openToggleDialog(uni)}>
                        {uni.is_active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => openDeleteDialog(uni)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Ranking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {universities.map((uni) => (
                  <TableRow
                    key={uni.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/universities/${uni.id}/edit`)}
                  >
                    <TableCell>
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {uni.logo_url ? (
                          <img
                            src={uni.logo_url}
                            alt={uni.name_en}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{uni.name_en}</p>
                        {uni.name_cn && (
                          <p className="text-sm text-muted-foreground">{uni.name_cn}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {uni.city}, {uni.province}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {getTypeBadge(uni.type)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {uni.ranking_national ? `#${uni.ranking_national}` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={uni.is_active ? 'default' : 'secondary'}>
                        {uni.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/universities/${uni.id}`} target="_blank">
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/universities/${uni.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openToggleDialog(uni)}>
                            {uni.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => openDeleteDialog(uni)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to{' '}
            {Math.min(page * ITEMS_PER_PAGE, totalCount)} of{' '}
            {totalCount} universities
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    disabled={isLoading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Toggle Dialog */}
      <Dialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUniversity?.is_active ? 'Deactivate University' : 'Activate University'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {selectedUniversity?.is_active ? 'deactivate' : 'activate'} &quot;{selectedUniversity?.name_en}&quot;?
              {selectedUniversity?.is_active ? ' This will hide it from public listings.' : ' This will make it visible in public listings.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToggleDialogOpen(false)}
              disabled={isToggling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggle}
              disabled={isToggling}
            >
              {isToggling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedUniversity?.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently Delete University</DialogTitle>
            <DialogDescription>
              Are you sure you want to PERMANENTLY DELETE &quot;{selectedUniversity?.name_en}&quot;?
              This action cannot be undone and will remove all associated data!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
