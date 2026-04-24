'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Filter, Calendar, Search, RotateCcw } from 'lucide-react';

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

export function TaskFilters({ onFilterChange, users = [], labels = [] }: TaskFiltersProps) {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <RotateCcw className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <Select value={filters.status || 'all'} onValueChange={(v) => handleFilterUpdate('status', v)}>
              <SelectTrigger className="h-8"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
            <Select value={filters.priority || 'all'} onValueChange={(v) => handleFilterUpdate('priority', v)}>
              <SelectTrigger className="h-8"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {priorities.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Assignee</label>
            <Select value={filters.assigneeId || 'all'} onValueChange={(v) => handleFilterUpdate('assigneeId', v)}>
              <SelectTrigger className="h-8"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 w-full justify-start">
                  <Calendar className="h-3 w-3 mr-2" />
                  {filters.dateFrom || filters.dateTo ? 'Range set' : 'Select'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="dateFrom">From</Label>
                    <Input id="dateFrom" type="date" value={filters.dateFrom || ''}
                      onChange={(e) => handleFilterUpdate('dateFrom', e.target.value || undefined)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="dateTo">To</Label>
                    <Input id="dateTo" type="date" value={filters.dateTo || ''}
                      onChange={(e) => handleFilterUpdate('dateTo', e.target.value || undefined)} className="mt-1" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {labels.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Labels</label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const isSelected = filters.labels?.includes(label.id);
                return (
                  <Badge key={label.id} variant={isSelected ? 'default' : 'outline'} className="cursor-pointer"
                    style={{ backgroundColor: isSelected ? label.color : 'transparent', borderColor: label.color, color: isSelected ? 'white' : label.color }}
                    onClick={() => {
                      const currentLabels = filters.labels || [];
                      const newLabels = currentLabels.includes(label.id) ? currentLabels.filter((l) => l !== label.id) : [...currentLabels, label.id];
                      handleFilterUpdate('labels', newLabels.length > 0 ? (newLabels as unknown as string) : undefined);
                    }}>
                    {label.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
