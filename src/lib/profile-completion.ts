/**
 * Shared profile completion calculation utility
 * Used by both profile API and dashboard API to ensure consistent completion metrics
 */

// User-level fields that contribute to profile completion
const USER_COMPLETION_FIELDS = [
  'full_name',
  'phone',
] as const;

// Student-level fields that contribute to profile completion
const STUDENT_COMPLETION_FIELDS = [
  // Personal information
  'nationality',
  'date_of_birth',
  'gender',
  'current_address',
  // Passport
  'passport_number',
  'passport_expiry_date',
  // Emergency contact
  'emergency_contact_name',
  'emergency_contact_phone',
  // Study preferences
  'study_mode',
  'funding_source',
  // Communication
  'wechat_id',
] as const;

// JSONB fields that count as "completed" when they have at least one entry
const STUDENT_ARRAY_COMPLETION_FIELDS = [
  'education_history',
  'family_members',
  'extracurricular_activities',
  'awards',
  'publications',
  'research_experience',
] as const;

// JSONB object fields that count as "completed" when they have at least one non-empty value
const STUDENT_OBJECT_COMPLETION_FIELDS = [
  'scholarship_application',
  'financial_guarantee',
] as const;

export type StudentCompletionField = typeof STUDENT_COMPLETION_FIELDS[number];

/**
 * Calculate profile completion percentage
 * @param user - User record from the users table
 * @param student - Student record from the students table
 * @returns Completion percentage (0-100)
 */
export function calculateProfileCompletion(user: Record<string, any> | null, student: Record<string, any> | null): number {
  let completed = 0;
  let total = 0;

  // Check user fields
  for (const field of USER_COMPLETION_FIELDS) {
    total++;
    if (user && user[field] != null && user[field] !== '') {
      completed++;
    }
  }

  // Check student scalar fields
  for (const field of STUDENT_COMPLETION_FIELDS) {
    total++;
    if (student && student[field] != null && student[field] !== '') {
      completed++;
    }
  }

  // Check student array fields (count as complete if at least one entry)
  for (const field of STUDENT_ARRAY_COMPLETION_FIELDS) {
    total++;
    if (student && Array.isArray(student[field]) && student[field].length > 0) {
      completed++;
    }
  }

  // Check student object fields (count as complete if object has at least one non-empty value)
  for (const field of STUDENT_OBJECT_COMPLETION_FIELDS) {
    total++;
    if (student && student[field] && typeof student[field] === 'object' && !Array.isArray(student[field])) {
      const obj = student[field] as Record<string, unknown>;
      const hasValue = Object.values(obj).some(v => v != null && v !== '');
      if (hasValue) {
        completed++;
      }
    }
  }

  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Get list of incomplete profile fields
 * Useful for showing users what they still need to fill in
 */
export function getIncompleteFields(user: Record<string, any> | null, student: Record<string, any> | null): string[] {
  const incomplete: string[] = [];

  for (const field of USER_COMPLETION_FIELDS) {
    if (!user || user[field] == null || user[field] === '') {
      incomplete.push(field);
    }
  }

  for (const field of STUDENT_COMPLETION_FIELDS) {
    if (!student || student[field] == null || student[field] === '') {
      incomplete.push(field);
    }
  }

  for (const field of STUDENT_ARRAY_COMPLETION_FIELDS) {
    if (!student || !Array.isArray(student[field]) || student[field].length === 0) {
      incomplete.push(field);
    }
  }

  for (const field of STUDENT_OBJECT_COMPLETION_FIELDS) {
    if (!student || !student[field] || typeof student[field] !== 'object' || Array.isArray(student[field])) {
      incomplete.push(field);
    } else {
      const obj = student[field] as Record<string, unknown>;
      const hasValue = Object.values(obj).some(v => v != null && v !== '');
      if (!hasValue) {
        incomplete.push(field);
      }
    }
  }

  return incomplete;
}

/**
 * All student fields that can be safely written via the API
 * This is the complete whitelist used by the profile PUT endpoint
 */
export const STUDENT_SAFE_COLUMNS = [
  // Personal information
  'nationality',
  'date_of_birth',
  'gender',
  'current_address',
  'postal_code',
  'permanent_address',
  'chinese_name',
  'marital_status',
  'religion',
  // Emergency contact
  'emergency_contact_name',
  'emergency_contact_phone',
  'emergency_contact_relationship',
  // Passport information
  'passport_number',
  'passport_expiry_date',
  'passport_issuing_country',
  // Academic information
  'education_history',
  'work_experience',
  // Legacy single-education fields
  'highest_education',
  'institution_name',
  'field_of_study',
  'graduation_date',
  'gpa',
  // Language test scores
  'hsk_level',
  'hsk_score',
  'ielts_score',
  'toefl_score',
  // Family information
  'family_members',
  // Additional information
  'extracurricular_activities',
  'awards',
  'publications',
  'research_experience',
  'scholarship_application',
  'financial_guarantee',
  // Study preferences
  'study_mode',
  'funding_source',
  // Communication
  'wechat_id',
] as const;

export type StudentSafeColumn = typeof STUDENT_SAFE_COLUMNS[number];
