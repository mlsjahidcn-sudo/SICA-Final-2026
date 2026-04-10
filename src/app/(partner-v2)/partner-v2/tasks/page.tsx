'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { PartnerSidebar } from '@/components/partner-v2/partner-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assignee_id?: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

const statuses = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'done': return 'default';
    case 'blocked': return 'destructive';
    case 'in_progress': return 'secondary';
    case 'review': return 'outline';
    default: return 'outline';
  }
}

function getPriorityBadgeVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case 'urgent': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    default: return 'outline';
  }
}

export default function PartnerTasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'partner' && user.role !== 'admin'))) {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchTasks() {
      if (!user) return;

      try {
        const token = localStorage.getItem('sica_auth_token');
        let url = '/api/partner/tasks';
        const params = new URLSearchParams();
        
        if (filterStatus !== 'all') params.append('status', filterStatus);
        if (filterPriority !== 'all') params.append('priority', filterPriority);
        
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setTasks(result.tasks || []);
        }
      } catch (error) {
        console.error('Failed to fetch partner tasks:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user && (user.role === 'partner' || user.role === 'admin')) {
      fetchTasks();
    }
  }, [user, filterStatus, filterPriority]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'partner' && user.role !== 'admin')) {
    return null;
  }

  const getStatusInfo = (status: string) => 
    statuses.find(s => s.value === status) || statuses[0];
  
  const getPriorityInfo = (priority: string) => 
    priorities.find(p => p.value === priority) || priorities[1];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredTasks = filterStatus === 'all' && filterPriority === 'all'
    ? tasks
    : tasks.filter(task => {
        const statusMatch = filterStatus === 'all' || task.status === filterStatus;
        const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
        return statusMatch && priorityMatch;
      });

  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <PartnerSidebar variant="inset" />
        <SidebarInset>
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                {/* Header */}
                <div>
                  <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
                  <p className="text-muted-foreground">
                    Tasks assigned to you or related to your applications
                  </p>
                </div>

                {/* Filters */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filters</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Status
                        </label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statuses.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Priority
                        </label>
                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Priorities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            {priorities.map(priority => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tasks List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Tasks</CardTitle>
                    <CardDescription>
                      {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No tasks found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredTasks.map(task => {
                          const statusInfo = getStatusInfo(task.status);
                          const priorityInfo = getPriorityInfo(task.priority);
                          return (
                            <Card key={task.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-foreground">{task.title}</h4>
                                    {task.description && (
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-3">
                                      <Badge variant={getStatusBadgeVariant(task.status)}>
                                        {statusInfo.label}
                                      </Badge>
                                      <Badge variant={getPriorityBadgeVariant(task.priority)}>
                                        {priorityInfo.label}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Created {formatDate(task.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
