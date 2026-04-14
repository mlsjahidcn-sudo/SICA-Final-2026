'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AppSidebar,
} from '@/components/dashboard-v2-sidebar';
import { SiteHeader } from '@/components/dashboard-v2-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Plus, List, KanbanSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import new components
import { TaskStatsHeader } from '@/components/tasks/task-stats-header';
import { TaskListView } from '@/components/tasks/task-list-view';
import { TaskBoardView } from '@/components/tasks/task-board-view';
import { TaskFiltersResponsive, type TaskFilters } from '@/components/tasks/task-filters-responsive';

interface Application {
  id: string;
  student?: {
    full_name: string;
  };
  program?: {
    id: string;
    name: string;
    degree_level: string;
  };
}

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
  related_to_type?: string;
  related_to_id?: string;
  application?: Application;
  subtasks?: { id: string; completed: boolean }[];
}

const statuses = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  { value: 'review', label: 'Review', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400' },
];

export default function AdminTasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [view, setView] = useState<'list' | 'board'>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    relatedToType: '',
    relatedToId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      let url = '/api/admin/tasks';
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
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
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!user) return;

    try {
      setLoadingApplications(true);
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const response = await fetch('/api/admin/applications?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setApplications(result.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchTasks();
      fetchApplications();
    }
  }, [user, filters]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      relatedToType: '',
      relatedToId: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date ? task.due_date.split('T')[0] : '',
      relatedToType: task.related_to_type || '',
      relatedToId: task.related_to_id || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const url = editingTask 
        ? `/api/admin/tasks/${editingTask.id}`
        : '/api/admin/tasks';
      
      interface TaskRequestBody {
        title: string;
        description: string;
        status: string;
        priority: string;
        dueDate?: string | null;
        relatedToType?: string;
        relatedToId?: string;
      }

      const requestBody: TaskRequestBody = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
      };

      if (formData.relatedToType && formData.relatedToId) {
        requestBody.relatedToType = formData.relatedToType;
        requestBody.relatedToId = formData.relatedToId;
      }

      const response = await fetch(url, {
        method: editingTask ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      return new Date(t.due_date) < new Date();
    }).length,
  };

  const getApplicationName = (app: Application) => {
    const studentName = app.student?.full_name || 'Unknown Student';
    const programName = app.program?.name || 'Unknown Program';
    return `${studentName} - ${programName}`;
  };

  const getStudentInitials = (app: Application) => {
    const name = app.student?.full_name || 'US';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Tasks" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
                    <p className="text-muted-foreground">
                      Manage and track all platform tasks
                    </p>
                  </div>
                  <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                  </Button>
                </div>

                {/* Statistics Header */}
                <TaskStatsHeader stats={taskStats} />

                {/* Filters and View Toggle */}
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <TaskFiltersResponsive
                    onFilterChange={setFilters}
                    users={[]}
                    labels={[]}
                  />
                  
                  {/* View Toggle */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'board')}>
                      <TabsList>
                        <TabsTrigger value="list" className="gap-2">
                          <List className="h-4 w-4" />
                          <span className="hidden sm:inline">List</span>
                        </TabsTrigger>
                        <TabsTrigger value="board" className="gap-2">
                          <KanbanSquare className="h-4 w-4" />
                          <span className="hidden sm:inline">Board</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                {/* Tasks Content */}
                {view === 'list' ? (
                  <TaskListView
                    tasks={tasks}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                  />
                ) : (
                  <TaskBoardView
                    tasks={tasks}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            </div>
          </div>
        </SidebarInset>

        {/* Create/Edit Task Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </DialogTitle>
                <DialogDescription>
                  {editingTask ? 'Update the task details below' : 'Fill in the details to create a new task'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Task title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Task description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relatedApplication">Related Application</Label>
                  <Select
                    value={formData.relatedToType === 'application' ? formData.relatedToId : 'none'}
                    onValueChange={(value) => {
                      if (value && value !== 'none') {
                        setFormData({ 
                          ...formData, 
                          relatedToType: 'application', 
                          relatedToId: value 
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          relatedToType: '', 
                          relatedToId: '' 
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="relatedApplication">
                      <SelectValue placeholder="Select an application (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {applications.map(app => (
                        <SelectItem key={app.id} value={app.id}>
                          {getApplicationName(app)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !formData.title} className="w-full sm:w-auto">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingTask ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingTask ? 'Update Task' : 'Create Task'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </TooltipProvider>
  );
}
