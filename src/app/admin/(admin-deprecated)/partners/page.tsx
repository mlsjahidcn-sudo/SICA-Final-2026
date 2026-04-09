'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Search,
  Mail,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  MapPin,
  Globe,
  Phone,
  MoreHorizontal,
  LayoutGrid,
  List,
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

interface Partner {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  subscription_plan?: string;
  created_at: string;
  approved_at?: string;
  users?: {
    id: string;
    email: string;
    full_name: string;
    last_sign_in_at?: string;
  }[];
  _count?: {
    students: number;
    applications: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string; icon: typeof Clock }> = {
  pending: { color: 'text-amber-600', bgColor: 'bg-amber-500/10', label: 'Pending', icon: Clock },
  approved: { color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Approved', icon: CheckCircle2 },
  rejected: { color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Rejected', icon: XCircle },
  suspended: { color: 'text-gray-600', bgColor: 'bg-gray-500/10', label: 'Suspended', icon: Ban },
};

const ITEMS_PER_PAGE = 12;

function PartnersListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/partners?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
        setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error('Failed to load partners');
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Failed to load partners');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPartners();
  };

  const handlePartnerAction = async (partnerId: string, action: 'approve' | 'reject' | 'suspend') => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/partners/${partnerId}?action=${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(`Partner ${action}d successfully`);
        fetchPartners();
      } else {
        toast.error(`Failed to ${action} partner`);
      }
    } catch (error) {
      console.error(`Error ${action}ing partner:`, error);
      toast.error(`Failed to ${action} partner`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleTabChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Partners</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage partner accounts and track their performance
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleTabChange('all')}>
          <CardContent className="p-2 md:p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                <p className="text-lg md:text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="hidden md:flex h-10 w-10 rounded-lg bg-blue-500/10 items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleTabChange('pending')}>
          <CardContent className="p-2 md:p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
                <p className="text-lg md:text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="hidden md:flex h-10 w-10 rounded-lg bg-amber-500/10 items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleTabChange('approved')}>
          <CardContent className="p-2 md:p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Approved</p>
                <p className="text-lg md:text-2xl font-bold">{stats.approved}</p>
              </div>
              <div className="hidden md:flex h-10 w-10 rounded-lg bg-green-500/10 items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors hidden md:block" onClick={() => handleTabChange('rejected')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors hidden md:block" onClick={() => handleTabChange('suspended')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold">{stats.suspended}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <Ban className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, contact, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleTabChange}>
                <SelectTrigger className="flex-1 sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="flex-shrink-0">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Partners Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : partners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No partners found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Partners will appear here once they register'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner) => {
            const config = STATUS_CONFIG[partner.status];
            const StatusIcon = config.icon;
            return (
              <Card key={partner.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  {/* Header with Status */}
                  <div className={cn('p-4 border-b', config.bgColor)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{partner.company_name}</h3>
                          <p className="text-sm text-muted-foreground">{partner.contact_person}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn(config.color, config.bgColor)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{partner.email}</span>
                    </div>
                    {partner.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{partner.phone}</span>
                      </div>
                    )}
                    {(partner.city || partner.country) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{[partner.city, partner.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span>Joined {formatDate(partner.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/admin/partners/${partner.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    {partner.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handlePartnerAction(partner.id, 'approve')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handlePartnerAction(partner.id, 'reject')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => {
                  const config = STATUS_CONFIG[partner.status];
                  const StatusIcon = config.icon;
                  return (
                    <TableRow
                      key={partner.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/partners/${partner.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{partner.company_name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {partner.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p>{partner.contact_person}</p>
                        {partner.phone && (
                          <p className="text-sm text-muted-foreground">{partner.phone}</p>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {[partner.city, partner.country].filter(Boolean).join(', ') || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(config.color, config.bgColor)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatDate(partner.created_at)}
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
                              <Link href={`/admin/partners/${partner.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {partner.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handlePartnerAction(partner.id, 'approve')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handlePartnerAction(partner.id, 'reject')}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {partner.status === 'approved' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handlePartnerAction(partner.id, 'suspend')}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} partners
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
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
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PartnersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PartnersListContent />
    </Suspense>
  );
}
