/**
 * Utility functions for Partner Portal Students module
 */

import type { Student, StudentListItem, StudentProfile } from './types';

/**
 * Calculate profile completion percentage
 * Based on required fields for a complete student profile
 */
export function calculateProfileCompletion(profile: StudentProfile | undefined): number {
  if (!profile) return 0;

  // Required fields with weights
  const requiredFields: Array<{ key: keyof StudentProfile; weight: number }> = [
    // Personal Information (40%)
    { key: 'nationality', weight: 10 },
    { key: 'date_of_birth', weight: 5 },
    { key: 'gender', weight: 5 },
    { key: 'current_address', weight: 5 },
    { key: 'chinese_name', weight: 5 },
    
    // Passport Information (20%)
    { key: 'passport_number', weight: 10 },
    { key: 'passport_expiry_date', weight: 5 },
    { key: 'passport_issuing_country', weight: 5 },
    
    // Academic Information (25%)
    { key: 'education_history', weight: 15 },
    { key: 'highest_education', weight: 5 },
    { key: 'gpa', weight: 5 },
    
    // Language Skills (10%)
    { key: 'hsk_level', weight: 5 },
    { key: 'ielts_score', weight: 5 },
    
    // Emergency Contact (5%)
    { key: 'emergency_contact_name', weight: 2 },
    { key: 'emergency_contact_phone', weight: 2 },
    { key: 'emergency_contact_relationship', weight: 1 },
  ];

  let totalWeight = 0;
  let filledWeight = 0;

  for (const field of requiredFields) {
    totalWeight += field.weight;
    const value = profile[field.key];
    
    // Check if field has a value
    if (value !== null && value !== undefined && value !== '') {
      // For arrays, check if they have items
      if (Array.isArray(value)) {
        if (value.length > 0) {
          filledWeight += field.weight;
        }
      } else {
        filledWeight += field.weight;
      }
    }
  }

  return totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;
}

/**
 * Get completion badge color based on percentage
 */
export function getCompletionColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600 bg-green-50';
  if (percentage >= 50) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

/**
 * Get initials from full name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if student has complete profile for application
 */
export function hasCompleteProfile(student: Student | StudentListItem): boolean {
  const completion = calculateProfileCompletion(
    'profile' in student ? student.profile : undefined
  );
  return completion >= 80;
}

/**
 * Get missing required fields for profile completion
 */
export function getMissingFields(profile: StudentProfile | undefined): string[] {
  if (!profile) {
    return ['All profile fields'];
  }

  const missing: string[] = [];
  
  const requiredFieldLabels: Record<keyof StudentProfile, string> = {
    nationality: 'Nationality',
    date_of_birth: 'Date of Birth',
    gender: 'Gender',
    current_address: 'Current Address',
    passport_number: 'Passport Number',
    passport_expiry_date: 'Passport Expiry Date',
    education_history: 'Education History',
    emergency_contact_name: 'Emergency Contact Name',
    emergency_contact_phone: 'Emergency Contact Phone',
    hsk_level: 'HSK Level',
    ielts_score: 'IELTS Score',
    chinese_name: 'Chinese Name',
    postal_code: 'Postal Code',
    permanent_address: 'Permanent Address',
    marital_status: 'Marital Status',
    religion: 'Religion',
    emergency_contact_relationship: 'Emergency Contact Relationship',
    passport_issuing_country: 'Passport Issuing Country',
    work_experience: 'Work Experience',
    highest_education: 'Highest Education',
    institution_name: 'Institution Name',
    field_of_study: 'Field of Study',
    graduation_date: 'Graduation Date',
    gpa: 'GPA',
    hsk_score: 'HSK Score',
    toefl_score: 'TOEFL Score',
    family_members: 'Family Members',
    extracurricular_activities: 'Extracurricular Activities',
    awards: 'Awards',
    publications: 'Publications',
    research_experience: 'Research Experience',
    scholarship_application: 'Scholarship Application',
    financial_guarantee: 'Financial Guarantee',
    study_mode: 'Study Mode',
    funding_source: 'Funding Source',
    wechat_id: 'WeChat ID',
  };

  // Check critical fields
  const criticalFields: Array<keyof StudentProfile> = [
    'nationality',
    'date_of_birth',
    'passport_number',
    'education_history',
    'emergency_contact_name',
    'emergency_contact_phone',
  ];

  for (const field of criticalFields) {
    const value = profile[field];
    const isEmpty = value === null || value === undefined || value === '' ||
                    (Array.isArray(value) && value.length === 0);
    
    if (isEmpty) {
      missing.push(requiredFieldLabels[field]);
    }
  }

  return missing;
}

/**
 * Format application status for display
 */
export function formatApplicationStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    document_request: 'Document Request',
    interview_scheduled: 'Interview Scheduled',
    accepted: 'Accepted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };
  
  return statusMap[status] || status;
}
