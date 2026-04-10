'use client';

import { useEffect, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Filter, Calendar, AlertCircle, CheckCircle2, Clock, ListTodo, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  completed_at?: string;
  assignee_id?: string;
  creator_id?: string;
  creator_role?: string;
  assignee_role?: string;
  related_to_type?: string;
  related_to_id?: string;
  partner_id?: string;
  created_at: string;
  updated_at: string;
  creator?: { id: string; email?: string; full_name?: string };
  assignee?: { id: string; email?: string; full_name?: string };
}

const statuses = [
  { value: 'todo', label: 'To Do', icon: ListTodo },
  { value: 'in_progress', label: 'In Progress', icon: Clock },
  { value: 'review', label: 'Review', icon: AlertCircle },
  { value: 'done', label: 'Done', icon: CheckCircle2 },
  { value: 'blocked', label: 'Blocked', icon: AlertCircle },
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

function isOverdue(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date();
}

export default function PartnerTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
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
        } else {
          const result = await response.json().catch(() => ({}));
          setError(result.error || 'Failed to load tasks');
        }
      } catch (err) {
        console.error('Failed to fetch partner tasks:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (user && (user.role === 'partner' || user.role === 'admin')) {
      fetchTasks();
    }
  }, [user, filterStatus, filterPriority]);

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTasks = filterStatus === 'all' && filterPriority === 'all'
    ? tasks
    : tasks.filter(task => {
        const statusMatch = filterStatus === 'all' || task.status === filterStatus;
        const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
        return statusMatch && priorityMatch;
      });

  // Stats
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const overdueCount = tasks.filter(t => isOverdue(t.due_date, t.status)).length;

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">My Tasks</h1>
          <p className="text-muted-foreground text-sm">Tasks assigned to you or related to your applications</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium mb-2">Failed to load tasks</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                }}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">My Tasks</h1>
          <p className="text-muted-foreground text-sm">
            Tasks assigned to you or related to your applications
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-muted p-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todoCount}</p>
                <p className="text-xs text-muted-foreground">To Do</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-muted p-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-muted p-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doneCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-muted p-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueCount}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No tasks found</p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                {tasks.length === 0
                  ? 'You have no tasks assigned yet'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => {
                const statusInfo = getStatusInfo(task.status);
                const priorityInfo = getPriorityInfo(task.priority);
                const overdue = isOverdue(task.due_date, task.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <Card
                    key={task.id}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTask(task)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <h4 className="font-semibold text-foreground truncate">{task.title}</h4>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center flex-wrap gap-3 mt-3">
                            <Badge variant={getStatusBadgeVariant(task.status)}>
                              {statusInfo.label}
                            </Badge>
                            <Badge variant={getPriorityBadgeVariant(task.priority)}>
                              {priorityInfo.label}
                            </Badge>
                            {task.due_date && (
                              <span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                <Calendar className="h-3 w-3" />
                                {overdue ? 'Overdue: ' : 'Due: '}
                                {formatDate(task.due_date)}
                              </span>
                            )}
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

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open: boolean) => { if (!open) setSelectedTask(null); }}>
        <DialogContent className="max-w-lg">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTask.title}</DialogTitle>
                <DialogDescription>
                  Task details and status information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status & Priority */}
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusBadgeVariant(selectedTask.status)}>
                    {getStatusInfo(selectedTask.status).label}
                  </Badge>
                  <Badge variant={getPriorityBadgeVariant(selectedTask.priority)}>
                    {getPriorityInfo(selectedTask.priority).label}
                  </Badge>
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedTask.description}</p>
                  </div>
                )}

                <Separator />

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedTask.due_date && (
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p className={isOverdue(selectedTask.due_date, selectedTask.status) ? 'text-destructive font-medium' : ''}>
                        {formatDate(selectedTask.due_date)}
                        {isOverdue(selectedTask.due_date, selectedTask.status) && ' (Overdue)'}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{formatDateTime(selectedTask.created_at)}</p>
                  </div>
                  {selectedTask.completed_at && (
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p>{formatDateTime(selectedTask.completed_at)}</p>
                    </div>
                  )}
                  {selectedTask.related_to_type && (
                    <div>
                      <p className="text-muted-foreground">Related To</p>
                      <p className="capitalize">{selectedTask.related_to_type.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                </div>

                {/* Assignee info */}
                {selectedTask.assignee && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                    <p className="text-sm">{selectedTask.assignee.full_name || selectedTask.assignee.email || 'Unknown'}</p>
                  </div>
                )}

                {/* Creator info */}
                {selectedTask.creator && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Created By</p>
                    <p className="text-sm">{selectedTask.creator.full_name || selectedTask.creator.email || 'Unknown'}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
