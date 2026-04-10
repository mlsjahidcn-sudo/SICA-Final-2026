'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import {
  IconSearch,
  IconUsers,
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconShield,
  IconUser,
  IconMail,
  IconCalendar,
  IconHistory,
  IconUserPlus,
  IconUserMinus,
  IconRefresh
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  partner_role: 'partner_admin' | 'member';
  partner_id: string | null;
  created_at: string;
}

interface TeamResponse {
  success: boolean;
  data: TeamMember[];
}

interface ActivityActor {
  id: string;
  full_name: string;
  email: string;
}

interface ActivityTargetUser {
  id: string;
  full_name: string;
  email: string;
}

interface TeamActivity {
  id: string;
  partner_id: string;
  actor_id: string;
  target_user_id: string | null;
  action: 'invite' | 'update_role' | 'remove' | 'update_permissions';
  action_details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  actor: ActivityActor;
  target_user: ActivityTargetUser | null;
}

interface ActivityResponse {
  success: boolean;
  data: TeamActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function PartnerV2TeamPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('members');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivity, setHasMoreActivity] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [inviteForm, setInviteForm] = useState<{
    email: string;
    full_name: string;
    partner_role: 'partner_admin' | 'member';
    password?: string; // Optional password field
    createWithPassword: boolean; // Toggle to show password field
  }>({
    email: '',
    full_name: '',
    partner_role: 'member',
    createWithPassword: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeam = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch('/api/partner/team', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data: TeamResponse = await response.json();
        setTeamMembers(data.data || []);
      } else {
        toast.error('Failed to load team');
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Failed to load team');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchActivities = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!append) setIsLoadingActivity(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '20');
      
      const response = await fetch(`/api/partner/team/activity?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data: ActivityResponse = await response.json();
        if (append) {
          setActivities(prev => [...prev, ...data.data]);
        } else {
          setActivities(data.data || []);
        }
        setActivityPage(data.pagination.page);
        setHasMoreActivity(data.pagination.page < data.pagination.totalPages);
      } else {
        toast.error('Failed to load activity log');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity log');
    } finally {
      setIsLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'partner') {
      fetchTeam();
    }
  }, [user, fetchTeam]);

  useEffect(() => {
    if (user?.role === 'partner' && activeTab === 'activity') {
      fetchActivities(1, false);
    }
  }, [user, activeTab, fetchActivities]);

  const handleInvite = async () => {
    if (!inviteForm.email) {
      toast.error('Email is required');
      return;
    }

    if (inviteForm.createWithPassword && (!inviteForm.password || inviteForm.password.length < 8)) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      // Prepare request body - only include password if createWithPassword is true
      const requestBody: {
        email: string;
        full_name: string;
        partner_role: string;
        password?: string;
      } = {
        email: inviteForm.email,
        full_name: inviteForm.full_name,
        partner_role: inviteForm.partner_role,
      };
      
      if (inviteForm.createWithPassword) {
        requestBody.password = inviteForm.password;
      }
      
      const response = await fetch('/api/partner/team/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast.success(inviteForm.createWithPassword 
          ? 'User created successfully!' 
          : 'Invitation sent successfully!'
        );
        setIsInviteDialogOpen(false);
        setInviteForm({ 
          email: '', 
          full_name: '', 
          partner_role: 'member',
          createWithPassword: false,
        });
        fetchTeam();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to invite user');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Failed to invite user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingMember) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/partner/team/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: editingMember.full_name,
          partner_role: editingMember.partner_role
        }),
      });

      if (response.ok) {
        toast.success('Team member updated successfully!');
        setIsEditDialogOpen(false);
        setEditingMember(null);
        fetchTeam();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update team member');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/partner/team/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Team member removed successfully!');
        fetchTeam();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove team member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove team member');
    }
  };

  const handleLoadMoreActivity = () => {
    if (hasMoreActivity && !isLoadingActivity) {
      fetchActivities(activityPage + 1, true);
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

  const getRoleBadge = (role: string | null) => {
    if (!role || role === 'partner_admin') {
      return <Badge className="bg-primary text-primary-foreground"><IconShield className="h-3 w-3 mr-1" /> Admin</Badge>;
    }
    return <Badge variant="secondary"><IconUser className="h-3 w-3 mr-1" /> Member</Badge>;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'invite':
        return <IconUserPlus className="h-4 w-4 text-green-600" />;
      case 'remove':
        return <IconUserMinus className="h-4 w-4 text-red-600" />;
      case 'update_role':
        return <IconRefresh className="h-4 w-4 text-blue-600" />;
      default:
        return <IconHistory className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'invite':
        return 'Invited';
      case 'remove':
        return 'Removed';
      case 'update_role':
        return 'Updated Role';
      default:
        return action;
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUserMember = teamMembers.find(m => m.id === user?.id);
  const isCurrentUserAdmin = !currentUserMember?.partner_role || currentUserMember?.partner_role === 'partner_admin';

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Team</h1>
            <p className="text-muted-foreground text-sm">
              Manage your team members and view activity
            </p>
          </div>
          {isCurrentUserAdmin && (
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              {isCurrentUserAdmin && (
                <DialogTrigger asChild>
                  <Button>
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a new team member
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      placeholder="John Doe"
                      value={inviteForm.full_name}
                      onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={inviteForm.partner_role}
                      onValueChange={(value: 'partner_admin' | 'member') => 
                        setInviteForm({ ...inviteForm, partner_role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="partner_admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Toggle for creating with password */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="create-with-password"
                      checked={inviteForm.createWithPassword}
                      onChange={(e) => setInviteForm({ 
                        ...inviteForm, 
                        createWithPassword: e.target.checked,
                        password: e.target.checked ? inviteForm.password : undefined
                      })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="create-with-password" className="cursor-pointer">
                      Create user with password directly (no email verification)
                    </Label>
                  </div>
                  
                  {/* Password field - only show if toggle is on */}
                  {inviteForm.createWithPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={inviteForm.password || ''}
                        onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters long. We recommend using a mix of letters, numbers, and symbols.
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsInviteDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {inviteForm.createWithPassword ? 'Create Account' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Tabs defaultValue="members" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="members">
              <IconUsers className="h-4 w-4 mr-2" />
              Members
              {teamMembers.length > 0 && (
                <Badge variant="secondary" className="ml-2">{teamMembers.length}</Badge>
              )}
            </TabsTrigger>
            {isCurrentUserAdmin && (
              <TabsTrigger value="activity">
                <IconHistory className="h-4 w-4 mr-2" />
                Activity Log
              </TabsTrigger>
            )}
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4 pt-4">
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Team List */}
            {isLoading && teamMembers.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <IconUsers className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">No team members found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search' : 'Invite team members to get started'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{member.full_name}</h3>
                              {getRoleBadge(member.partner_role)}
                              {member.id === user?.id && (
                                <Badge variant="outline">You</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <IconMail className="h-3 w-3" />
                              <span className="truncate">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <IconCalendar className="h-3 w-3" />
                              <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        {isCurrentUserAdmin && member.id !== user?.id && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Dialog open={isEditDialogOpen && editingMember?.id === member.id} onOpenChange={(open) => {
                              setIsEditDialogOpen(open);
                              if (!open) setEditingMember(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingMember(member)}
                                >
                                  <IconEdit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Team Member</DialogTitle>
                                  <DialogDescription>
                                    Update team member details
                                  </DialogDescription>
                                </DialogHeader>
                                {editingMember && (
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-full_name">Full Name</Label>
                                      <Input
                                        id="edit-full_name"
                                        value={editingMember.full_name}
                                        onChange={(e) => setEditingMember({
                                          ...editingMember,
                                          full_name: e.target.value
                                        })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-role">Role</Label>
                                      <Select
                                        value={editingMember.partner_role}
                                        onValueChange={(value: 'partner_admin' | 'member') =>
                                          setEditingMember({ ...editingMember, partner_role: value })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="member">Member</SelectItem>
                                          <SelectItem value="partner_admin">Admin</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsEditDialogOpen(false);
                                      setEditingMember(null);
                                    }}
                                    disabled={isSubmitting}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleUpdate} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : null}
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <IconTrash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {member.full_name} from the team?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemove(member.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Log Tab */}
          {isCurrentUserAdmin && (
            <TabsContent value="activity" className="space-y-4 pt-4">
              {isLoadingActivity && activities.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-64 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <IconHistory className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-lg font-medium text-muted-foreground">No activity yet</p>
                    <p className="text-sm text-muted-foreground">
                      Team management activity will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <Card key={activity.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="mt-1">
                              {getActionIcon(activity.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">
                                  {activity.actor.full_name}
                                </span>
                                <Badge variant="outline">
                                  {getActionLabel(activity.action)}
                                </Badge>
                                {activity.target_user && (
                                  <span className="text-muted-foreground">
                                    {activity.target_user.full_name}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(activity.created_at).toLocaleString()}
                              </p>
                              {activity.action_details && Object.keys(activity.action_details).length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                                  <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(activity.action_details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {hasMoreActivity && (
                    <div className="text-center mt-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMoreActivity}
                        disabled={isLoadingActivity}
                      >
                        {isLoadingActivity ? (
                          <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}
