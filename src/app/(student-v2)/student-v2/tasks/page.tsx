'use client';

import { useEffect, useState, useCallback } from 'react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  IconPlus,
  IconDotsVertical,
  IconCheck,
  IconProgress,
  IconTrash,
  IconLayoutColumns,
  IconList,
  IconLoader2,
  IconFilter,
  IconCalendar,
  IconAlertCircle,
  IconCircleCheck,
  IconClock,
  IconListCheck,
  IconClipboardList,
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

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
  created_at: string;
  updated_at: string;
  creator?: { id: string; email?: string; full_name?: string };
  assignee?: { id: string; email?: string; full_name?: string };
}

const statuses = [
  { value: 'todo', label: 'To Do', icon: IconListCheck },
  { value: 'in_progress', label: 'In Progress', icon: IconClock },
  { value: 'done', label: 'Done', icon: IconCircleCheck },
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'done':
      return 'default';
    case 'in_progress':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getPriorityBadgeVariant(priority: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    default:
      return 'outline';
  }
}

function isOverdue(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date();
}

export default function StudentTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
  });

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const params = new URLSearchParams();

      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);

      const url = `/api/student/tasks${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setTasks(result.tasks || []);
      } else {
        const result = await response.json().catch(() => ({}));
        setError(result.error || 'Failed to load tasks');
      }
    } catch (err) {
      console.error('Failed to fetch student tasks:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, filterStatus, filterPriority]);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsCreating(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch('/api/student/tasks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (response.ok) {
        toast.success('Task created successfully');
        setShowCreateDialog(false);
        setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
        fetchTasks();
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || 'Failed to create task');
      }
    } catch (err) {
      console.error('Create task error:', err);
      toast.error('Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    setIsUpdating(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch(`/api/student/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Task marked as ${statuses.find((s) => s.value === status)?.label || status}`);
        fetchTasks();
        if (selectedTask?.id === taskId) {
          setSelectedTask((prev) =>
            prev
              ? {
                  ...prev,
                  status,
                  completed_at: status === 'done' ? new Date().toISOString() : undefined,
                }
              : null
          );
        }
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || 'Failed to update task');
      }
    } catch (err) {
      console.error('Update task error:', err);
      toast.error('Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch(`/api/student/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Task deleted');
        setSelectedTask(null);
        fetchTasks();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (err) {
      console.error('Delete task error:', err);
      toast.error('Failed to delete task');
    }
  };

  const getStatusInfo = (status: string) =>
    statuses.find((s) => s.value === status) || statuses[0];

  const getPriorityInfo = (priority: string) =>
    priorities.find((p) => p.value === priority) || priorities[1];

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

  const filteredTasks =
    filterStatus === 'all' && filterPriority === 'all'
      ? tasks
      : tasks.filter((task) => {
          const statusMatch = filterStatus === 'all' || task.status === filterStatus;
          const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
          return statusMatch && priorityMatch;
        });

  const todoCount = tasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const overdueCount = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">My Tasks</h1>
          <p className="text-muted-foreground text-sm">Manage your personal tasks and application-related tasks</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <IconAlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
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
            Manage your personal tasks and application-related tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border bg-muted/50 p-0.5">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('list')}
            >
              <IconList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('kanban')}
            >
              <IconLayoutColumns className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <IconPlus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-muted p-2">
                <IconListCheck className="h-4 w-4 text-muted-foreground" />
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
                <IconClock className="h-4 w-4 text-muted-foreground" />
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
                <IconCircleCheck className="h-4 w-4 text-muted-foreground" />
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
                <IconAlertCircle className="h-4 w-4 text-destructive" />
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
            <IconFilter className="h-4 w-4 text-muted-foreground" />
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
                  {statuses.map((status) => (
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
                  {priorities.map((priority) => (
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

      {/* Tasks View */}
      {viewMode === 'list' ? (
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
                <IconClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No tasks found</p>
                <p className="text-muted-foreground/70 text-sm mt-1">
                  {tasks.length === 0
                    ? 'Create a new task to get started'
                    : 'Try adjusting your filters'}
                </p>
                {tasks.length === 0 && (
                  <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                    <IconPlus className="h-4 w-4 mr-2" /> Create Task
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
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
                              <h4
                                className={`font-semibold truncate ${
                                  task.status === 'done'
                                    ? 'line-through text-muted-foreground'
                                    : 'text-foreground'
                                }`}
                              >
                                {task.title}
                              </h4>
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
                                <span
                                  className={`inline-flex items-center gap-1 text-xs ${
                                    overdue ? 'text-destructive font-medium' : 'text-muted-foreground'
                                  }`}
                                >
                                  <IconCalendar className="h-3 w-3" />
                                  {overdue ? 'Overdue: ' : 'Due: '}
                                  {formatDate(task.due_date)}
                                </span>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon-sm" className="shrink-0">
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {task.status !== 'in_progress' && task.status !== 'done' && (
                                <DropdownMenuItem
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(task.id, 'in_progress');
                                  }}
                                >
                                  <IconProgress className="h-4 w-4 mr-2" /> Mark In Progress
                                </DropdownMenuItem>
                              )}
                              {task.status !== 'done' && (
                                <DropdownMenuItem
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(task.id, 'done');
                                  }}
                                >
                                  <IconCheck className="h-4 w-4 mr-2" /> Mark Done
                                </DropdownMenuItem>
                              )}
                              {task.status === 'done' && (
                                <DropdownMenuItem
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(task.id, 'todo');
                                  }}
                                >
                                  <IconListCheck className="h-4 w-4 mr-2" /> Reopen
                                </DropdownMenuItem>
                              )}
                              {task.creator_role === 'student' && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id);
                                  }}
                                >
                                  <IconTrash className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
          {['todo', 'in_progress', 'done'].map((status) => {
            const statusInfo = getStatusInfo(status);
            const StatusIcon = statusInfo.icon;
            const columnTasks = filteredTasks.filter((t) => t.status === status);

            return (
              <div key={status} className="flex flex-col rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 p-3 border-b">
                  <StatusIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{statusInfo.label}</h3>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {columnTasks.length}
                  </Badge>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
                  {columnTasks.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground/50 text-xs">
                      No tasks
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const priorityInfo = getPriorityInfo(task.priority);
                      const overdue = isOverdue(task.due_date, task.status);

                      return (
                        <Card
                          key={task.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedTask(task)}
                        >
                          <CardContent className="p-3">
                            <h4
                              className={`text-sm font-medium ${
                                task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center flex-wrap gap-1.5 mt-2">
                              <Badge
                                variant={getPriorityBadgeVariant(task.priority)}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {priorityInfo.label}
                              </Badge>
                              {task.due_date && (
                                <span
                                  className={`inline-flex items-center gap-0.5 text-[10px] ${
                                    overdue ? 'text-destructive font-medium' : 'text-muted-foreground'
                                  }`}
                                >
                                  <IconCalendar className="h-2.5 w-2.5" />
                                  {overdue ? 'Overdue' : formatDate(task.due_date)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                              {task.status !== 'done' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-[10px]"
                                  disabled={isUpdating}
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(task.id, task.status === 'todo' ? 'in_progress' : 'done');
                                  }}
                                >
                                  {task.status === 'todo' ? (
                                    <>
                                      <IconProgress className="h-3 w-3 mr-0.5" /> Start
                                    </>
                                  ) : (
                                    <>
                                      <IconCheck className="h-3 w-3 mr-0.5" /> Done
                                    </>
                                  )}
                                </Button>
                              )}
                              {task.status === 'done' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-[10px]"
                                  disabled={isUpdating}
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(task.id, 'todo');
                                  }}
                                >
                                  <IconListCheck className="h-3 w-3 mr-0.5" /> Reopen
                                </Button>
                              )}
                              {task.creator_role === 'student' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-[10px] text-destructive hover:text-destructive ml-auto"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id);
                                  }}
                                >
                                  <IconTrash className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open: boolean) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-lg">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle
                  className={selectedTask.status === 'done' ? 'line-through text-muted-foreground' : ''}
                >
                  {selectedTask.title}
                </DialogTitle>
                <DialogDescription>Task details and status information</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusBadgeVariant(selectedTask.status)}>
                    {getStatusInfo(selectedTask.status).label}
                  </Badge>
                  <Badge variant={getPriorityBadgeVariant(selectedTask.priority)}>
                    {getPriorityInfo(selectedTask.priority).label}
                  </Badge>
                </div>

                {selectedTask.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedTask.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedTask.due_date && (
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p
                        className={
                          isOverdue(selectedTask.due_date, selectedTask.status)
                            ? 'text-destructive font-medium'
                            : ''
                        }
                      >
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

                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedTask.status !== 'in_progress' && selectedTask.status !== 'done' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(selectedTask.id, 'in_progress')}
                    >
                      {isUpdating ? (
                        <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <IconProgress className="h-4 w-4 mr-1" />
                      )}
                      In Progress
                    </Button>
                  )}
                  {selectedTask.status !== 'done' && (
                    <Button size="sm" disabled={isUpdating} onClick={() => handleUpdateStatus(selectedTask.id, 'done')}>
                      {isUpdating ? (
                        <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <IconCheck className="h-4 w-4 mr-1" />
                      )}
                      Done
                    </Button>
                  )}
                  {selectedTask.status === 'done' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(selectedTask.id, 'todo')}
                    >
                      {isUpdating ? (
                        <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <IconListCheck className="h-4 w-4 mr-1" />
                      )}
                      Reopen
                    </Button>
                  )}
                  {selectedTask.creator_role === 'student' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-auto"
                      onClick={() => handleDeleteTask(selectedTask.id)}
                    >
                      <IconTrash className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new personal task to track your work</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description (optional)"
                value={newTask.description}
                onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={isCreating || !newTask.title.trim()}>
              {isCreating ? (
                <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <IconPlus className="h-4 w-4 mr-1" />
              )}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
