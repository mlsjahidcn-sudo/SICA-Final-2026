/**
 * Enhanced Add Application Dialog with react-hook-form and ProgressSteps
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { Loader2 } from "lucide-react";
import { IconPlus, IconChevronLeft, IconChevronRight, IconUser, IconSchool, IconFileText, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";

import { StudentSelectionStep } from "./add-application/student-selection-step";
import { ProgramSelectionStep } from "./add-application/program-selection-step";
import { DetailsStep } from "./add-application/details-step";
import { ReviewStep } from "./add-application/review-step";
import { applicationSchema } from "./add-application/validation-schema";
import type { ApplicationFormData, Student, Program } from "./add-application/types";

interface AddApplicationDialogProps {
  onApplicationAdded?: () => void;
  trigger?: React.ReactNode;
}

const STEPS = [
  { id: 1, title: "Select Student", description: "Choose applicant", icon: IconUser },
  { id: 2, title: "Select Program", description: "Choose or describe", icon: IconSchool },
  { id: 3, title: "Details", description: "Add information", icon: IconFileText },
  { id: 4, title: "Review", description: "Confirm & submit", icon: IconCheck },
];

export function AddApplicationDialog({ onApplicationAdded, trigger }: AddApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Form setup
  const methods = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      student_id: "",
      program_id: "",
      requested_university_program_note: "",
      intake: "",
      personal_statement: "",
      study_plan: "",
      notes: "",
      priority: 0,
    },
    mode: "onChange", // Validate on change for better UX
  });

  const { trigger: triggerValidation, getValues } = methods;

  // Fetch students
  const fetchStudents = useCallback(async (search: string) => {
    setIsFetching(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', '20');

      const response = await fetch(`/api/admin/students?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const transformed = (data.students || []).map((s: any) => ({
          id: s.id,
          user_id: s.user_id || s.id,
          nationality: s.nationality,
          users: {
            id: s.user_id || s.id,
            full_name: s.full_name || 'Unknown',
            email: s.email || '',
          },
        }));
        setStudents(transformed);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Fetch programs
  const fetchPrograms = useCallback(async (search: string) => {
    setIsFetching(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', '20');

      const response = await fetch(`/api/programs?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      fetchStudents("");
      fetchPrograms("");
    }
  }, [open, fetchStudents, fetchPrograms]);

  // Validate current step fields
  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: (keyof ApplicationFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate.push("student_id");
        break;
      case 2:
        fieldsToValidate.push("program_id", "requested_university_program_note");
        break;
      case 3:
        fieldsToValidate.push("intake", "personal_statement", "study_plan", "notes", "priority");
        break;
    }

    return await triggerValidation(fieldsToValidate);
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      toast.error("Please fix the errors before proceeding");
      return;
    }

    // Special validation for step 2
    if (currentStep === 2) {
      const values = getValues();
      if (!values.program_id && !values.requested_university_program_note) {
        toast.error("Please select a program or enter a custom request");
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = (stepId: number) => {
    // Only allow going back to completed steps
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    }
  };

  const handleSubmit = async () => {
    const isValid = await triggerValidation();
    if (!isValid) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const values = getValues();

      const response = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: values.student_id,
          program_id: values.program_id || null,
          requested_university_program_note: values.requested_university_program_note || null,
          intake: values.intake || null,
          personal_statement: values.personal_statement || null,
          study_plan: values.study_plan || null,
          notes: values.notes || null,
          priority: values.priority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create application');
      }

      toast.success('Application created successfully');
      setOpen(false);
      methods.reset();
      setCurrentStep(1);
      onApplicationAdded?.();
    } catch (error) {
      console.error('Error creating application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      methods.reset();
      setCurrentStep(1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Application
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Application</DialogTitle>
          <DialogDescription>
            Create a new application for a student. Follow the steps below.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <ProgressSteps
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          allowStepBack={true}
          variant="horizontal"
          size="md"
          showProgress={true}
        />

        <FormProvider {...methods}>
          <ScrollArea className="h-[400px] w-full pr-4">
            {/* Step 1: Select Student */}
            {currentStep === 1 && (
              <StudentSelectionStep
                students={students}
                onSearch={fetchStudents}
                isFetching={isFetching}
              />
            )}

            {/* Step 2: Select Program */}
            {currentStep === 2 && (
              <ProgramSelectionStep
                programs={programs}
                onSearch={fetchPrograms}
                isFetching={isFetching}
              />
            )}

            {/* Step 3: Details */}
            {currentStep === 3 && <DetailsStep />}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <ReviewStep
                students={students}
                programs={programs}
                onEditStep={setCurrentStep}
              />
            )}
          </ScrollArea>
        </FormProvider>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? () => handleOpenChange(false) : handleBack}
          >
            {currentStep === 1 ? (
              "Cancel"
            ) : (
              <>
                <IconChevronLeft className="mr-2 h-4 w-4" />
                Back
              </>
            )}
          </Button>
          {currentStep < 4 ? (
            <Button onClick={handleNext}>
              Next
              <IconChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Application
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
