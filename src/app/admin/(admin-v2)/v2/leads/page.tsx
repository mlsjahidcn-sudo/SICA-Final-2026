'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard-v2-sidebar';
import { SiteHeader } from '@/components/dashboard-v2-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  UserPlus,
  Building,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Eye,
  Download,
  MessageSquare,
  Clock,
  User,
  Globe,
  Briefcase,
  GraduationCap,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Lead {
  id: string;
  type: 'b2c' | 'b2b';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  desired_program: string | null;
  desired_intake: string | null;
  organization_name: string | null;
  contact_person: string | null;
  organization_email: string | null;
  organization_phone: string | null;
  website: string | null;
  country: string | null;
  organization_type: string | null;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}

interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: string;
  content: string;
  created_at: string;
  users?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

const ITEMS_PER_PAGE = 15;

const statusColors = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  qualified: 'bg-green-500',
  converted: 'bg-purple-500',
  lost: 'bg-red-500',
};

const statusBadgeVariants = {
  new: 'secondary' as const,
  contacted: 'outline' as const,
  qualified: 'default' as const,
  converted: 'default' as const,
  lost: 'destructive' as const,
};

const sourceOptions = [
  'Website',
  'Social Media',
  'Referral',
  'Event',
  'Outreach',
  'Other',
];

const activityTypes = [
  { value: 'note', label: 'Note', icon: FileText },
  { value: 'call', label: 'Phone Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Calendar },
  { value: 'other', label: 'Other', icon: MessageSquare },
];

export default function LeadsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'b2c' | 'b2b'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([]);
  const [newLeadType, setNewLeadType] = useState<'b2c' | 'b2b'>('b2c');
  const [b2cSource, setB2cSource] = useState<string>('');
  const [b2bSource, setB2bSource] = useState<string>('');
  const [b2bOrgType, setB2bOrgType] = useState<string>('');
  const [editSource, setEditSource] = useState<string>('');
  const [editOrgType, setEditOrgType] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Activity state
  const [newActivityType, setNewActivityType] = useState('note');
  const [newActivityContent, setNewActivityContent] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  const fetchLeads = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', ITEMS_PER_PAGE.toString());
      if (activeTab !== 'all') params.set('type', activeTab);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter && sourceFilter !== 'all') params.set('source', sourceFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/leads?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch leads');

      const data = await res.json();
      // Handle both array and paginated response
      if (Array.isArray(data)) {
        setLeads(data);
        setTotalCount(data.length);
      } else {
        setLeads(data.leads || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTab, statusFilter, sourceFilter, searchQuery, page]);

  const fetchLeadActivities = async (leadId: string) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const res = await fetch(`/api/admin/leads/${leadId}/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLeadActivities(data || []);
      }
    } catch (error) {
      console.error('Error fetching lead activities:', error);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchLeads();
    }
  }, [fetchLeads, user]);

  const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!user) return;
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();

      const payload: Record<string, unknown> = {
        type: newLeadType,
        ...data
      };

      if (newLeadType === 'b2c' && b2cSource) {
        payload.source = b2cSource;
      }
      if (newLeadType === 'b2b') {
        if (b2bSource) payload.source = b2bSource;
        if (b2bOrgType) payload.organization_type = b2bOrgType;
      }

      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create lead');

      toast.success('Lead created successfully');
      setIsCreateDialogOpen(false);
      setB2cSource('');
      setB2bSource('');
      setB2bOrgType('');
      fetchLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditLead = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!user || !selectedLead) return;
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();

      const payload: Record<string, unknown> = {
        ...data,
      };

      if (editSource) payload.source = editSource;
      if (selectedLead.type === 'b2b' && editOrgType) {
        payload.organization_type = editOrgType;
      }

      const res = await fetch(`/api/admin/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update lead');

      toast.success('Lead updated successfully');
      setIsEditDialogOpen(false);
      fetchLeads();
      if (isDetailSheetOpen) {
        setSelectedLead({ ...selectedLead, ...payload } as Lead);
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: Lead['status']) => {
    if (!user) return;

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update lead');

      toast.success('Status updated successfully');
      fetchLeads();
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete lead');

      toast.success('Lead deleted successfully');
      setIsDetailSheetOpen(false);
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const handleAddActivity = async () => {
    if (!user || !selectedLead || !newActivityContent.trim()) return;
    setIsAddingActivity(true);

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const res = await fetch(`/api/admin/leads/${selectedLead.id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          activity_type: newActivityType,
          content: newActivityContent,
        }),
      });

      if (!res.ok) throw new Error('Failed to add activity');

      toast.success('Activity added successfully');
      setNewActivityContent('');
      fetchLeadActivities(selectedLead.id);
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('Failed to add activity');
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (!user) return;

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('type', activeTab);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);

      const res = await fetch(`/api/admin/leads/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to export leads');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Leads exported successfully');
    } catch (error) {
      console.error('Error exporting leads:', error);
      toast.error('Failed to export leads');
    }
  };

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setEditSource(lead.source || '');
    setEditOrgType(lead.organization_type || '');
    setIsEditDialogOpen(true);
  };

  const openDetailSheet = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailSheetOpen(true);
    fetchLeadActivities(lead.id);
  };

  const stats = {
    total: totalCount,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
  };

  const getLeadDisplayName = (lead: Lead) => {
    if (lead.type === 'b2c') {
      return `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unnamed Lead';
    }
    return lead.organization_name || 'Unnamed Organization';
  };

  const getLeadContact = (lead: Lead) => {
    if (lead.type === 'b2c') {
      return lead.email;
    }
    return lead.organization_email;
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSourceFilter('all');
    setActiveTab('all');
    setPage(1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="Leads" />
          <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
                <p className="text-muted-foreground">
                  Manage your prospective students and partners
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1 sm:flex-none">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="flex-1 sm:flex-none">
                  <Plus className="mr-2 h-4 w-4" />
                  New Lead
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting contact</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contacted</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
                  <p className="text-xs text-muted-foreground mt-1">In progress</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Converted</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
                  <p className="text-xs text-muted-foreground mt-1">Successful conversions</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-4">
                  <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as 'all' | 'b2c' | 'b2b')}
                    className="w-full"
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="all" className="flex-1">All Leads</TabsTrigger>
                      <TabsTrigger value="b2c" className="flex-1">Students</TabsTrigger>
                      <TabsTrigger value="b2b" className="flex-1">Partners</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="flex-1 sm:w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="flex-1 sm:w-[140px]">
                          <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          {sourceOptions.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No leads found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || statusFilter !== 'all' || sourceFilter !== 'all' || activeTab !== 'all'
                        ? 'Try adjusting your filters or search query'
                        : 'Get started by creating your first lead'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && sourceFilter === 'all' && activeTab === 'all' && (
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Lead
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">Contact</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Source</TableHead>
                          <TableHead className="hidden lg:table-cell">Created</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leads.map((lead) => (
                          <TableRow
                            key={lead.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => openDetailSheet(lead)}
                          >
                            <TableCell>
                              <div className={`w-3 h-3 rounded-full ${statusColors[lead.status]}`} />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{getLeadDisplayName(lead)}</div>
                              {lead.type === 'b2c' && lead.nationality && (
                                <div className="text-xs text-muted-foreground">{lead.nationality}</div>
                              )}
                              {lead.type === 'b2b' && lead.country && (
                                <div className="text-xs text-muted-foreground">{lead.country}</div>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex flex-col gap-0.5">
                                {getLeadContact(lead) && (
                                  <span className="text-sm flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {getLeadContact(lead)}
                                  </span>
                                )}
                                {(lead.phone || lead.organization_phone) && (
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {lead.phone || lead.organization_phone}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {lead.type === 'b2c' ? (
                                  <><GraduationCap className="h-3 w-3 mr-1" /> Student</>
                                ) : (
                                  <><Briefcase className="h-3 w-3 mr-1" /> Partner</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusBadgeVariants[lead.status]}>
                                {lead.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {lead.source && (
                                <Badge variant="outline" className="text-xs">
                                  {lead.source}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                              {format(new Date(lead.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openDetailSheet(lead)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditDialog(lead)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'new')}>
                                    Mark as New
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'contacted')}>
                                    Mark as Contacted
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'qualified')}>
                                    Mark as Qualified
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'converted')}>
                                    Mark as Converted
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'lost')}>
                                    Mark as Lost
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteLead(lead.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                          {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} leads
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = i + 1;
                              return (
                                <Button
                                  key={pageNum}
                                  variant={page === pageNum ? 'default' : 'outline'}
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                  onClick={() => setPage(pageNum)}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                            {totalPages > 5 && (
                              <>
                                <span className="text-muted-foreground">...</span>
                                <Button
                                  variant={page === totalPages ? 'default' : 'outline'}
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                  onClick={() => setPage(totalPages)}
                                >
                                  {totalPages}
                                </Button>
                              </>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page === totalPages}
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Create Lead Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          setB2cSource('');
          setB2bSource('');
          setB2bOrgType('');
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Lead</DialogTitle>
            <DialogDescription>
              Add a new prospective student or partner.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={newLeadType} onValueChange={(v) => setNewLeadType(v as 'b2c' | 'b2b')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="b2c">Student (B2C)</TabsTrigger>
              <TabsTrigger value="b2b">Partner (B2B)</TabsTrigger>
            </TabsList>
            <form onSubmit={handleCreateLead}>
              <TabsContent value="b2c" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input name="first_name" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input name="last_name" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input name="phone" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input name="nationality" />
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select value={b2cSource} onValueChange={setB2cSource}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Desired Program</Label>
                  <Input name="desired_program" placeholder="e.g., Computer Science" />
                </div>
                <div className="space-y-2">
                  <Label>Desired Intake</Label>
                  <Input name="desired_intake" placeholder="e.g., September 2024" />
                </div>
              </TabsContent>
              <TabsContent value="b2b" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Organization Name *</Label>
                  <Input name="organization_name" required />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input name="contact_person" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input name="organization_email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input name="organization_phone" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input name="website" placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input name="country" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Organization Type</Label>
                    <Select value={b2bOrgType} onValueChange={setB2bOrgType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultancy">Consultancy</SelectItem>
                        <SelectItem value="school">School</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select value={b2bSource} onValueChange={setB2bSource}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Lead
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update lead information.
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <form onSubmit={handleEditLead}>
              {selectedLead.type === 'b2c' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input name="first_name" defaultValue={selectedLead.first_name || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input name="last_name" defaultValue={selectedLead.last_name || ''} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input name="email" type="email" defaultValue={selectedLead.email || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input name="phone" defaultValue={selectedLead.phone || ''} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nationality</Label>
                      <Input name="nationality" defaultValue={selectedLead.nationality || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label>Source</Label>
                      <Select value={editSource} onValueChange={setEditSource}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceOptions.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Desired Program</Label>
                    <Input name="desired_program" defaultValue={selectedLead.desired_program || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Desired Intake</Label>
                    <Input name="desired_intake" defaultValue={selectedLead.desired_intake || ''} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <Input name="organization_name" defaultValue={selectedLead.organization_name || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input name="contact_person" defaultValue={selectedLead.contact_person || ''} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input name="organization_email" type="email" defaultValue={selectedLead.organization_email || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input name="organization_phone" defaultValue={selectedLead.organization_phone || ''} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input name="website" defaultValue={selectedLead.website || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input name="country" defaultValue={selectedLead.country || ''} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organization Type</Label>
                      <Select value={editOrgType} onValueChange={setEditOrgType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultancy">Consultancy</SelectItem>
                          <SelectItem value="school">School</SelectItem>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Source</Label>
                      <Select value={editSource} onValueChange={setEditSource}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceOptions.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-[600px] p-0 flex flex-col">
          {selectedLead && (
            <>
              <SheetHeader className="p-6 pb-4 border-b">
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg">
                      {selectedLead.type === 'b2c'
                        ? `${selectedLead.first_name?.[0] || ''}${selectedLead.last_name?.[0] || ''}`
                        : selectedLead.organization_name?.[0] || 'O'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{getLeadDisplayName(selectedLead)}</div>
                    <SheetDescription className="mt-1">
                      {selectedLead.type === 'b2c' ? 'Student Lead' : 'Partner Lead'} • Created {format(new Date(selectedLead.created_at), 'MMM d, yyyy')}
                    </SheetDescription>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={statusBadgeVariants[selectedLead.status]} className="text-sm">
                      {selectedLead.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {selectedLead.type === 'b2c' ? 'Student' : 'Partner'}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        Update Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUpdateStatus(selectedLead.id, 'new')}>
                        Mark as New
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(selectedLead.id, 'contacted')}>
                        Mark as Contacted
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(selectedLead.id, 'qualified')}>
                        Mark as Qualified
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(selectedLead.id, 'converted')}>
                        Mark as Converted
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(selectedLead.id, 'lost')}>
                        Mark as Lost
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Contact Information</h4>
                  <div className="grid gap-3">
                    {selectedLead.type === 'b2c' ? (
                      <>
                        {selectedLead.email && (
                          <div className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded-md">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline truncate">
                              {selectedLead.email}
                            </a>
                          </div>
                        )}
                        {selectedLead.phone && (
                          <div className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded-md">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a href={`tel:${selectedLead.phone}`} className="text-blue-600 hover:underline">
                              {selectedLead.phone}
                            </a>
                          </div>
                        )}
                        {selectedLead.nationality && (
                          <div className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded-md">
                            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{selectedLead.nationality}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {selectedLead.organization_email && (
                          <div className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded-md">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a href={`mailto:${selectedLead.organization_email}`} className="text-blue-600 hover:underline truncate">
                              {selectedLead.organization_email}
                            </a>
                          </div>
                        )}
                        {selectedLead.organization_phone && (
                          <div className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded-md">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a href={`tel:${selectedLead.organization_phone}`} className="text-blue-600 hover:underline">
                              {selectedLead.organization_phone}
                            </a>
                          </div>
                        )}
                        {selectedLead.contact_person && (
                          <div className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded-md">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{selectedLead.contact_person}</span>
                          </div>
                        )}
                        {selectedLead.country && (
                          <div className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded-md">
                            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{selectedLead.country}</span>
                          </div>
                        )}
                        {selectedLead.website && (
                          <div className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded-md">
                            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                              {selectedLead.website}
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Details */}
                {(selectedLead.source || selectedLead.desired_program || selectedLead.desired_intake || selectedLead.organization_type) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Details</h4>
                      <div className="grid gap-3 text-sm">
                        {selectedLead.source && (
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <span className="text-muted-foreground">Source</span>
                            <Badge variant="outline">{selectedLead.source}</Badge>
                          </div>
                        )}
                        {selectedLead.type === 'b2c' && selectedLead.desired_program && (
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <span className="text-muted-foreground">Desired Program</span>
                            <span className="text-right truncate max-w-[60%]">{selectedLead.desired_program}</span>
                          </div>
                        )}
                        {selectedLead.type === 'b2c' && selectedLead.desired_intake && (
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <span className="text-muted-foreground">Desired Intake</span>
                            <span>{selectedLead.desired_intake}</span>
                          </div>
                        )}
                        {selectedLead.type === 'b2b' && selectedLead.organization_type && (
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <span className="text-muted-foreground">Organization Type</span>
                            <span className="capitalize">{selectedLead.organization_type}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Activities */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Activities & Notes</h4>

                  {/* Add Activity */}
                  <div className="space-y-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <Select value={newActivityType} onValueChange={setNewActivityType}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-3 w-3" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Add a note or activity..."
                      value={newActivityContent}
                      onChange={(e) => setNewActivityContent(e.target.value)}
                      rows={3}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddActivity}
                      disabled={!newActivityContent.trim() || isAddingActivity}
                      className="w-full sm:w-auto"
                    >
                      {isAddingActivity ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Add Activity
                    </Button>
                  </div>

                  {/* Activity List */}
                  <div className="space-y-3">
                    {leadActivities.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No activities yet. Add a note above.
                      </div>
                    ) : (
                      leadActivities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 p-3 border rounded-lg">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={activity.users?.avatar_url} />
                            <AvatarFallback>
                              {activity.users?.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {activity.users?.full_name || 'Unknown'}
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {activity.activity_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground break-words">
                              {activity.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pb-4">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setIsDetailSheetOpen(false);
                    openEditDialog(selectedLead);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDeleteLead(selectedLead.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
