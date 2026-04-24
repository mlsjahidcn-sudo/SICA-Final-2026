'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  GripVertical,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  order_index: number;
  created_at: string;
}

interface TaskSubtasksProps {
  taskId: string;
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
  readOnly?: boolean;
}

interface SortableItemProps {
  subtask: Subtask;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  readOnly?: boolean;
}

function SortableSubtask({ subtask, onToggle, onDelete, onEdit, readOnly }: SortableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== subtask.title) {
      onEdit(subtask.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors ${
        isDragging ? 'bg-muted shadow-md' : ''
      }`}
    >
      {!readOnly && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={(checked) => onToggle(subtask.id, checked as boolean)}
        disabled={readOnly}
        className="flex-shrink-0"
      />
      
      {isEditing ? (
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setEditTitle(subtask.title);
              setIsEditing(false);
            }
          }}
          className="flex-1 h-8"
          autoFocus
        />
      ) : (
        <span
          className={`flex-1 text-sm ${
            subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'
          } ${!readOnly ? 'cursor-pointer' : ''}`}
          onClick={() => !readOnly && !subtask.completed && setIsEditing(true)}
        >
          {subtask.title}
        </span>
      )}
      
      {!readOnly && !isEditing && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(subtask.id)}
          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export function TaskSubtasks({
  taskId,
  subtasks,
  onSubtasksChange,
  readOnly = false,
}: TaskSubtasksProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = subtasks.findIndex((s) => s.id === active.id);
        const newIndex = subtasks.findIndex((s) => s.id === over.id);

        const newSubtasks = arrayMove(subtasks, oldIndex, newIndex).map(
          (s, index) => ({ ...s, order_index: index })
        );

        onSubtasksChange(newSubtasks);

        // Update order on server
        try {
          const { getValidToken } = await import('@/lib/auth-token');
          const token = await getValidToken();
          await fetch(`/api/admin/tasks/${taskId}/subtasks/reorder`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              subtaskIds: newSubtasks.map((s) => s.id),
            }),
          });
        } catch (error) {
          console.error('Failed to reorder subtasks:', error);
        }
      }
    },
    [subtasks, taskId, onSubtasksChange]
  );

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch(`/api/admin/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newSubtaskTitle.trim() }),
      });

      if (response.ok) {
        const { subtask } = await response.json();
        onSubtasksChange([...subtasks, subtask]);
        setNewSubtaskTitle('');
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Failed to add subtask:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch(`/api/admin/tasks/${taskId}/subtasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        onSubtasksChange(
          subtasks.map((s) => (s.id === id ? { ...s, completed } : s))
        );
      }
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch(`/api/admin/tasks/${taskId}/subtasks/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onSubtasksChange(subtasks.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  const handleEdit = async (id: string, title: string) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch(`/api/admin/tasks/${taskId}/subtasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        onSubtasksChange(
          subtasks.map((s) => (s.id === id ? { ...s, title } : s))
        );
      }
    } catch (error) {
      console.error('Failed to edit subtask:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Subtasks
            </CardTitle>
            <CardDescription>
              {completedCount} of {totalCount} completed
            </CardDescription>
          </div>
          {totalCount > 0 && (
            <div className="flex items-center gap-2 w-32">
              <Progress value={progressPercentage} className="h-2" />
              <span className="text-xs text-muted-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={subtasks.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1 group">
              {subtasks
                .sort((a, b) => a.order_index - b.order_index)
                .map((subtask) => (
                  <SortableSubtask
                    key={subtask.id}
                    subtask={subtask}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    readOnly={readOnly}
                  />
                ))}
            </div>
          </SortableContext>
        </DndContext>

        {!readOnly && (
          <div className="pt-2">
            {isAdding ? (
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Enter subtask title..."
                  className="flex-1 h-8"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSubtask();
                    if (e.key === 'Escape') {
                      setIsAdding(false);
                      setNewSubtaskTitle('');
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddSubtask}
                  disabled={isSubmitting || !newSubtaskTitle.trim()}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Add'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAdding(false);
                    setNewSubtaskTitle('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add subtask
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
