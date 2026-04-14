'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  subtasks: { title: string; order: number }[];
  is_public: boolean;
}

interface TaskTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTemplate: (template: TaskTemplate) => Promise<void>;
}

const categories = [
  { value: 'application', label: 'Application' },
  { value: 'visa', label: 'Visa' },
  { value: 'interview', label: 'Interview' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'document', label: 'Document' },
  { value: 'general', label: 'General' },
];

export function TaskTemplateDialog({
  open,
  onOpenChange,
  onApplyTemplate,
}: TaskTemplateDialogProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch('/api/tasks/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const { templates } = await response.json();
        setTemplates(templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedTemplate) return;

    setApplying(true);
    try {
      await onApplyTemplate(selectedTemplate);
      toast.success(`Applied template: ${selectedTemplate.name}`);
      onOpenChange(false);
      setSelectedTemplate(null);
    } catch (error) {
      toast.error('Failed to apply template');
    } finally {
      setApplying(false);
    }
  };

  const filteredTemplates = templates;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Apply Task Template</DialogTitle>
          <DialogDescription>
            Select a template to quickly create tasks with pre-defined subtasks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Filter */}
          <Select onValueChange={() => {}}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Template List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No templates available
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{template.name}</span>
                        {template.is_public && (
                          <Badge variant="secondary" className="text-xs">Public</Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {categories.find((c) => c.value === template.category)?.label || template.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {template.subtasks.length} subtasks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Show subtasks preview when selected */}
                  {selectedTemplate?.id === template.id && template.subtasks.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Subtasks:</p>
                      <ul className="space-y-1">
                        {template.subtasks
                          .sort((a, b) => a.order - b.order)
                          .map((subtask, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]">
                                {index + 1}
                              </span>
                              {subtask.title}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!selectedTemplate || applying}>
            {applying && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
