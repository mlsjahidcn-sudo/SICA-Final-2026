/**
 * Step 2: Details & Submit
 * Improved responsive UI with modern card design.
 */

'use client';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  FileText,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  School,
} from 'lucide-react';
import type { PartnerApplicationFormData, ProgramOption } from './types';
import { getIntakeOptions, DEGREE_OPTIONS } from './types';

interface DetailsSubmitStepProps {
  formData: PartnerApplicationFormData;
  selectedPrograms: ProgramOption[];
  studentName: string;
  isSubmitting: boolean;
  onUpdateField: <K extends keyof PartnerApplicationFormData>(field: K, value: PartnerApplicationFormData[K]) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function DetailsSubmitStep({
  formData,
  selectedPrograms,
  studentName,
  isSubmitting,
  onUpdateField,
  onSubmit,
  onBack,
}: DetailsSubmitStepProps) {
  const intakeOptions = getIntakeOptions();
  const hasSelection = formData.selectedProgramIds.length > 0;
  const canSubmit = hasSelection && !!formData.intake?.trim();

  const selectedDegreeLabel = DEGREE_OPTIONS.find(d => d.value === formData.selectedDegree)?.label || formData.selectedDegree;

  return (
    <div className="space-y-4 md:space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl md:text-xl font-bold text-foreground">Review & Submit</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Confirm details for <span className="font-medium text-foreground">{studentName}</span>
        </p>
      </div>

      {/* ===== SUMMARY CARD ===== */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 md:px-6 py-4 border-b">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Application Summary
          </h3>
        </div>

        <div className="p-3 md:p-4 space-y-3">
          {/* Quick stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Degree */}
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Degree</p>
              <Badge variant="secondary" className="text-xs md:text-sm font-medium">
                {selectedDegreeLabel || '—'}
              </Badge>
            </div>

            {/* Programs count */}
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Programs</p>
              <p className={cn(
                "text-lg md:text-xl font-bold",
                hasSelection ? "text-primary" : "text-muted-foreground"
              )}>
                {formData.selectedProgramIds.length}
              </p>
            </div>

            {/* Intake */}
            <div className="col-span-2 bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Intake</p>
              <p className={cn(
                "text-sm font-semibold truncate",
                formData.intake ? "text-foreground" : "text-muted-foreground italic"
              )}>
                {formData.intake || 'Not set'}
              </p>
            </div>
          </div>

          {/* Selected program names preview */}
          {selectedPrograms.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Selected Programs</p>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 md:max-h-32 overflow-y-auto">
                {selectedPrograms.map((p) => (
                  <Badge 
                    key={p.id} 
                    variant="outline" 
                    className="text-xs md:text-sm px-2 py-1 bg-background border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                  >
                    <School className="h-3 w-3 mr-1" />
                    {p.name || p.name_en || p.major || 'Unnamed'}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Validation warnings */}
          {(!hasSelection || !formData.intake?.trim()) && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="space-y-1">
                {!hasSelection && (
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">No programs selected</p>
                )}
                {!formData.intake?.trim() && (
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Intake period is required</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== INTAKE & NOTES FORM ===== */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Application Details
          </h3>
        </div>

        <div className="p-3 md:p-4 space-y-4">
          {/* Intake selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Intake Period
              <span className="text-xs font-normal text-destructive">*</span>
            </label>

            {/* Intake chips - responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {intakeOptions.map((opt) => {
                const isSelected = formData.intake === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateField('intake', opt.value)}
                    className={cn(
                      'relative px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200',
                      'hover:shadow-md hover:-translate-y-0.5',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : opt.isUpcoming
                          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:border-emerald-400'
                          : 'border-border bg-card text-foreground hover:border-primary/40'
                    )}
                  >
                    <span className="block truncate">{opt.label}</span>
                    {opt.isUpcoming && (
                      <span className="absolute -top-1 -right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-semibold">
                        NEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom intake input */}
            <div className="relative">
              <Input
                placeholder="Or type custom intake, e.g., Fall 2027"
                value={formData.intake}
                onChange={(e) => onUpdateField('intake', e.target.value)}
                className="pr-16"
              />
              {formData.intake && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateField('intake', '')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Additional Notes</label>
            <Textarea
              placeholder="Any internal notes, special requests, or comments for the review team..."
              rows={3}
              value={formData.notes}
              onChange={(e) => onUpdateField('notes', e.target.value)}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground/70">These notes are for internal partner team reference only</p>
          </div>
        </div>
      </div>

      {/* ===== SUBMIT ACTIONS ===== */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto gap-2 h-11"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          size="lg"
          className={cn(
            'w-full sm:w-auto gap-2 min-w-[200px] h-11 transition-all duration-300',
            canSubmit && !isSubmitting && 'bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" /> 
              <span>Submit Application</span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Help text */}
      {!canSubmit && (
        <p className="text-center text-xs text-muted-foreground">
          {hasSelection ? 'Select an intake period to continue' : 'Select at least one program to continue'}
        </p>
      )}
    </div>
  );
}
