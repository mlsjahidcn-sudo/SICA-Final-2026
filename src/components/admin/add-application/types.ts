/**
 * Type definitions for Add Application Form
 */

export interface ApplicationFormData {
  student_id: string;
  program_id?: string;
  requested_university_program_note?: string;
  intake?: string;
  personal_statement?: string;
  study_plan?: string;
  notes?: string;
  priority: number;
}

export interface Student {
  id: string;
  user_id: string;
  nationality?: string;
  users: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface Program {
  id: string;
  name: string;
  degree_level: string;
  language_of_instruction?: string;
  universities: {
    id: string;
    name_en: string;
    name_cn?: string;
    city?: string;
    province?: string;
    logo_url?: string;
  };
}

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: (keyof ApplicationFormData)[];
}
