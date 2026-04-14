'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tag, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

interface TaskLabelsProps {
  labels: TaskLabel[];
  selectedLabels: string[];
  onLabelsChange: (labelIds: string[]) => void;
  onCreateLabel?: (name: string, color: string) => Promise<TaskLabel>;
  onUpdateLabel?: (id: string, name: string, color: string) => Promise<void>;
  onDeleteLabel?: (id: string) => Promise<void>;
  readOnly?: boolean;
}

const defaultColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
  '#14b8a6', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#78716c', '#57534e',
];

export function TaskLabels({
  labels,
  selectedLabels,
  onLabelsChange,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  readOnly = false,
}: TaskLabelsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLabel, setEditingLabel] = useState<TaskLabel | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(defaultColors[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleLabel = (labelId: string) => {
    if (selectedLabels.includes(labelId)) {
      onLabelsChange(selectedLabels.filter((id) => id !== labelId));
    } else {
      onLabelsChange([...selectedLabels, labelId]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Label name is required');
      return;
    }

    if (!onCreateLabel) return;

    setIsSubmitting(true);
    try {
      const newLabel = await onCreateLabel(name.trim(), color);
      onLabelsChange([...selectedLabels, newLabel.id]);
      setShowCreateDialog(false);
      setName('');
      setColor(defaultColors[0]);
      toast.success('Label created');
    } catch (error) {
      toast.error('Failed to create label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingLabel || !name.trim()) return;
    if (!onUpdateLabel) return;

    setIsSubmitting(true);
    try {
      await onUpdateLabel(editingLabel.id, name.trim(), color);
      setEditingLabel(null);
      setName('');
      setColor(defaultColors[0]);
      toast.success('Label updated');
    } catch (error) {
      toast.error('Failed to update label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteLabel) return;
    if (!confirm('Are you sure you want to delete this label?')) return;

    try {
      await onDeleteLabel(id);
      onLabelsChange(selectedLabels.filter((labelId) => labelId !== id));
      toast.success('Label deleted');
    } catch (error) {
      toast.error('Failed to delete label');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Labels</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => {
          const isSelected = selectedLabels.includes(label.id);
          return (
            <div key={label.id} className="flex items-center gap-1">
              <Badge
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer"
                style={{
                  backgroundColor: isSelected ? label.color : 'transparent',
                  borderColor: label.color,
                  color: isSelected ? 'white' : label.color,
                }}
                onClick={() => handleToggleLabel(label.id)}
              >
                {label.name}
              </Badge>
              {!readOnly && onUpdateLabel && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    setEditingLabel(label);
                    setName(label.name);
                    setColor(label.color);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
        
        {!readOnly && onCreateLabel && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingLabel} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingLabel(null);
          setName('');
          setColor(defaultColors[0]);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLabel ? 'Edit Label' : 'Create Label'}</DialogTitle>
            <DialogDescription>
              {editingLabel ? 'Update the label details' : 'Create a new label for tasks'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Label name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {defaultColors.map((c) => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            {editingLabel && onDeleteLabel && (
              <Button variant="destructive" onClick={() => handleDelete(editingLabel.id)} className="mr-auto">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingLabel(null);
            }}>
              Cancel
            </Button>
            <Button onClick={editingLabel ? handleUpdate : handleCreate} disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingLabel ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
