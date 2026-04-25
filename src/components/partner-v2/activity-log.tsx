'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  IconUser,
  IconFileText,
  IconCheck,
  IconX,
  IconClock,
  IconEdit,
  IconTrash,
  IconArrowRight,
  IconNote,
  IconUpload,
  IconCalendar,
  IconLoader2,
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLogItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ActivityLogProps {
  entityType: 'student' | 'application' | 'document' | 'meeting';
  entityId: string;
  title?: string;
  limit?: number;
}

const ACTION_CONFIG: Record<string, { icon: typeof IconUser; label: string; color: string }> = {
  created: { icon: IconFileText, label: 'Created', color: 'text-blue-600 bg-blue-50' },
  updated: { icon: IconEdit, label: 'Updated', color: 'text-amber-600 bg-amber-50' },
  deleted: { icon: IconTrash, label: 'Deleted', color: 'text-red-600 bg-red-50' },
  status_changed: { icon: IconArrowRight, label: 'Status Changed', color: 'text-purple-600 bg-purple-50' },
  assigned: { icon: IconUser, label: 'Assigned', color: 'text-indigo-600 bg-indigo-50' },
  unassigned: { icon: IconUser, label: 'Unassigned', color: 'text-gray-600 bg-gray-50' },
  note_added: { icon: IconNote, label: 'Note Added', color: 'text-teal-600 bg-teal-50' },
  document_uploaded: { icon: IconUpload, label: 'Document Uploaded', color: 'text-cyan-600 bg-cyan-50' },
  document_verified: { icon: IconCheck, label: 'Document Verified', color: 'text-green-600 bg-green-50' },
  document_rejected: { icon: IconX, label: 'Document Rejected', color: 'text-red-600 bg-red-50' },
  meeting_scheduled: { icon: IconCalendar, label: 'Meeting Scheduled', color: 'text-violet-600 bg-violet-50' },
  meeting_completed: { icon: IconCheck, label: 'Meeting Completed', color: 'text-green-600 bg-green-50' },
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ActivityLog({ entityType, entityId, title = 'Activity Log', limit = 10 }: ActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchLogs = async (resetOffset = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      const params = new URLSearchParams({
        entityType,
        entityId,
        limit: limit.toString(),
        offset: (resetOffset ? 0 : offset).toString(),
      });

      const response = await fetch(`/api/partner/activity?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch activity logs');
      }

      const data = await response.json();
      
      if (resetOffset) {
        setLogs(data.logs);
        setOffset(0);
      } else {
        setLogs(prev => [...prev, ...data.logs]);
      }
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [entityType, entityId]);

  const loadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchLogs(false);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <IconClock className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && logs.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <IconClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activity recorded yet</p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {logs.map((log) => {
                const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.updated;
                const Icon = config.icon;
                const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true });

                return (
                  <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors">
                    {/* Actor Avatar */}
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(log.actor_name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={`text-xs ${config.color} border-0`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        {log.actor_name && (
                          <span className="text-sm font-medium truncate">
                            {log.actor_name}
                          </span>
                        )}
                      </div>
                      
                      {/* Metadata details */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {!!log.metadata.old_status && !!log.metadata.new_status && (
                            <span>
                              {String(log.metadata.old_status)} → {String(log.metadata.new_status)}
                            </span>
                          )}
                          {!!log.metadata.note_preview && (
                            <span className="truncate block max-w-[300px]">
                              "{String(log.metadata.note_preview)}"
                            </span>
                          )}
                          {!!log.metadata.document_name && (
                            <span>{String(log.metadata.document_name)}</span>
                          )}
                          {!!log.metadata.meeting_title && (
                            <span>{String(log.metadata.meeting_title)}</span>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-1">
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="p-4 border-t text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
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
      </CardContent>
    </Card>
  );
}
