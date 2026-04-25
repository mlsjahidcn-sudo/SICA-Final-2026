'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  IconX,
  IconTrash,
  IconCheck,
  IconUserPlus,
  IconDownload,
  IconChevronDown,
  IconLoader2,
} from '@tabler/icons-react';

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
  onAssign?: (userId: string) => void;
  onExport?: () => void;
  isLoading?: boolean;
  entityType: 'applications' | 'students';
  teamMembers?: Array<{ id: string; full_name: string }>;
  statusOptions?: Array<{ value: string; label: string }>;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDelete,
  onStatusChange,
  onAssign,
  onExport,
  isLoading = false,
  entityType,
  teamMembers = [],
  statusOptions = [],
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            {selectedCount} selected
          </Badge>
          {selectedCount < totalCount && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="text-xs h-7"
            >
              Select all {totalCount}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClearSelection}
            className="h-7 w-7"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Status Change - Applications only */}
          {entityType === 'applications' && onStatusChange && statusOptions.length > 0 && (
            <Select onValueChange={onStatusChange} disabled={isLoading}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Assign to Team Member */}
          {onAssign && teamMembers.length > 0 && (
            <Select onValueChange={onAssign} disabled={isLoading}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Export */}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isLoading}
              className="h-8"
            >
              <IconDownload className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}

          {/* Delete */}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isLoading}
              className="h-8"
            >
              {isLoading ? (
                <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <IconTrash className="h-4 w-4 mr-1" />
              )}
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
