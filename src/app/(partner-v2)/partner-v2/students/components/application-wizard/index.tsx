/**
 * Application Wizard - Main Container (Simplified 2-step)
 * Step 1: Select Degree & Program
 * Step 2: Details & Submit
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getValidToken } from '@/lib/auth-token';

import type {
  PartnerApplicationFormData,
  ProgramOption,
} from './types';
import {
  createEmptyFormData,
  WIZARD_STEPS,
  DEGREE_OPTIONS,
  TOTAL_STEPS,
} from './types';

import { SelectionStep } from './selection-step';
import { DetailsSubmitStep } from './details-submit-step';

// Step icon map (2 steps)
const STEP_ICONS: React.ComponentType<{ className?: string }>[] = [
  GraduationCap,
  CheckCircle2,
];

interface ApplicationWizardProps {
  studentId: string;
  studentName: string;
  userId: string;
}

export function ApplicationWizard({ studentId, studentName, userId }: ApplicationWizardProps) {
  const router = useRouter();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PartnerApplicationFormData>(createEmptyFormData());

  // Programs state for Step 1
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [isFetchingPrograms, setIsFetchingPrograms] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update a form field
  const updateField = useCallback(<K extends keyof PartnerApplicationFormData>(
    field: K,
    value: PartnerApplicationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Navigate to next/previous step
  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // Fetch programs when degree is selected and on Step 1
  useEffect(() => {
    if (formData.selectedDegree && currentStep >= 1) {
      fetchPrograms('');
    }
  }, [formData.selectedDegree, currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search mode state
  const [searchMode, setSearchMode] = useState<'program' | 'university'>('program');

  // Fetch programs from API
  // Accept explicit mode param to avoid closure issues with searchMode state
  const fetchPrograms = useCallback(async (search: string, mode?: 'program' | 'university') => {
    if (!formData.selectedDegree) return;

    setIsFetchingPrograms(true);
    try {
      const params = new URLSearchParams({
        degree_level: formData.selectedDegree,
        limit: '50',
      });
      if (search) {
        if (mode === 'university') {
          params.set('university_search', search);
        } else {
          params.set('search', search);
        }
      }

      const token = await getValidToken();
      const res = await fetch(`/api/programs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setIsFetchingPrograms(false);
    }
  }, [formData.selectedDegree]);

  // Toggle program selection (multi-select)
  const toggleProgram = useCallback((programId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedProgramIds: prev.selectedProgramIds.includes(programId)
        ? prev.selectedProgramIds.filter((id) => id !== programId)
        : [...prev.selectedProgramIds, programId],
    }));
  }, []);

  // Submit application(s) to API (simplified - no custom programs)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await getValidToken();

      if (formData.selectedProgramIds.length === 0) {
        throw new Error('No programs selected');
      }

      const body = {
        user_id: userId,
        selected_program_ids: formData.selectedProgramIds,
        intake: formData.intake,
        notes: formData.notes || undefined,
      };

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Submission failed' }));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const result = await res.json();
      const createdAppsCount = result.count || result.applications?.length || 0;

      if (createdAppsCount === 0) {
        throw new Error('No applications were created');
      }

      router.push(`/partner-v2/students/${studentId}?app_created=${createdAppsCount}`);
    } catch (err) {
      throw err; // Re-throw for error display in DetailsSubmitStep
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected program full objects for review
  const selectedProgramObjects = programs.filter((p) =>
    formData.selectedProgramIds.includes(p.id)
  );

  // Can proceed to next step?
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.selectedDegree && formData.selectedProgramIds.length > 0;
      default:
        return true;
    }
  };

  // Render current step content
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SelectionStep
            selectedDegree={formData.selectedDegree}
            selectedProgramIds={formData.selectedProgramIds}
            programs={programs}
            isFetchingPrograms={isFetchingPrograms}
            degrees={DEGREE_OPTIONS}
            onDegreeSelect={(deg) => updateField('selectedDegree', deg)}
            onSearchPrograms={(query) => fetchPrograms(query, searchMode)}
            onSearchModeChange={setSearchMode}
            searchMode={searchMode}
            onToggleProgram={toggleProgram}
          />
        );
      case 2:
        return (
          <DetailsSubmitStep
            formData={formData}
            selectedPrograms={selectedProgramObjects}
            studentName={studentName}
            isSubmitting={isSubmitting}
            onUpdateField={updateField}
            onSubmit={handleSubmit}
            onBack={goBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ===== TOP NAVIGATION BAR ===== */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Back button + Student name */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/partner-v2/students/${studentId}`}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-7" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-foreground leading-tight">New Application</p>
              <p className="text-xs text-muted-foreground">For {studentName}</p>
            </div>
          </div>

          {/* Right: Step progress indicator (2 steps) */}
          <nav className="flex items-center gap-1" aria-label="Wizard progress">
            {WIZARD_STEPS.map((stepConfig, idx) => {
              const stepNum = idx + 1;
              const isActive = stepNum === currentStep;
              const isCompleted = stepNum < currentStep;
              const StepIcon = STEP_ICONS[idx];

              return (
                <div key={stepConfig.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompleted || isActive) setCurrentStep(stepNum);
                    }}
                    disabled={!isCompleted && !isActive}
                    className={cn(
                      'group flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : isCompleted
                          ? 'text-primary hover:bg-muted cursor-pointer'
                          : 'text-muted-foreground/50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all border-2',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-110'
                          : isCompleted
                            ? 'border-primary bg-primary text-white'
                            : 'border-border bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={cn(
                      'text-[10px] font-medium hidden lg:block max-w-[80px] truncate',
                      isActive ? 'text-primary' : isCompleted ? 'text-primary/80' : 'text-muted-foreground/60'
                    )}>
                      {stepConfig.title}
                    </span>
                  </button>

                  {/* Connector line between steps */}
                  {idx < WIZARD_STEPS.length - 1 && (
                    <div
                      className={cn(
                        'hidden lg:block w-10 h-[2px] mx-0.5 rounded-full transition-colors',
                        idx < currentStep - 1 ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28">
        {/* Step title bar */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            {WIZARD_STEPS[currentStep - 1]?.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {WIZARD_STEPS[currentStep - 1]?.description}
            {' '}· Step {currentStep} of {TOTAL_STEPS}
          </p>
        </div>

        {/* Step content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {renderStep()}
        </div>
      </main>

      {/* ===== BOTTOM ACTION BAR (only show on Step 1) ===== */}
      {currentStep < TOTAL_STEPS && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t shadow-lg z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between py-4">
            {/* Left placeholder */}
            <div className="sm:w-[100px]" />

            {/* Right: Next button */}
            <Button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              size="lg"
              className={cn(
                'gap-2 min-w-[140px]',
                canProceed() && 'bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg shadow-primary/25'
              )}
            >
              Next
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
