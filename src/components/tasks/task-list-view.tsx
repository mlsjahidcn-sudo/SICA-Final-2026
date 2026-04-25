'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskCard } from './task-card';
import { FileQuestion } from 'lucide-react';

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

interface TaskListViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

export function TaskListView({ tasks, onEdit, onDelete, onStatusChange }: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No tasks found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Create a new task to get started, or adjust your filters to see existing tasks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">All Tasks</CardTitle>
        <CardDescription>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              view="list"
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
