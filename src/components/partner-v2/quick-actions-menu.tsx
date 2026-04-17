'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconCopy,
  IconExternalLink,
  IconArrowRight,
  IconFileText,
  IconMail,
  IconCalendar,
  IconSend,
  IconCheck,
  IconX,
} from '@tabler/icons-react';

interface QuickAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  onClick?: () => void;
}

interface QuickActionGroup {
  id: string;
  label: string;
  actions: QuickAction[];
}

interface QuickActionsMenuProps {
  trigger?: React.ReactNode;
  actions?: (QuickAction | QuickActionGroup)[];
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
  onDuplicate?: () => void;
  onEmail?: () => void;
  onScheduleMeeting?: () => void;
  entityType?: 'application' | 'student' | 'document';
  statusOptions?: Array<{ value: string; label: string }>;
  align?: 'start' | 'center' | 'end';
}

export function QuickActionsMenu({
  trigger,
  actions,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
  onEmail,
  onScheduleMeeting,
  entityType = 'application',
  statusOptions = [],
  align = 'end',
}: QuickActionsMenuProps) {
  // Default actions based on entity type
  const defaultActions: (QuickAction | QuickActionGroup)[] = actions || buildDefaultActions(
    entityType,
    { onView, onEdit, onDelete, onStatusChange, onDuplicate, onEmail, onScheduleMeeting },
    statusOptions
  );

  const renderAction = (action: QuickAction) => (
    <DropdownMenuItem
      key={action.id}
      onClick={action.onClick}
      disabled={action.disabled}
      className={action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
    >
      {action.icon}
      <span className="ml-2">{action.label}</span>
      {action.shortcut && (
        <span className="ml-auto text-xs text-muted-foreground">{action.shortcut}</span>
      )}
    </DropdownMenuItem>
  );

  const renderItem = (item: QuickAction | QuickActionGroup) => {
    if ('actions' in item) {
      // It's a group with sub-actions
      return (
        <DropdownMenuSub key={item.id}>
          <DropdownMenuSubTrigger>
            <span>{item.label}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {item.actions.map(renderAction)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }
    return renderAction(item);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon-sm">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        {defaultActions.map((item, index) => {
          // Check if we need a separator before this item
          const needsSeparator = index > 0 && 
            ('id' in defaultActions[index - 1] && 
             !('actions' in defaultActions[index - 1]) && 
             'actions' in item);

          return (
            <React.Fragment key={'id' in item ? item.id : item.id}>
              {needsSeparator && <DropdownMenuSeparator />}
              {renderItem(item)}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildDefaultActions(
  entityType: string,
  handlers: {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onStatusChange?: (status: string) => void;
    onDuplicate?: () => void;
    onEmail?: () => void;
    onScheduleMeeting?: () => void;
  },
  statusOptions: Array<{ value: string; label: string }>
): (QuickAction | QuickActionGroup)[] {
  const actions: (QuickAction | QuickActionGroup)[] = [];

  if (entityType === 'application') {
    if (handlers.onView) {
      actions.push({
        id: 'view',
        label: 'View Details',
        icon: <IconEye className="h-4 w-4" />,
        shortcut: 'V',
        onClick: handlers.onView,
      });
    }

    if (handlers.onEdit) {
      actions.push({
        id: 'edit',
        label: 'Edit',
        icon: <IconEdit className="h-4 w-4" />,
        shortcut: 'E',
        onClick: handlers.onEdit,
      });
    }

    if (handlers.onStatusChange && statusOptions.length > 0) {
      actions.push({
        id: 'status-group',
        label: 'Change Status',
        actions: statusOptions.map((opt) => ({
          id: `status-${opt.value}`,
          label: opt.label,
          icon: <IconArrowRight className="h-4 w-4" />,
          onClick: () => handlers.onStatusChange!(opt.value),
        })),
      });
    }

    if (handlers.onScheduleMeeting) {
      actions.push({
        id: 'schedule',
        label: 'Schedule Meeting',
        icon: <IconCalendar className="h-4 w-4" />,
        onClick: handlers.onScheduleMeeting,
      });
    }

    if (handlers.onEmail) {
      actions.push({
        id: 'email',
        label: 'Send Email',
        icon: <IconMail className="h-4 w-4" />,
        onClick: handlers.onEmail,
      });
    }

    if (handlers.onDuplicate) {
      actions.push({
        id: 'duplicate',
        label: 'Duplicate',
        icon: <IconCopy className="h-4 w-4" />,
        onClick: handlers.onDuplicate,
      });
    }

    if (handlers.onDelete) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        icon: <IconTrash className="h-4 w-4" />,
        variant: 'destructive',
        onClick: handlers.onDelete,
      });
    }
  } else if (entityType === 'student') {
    if (handlers.onView) {
      actions.push({
        id: 'view',
        label: 'View Profile',
        icon: <IconEye className="h-4 w-4" />,
        onClick: handlers.onView,
      });
    }

    if (handlers.onEdit) {
      actions.push({
        id: 'edit',
        label: 'Edit',
        icon: <IconEdit className="h-4 w-4" />,
        onClick: handlers.onEdit,
      });
    }

    if (handlers.onEmail) {
      actions.push({
        id: 'email',
        label: 'Send Email',
        icon: <IconMail className="h-4 w-4" />,
        onClick: handlers.onEmail,
      });
    }

    if (handlers.onDelete) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        icon: <IconTrash className="h-4 w-4" />,
        variant: 'destructive',
        onClick: handlers.onDelete,
      });
    }
  } else if (entityType === 'document') {
    if (handlers.onView) {
      actions.push({
        id: 'view',
        label: 'View Document',
        icon: <IconEye className="h-4 w-4" />,
        onClick: handlers.onView,
      });
    }

    if (handlers.onStatusChange) {
      actions.push({
        id: 'verify',
        label: 'Verify',
        icon: <IconCheck className="h-4 w-4" />,
        onClick: () => handlers.onStatusChange!('verified'),
      });

      actions.push({
        id: 'reject',
        label: 'Reject',
        icon: <IconX className="h-4 w-4" />,
        variant: 'destructive',
        onClick: () => handlers.onStatusChange!('rejected'),
      });
    }

    if (handlers.onDelete) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        icon: <IconTrash className="h-4 w-4" />,
        variant: 'destructive',
        onClick: handlers.onDelete,
      });
    }
  }

  return actions;
}
