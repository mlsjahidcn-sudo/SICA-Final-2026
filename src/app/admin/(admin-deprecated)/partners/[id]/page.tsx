'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Mail, Phone, MapPin, FileText, Globe, Building2, CheckCircle2, XCircle, Ban, Clock, ExternalLink, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PartnerUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  last_sign_in_at?: string;
  created_at: string;
  password?: string; // For temporary password when adding new user
}

interface PartnerApplication {
  id: string;
  status: string;
  created_at: string;
  submitted_at?: string;
  passport_first_name: string;
  passport_last_name: string;
  programs?: {
    name_en: string;
    degree_type: string;
    universities?: {
      name_en: string;
    };
  };
}

interface PartnerDetails {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  city?: string;
  website?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  subscription_plan?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  created_at: string;
  updated_at?: string;
  users?: PartnerUser[];
  applications: PartnerApplication[];
}

type IconComponent = typeof FileText;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-amber-500/10 text-amber-600', label: 'Pending' },
  approved: { color: 'bg-green-500/10 text-green-600', label: 'Approved' },
  rejected: { color: 'bg-red-500/10 text-red-600', label: 'Rejected' },
  suspended: { color: 'bg-gray-500/10 text-gray-600', label: 'Suspended' },
};

const APPLICATION_STATUS_CONFIG: Record<string, { color: string; icon: IconComponent; label: string }> = {
  draft: { color: 'bg-gray-500/10 text-gray-600', icon: FileText, label: 'Draft' },
  submitted: { color: 'bg-blue-500/10 text-blue-600', icon: Clock, label: 'Submitted' },
  under_review: { color: 'bg-amber-500/10 text-amber-600', icon: Clock, label: 'Under Review' },
  accepted: { color: 'bg-green-500/10 text-green-600', icon: CheckCircle2, label: 'Accepted' },
  rejected: { color: 'bg-red-500/10 text-red-600', icon: XCircle, label: 'Rejected' },
};

function PartnerDetailContent() {
  const router = useRouter();
  const params = useParams();
  const partnerId = params.id as string;

  const [partner, setPartner] = useState<PartnerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PartnerDetails>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // User management state
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PartnerUser | null>(null);
  const [userForm, setUserForm] = useState<Partial<PartnerUser>>({});
  const [isUserSaving, setIsUserSaving] = useState(false);

  const fetchPartnerDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/partners/${partnerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPartner(data.partner);
      } else {
        toast.error('Partner not found');
        router.push('/admin/partners');
      }
    } catch (error) {
      console.error('Error fetching partner:', error);
      toast.error('Failed to load partner details');
    } finally {
      setIsLoading(false);
    }
  }, [partnerId, router]);

  useEffect(() => {
    fetchPartnerDetails();
  }, [fetchPartnerDetails]);

  const handlePartnerAction = async (action: 'approve' | 'reject' | 'suspend') => {
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
        fetchPartnerDetails();
      } else {
        toast.error(`Failed to ${action} partner`);
      }
    } catch (error) {
      console.error(`Error ${action}ing partner:`, error);
      toast.error(`Failed to ${action} partner`);
    }
  };

  const handleEdit = () => {
    if (partner) {
      setEditForm({ ...partner });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success('Partner updated successfully');
        setIsEditing(false);
        fetchPartnerDetails();
      } else {
        toast.error('Failed to update partner');
      }
    } catch (error) {
      console.error('Error updating partner:', error);
      toast.error('Failed to update partner');
    } finally {
      setIsSaving(false);
    }
  };

  // User management functions
  const handleAddUser = () => {
    setUserForm({});
    setIsAddUserDialogOpen(true);
  };

  const handleEditUser = (user: PartnerUser) => {
    setSelectedUser(user);
    setUserForm({ ...user });
    setIsEditUserDialogOpen(true);
  };

  const handleDeleteUser = (user: PartnerUser) => {
    setSelectedUser(user);
    setIsDeleteUserDialogOpen(true);
  };

  const handleSaveAddUser = async () => {
    try {
      setIsUserSaving(true);
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/partners/${partnerId}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        toast.success('User added successfully');
        setIsAddUserDialogOpen(false);
        fetchPartnerDetails();
      } else {
        toast.error('Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    } finally {
      setIsUserSaving(false);
    }
  };

  const handleSaveEditUser = async () => {
    if (!selectedUser) return;
    try {
      setIsUserSaving(true);
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/partners/${partnerId}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        toast.success('User updated successfully');
        setIsEditUserDialogOpen(false);
        fetchPartnerDetails();
      } else {
        toast.error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsUserSaving(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setIsUserSaving(true);
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/partners/${partnerId}/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        setIsDeleteUserDialogOpen(false);
        fetchPartnerDetails();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsUserSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Partner not found</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[partner.status] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/partners')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{partner.company_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              <span className="text-muted-foreground text-sm">
                Joined {formatDate(partner.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!isEditing && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </>
          )}
          {!isEditing && partner.status === 'pending' && (
            <>
              <Button onClick={() => handlePartnerAction('approve')}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handlePartnerAction('reject')}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {!isEditing && partner.status === 'approved' && (
            <Button variant="outline" onClick={() => handlePartnerAction('suspend')}>
              <Ban className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Basic partner company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={editForm.company_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_person">Contact Person</Label>
                      <Input
                        id="contact_person"
                        value={editForm.contact_person || ''}
                        onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={editForm.website || ''}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={editForm.country || ''}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={editForm.city || ''}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={editForm.address || ''}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subscription_plan">Subscription Plan</Label>
                      <Input
                        id="subscription_plan"
                        value={editForm.subscription_plan || ''}
                        onChange={(e) => setEditForm({ ...editForm, subscription_plan: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={editForm.status || ''}
                        onValueChange={(value) => setEditForm({ ...editForm, status: value as PartnerDetails['status'] })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Contact Person</p>
                      <p>{partner.contact_person}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${partner.email}`} className="text-primary hover:underline">
                          {partner.email}
                        </a>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{partner.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Website</p>
                      {partner.website ? (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={partner.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {partner.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {[partner.city, partner.country].filter(Boolean).join(', ') || 'N/A'}
                        </span>
                      </div>
                    </div>
                    {partner.address && (
                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                        <p>{partner.address}</p>
                      </div>
                    )}
                  </div>
                )}

                {!isEditing && partner.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{partner.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Plan</p>
                    <p className="font-medium">{partner.subscription_plan || 'N/A'}</p>
                  </div>
                  {partner.subscription_start_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Start Date</p>
                      <p>{formatDate(partner.subscription_start_date)}</p>
                    </div>
                  )}
                  {partner.subscription_end_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">End Date</p>
                      <p>{formatDate(partner.subscription_end_date)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Applications</span>
                    <span className="font-bold">{partner.applications?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Partner Users</CardTitle>
                <CardDescription>Users associated with this partner</CardDescription>
              </div>
              <Button onClick={handleAddUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              {partner.users && partner.users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partner.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell>
                          {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : 'Never'}
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEditUser(user)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="text-red-600" onClick={() => handleDeleteUser(user)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users associated with this partner</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add User Dialog */}
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Partner User</DialogTitle>
                <DialogDescription>Add a new user to this partner account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="add-full_name">Full Name</Label>
                  <Input
                    id="add-full_name"
                    value={userForm.full_name || ''}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={userForm.email || ''}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-phone">Phone</Label>
                  <Input
                    id="add-phone"
                    value={userForm.phone || ''}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-password">Temporary Password</Label>
                  <Input
                    id="add-password"
                    type="password"
                    value={userForm.password || ''}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)} disabled={isUserSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAddUser} disabled={isUserSaving}>
                  {isUserSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Partner User</DialogTitle>
                <DialogDescription>Edit user information</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-full_name">Full Name</Label>
                  <Input
                    id="edit-full_name"
                    value={userForm.full_name || ''}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={userForm.email || ''}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={userForm.phone || ''}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditUserDialogOpen} disabled={isUserSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEditUser} disabled={isUserSaving}>
                  {isUserSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete User Dialog */}
          <AlertDialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this user? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isUserSaving}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDeleteUser}
                  disabled={isUserSaving}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isUserSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>Applications from this partner</CardDescription>
            </CardHeader>
            <CardContent>
              {partner.applications && partner.applications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partner.applications.map((app) => {
                      const statusConfig = APPLICATION_STATUS_CONFIG[app.status] || APPLICATION_STATUS_CONFIG.draft;
                      return (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">
                            <Link href={`/admin/applications/${app.id}`} className="text-primary hover:underline">
                              {app.programs?.name_en || 'N/A'}
                            </Link>
                          </TableCell>
                          <TableCell>{app.programs?.universities?.name_en || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(app.created_at)}</TableCell>
                          <TableCell>
                            {app.submitted_at ? formatDate(app.submitted_at) : 'Not submitted'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No applications from this partner</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PartnerDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PartnerDetailContent />
    </Suspense>
  );
}
