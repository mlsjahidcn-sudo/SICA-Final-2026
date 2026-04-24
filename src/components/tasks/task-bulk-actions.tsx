'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckSquare,
  MoreHorizontal,
  Trash2,
  User,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee_id?: string;
  [key: string]: unknown;
}

interface TaskBulkActionsProps {
  selectedTasks: Task[];
  onSelectionChange: (taskIds: string[]) => void;
  onBulkStatusChange: (taskIds: string[], status: string) => Promise<void>;
  onBulkPriorityChange: (taskIds: string[], priority: string) => Promise<void>;
  onBulkAssign: (taskIds: string[], assigneeId: string) => Promise<void>;
  onBulkDelete: (taskIds: string[]) => Promise<void>;
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

export function TaskBulkActions({
  selectedTasks,
  onSelectionChange,
  onBulkStatusChange,
  onBulkPriorityChange,
  onBulkAssign,
  onBulkDelete,
}: TaskBulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCount = selectedTasks.length;
  const selectedIds = selectedTasks.map((t) => t.id);

  const handleBulkStatusChange = async (status: string) => {
    setIsProcessing(true);
    try {
      await onBulkStatusChange(selectedIds, status);
      toast.success(`Updated ${selectedCount} tasks to ${status}`);
    } catch (error) {
      toast.error('Failed to update tasks');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPriorityChange = async (priority: string) => {
    setIsProcessing(true);
    try {
      await onBulkPriorityChange(selectedIds, priority);
      toast.success(`Updated ${selectedCount} tasks priority to ${priority}`);
    } catch (error) {
      toast.error('Failed to update tasks');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} tasks?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await onBulkDelete(selectedIds);
      toast.success(`Deleted ${selectedCount} tasks`);
      onSelectionChange([]);
    } catch (error) {
      toast.error('Failed to delete tasks');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <Card className="border-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">
              {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClearSelection}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Change */}
          <Select
            onValueChange={handleBulkStatusChange}
            disabled={isProcessing}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Change */}
          <Select
            onValueChange={handleBulkPriorityChange}
            disabled={isProcessing}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Change priority" />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                )}
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedCount} tasks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
