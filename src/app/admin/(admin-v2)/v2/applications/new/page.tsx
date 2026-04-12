'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { IconArrowLeft, IconCheck, IconUser, IconSchool, IconFileText, IconCircleCheck } from '@tabler/icons-react';
import { toast } from 'sonner';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicationSchema, ApplicationFormData } from '@/components/admin/add-application/validation-schema';
import { StudentSelectionStep } from '@/components/admin/add-application/student-selection-step';
import { ProgramSelectionStep } from '@/components/admin/add-application/program-selection-step';
import { DetailsStep } from '@/components/admin/add-application/details-step';
import { ReviewStep } from '@/components/admin/add-application/review-step';
import { PageContainer, PageHeader } from '@/components/admin';
import { useAuth } from '@/contexts/auth-context';

const steps = [
  { id: 1, title: 'Select Student', description: 'Choose student applicant', icon: IconUser },
  { id: 2, title: 'Select Program', description: 'Choose target program', icon: IconSchool },
  { id: 3, title: 'Application Details', description: 'Fill in details', icon: IconFileText },
  { id: 4, title: 'Review & Submit', description: 'Confirm information', icon: IconCircleCheck },
];

export default function AdminAddApplicationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <PageContainer title="Add Application">
      <AddApplicationFormContent />
    </PageContainer>
  );
}

function AddApplicationFormContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Student search state
  const [students, setStudents] = useState<any[]>([]);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  
  // Program search state
  const [programs, setPrograms] = useState<any[]>([]);
  const [isFetchingPrograms, setIsFetchingPrograms] = useState(false);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      student_id: '',
      program_id: '',
      requested_university_program_note: '',
      intake: '',
      personal_statement: '',
      study_plan: '',
      notes: '',
      priority: 0,
    },
    mode: 'onChange',
  });

  const { trigger } = form;

  const fetchStudents = useCallback(async (search: string) => {
    setIsFetchingStudents(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');

      const response = await fetch(`/api/admin/students?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform the data to match expected Student type
        const transformedStudents = (data.students || []).map((user: any) => {
          // For users with accounts, get the student record from nested students array
          const studentRecord = Array.isArray(user.students) 
            ? user.students[0] 
            : user.students;
          
          // For applications, we need the student.id (from students table)
          // If no student record exists, this user doesn't have a student profile yet
          const studentId = studentRecord?.id || user.id;
          
          return {
            id: studentId,
            user_id: user.id,
            nationality: user.nationality || studentRecord?.nationality,
            users: {
              id: user.id,
              full_name: user.full_name || '',
              email: user.email || '',
            },
          };
        }).filter((s: any) => s.id); // Filter out any without a valid ID
        setStudents(transformedStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsFetchingStudents(false);
    }
  }, []);

  const fetchPrograms = useCallback(async (search: string) => {
    setIsFetchingPrograms(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');

      const response = await fetch(`/api/admin/programs?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setIsFetchingPrograms(false);
    }
  }, []);
  
  // Fetch students on mount
  useEffect(() => {
    fetchStudents('');
  }, [fetchStudents]);
  
  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms('');
  }, [fetchPrograms]);

  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: (keyof ApplicationFormData)[] = [];
    
    switch (step) {
      case 0:
        fieldsToValidate.push('student_id');
        break;
      case 1:
        fieldsToValidate.push('program_id');
        break;
      case 2:
        fieldsToValidate.push('intake', 'personal_statement', 'study_plan', 'priority');
        break;
    }

    if (fieldsToValidate.length > 0) {
      return await trigger(fieldsToValidate);
    }
    
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error('Please fill in all required fields correctly');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      toast.error('Please review your information');
      return;
    }

    setIsSubmitting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      if (!token) {
        toast.error('Please sign in first');
        router.push('/signin');
        return;
      }

      const formData = form.getValues();
      const response = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: formData.student_id,
          program_id: formData.program_id,
          requested_university_program_note: formData.requested_university_program_note || undefined,
          intake: formData.intake,
          personal_statement: formData.personal_statement,
          study_plan: formData.study_plan,
          notes: formData.notes || undefined,
          priority: formData.priority,
        }),
      });

      if (response.ok) {
        toast.success('Application created successfully!');
        router.push('/admin/v2/applications');
      } else {
        let errorMsg = 'Failed to create application';
        try {
          const errData = await response.json();
          errorMsg = errData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StudentSelectionStep
            students={students}
            onSearch={fetchStudents}
            isFetching={isFetchingStudents}
          />
        );
      case 1:
        return (
          <ProgramSelectionStep
            programs={programs}
            onSearch={fetchPrograms}
            isFetching={isFetchingPrograms}
          />
        );
      case 2:
        return <DetailsStep />;
      case 3:
        return (
          <ReviewStep
            students={students}
            programs={programs}
            onEditStep={(step) => setCurrentStep(step)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-6 md:p-6 md:pt-0">
      {/* Header */}
      <PageHeader
        title="Add New Application"
        description="Create a new student application with program and details"
        backHref="/admin/v2/applications"
        backLabel="Back to Applications"
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Application Information</CardTitle>
          <CardDescription>
            Complete all steps to create a new application. Required fields are marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Progress Steps */}
          <ProgressSteps
            steps={steps}
            currentStep={currentStep + 1}
            onStepClick={(step) => {
              const targetStep = step - 1;
              if (targetStep < currentStep) {
                setCurrentStep(targetStep);
              }
            }}
            className="mb-8"
          />

          {/* Form Content */}
          <FormProvider {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="min-h-[400px]">
                {renderStepContent()}
              </div>
            </form>
          </FormProvider>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/v2/applications')}
              >
                Cancel
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next Step
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <IconCheck className="h-4 w-4 mr-2" />
                  Create Application
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
