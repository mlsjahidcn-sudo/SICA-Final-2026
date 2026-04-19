/**
 * Step 1: Select Degree & Program
 * Merges degree cards + searchable program list into one simplified step.
 * No preview panel, no custom mode, no complex debounce timers.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  GraduationCap,
  Award,
  Gem,
  Library,
  ScrollText,
  Languages,
  CheckCircle2,
  Search,
  School,
  Building2,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import type { ProgramOption, DegreeOption } from './types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen: GraduationCap,
  Award,
  Gem,
  Library,
  ScrollText,
  Languages,
  GraduationCap,
};

interface SelectionStepProps {
  selectedDegree: string | null;
  selectedProgramIds: string[];
  programs: ProgramOption[];
  isFetchingPrograms: boolean;
  degrees: DegreeOption[];
  onDegreeSelect: (degree: string) => void;
  onSearchPrograms: (query: string, mode?: 'program' | 'university') => void;
  onSearchModeChange: (mode: 'program' | 'university') => void;
  searchMode: 'program' | 'university';
  onToggleProgram: (programId: string) => void;
}

export function SelectionStep({
  selectedDegree,
  selectedProgramIds,
  programs,
  isFetchingPrograms,
  degrees,
  onDegreeSelect,
  onSearchPrograms,
  onSearchModeChange,
  searchMode,
  onToggleProgram,
}: SelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use ref to store stable callback reference to avoid debounce flickering
  const onSearchProgramsRef = useRef(onSearchPrograms);
  onSearchProgramsRef.current = onSearchPrograms;

  const handleSearchModeChange = (mode: 'program' | 'university') => {
    if (mode !== searchMode) {
      onSearchModeChange(mode);
      setSearchQuery('');
      // Trigger empty search with new mode to reload
      onSearchProgramsRef.current('', mode);
    }
  };

  // Debounced search - use ref for stable callback, searchMode in deps only triggers on actual mode change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        onSearchProgramsRef.current(searchQuery, searchMode);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, searchMode]); // searchMode here only triggers on actual mode change, not onSearchPrograms ref changes

  const selectedDegreeLabel = degrees.find(d => d.value === selectedDegree)?.label || selectedDegree;

  return (
    <div className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
      {/* ===== DEGREE SELECTION ===== */}
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-3">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-xl font-bold text-foreground">Select Academic Level</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            Choose the target degree level to filter available programs.
          </p>
        </div>

        {/* Degree cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {degrees.map((degree) => {
            const isSelected = selectedDegree === degree.value;
            const IconComponent = ICON_MAP[degree.icon] || GraduationCap;

            return (
              <button
                key={degree.value}
                type="button"
                onClick={() => onDegreeSelect(degree.value)}
                className={cn(
                  'relative group rounded-xl border-2 p-5 transition-all duration-300',
                  'hover:shadow-lg hover:-translate-y-0.5',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]'
                    : 'border-border bg-card hover:border-primary/40 bg-gradient-to-b from-white to-muted/30'
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors',
                    `bg-gradient-to-br ${degree.color}`,
                    isSelected ? 'text-white shadow-md' : 'text-white/90 group-hover:shadow-md'
                  )}
                >
                  <IconComponent className="h-6 w-6" />
                </div>

                <div className="text-left">
                  <p className={cn('font-semibold text-sm leading-tight mb-1', isSelected ? 'text-primary' : 'text-foreground')}>
                    {degree.label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{degree.description}</p>
                </div>

                {isSelected && (
                  <div className="absolute inset-0 rounded-xl bg-primary/[0.03] pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {selectedDegree && (
          <p className="text-center text-sm text-primary font-medium animate-in fade-in duration-300">
            Selected: <span className="font-bold">{selectedDegreeLabel}</span>
          </p>
        )}
      </div>

      {/* Separator */}
      <div className="border-t" />

      {/* ===== PROGRAM SEARCH & SELECTION ===== */}
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <School className="h-5 w-5 text-primary" />
              Choose Programs
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {selectedDegreeLabel ? `${selectedDegreeLabel} programs` : 'Select a degree first'}
              {selectedProgramIds.length > 0 && <span className="text-primary font-medium ml-1">· {selectedProgramIds.length} selected</span>}
            </p>
          </div>
        </div>

        {/* Search mode toggle + Search bar */}
        <div className="space-y-3">
          {/* Segmented Toggle: Program | University */}
          {selectedDegree && (
            <div className="flex bg-muted/50 rounded-lg p-1 w-fit mx-auto">
              {([
                { value: 'program' as const, label: 'Program', icon: GraduationCap },
                { value: 'university' as const, label: 'University', icon: Building2 },
              ]).map((option) => {
                const isSelected = searchMode === option.value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSearchModeChange(option.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      isSelected
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                searchMode === 'university'
                  ? 'Search by university name...'
                  : 'Search by program name or major...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedDegree}
              className="pl-10 pr-10 h-11 bg-background border-input focus:ring-2 focus:ring-primary/30 transition-shadow disabled:opacity-50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Programs list */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto divide-y">
            {!selectedDegree ? (
              <div className="flex items-center justify-center py-12 text-center px-6">
                <GraduationCap className="h-10 w-10 text-muted-foreground/40 mb-3 block mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">Please select a degree above first</p>
              </div>
            ) : isFetchingPrograms ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Loading programs...</span>
              </div>
            ) : programs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <School className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No programs found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term</p>
              </div>
            ) : (
              programs.map((program) => {
                const isSelected = selectedProgramIds.includes(program.id);
                const uni = program.universities;

                return (
                  <div
                    key={program.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onToggleProgram(program.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleProgram(program.id);
                      }
                    }}
                    className={cn(
                      'w-full flex items-start gap-2 md:gap-3 p-3 md:p-4 transition-colors text-left cursor-pointer',
                      'hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30',
                      isSelected && 'bg-primary/5 border-l-2 md:border-l-4 border-l-primary'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleProgram(program.id)}
                      className="mt-1 md:mt-0.5 shrink-0"
                    />

                    {/* University logo */}
                    <div className="shrink-0">
                      {uni?.logo_url ? (
                        <img src={uni.logo_url} alt={uni.name_en || ''} className="w-9 h-9 md:w-10 md:h-10 rounded-lg object-cover border border-border/50" />
                      ) : (
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                          <School className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Program info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-sm md:text-sm font-medium truncate', isSelected ? 'text-primary' : 'text-foreground')}>
                            {program.name || program.name_en || program.major || 'Unnamed Program'}
                          </p>
                          <div className="flex items-center gap-1.5 md:gap-2 mt-1 flex-wrap">
                            {uni?.name_en && (
                              <span className="text-xs text-muted-foreground truncate max-w-[120px] md:max-w-[160px]">{uni.name_en}</span>
                            )}
                            {program.degree_level && (
                              <Badge variant="secondary" className="text-[10px] md:text-[10px] px-1.5 py-0">{program.degree_level}</Badge>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selection count footer */}
          {selectedProgramIds.length > 0 && (
            <div className="px-3 md:px-4 py-2.5 md:py-3 bg-primary/5 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-xs md:text-sm font-medium text-primary flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {selectedProgramIds.length} program{selectedProgramIds.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => selectedProgramIds.forEach(id => onToggleProgram(id))}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
