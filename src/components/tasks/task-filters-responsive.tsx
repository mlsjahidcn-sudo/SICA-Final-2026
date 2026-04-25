'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Filter,
  Calendar,
  Search,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  onFilterChange: (filters: TaskFilters) => void;
  users?: { id: string; full_name?: string; email?: string }[];
  labels?: { id: string; name: string; color: string }[];
}

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dateFrom?: string;
  dateTo?: string;
  labels?: string[];
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

export function TaskFiltersResponsive({ onFilterChange, users = [], labels = [] }: TaskFiltersProps) {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const handleFilterUpdate = (key: keyof TaskFilters, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value && value !== 'all') {
      (newFilters as Record<string, unknown>)[key] = value;
    } else {
      delete (newFilters as Record<string, unknown>)[key];
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    handleFilterUpdate('search', value || undefined);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchInput('');
    onFilterChange({});
  };

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'all').length;

  // Compact filter chips for active filters
  const renderActiveFilterChips = () => {
    const chips: { key: string; label: string; value: string }[] = [];

    if (filters.status) {
      const status = statuses.find((s) => s.value === filters.status);
      if (status) chips.push({ key: 'status', label: 'Status', value: status.label });
    }
    if (filters.priority) {
      const priority = priorities.find((p) => p.value === filters.priority);
      if (priority) chips.push({ key: 'priority', label: 'Priority', value: priority.label });
    }
    if (filters.assigneeId) {
      if (filters.assigneeId === 'unassigned') {
        chips.push({ key: 'assigneeId', label: 'Assignee', value: 'Unassigned' });
      } else {
        const user = users.find((u) => u.id === filters.assigneeId);
        if (user) chips.push({ key: 'assigneeId', label: 'Assignee', value: user.full_name || user.email || '' });
      }
    }
    if (filters.dateFrom || filters.dateTo) {
      chips.push({ key: 'date', label: 'Date', value: 'Range set' });
    }

    return chips;
  };

  const activeChips = renderActiveFilterChips();

  return (
    <Card className="overflow-hidden">
      {/* Mobile: Collapsible header */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-0">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full py-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllFilters();
                    }}
                    className="h-7 px-2"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground md:hidden" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground md:hidden" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-4 space-y-4">
            {/* Search - always visible */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Active filter chips - mobile */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 md:hidden">
                {activeChips.map((chip) => (
                  <Badge
                    key={chip.key}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <span className="text-xs text-muted-foreground">{chip.label}:</span>
                    <span className="text-xs">{chip.value}</span>
                    <button
                      onClick={() => handleFilterUpdate(chip.key as keyof TaskFilters, undefined)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Filter Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Status */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Status
                </label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(v) => handleFilterUpdate('status', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Priority
                </label>
                <Select
                  value={filters.priority || 'all'}
                  onValueChange={(v) => handleFilterUpdate('priority', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Assignee
                </label>
                <Select
                  value={filters.assigneeId || 'all'}
                  onValueChange={(v) => handleFilterUpdate('assigneeId', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Due Date
                </label>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 w-full justify-start font-normal">
                      <Calendar className="h-3.5 w-3.5 mr-2" />
                      {filters.dateFrom || filters.dateTo ? 'Range set' : 'Select range'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Date Range</h4>
                        <p className="text-xs text-muted-foreground">
                          Filter tasks by due date range
                        </p>
                      </div>
                      <div className="grid gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="dateFrom">From</Label>
                          <Input
                            id="dateFrom"
                            type="date"
                            value={filters.dateFrom || ''}
                            onChange={(e) =>
                              handleFilterUpdate('dateFrom', e.target.value || undefined)
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="dateTo">To</Label>
                          <Input
                            id="dateTo"
                            type="date"
                            value={filters.dateTo || ''}
                            onChange={(e) =>
                              handleFilterUpdate('dateTo', e.target.value || undefined)
                            }
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => setDatePopoverOpen(false)}
                      >
                        Apply
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Labels */}
            {labels.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Labels
                </label>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => {
                    const isSelected = filters.labels?.includes(label.id);
                    return (
                      <Badge
                        key={label.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isSelected ? label.color : 'transparent',
                          borderColor: label.color,
                          color: isSelected ? 'white' : label.color,
                        }}
                        onClick={() => {
                          const currentLabels = filters.labels || [];
                          const newLabels = currentLabels.includes(label.id)
                            ? currentLabels.filter((l) => l !== label.id)
                            : [...currentLabels, label.id];
                          handleFilterUpdate(
                            'labels',
                            newLabels.length > 0 ? (newLabels as unknown as string) : undefined
                          );
                        }}
                      >
                        {label.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
