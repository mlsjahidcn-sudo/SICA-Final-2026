/**
 * Type definitions for Partner Application Wizard
 * Simplified 2-step form: Selection -> Details & Submit
 */

// ============================================================
// Step Configuration (2 steps)
// ============================================================

export const TOTAL_STEPS = 2;

export interface WizardStepConfig {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: 1,
    title: 'Select Degree & Program',
    description: 'Choose academic level and programs',
    icon: 'GraduationCap',
  },
  {
    id: 2,
    title: 'Details & Submit',
    description: 'Intake, notes and confirm',
    icon: 'CheckCircle2',
  },
];

// ============================================================
// Degree Options
// ============================================================

export interface DegreeOption {
  value: string;
  label: string;
  description: string;
  color: string;
  icon: string;
}

export const DEGREE_OPTIONS: DegreeOption[] = [
  {
    value: "Bachelor",
    label: "Bachelor's Degree",
    description: "4-year undergraduate program",
    color: 'from-blue-500 to-blue-600',
    icon: 'BookOpen',
  },
  {
    value: "Master",
    label: "Master's Degree",
    description: "1-2 year graduate program",
    color: 'from-purple-500 to-purple-600',
    icon: 'Award',
  },
  {
    value: "PhD",
    label: "Doctoral (PhD)",
    description: "Research-focused doctorate",
    color: 'from-amber-500 to-amber-600',
    icon: 'Gem',
  },
  {
    value: "Associate",
    label: "Associate Degree",
    description: "2-year foundation program",
    color: 'from-emerald-500 to-emerald-600',
    icon: 'Library',
  },
  {
    value: "Diploma",
    label: "Certificate/Diploma",
    description: 'Short-term specialized course',
    color: 'from-rose-500 to-rose-600',
    icon: 'ScrollText',
  },
  {
    value: "Non-Degree",
    label: 'Non-Degree / Language',
    description: 'Language or exchange program',
    color: 'from-cyan-500 to-cyan-600',
    icon: 'Languages',
  },
];

// ============================================================
// Program Types (from API) - kept for API compatibility
// ============================================================

export interface ProgramOption {
  id: string;
  name: string | null;
  name_en?: string;
  name_cn?: string;
  degree_level?: string;
  degree_type?: string;
  discipline?: string;
  major?: string;
  teaching_language?: string;
  duration_months?: number | null;
  duration_description?: string | null;
  tuition_per_year?: number | null;
  tuition_currency?: string;
  scholarship_available?: boolean;
  scholarship_details?: string | null;
  entry_requirements?: string | null;
  required_documents?: unknown[] | null;
  intake_months?: unknown[] | null;
  application_deadline_fall?: string | null;
  application_deadline_spring?: string | null;
  description?: string | null;
  description_en?: string | null;
  curriculum?: string | null;
  career_prospects?: string | null;
  min_gpa?: number | null;
  language_requirement?: string | null;
  cover_image?: string | null;
  is_active?: boolean;
  university_id?: string;
  universities?: UniversityInfo;
}

export interface UniversityInfo {
  id: string;
  name_en: string;
  name_cn?: string;
  city?: string;
  province?: string;
  logo_url?: string;
  website_url?: string;
  type?: string;
  ranking_national?: number;
}

// ============================================================
// Application Form Data (simplified)
// ============================================================

export interface PartnerApplicationFormData {
  // Step 1
  selectedDegree: string | null;
  selectedProgramIds: string[];

  // Step 2
  intake: string;
  notes: string;
}

// ============================================================
// Intake Options
// ============================================================

export interface IntakeOption {
  value: string;
  label: string;
  isUpcoming: boolean;
}

export function getIntakeOptions(): IntakeOption[] {
  const currentYear = new Date().getFullYear();
  return [
    { value: `Fall ${currentYear}`, label: `Fall ${currentYear}`, isUpcoming: true },
    { value: `Spring ${currentYear + 1}`, label: `Spring ${currentYear + 1}`, isUpcoming: true },
    { value: `Fall ${currentYear + 1}`, label: `Fall ${currentYear + 1}`, isUpcoming: true },
    { value: `Spring ${currentYear + 2}`, label: `Spring ${currentYear + 2}`, isUpcoming: false },
  ];
}

// ============================================================
// Priority Options (kept for detail page compatibility)
// ============================================================

export interface PriorityOption {
  value: number;
  label: string;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { value: 0, label: 'Normal' },
  { value: 1, label: 'Low' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Urgent' },
];

// ============================================================
// Application Status Types (for list/detail pages)
// ============================================================

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'document_request'
  | 'interview_scheduled'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationStatusConfig {
  value: ApplicationStatus;
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
}

export const APPLICATION_STATUS_MAP: Record<ApplicationStatus, ApplicationStatusConfig> = {
  draft: { value: 'draft', label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100', dotColor: 'bg-gray-400' },
  submitted: { value: 'submitted', label: 'Submitted', color: 'text-blue-600', bgColor: 'bg-blue-100', dotColor: 'bg-blue-400' },
  under_review: { value: 'under_review', label: 'Under Review', color: 'text-amber-600', bgColor: 'bg-amber-100', dotColor: 'bg-amber-400' },
  document_request: { value: 'document_request', label: 'Documents Requested', color: 'text-purple-600', bgColor: 'bg-purple-100', dotColor: 'bg-purple-400' },
  interview_scheduled: { value: 'interview_scheduled', label: 'Interview Scheduled', color: 'text-indigo-600', bgColor: 'bg-indigo-100', dotColor: 'bg-indigo-400' },
  accepted: { value: 'accepted', label: 'Accepted', color: 'text-emerald-600', bgColor: 'bg-emerald-100', dotColor: 'bg-emerald-400' },
  rejected: { value: 'rejected', label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100', dotColor: 'bg-red-400' },
  withdrawn: { value: 'withdrawn', label: 'Withdrawn', color: 'text-slate-600', bgColor: 'bg-slate-100', dotColor: 'bg-slate-400' },
};

// ============================================================
// API Response Types
// ============================================================

export interface ProgramsApiResponse {
  programs: ProgramOption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateApplicationRequest {
  student_id: string;
  user_id?: string;
  program_id?: string;
  selected_program_ids?: string[];
  requested_university_program_note?: string;
  intake?: string;
  notes?: string;
}

export interface CreateApplicationResponse {
  application: Record<string, unknown>;
  applications: Record<string, unknown>[];
  count: number;
}

// ============================================================
// Helper: Create empty form data
// ============================================================

export function createEmptyFormData(): PartnerApplicationFormData {
  return {
    selectedDegree: null,
    selectedProgramIds: [],
    intake: '',
    notes: '',
  };
}
