/**
 * Type definitions for Admin Module Separation
 * Individual Students vs Partner Students
 */

// Student source classification
export const STUDENT_SOURCES = {
  INDIVIDUAL: 'individual',           // Self-registered, no partner referral
  PARTNER_REFERRED: 'partner_referred', // Referred by partner
} as const;

export type StudentSource = typeof STUDENT_SOURCES[keyof typeof STUDENT_SOURCES];

// Student type for individual students
export interface IndividualStudent {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  country: string | null;
  city: string | null;
  source: typeof STUDENT_SOURCES.INDIVIDUAL;
  nationality: string | null;
  gender: string | null;
  date_of_birth: string | null;
  passport_number: string | null;
  current_address: string | null;
  wechat_id: string | null;
  highest_education: string | null;
  institution_name: string | null;
  created_at: string;
  updated_at: string | null;
  applications: {
    total: number;
    pending: number;
  };
}

// Student type for partner-referred students
export interface PartnerStudent {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  source: typeof STUDENT_SOURCES.PARTNER_REFERRED;
  referred_by_partner_id: string | null;
  referred_by_partner: {
    id: string;
    full_name: string;
    email: string;
    company_name?: string;
  } | null;
  // Track which partner team member created/updated this student
  created_by: string | null;
  created_by_partner: {
    id: string;
    full_name: string;
    email: string;
    company_name?: string;
  } | null;
  updated_by: string | null;
  updated_by_partner: {
    id: string;
    full_name: string;
    email: string;
    company_name?: string;
  } | null;
  nationality: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string | null;
  applications: {
    total: number;
    pending: number;
  };
}

// Combined student type
export type Student = IndividualStudent | PartnerStudent;

// Application with partner context
export interface ApplicationWithPartner {
  id: string;
  status: string;
  priority: number;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  partner_id: string | null;
  intake: string | null;
  // Track which partner team member created/updated this application
  created_by: string | null;
  created_by_partner: {
    id: string;
    full_name: string;
    email: string;
    company_name?: string;
  } | null;
  updated_by: string | null;
  updated_by_partner: {
    id: string;
    full_name: string;
    email: string;
    company_name?: string;
  } | null;
  program: {
    id: string;
    name: string;
    degree_level: string;
    university: {
      id: string;
      name_en: string;
      city: string;
      province: string;
    } | null;
  } | null;
  student: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    nationality: string | null;
    gender: string | null;
    highest_education: string | null;
    source: StudentSource;
    referred_by_partner?: {
      id: string;
      full_name: string;
      email: string;
      company_name?: string;
    } | null;
  };
}

// Statistics for admin dashboard
export interface AdminStats {
  students: {
    total: number;
    individual: number;
    partnerReferred: number;
    active: number;
    newThisMonth: number;
    withApplications: number;
  };
  applications: {
    total: number;
    individual: number;
    partner: number;
    submitted: number;
    under_review: number;
    document_request: number;
    interview_scheduled: number;
    accepted: number;
    rejected: number;
  };
}
