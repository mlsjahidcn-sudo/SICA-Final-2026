'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  GraduationCap,
} from 'lucide-react';
import { format, isPast, isToday, differenceInDays, parseISO } from 'date-fns';

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
  application?: {
    id: string;
    student?: {
      full_name: string;
    };
    program?: {
      id: string;
      name: string;
      degree_level: string;
    };
  };
  subtasks?: { id: string; completed: boolean }[];
}

interface TaskCardProps {
  task: Task;
  view?: 'list' | 'board';
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  todo: { label: 'To Do', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dotColor: 'bg-slate-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', dotColor: 'bg-blue-500' },
  review: { label: 'Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', dotColor: 'bg-amber-500' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300', dotColor: 'bg-green-500' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300', dotColor: 'bg-red-500' },
};

const priorityConfig: Record<string, { label: string; color: string; indicator: string }> = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', indicator: '●' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400', indicator: '●●' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400', indicator: '●●●' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400', indicator: '⚠' },
};

export function TaskCard({ task, view = 'list', onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const status = statusConfig[task.status] || statusConfig.todo;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  // Calculate due date status
  const getDueDateInfo = () => {
    if (!task.due_date) return null;

    const dueDate = parseISO(task.due_date);
    const now = new Date();

    if (isPast(dueDate) && !isToday(dueDate) && task.status !== 'done') {
      return {
        isOverdue: true,
        isDueSoon: false,
        text: `Overdue by ${Math.abs(differenceInDays(dueDate, now))}d`,
        icon: AlertTriangle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
      };
    }

    if (isToday(dueDate) && task.status !== 'done') {
      return {
        isOverdue: false,
        isDueSoon: true,
        text: 'Due today',
        icon: Clock,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      };
    }

    const daysUntil = differenceInDays(dueDate, now);
    if (daysUntil <= 3 && daysUntil > 0 && task.status !== 'done') {
      return {
        isOverdue: false,
        isDueSoon: true,
        text: `Due in ${daysUntil}d`,
        icon: Clock,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      };
    }

    return {
      isOverdue: false,
      isDueSoon: false,
      text: format(dueDate, 'MMM d'),
      icon: Calendar,
      color: 'text-muted-foreground',
      bgColor: '',
    };
  };

  const dueDateInfo = getDueDateInfo();
  const DueIcon = dueDateInfo?.icon || Calendar;

  // Calculate progress from subtasks
  const subtaskProgress = task.subtasks
    ? {
        completed: task.subtasks.filter((s) => s.completed).length,
        total: task.subtasks.length,
        percentage:
          task.subtasks.length > 0
            ? Math.round(
                (task.subtasks.filter((s) => s.completed).length /
                  task.subtasks.length) *
                  100
              )
            : 0,
      }
    : null;

  // Get related application info
  const getApplicationName = () => {
    if (task.related_to_type !== 'application' || !task.application) return null;
    const studentName = task.application.student?.full_name || 'Unknown Student';
    const programName = task.application.program?.name || 'Unknown Program';
    return { studentName, programName, id: task.application.id };
  };

  const relatedApp = getApplicationName();

  const getStudentInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Board view - compact card
  if (view === 'board') {
    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-all duration-200 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-3 space-y-2">
          {/* Header with priority */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 flex-shrink-0 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit?.(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete?.(task.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Priority & Due Date */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs px-1.5 py-0 ${priority.color}`}>
              {priority.indicator} {priority.label}
            </Badge>
            {dueDateInfo && (
              <span className={`text-xs flex items-center gap-1 ${dueDateInfo.color}`}>
                <DueIcon className="h-3 w-3" />
                {dueDateInfo.text}
              </span>
            )}
          </div>

          {/* Related Application */}
          {relatedApp && (
            <Link
              href={`/admin/v2/applications/${relatedApp.id}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[8px]">
                  {getStudentInitials(relatedApp.studentName)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{relatedApp.studentName}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </Link>
          )}

          {/* Progress */}
          {subtaskProgress && subtaskProgress.total > 0 && (
            <div className="flex items-center gap-2">
              <Progress value={subtaskProgress.percentage} className="h-1 flex-1" />
              <span className="text-xs text-muted-foreground">
                {subtaskProgress.completed}/{subtaskProgress.total}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // List view - full card
  return (
    <Card
      className="hover:shadow-md transition-all duration-200 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Indicator */}
          <div className={`w-1 h-12 rounded-full flex-shrink-0 ${status.dotColor}`} />

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate">{task.title}</h4>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className={`flex items-center gap-1 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit?.(task)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Task
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete?.(task.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Badge */}
              <Badge variant="secondary" className={status.color}>
                {status.label}
              </Badge>

              {/* Priority Badge */}
              <Badge variant="outline" className={priority.color}>
                {priority.indicator} {priority.label}
              </Badge>

              {/* Due Date */}
              {dueDateInfo && (
                <span
                  className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded ${dueDateInfo.bgColor} ${dueDateInfo.color}`}
                >
                  <DueIcon className="h-3 w-3" />
                  {dueDateInfo.text}
                </span>
              )}

              {/* Created Date */}
              <span className="text-xs text-muted-foreground">
                Created {format(parseISO(task.created_at), 'MMM d, yyyy')}
              </span>
            </div>

            {/* Related Application */}
            {relatedApp && (
              <div className="flex items-center gap-2 pt-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <Link
                  href={`/admin/v2/applications/${relatedApp.id}`}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {getStudentInitials(relatedApp.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{relatedApp.studentName}</span>
                  <span className="text-muted-foreground">-</span>
                  <span className="truncate">{relatedApp.programName}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0 ml-1" />
                </Link>
              </div>
            )}

            {/* Progress */}
            {subtaskProgress && subtaskProgress.total > 0 && (
              <div className="flex items-center gap-3 pt-1">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2 flex-1">
                  <Progress value={subtaskProgress.percentage} className="h-1.5 w-24" />
                  <span className="text-xs text-muted-foreground">
                    {subtaskProgress.completed}/{subtaskProgress.total} subtasks
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
