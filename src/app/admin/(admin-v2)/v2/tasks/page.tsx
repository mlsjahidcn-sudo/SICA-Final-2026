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
import { Loader2, Plus, Filter, List, KanbanSquare, Edit, Trash2, ExternalLink, User, GraduationCap } from 'lucide-react';
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

interface Application {
  id: string;
  student?: {
    full_name: string;
  };
  program?: {
    id: string;
    name_en: string;
    degree_type: string;
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
}

const statuses = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-100 text-slate-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'review', label: 'Review', color: 'bg-amber-100 text-amber-800' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-800' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

export default function AdminTasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [view, setView] = useState<'list' | 'board'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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
      const token = localStorage.getItem('sica_auth_token');
      let url = '/api/admin/tasks';
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
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!user) return;

    try {
      setLoadingApplications(true);
      const token = localStorage.getItem('sica_auth_token');
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
  }, [user, filterStatus, filterPriority]);

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
      const token = localStorage.getItem('sica_auth_token');
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
      const token = localStorage.getItem('sica_auth_token');
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

  const getApplicationName = (app: Application) => {
    const studentName = app.student?.full_name || 'Unknown Student';
    const programName = app.program?.name_en || 'Unknown Program';
    return `${studentName} - ${programName}`;
  };

  const getStudentInitials = (app: Application) => {
    const name = app.student?.full_name || 'US';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredTasks = filterStatus === 'all' && filterPriority === 'all'
    ? tasks
    : tasks.filter(task => {
        const statusMatch = filterStatus === 'all' || task.status === filterStatus;
        const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
        return statusMatch && priorityMatch;
      });

  const groupByStatus = () => {
    const groups: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      blocked: [],
    };
    
    filteredTasks.forEach(task => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });
    
    return groups;
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
          <SiteHeader />
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
                  <div className="flex items-center gap-2">
                    <Button onClick={handleOpenCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Task
                    </Button>
                  </div>
                </div>

                {/* Filters and View Toggle */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Filters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={view === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setView('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={view === 'board' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setView('board')}
                        >
                          <KanbanSquare className="h-4 w-4" />
                        </Button>
                      </div>
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

                {/* Tasks Content */}
                {view === 'list' ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>All Tasks</CardTitle>
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
                            const relatedApp = task.related_to_type === 'application' 
                              ? applications.find(app => app.id === task.related_to_id)
                              : null;
                            
                            return (
                              <Card key={task.id} className="hover:bg-muted/50">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3">
                                        <h4 className="font-semibold text-foreground">{task.title}</h4>
                                        {relatedApp && (
                                          <Link 
                                            href={`/admin/v2/applications/${relatedApp.id}`}
                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                          >
                                            <Avatar className="h-5 w-5">
                                              <AvatarFallback className="text-[10px]">
                                                {getStudentInitials(relatedApp)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span>{getApplicationName(relatedApp)}</span>
                                            <ExternalLink className="h-3 w-3" />
                                          </Link>
                                        )}
                                      </div>
                                      {task.description && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-3 mt-3">
                                        <Badge className={statusInfo.color} variant="secondary">
                                          {statusInfo.label}
                                        </Badge>
                                        <Badge className={priorityInfo.color} variant="secondary">
                                          {priorityInfo.label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          Created {formatDate(task.created_at)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleOpenEdit(task)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(task.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {statuses.map(status => {
                      const statusGroups = groupByStatus();
                      const statusTasks = statusGroups[status.value] || [];
                      
                      return (
                        <Card key={status.value}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Badge className={status.color} variant="secondary">
                                {statusTasks.length}
                              </Badge>
                              {status.label}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                            {statusTasks.length === 0 ? (
                              <div className="text-center py-6">
                                <p className="text-xs text-muted-foreground">No tasks</p>
                              </div>
                            ) : (
                              statusTasks.map(task => {
                                const priorityInfo = getPriorityInfo(task.priority);
                                const relatedApp = task.related_to_type === 'application' 
                                  ? applications.find(app => app.id === task.related_to_id)
                                  : null;
                                
                                return (
                                  <Card key={task.id} className="hover:bg-muted/50 cursor-pointer">
                                    <CardContent className="p-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <h5 className="font-medium text-sm text-foreground line-clamp-2">
                                            {task.title}
                                          </h5>
                                          {relatedApp && (
                                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                              <User className="h-3 w-3" />
                                              <span className="truncate">
                                                {getApplicationName(relatedApp)}
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2 mt-2">
                                            <Badge className={`${priorityInfo.color} text-xs`} variant="secondary">
                                              {priorityInfo.label}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenEdit(task);
                                            }}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>

        {/* Create/Edit Task Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
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
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !formData.title}>
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
