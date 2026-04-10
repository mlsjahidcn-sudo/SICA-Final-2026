'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IconBell,
  IconCheck,
  IconChecks,
  IconFileText,
  IconCalendar,
  IconPaperclip,
  IconAlertCircle,
  IconRefresh,
  IconDots,
  IconExternalLink,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const NOTIFICATION_TYPES: Record<string, { icon: typeof IconBell; color: string; label: string }> = {
  application: { icon: IconFileText, color: 'text-blue-500', label: 'Application' },
  meeting: { icon: IconCalendar, color: 'text-purple-500', label: 'Meeting' },
  document: { icon: IconPaperclip, color: 'text-orange-500', label: 'Document' },
  system: { icon: IconAlertCircle, color: 'text-gray-500', label: 'System' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      
      const response = await fetch(`/api/partner/notifications?type=${activeFilter}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        toast.error('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      
      const response = await fetch(`/api/partner/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success('Marked as read');
      }
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      
      const response = await fetch('/api/partner/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const getTypeIcon = (type: string) => {
    const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;
    const Icon = config.icon;
    return <Icon className={`h-5 w-5 ${config.color}`} />;
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.is_read;
    return n.type === activeFilter;
  });

  const counts = {
    all: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    application: notifications.filter(n => n.type === 'application').length,
    meeting: notifications.filter(n => n.type === 'meeting').length,
    document: notifications.filter(n => n.type === 'document').length,
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="default" className="rounded-full">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Stay updated with your latest notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchNotifications()}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <IconChecks className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 lg:px-6">
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all" className="gap-2">
              All
              {counts.all > 0 && (
                <Badge variant="secondary" className="rounded-full px-2">
                  {counts.all}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              Unread
              {counts.unread > 0 && (
                <Badge variant="secondary" className="rounded-full px-2">
                  {counts.unread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="application" className="gap-2">
              <IconFileText className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="meeting" className="gap-2">
              <IconCalendar className="h-4 w-4" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="document" className="gap-2">
              <IconPaperclip className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Notifications List */}
      <div className="px-4 lg:px-6 py-6">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              // Loading skeletons
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4 p-4">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-64 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconBell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {activeFilter === 'unread'
                    ? "You're all caught up!"
                    : 'No notifications to display'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {getTypeIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          {notification.content && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.content}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <IconCheck className="h-4 w-4 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          {notification.link && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={notification.link}>
                                <IconExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <IconDots className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.is_read && (
                                <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                  <IconCheck className="h-4 w-4 mr-2" />
                                  Mark as Read
                                </DropdownMenuItem>
                              )}
                              {notification.link && (
                                <DropdownMenuItem asChild>
                                  <Link href={notification.link}>
                                    <IconExternalLink className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.is_read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
