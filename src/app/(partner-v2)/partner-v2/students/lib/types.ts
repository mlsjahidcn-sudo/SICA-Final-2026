/**
 * Type definitions for Partner Portal Students Module
 */

// ==================== Array Entry Types (JSONB) ====================

export interface EducationHistoryEntry {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  gpa?: string;
  city?: string;
  country?: string;
}

export interface WorkExperienceEntry {
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface FamilyMemberEntry {
  name: string;
  relationship: string;
  occupation?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface ExtracurricularActivityEntry {
  activity: string;
  role?: string;
  organization?: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface AwardEntry {
  title: string;
  issuing_organization?: string;
  date?: string;
  description?: string;
}

export interface PublicationEntry {
  title: string;
  publisher?: string;
  publication_date?: string;
  url?: string;
  description?: string;
}

export interface ResearchExperienceEntry {
  topic: string;
  institution?: string;
  supervisor?: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

// ==================== Form Data Type ====================

export interface StudentFormData {
  // Required
  email: string;
  full_name: string;

  // Personal
  phone?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  chinese_name?: string;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  religion?: string;

  // Address
  current_address?: string;
  permanent_address?: string;
  postal_code?: string;
  city?: string;
  country?: string;

  // Communication
  wechat_id?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;

  // Passport
  passport_number?: string;
  passport_expiry_date?: string;
  passport_issuing_country?: string;

  // Academic - JSONB arrays
  education_history: EducationHistoryEntry[];
  work_experience: WorkExperienceEntry[];

  // Legacy education fields
  highest_education?: string;
  institution_name?: string;
  field_of_study_legacy?: string;
  graduation_date?: string;
  gpa_legacy?: string;

  // Language Scores
  hsk_level?: number;
  hsk_score?: number;
  ielts_score?: string;
  toefl_score?: number;

  // Family
  family_members: FamilyMemberEntry[];

  // Additional Info - JSONB arrays
  extracurricular_activities: ExtracurricularActivityEntry[];
  awards: AwardEntry[];
  publications: PublicationEntry[];
  research_experience: ResearchExperienceEntry[];

  // Preferences
  study_mode?: 'full_time' | 'part_time' | 'online';
  funding_source?: 'self_funded' | 'csc_scholarship' | 'university_scholarship' | 'government_scholarship' | 'other';

  // Scholarship & Financial
  scholarship_application?: Record<string, unknown>;
  financial_guarantee?: Record<string, unknown>;

  // Flags
  skip_user_creation?: boolean;
}

// ==================== Response Types ====================

export interface PartnerStudentListItem {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  nationality: string | null;
  gender: string | null;
  is_active: boolean;
  passport_number: string | null;
  referred_by_partner_id: string | null;
  created_at: string;
  updated_at: string | null;
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface PartnerStudentDetail extends Omit<PartnerStudentListItem, 'applications'> {
  // Personal details
  date_of_birth: string | null;
  chinese_name: string | null;
  marital_status: string | null;
  religion: string | null;
  current_address: string | null;
  permanent_address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  wechat_id: string | null;

  // Emergency contact
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;

  // Passport
  passport_expiry_date: string | null;
  passport_issuing_country: string | null;

  // Academic
  education_history: EducationHistoryEntry[] | null;
  work_experience: WorkExperienceEntry[] | null;
  highest_education: string | null;
  institution_name: string | null;
  field_of_study: string | null;
  graduation_date: string | null;
  gpa: string | null;
  hsk_level: number | null;
  hsk_score: number | null;
  ielts_score: string | null;
  toefl_score: number | null;

  // Family & Additional
  family_members: FamilyMemberEntry[] | null;
  extracurricular_activities: ExtracurricularActivityEntry[] | null;
  awards: AwardEntry[] | null;
  publications: PublicationEntry[] | null;
  research_experience: ResearchExperienceEntry[] | null;

  // Preferences
  study_mode: string | null;
  funding_source: string | null;
  scholarship_application: Record<string, unknown> | null;
  financial_guarantee: Record<string, unknown> | null;

  // Computed
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  documents_count?: number;
}

// ==================== Profile Completion Type ====================

export interface StudentProfile {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  passport_number?: string | null;
  education_history?: EducationHistoryEntry[] | null;
  highest_education?: string | null;
  institution_name?: string | null;
  field_of_study?: string | null;
  gpa?: string | null;
  ielts_score?: string | null;
  toefl_score?: number | null;
  hsk_level?: number | null;
  work_experience?: WorkExperienceEntry[] | null;
  family_members?: FamilyMemberEntry[] | null;
}

// ==================== Stats Type ====================

export interface StudentStats {
  total: number;
  active: number;
  newThisMonth: number;
  withApplications: number;
}

// ==================== List Query Params ====================

export interface StudentsListParams {
  page: number;
  limit: number;
  search?: string;
  nationality?: string;
  status?: string;
}

export interface StudentsListResponse {
  students: PartnerStudentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: StudentStats;
}

// ==================== Constants ====================

export const NATIONALITIES = [
  { value: 'CN', label: 'China' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'IN', label: 'India' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'KE', label: 'Kenya' },
  { value: 'GH', label: 'Ghana' },
  { value: 'ET', label: 'Ethiopia' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'EG', label: 'Egypt' },
  { value: 'PH', label: 'Philippines' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'TH', label: 'Thailand' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'RU', label: 'Russia' },
  { value: 'KZ', label: 'Kazakhstan' },
  { value: 'UZ', label: 'Uzbekistan' },
  { value: 'OTHER', label: 'Other' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

export const STUDY_MODE_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'online', label: 'Online' },
];

export const FUNDING_SOURCE_OPTIONS = [
  { value: 'self_funded', label: 'Self-funded' },
  { value: 'csc_scholarship', label: 'CSC Scholarship' },
  { value: 'university_scholarship', label: 'University Scholarship' },
  { value: 'government_scholarship', label: 'Government Scholarship' },
  { value: 'other', label: 'Other' },
];

export const DEGREE_LEVELS = [
  'High School',
  'Associate Degree',
  "Bachelor's",
  "Master's",
  'PhD',
  'Diploma',
  'Certificate',
  'Other',
];

export const FAMILY_RELATIONSHIPS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Spouse',
  'Son',
  'Daughter',
  'Uncle',
  'Aunt',
  'Guardian',
  'Other',
];
