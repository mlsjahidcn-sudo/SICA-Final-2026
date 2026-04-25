'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { authFetch } from '@/lib/auth-token';
import type { StudentFormData } from '../lib/types';
import { createEmptyFormData } from '../lib/student-utils';

// Import tab components
import { PersonalTab } from './form-tabs/personal-tab';
import { PassportTab } from './form-tabs/passport-tab';
import { AcademicTab } from './form-tabs/academic-tab';
import { FamilyTab } from './form-tabs/family-tab';

interface StudentFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<StudentFormData>;
  studentId?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

/** Normalize API error details (Zod fieldErrors format: { field: ["msg"] }) to flat string format */
function normalizeApiErrors(details: Record<string, unknown> | string): ValidationErrors {
  const normalized: ValidationErrors = {};
  
  // Handle case where details is a string (not an object)
  if (typeof details === 'string') {
    normalized._general = details;
    return normalized;
  }
  
  for (const [field, value] of Object.entries(details)) {
    if (Array.isArray(value)) {
      normalized[field] = value[0] || 'Invalid value';
    } else if (typeof value === 'string') {
      normalized[field] = value;
    } else {
      normalized[field] = String(value);
    }
  }
  return normalized;
}

export function StudentForm({ mode, initialData, studentId }: StudentFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<StudentFormData>({
    ...createEmptyFormData(),
    ...initialData,
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Clear validation errors when user starts typing
  const updateField = <K extends keyof StudentFormData>(field: K, value: StudentFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user modifies it
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Required fields validation - only email and full_name required
  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.full_name?.trim()) {
      errors.full_name = 'Full name is required';
    }

    return errors;
  };

  // Navigate to first tab with errors
  const navigateToFirstError = (errors: ValidationErrors) => {
    const errorFieldToTab: Record<string, string> = {
      email: 'personal',
      full_name: 'personal',
      phone: 'personal',
      nationality: 'personal',
      date_of_birth: 'personal',
      gender: 'personal',
      chinese_name: 'personal',
      marital_status: 'personal',
      religion: 'personal',
      current_address: 'personal',
      permanent_address: 'personal',
      postal_code: 'personal',
      city: 'personal',
      country: 'personal',
      wechat_id: 'personal',
      emergency_contact_name: 'personal',
      emergency_contact_phone: 'personal',
      emergency_contact_relationship: 'personal',
      passport_number: 'passport',
      passport_expiry_date: 'passport',
      passport_issuing_country: 'passport',
    };

    const firstErrorField = Object.keys(errors)[0];
    const tab = errorFieldToTab[firstErrorField] || 'personal';
    setActiveTab(tab);
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);

    // Client-side validation first
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix the validation errors before submitting');
      navigateToFirstError(errors);
      return;
    }

    setLoading(true);
    setValidationErrors({});

    try {
      if (mode === 'create') {
        const response = await authFetch('/api/partner/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 409) {
            toast.error('A student with this email already exists. Please use a different email.');
            setValidationErrors({ email: 'This email is already registered' });
          } else if (result.details) {
            const normalized = normalizeApiErrors(result.details);
            setValidationErrors(normalized);
            if (normalized._general) {
              toast.error(normalized._general);
            } else {
              const errorCount = Object.keys(normalized).length;
              toast.error(`Validation failed: ${errorCount} field${errorCount > 1 ? 's' : ''} need correction`);
              navigateToFirstError(normalized);
            }
          } else {
            toast.error(result.error || 'Failed to create student');
          }
          return;
        }

        toast.success('Student created successfully!');
        router.push('/partner-v2/students');
      } else if (studentId) {
        const response = await authFetch(`/api/partner/students/${studentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.details) {
            const normalized = normalizeApiErrors(result.details);
            setValidationErrors(normalized);
            const errorCount = Object.keys(normalized).length;
            toast.error(`Validation failed: ${errorCount} field${errorCount > 1 ? 's' : ''} need correction`);
            navigateToFirstError(normalized);
          } else {
            toast.error(result.error || 'Failed to update student');
          }
          return;
        }

        toast.success('Student updated successfully!');
        router.push('/partner-v2/students');
      }
    } catch (error: unknown) {
      console.error('Student form submission error:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      onSubmit={(e) => { 
        e.preventDefault(); 
        handleSubmit(); 
      }} 
      className="space-y-6"
    >
      {/* Error Summary Banner */}
      {submitAttempted && Object.keys(validationErrors).length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive mb-2">
                {validationErrors._general ? 'Error' : 'Please correct the following errors:'}
              </h4>
              {validationErrors._general ? (
                <p className="text-sm text-destructive/80">{validationErrors._general}</p>
              ) : (
                <ul className="text-sm text-destructive/80 space-y-1">
                  {Object.entries(validationErrors).slice(0, 5).map(([field, message]) => (
                    <li key={field}>
                      <span className="font-medium capitalize">{field.replace(/_/g, ' ')}:</span>{' '}
                      {message}
                    </li>
                  ))}
                  {Object.keys(validationErrors).length > 5 && (
                    <li className="text-muted-foreground">
                      ... and {Object.keys(validationErrors).length - 5} more error(s)
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === 'create' ? 'Add New Student' : 'Edit Student'}
          </h2>
          <p className="text-muted-foreground">
            Fill in student information. Only email and full name are required.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Saving...' : mode === 'create' ? 'Create Student' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Tabbed Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:flex lg:flex-wrap lg:justify-start lg:w-auto">
          <TabsTrigger value="personal" className="text-xs sm:text-sm">Personal</TabsTrigger>
          <TabsTrigger value="passport" className="text-xs sm:text-sm">Passport</TabsTrigger>
          <TabsTrigger value="academic" className="text-xs sm:text-sm">Academic</TabsTrigger>
          <TabsTrigger value="family" className="text-xs sm:text-sm">Family</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="pt-6">
            <TabsContent value="personal" className="mt-0">
              <PersonalTab formData={formData} updateField={updateField} errors={validationErrors} />
            </TabsContent>

            <TabsContent value="passport" className="mt-0">
              <PassportTab formData={formData} updateField={updateField} errors={validationErrors} />
            </TabsContent>

            <TabsContent value="academic" className="mt-0">
              <AcademicTab formData={formData} updateField={updateField} />
            </TabsContent>

            <TabsContent value="family" className="mt-0">
              <FamilyTab formData={formData} updateField={updateField} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 z-10 flex justify-end gap-3 bg-background p-4 border-t rounded-lg shadow-lg">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Create Student' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
