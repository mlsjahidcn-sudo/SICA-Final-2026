/**
 * Unified type definitions for Partner Portal Students module
 * This file consolidates all student-related types to avoid duplication
 */

import type {
  EducationHistoryEntry,
  WorkExperienceEntry,
  FamilyMemberEntry,
  ExtracurricularActivityEntry,
  AwardEntry,
  PublicationEntry,
  ResearchExperienceEntry,
  ScholarshipApplicationData,
  FinancialGuaranteeData,
} from '@/lib/student-api';

/**
 * Student profile information
 */
export interface StudentProfile {
  // Personal Information
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  current_address?: string;
  postal_code?: string;
  permanent_address?: string;
  chinese_name?: string;
  marital_status?: string;
  religion?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;

  // Passport Information
  passport_number?: string;
  passport_expiry_date?: string;
  passport_issuing_country?: string;

  // Academic Information
  education_history?: EducationHistoryEntry[];
  work_experience?: WorkExperienceEntry[];
  highest_education?: string;
  institution_name?: string;
  field_of_study?: string;
  graduation_date?: string;
  gpa?: string;

  // Language Test Scores
  hsk_level?: number | string;
  hsk_score?: number | string;
  ielts_score?: string;
  toefl_score?: number | string;

  // Family Information
  family_members?: FamilyMemberEntry[];

  // Additional Information
  extracurricular_activities?: ExtracurricularActivityEntry[];
  awards?: AwardEntry[];
  publications?: PublicationEntry[];
  research_experience?: ResearchExperienceEntry[];
  scholarship_application?: ScholarshipApplicationData;
  financial_guarantee?: FinancialGuaranteeData;

  // Study Preferences
  study_mode?: string;
  funding_source?: string;
  wechat_id?: string;
}

/**
 * Application statistics for a student
 */
export interface StudentStats {
  total: number;
  accepted: number;
  pending: number;
  rejected: number;
}

/**
 * Document information
 */
export interface StudentDocument {
  id: string;
  type: string;
  file_name: string;
  file_size: number;
  mime_type?: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  url?: string;
}

/**
 * Document statistics
 */
export interface DocumentStats {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
}

/**
 * Application information (simplified for student detail view)
 */
export interface StudentApplication {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  passport_first_name?: string;
  passport_last_name?: string;
  nationality?: string;
  highest_degree?: string;
  gpa?: number;
  programs: {
    id: string;
    name: string;
    name_cn?: string;
    degree_type: string;
    discipline?: string;
    duration_months?: number;
    tuition_per_year?: number;
    tuition_currency?: string;
    universities: {
      id: string;
      name_en: string;
      name_cn?: string;
      city?: string;
      province?: string;
    };
  };
}

/**
 * Complete student information (for detail page)
 */
export interface Student {
  id: string;
  email: string | null;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  nationality?: string | null;
  created_at: string;
  last_sign_in_at?: string;
  profile?: StudentProfile;
  applications: StudentApplication[];
  stats: StudentStats;
  documents?: StudentDocument[];
  documentStats?: DocumentStats;
  completion_percentage?: number;
}

/**
 * Student list item (for list page)
 */
export interface StudentListItem {
  id: string;
  email: string | null;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  nationality?: string | null;
  created_at: string;
  application_count: number;
  stats: StudentStats;
  completion_percentage?: number;
}

/**
 * API response for students list
 */
export interface StudentsResponse {
  students: StudentListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Allowed document types
 */
export const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
  passport: 'Passport',
  diploma: 'Diploma',
  transcript: 'Academic Transcript',
  language_certificate: 'Language Certificate',
  photo: 'Passport Photo',
  recommendation: 'Recommendation Letter',
  cv: 'CV/Resume',
  study_plan: 'Study Plan',
  financial_proof: 'Financial Proof',
  medical_exam: 'Medical Exam Report',
  police_clearance: 'Police Clearance',
  other: 'Other Document',
};
