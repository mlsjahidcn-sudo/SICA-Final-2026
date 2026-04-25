'use client';

import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskCard } from './task-card';
import { ChevronLeft, ChevronRight, GripVertical, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface TaskBoardViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

const statusColumns = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-500', bgColor: 'bg-slate-50 dark:bg-slate-950/30' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  { value: 'review', label: 'Review', color: 'bg-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
  { value: 'done', label: 'Done', color: 'bg-green-500', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-950/30' },
];

export function TaskBoardView({ tasks, onEdit, onDelete, onStatusChange }: TaskBoardViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const groupByStatus = () => {
    const groups: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      blocked: [],
    };

    tasks.forEach((task) => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });

    return groups;
  };

  const statusGroups = groupByStatus();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Card width + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative">
      {/* Scroll buttons for mobile */}
      <div className="flex md:hidden items-center justify-end gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={() => scroll('left')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">Swipe to see more columns</span>
        <Button variant="outline" size="sm" onClick={() => scroll('right')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Board container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {statusColumns.map((column) => {
          const columnTasks = statusGroups[column.value] || [];
          const completedTasks = columnTasks.filter((t) => t.status === 'done').length;

          return (
            <div
              key={column.value}
              className="flex-shrink-0 w-[300px] md:w-[280px] lg:w-[260px] xl:w-[280px]"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Column Header */}
              <Card className={cn('h-full', column.bgColor)}>
                <CardHeader className="pb-3 sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2.5 h-2.5 rounded-full', column.color)} />
                      <CardTitle className="text-sm font-medium">{column.label}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {columnTasks.length}
                    </Badge>
                  </div>
                </CardHeader>

                {/* Column Content */}
                <CardContent className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="rounded-full bg-muted/50 p-2 mb-2">
                        <FileQuestion className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">No tasks</p>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        view="board"
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Gradient fade indicators */}
      <div className="hidden md:block absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="hidden md:block absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
}
