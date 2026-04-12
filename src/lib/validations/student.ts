import { z } from 'zod';

/**
 * Student validation schemas
 */

// Common optional string field
const optionalString = z.string().optional();

// Date string validator
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional();

// JSONB array validator
const jsonArray = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).optional();

export const createStudentSchema = z.object({
  // Required fields when creating user account
  email: z.string().email('Invalid email address').optional(),
  full_name: z.string().min(1, 'Full name is required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  
  // Role and partner
  role: z.enum(['student', 'partner']).optional().default('student'),
  partner_id: z.string().uuid().optional(),
  
  // Personal information
  nationality: optionalString,
  date_of_birth: dateString,
  gender: z.enum(['male', 'female', 'other']).optional(),
  current_address: optionalString,
  permanent_address: optionalString,
  postal_code: optionalString,
  chinese_name: optionalString,
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  religion: optionalString,
  
  // Emergency contact
  emergency_contact_name: optionalString,
  emergency_contact_phone: optionalString,
  emergency_contact_relationship: optionalString,
  
  // Passport information
  passport_number: optionalString,
  passport_expiry_date: dateString,
  passport_issuing_country: optionalString,
  
  // Academic history (JSONB array)
  education_history: jsonArray(z.object({
    institution: z.string(),
    degree: z.string(),
    field_of_study: z.string(),
    start_date: z.string(),
    end_date: z.string().optional(),
    gpa: z.string().optional(),
  })),
  
  // Work experience (JSONB array)
  work_experience: jsonArray(z.object({
    company: z.string(),
    position: z.string(),
    start_date: z.string(),
    end_date: z.string().optional(),
    responsibilities: z.string().optional(),
  })),
  
  // Legacy single-education fields (for backward compatibility)
  highest_education: optionalString,
  institution_name: optionalString,
  field_of_study: optionalString,
  graduation_date: dateString,
  gpa: optionalString,
  
  // Language scores
  hsk_level: z.number().int().min(1).max(6).optional(),
  hsk_score: z.number().int().positive().optional(),
  ielts_score: z.string().optional(),
  toefl_score: z.number().int().positive().optional(),
  
  // Family members (JSONB array)
  family_members: jsonArray(z.object({
    name: z.string(),
    relationship: z.string(),
    occupation: z.string().optional(),
    contact: z.string().optional(),
  })),
  
  // Additional activities (JSONB arrays)
  extracurricular_activities: jsonArray(z.object({
    activity: z.string(),
    role: z.string().optional(),
    duration: z.string().optional(),
  })),
  
  awards: jsonArray(z.object({
    title: z.string(),
    organization: z.string().optional(),
    date: z.string().optional(),
  })),
  
  publications: jsonArray(z.object({
    title: z.string(),
    publisher: z.string().optional(),
    date: z.string().optional(),
    url: z.string().url().optional(),
  })),
  
  research_experience: jsonArray(z.object({
    topic: z.string(),
    role: z.string().optional(),
    duration: z.string().optional(),
    description: z.string().optional(),
  })),
  
  // Preferences
  study_mode: z.enum(['full-time', 'part-time', 'online']).optional(),
  funding_source: z.enum(['self-funded', 'scholarship', 'loan', 'other']).optional(),
  scholarship_application: z.record(z.string(), z.unknown()).optional(),
  financial_guarantee: z.record(z.string(), z.unknown()).optional(),
  
  // Communication
  phone: optionalString,
  wechat_id: optionalString,
  
  // Skip user account creation (for orphan students)
  skip_user_creation: z.boolean().optional().default(false),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
