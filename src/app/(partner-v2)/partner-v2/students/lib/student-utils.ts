/**
 * Utility functions for Partner Portal Students Module
 */

import type {
  PartnerStudentDetail,
  StudentFormData,
  EducationHistoryEntry,
  WorkExperienceEntry,
  FamilyMemberEntry,
  StudentProfile,
} from './types';
import { NATIONALITIES } from './types';

// ==================== Form Data Helpers ====================

/**
 * Create empty form data for new student creation
 */
export function createEmptyFormData(): StudentFormData {
  return {
    email: '',
    full_name: '',
    phone: '',
    nationality: '',
    date_of_birth: '',
    gender: undefined,
    chinese_name: '',
    marital_status: undefined,
    religion: '',
    current_address: '',
    permanent_address: '',
    postal_code: '',
    city: '',
    country: '',
    wechat_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    passport_number: '',
    passport_expiry_date: '',
    passport_issuing_country: '',
    education_history: [],
    work_experience: [],
    highest_education: '',
    institution_name: '',
    field_of_study_legacy: '',
    graduation_date: '',
    gpa_legacy: '',
    hsk_level: undefined,
    hsk_score: undefined,
    ielts_score: '',
    toefl_score: undefined,
    family_members: [],
    extracurricular_activities: [],
    awards: [],
    publications: [],
    research_experience: [],
    study_mode: undefined,
    funding_source: undefined,
    scholarship_application: undefined,
    financial_guarantee: undefined,
    skip_user_creation: true,
  };
}

/**
 * Map student detail data to form format for editing
 */
export function studentDetailToFormData(student: PartnerStudentDetail): StudentFormData {
  return {
    email: student.email || '',
    full_name: student.full_name || '',
    phone: student.phone || '',
    nationality: student.nationality || '',
    date_of_birth: student.date_of_birth || '',
    gender: (student.gender as StudentFormData['gender']) || undefined,
    chinese_name: student.chinese_name || '',
    marital_status: (student.marital_status as StudentFormData['marital_status']) || undefined,
    religion: student.religion || '',
    current_address: student.current_address || '',
    permanent_address: student.permanent_address || '',
    postal_code: student.postal_code || '',
    city: student.city || '',
    country: student.country || '',
    wechat_id: student.wechat_id || '',
    emergency_contact_name: student.emergency_contact_name || '',
    emergency_contact_phone: student.emergency_contact_phone || '',
    emergency_contact_relationship: student.emergency_contact_relationship || '',
    passport_number: student.passport_number || '',
    passport_expiry_date: student.passport_expiry_date || '',
    passport_issuing_country: student.passport_issuing_country || '',
    education_history: (student.education_history as EducationHistoryEntry[]) || [],
    work_experience: (student.work_experience as WorkExperienceEntry[]) || [],
    highest_education: student.highest_education || '',
    institution_name: student.institution_name || '',
    field_of_study_legacy: student.field_of_study || '',
    graduation_date: student.graduation_date || '',
    gpa_legacy: student.gpa || '',
    hsk_level: student.hsk_level ?? undefined,
    hsk_score: student.hsk_score ?? undefined,
    ielts_score: student.ielts_score || '',
    toefl_score: student.toefl_score ?? undefined,
    family_members: (student.family_members as FamilyMemberEntry[]) || [],
    extracurricular_activities: student.extracurricular_activities || [],
    awards: student.awards || [],
    publications: student.publications || [],
    research_experience: student.research_experience || [],
    study_mode: (student.study_mode as StudentFormData['study_mode']) || undefined,
    funding_source: (student.funding_source as StudentFormData['funding_source']) || undefined,
  };
}

// ==================== Array Field Helpers ====================

/**
 * Add a new entry to a dynamic array field
 */
export function addArrayItem<T>(array: T[], newItem: T): T[] {
  return [...array, newItem];
}

/**
 * Remove an item from a dynamic array field by index
 */
export function removeArrayItem<T>(array: T[], index: number): T[] {
  return array.filter((_, i) => i !== index);
}

/**
 * Update a specific field within an array item
 */
export function updateArrayItemField<T>(
  array: T[],
  index: number,
  field: keyof T,
  value: T[keyof T]
): T[] {
  return array.map((item, i) =>
    i === index ? { ...item, [field]: value } : item
  );
}

// ==================== Empty Entry Templates ====================

export const emptyEducationEntry: EducationHistoryEntry = {
  institution: '',
  degree: '',
  field_of_study: '',
  start_date: '',
  end_date: '',
  gpa: '',
  city: '',
  country: '',
};

export const emptyWorkExperienceEntry: WorkExperienceEntry = {
  company: '',
  position: '',
  start_date: '',
  end_date: '',
  description: '',
};

export const emptyFamilyMemberEntry: FamilyMemberEntry = {
  name: '',
  relationship: '',
  occupation: '',
  phone: '',
  email: '',
  address: '',
};

export const emptyExtracurricularActivity = {
  activity: '',
  role: '',
  organization: '',
  start_date: '',
  end_date: '',
  description: '',
};

export const emptyAward = {
  title: '',
  issuing_organization: '',
  date: '',
  description: '',
};

export const emptyPublication = {
  title: '',
  publisher: '',
  publication_date: '',
  url: '',
  description: '',
};

export const emptyResearchExperience = {
  topic: '',
  institution: '',
  supervisor: '',
  start_date: '',
  end_date: '',
  description: '',
};

// ==================== Formatter Functions ====================

/**
 * Format a date string for display
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format a date string for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return '';
  // Already in YYYY-MM-DD format or close enough
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.substring(0, 10);
  }
  try {
    const date = new Date(dateString);
    return date.toISOString().substring(0, 10);
  } catch {
    return '';
  }
}

/**
 * Get nationality label from code
 */
export function getNationalityLabel(code: string | null | undefined): string {
  if (!code) return '-';
  const found = NATIONALITIES.find((n: { value: string; label: string }) => n.value === code);
  return found ? found.label : code;
}

/**
 * Get gender display label
 */
export function getGenderLabel(gender: string | null | undefined): string {
  if (!gender) return '-';
  const labels: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
  };
  return labels[gender] || gender;
}

/**
 * Get status badge variant based on is_active
 */
export function getStatusVariant(isActive: boolean): 'default' | 'secondary' {
  return isActive ? 'default' : 'secondary';
}

/**
 * Get study mode label
 */
export function getStudyModeLabel(mode: string | null | undefined): string {
  if (!mode) return '-';
  const labels: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    online: 'Online',
  };
  return labels[mode] || mode.replace('_', '-');
}

/**
 * Get funding source label
 */
export function getFundingSourceLabel(source: string | null | undefined): string {
  if (!source) return '-';
  const labels: Record<string, string> = {
    self_funded: 'Self-funded',
    csc_scholarship: 'CSC Scholarship',
    university_scholarship: 'University Scholarship',
    government_scholarship: 'Government Scholarship',
    other: 'Other',
  };
  return labels[source] || source.replace(/_/g, ' ');
}

/**
 * Mask passport number for display (show last 4 chars)
 */
export function maskPassportNumber(passport: string | null | undefined): string {
  if (!passport) return '-';
  if (passport.length <= 4) return passport;
  return '*'.repeat(passport.length - 4) + passport.slice(-4);
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  try {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

// ==================== Profile Completion Functions ====================

const REQUIRED_FIELDS = [
  'full_name',
  'email',
  'phone',
  'nationality',
  'date_of_birth',
  'gender',
  'passport_number',
  'education_history',
  'highest_education',
  'institution_name',
  'field_of_study',
];

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(profile: StudentProfile | undefined): number {
  if (!profile) return 0;
  
  let filled = 0;
  for (const field of REQUIRED_FIELDS) {
    const value = profile[field as keyof StudentProfile];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) && value.length === 0) continue;
      filled++;
    }
  }
  
  // Add language scores
  if (profile.ielts_score || profile.toefl_score || profile.hsk_level) {
    filled += 0.5;
  }
  
  // Add work experience
  if (profile.work_experience && profile.work_experience.length > 0) {
    filled += 0.5;
  }
  
  return Math.min(Math.round((filled / REQUIRED_FIELDS.length) * 100), 100);
}

/**
 * Get color class based on completion percentage
 */
export function getCompletionColor(completion: number): string {
  if (completion < 30) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (completion < 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (completion < 100) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
}

/**
 * Get list of missing required fields
 */
export function getMissingFields(profile: StudentProfile | undefined): string[] {
  if (!profile) return REQUIRED_FIELDS;
  
  const missing: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    const value = profile[field as keyof StudentProfile];
    if (value === undefined || value === null || value === '') {
      missing.push(field.replace(/_/g, ' '));
    } else if (Array.isArray(value) && value.length === 0) {
      missing.push(field.replace(/_/g, ' '));
    }
  }
  return missing;
}
