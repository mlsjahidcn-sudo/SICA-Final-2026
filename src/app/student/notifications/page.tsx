'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/auth-context';
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Loader2,
  ArrowLeft,
  FileText,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  application: FileText,
  meeting: Calendar,
  message: MessageSquare,
  document: AlertCircle,
  status_update: CheckCircle2,
  payment: FileText,
  general: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  application: 'text-blue-500 bg-blue-500/10',
  meeting: 'text-purple-500 bg-purple-500/10',
  message: 'text-green-500 bg-green-500/10',
  document: 'text-amber-500 bg-amber-500/10',
  status_update: 'text-primary bg-primary/10',
  payment: 'text-red-500 bg-red-500/10',
  general: 'text-muted-foreground bg-muted',
};

const TYPE_LABELS: Record<string, string> = {
  application: 'Application',
  meeting: 'Meeting',
  message: 'Message',
  document: 'Document',
  status_update: 'Status Update',
  payment: 'Payment',
  general: 'General',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'student') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch(`/api/notifications?unreadOnly=${filter === 'unread'}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setTotalCount(data.total || 0);
      } else {
        toast.error('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const handleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const markSelectedAsRead = async () => {
    if (selectedIds.size === 0) return;
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationIds: Array.from(selectedIds) }),
      });
      
      if (response.ok) {
        toast.success('Marked as read');
        setSelectedIds(new Set());
        fetchNotifications();
      } else {
        toast.error('Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    } finally {
      setIsProcessing(false);
    }
  };

  const markAllAsRead = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ markAllRead: true }),
      });
      
      if (response.ok) {
        toast.success('All notifications marked as read');
        fetchNotifications();
      } else {
        toast.error('Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark as read');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      // Delete each selected notification
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/notifications?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          })
        )
      );
      
      toast.success('Notifications deleted');
      setSelectedIds(new Set());
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast.error('Failed to delete notifications');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch('/api/notifications?clearAll=true', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success('All notifications cleared');
        fetchNotifications();
      } else {
        toast.error('Failed to clear notifications');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (authLoading || !user || user.role !== 'student' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-2 -ml-4">
            <Link href="/student">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground mt-1">
                Stay updated with your application progress
              </p>
            </div>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-sm">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs & Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
                <TabsList>
                  <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
                  <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={isProcessing}>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark All Read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearAll} disabled={isProcessing}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <Card className="mb-4 border-primary/50 bg-primary/5">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={markSelectedAsRead} disabled={isProcessing}>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark Read
                  </Button>
                  <Button size="sm" variant="destructive" onClick={deleteSelected} disabled={isProcessing}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        <Card>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="py-16 text-center">
                <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  We&apos;ll notify you when there&apos;s something new
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {/* Select All Header */}
                <div className="flex items-center gap-3 p-4 bg-muted/50">
                  <Checkbox
                    checked={selectedIds.size === notifications.length && notifications.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select all</span>
                </div>
                
                {/* Notifications */}
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                  const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.general;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${
                        !notification.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selectedIds.has(notification.id)}
                        onCheckedChange={() => handleSelect(notification.id)}
                      />
                      
                      <div className={`h-10 w-10 rounded-full ${colorClass.split(' ')[1]} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${colorClass.split(' ')[0]}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            {notification.content && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.content}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {TYPE_LABELS[notification.type] || notification.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              {notification.link && (
                                <Link
                                  href={notification.link}
                                  className="text-xs text-primary hover:underline flex items-center gap-0.5"
                                >
                                  View details
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Notification Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Customize how you receive notifications
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/student/settings">
                  Manage Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
