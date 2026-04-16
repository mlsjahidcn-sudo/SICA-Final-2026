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
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  
  // Role and partner
  role: z.enum(['student', 'partner']).optional().default('student'),
  partner_id: z.string().uuid().optional(),
  
  // Personal information
  nationality: optionalString,
  date_of_birth: z.string().optional().refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'Invalid date format (YYYY-MM-DD)',
  }),
  gender: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : val,
    z.enum(['male', 'female', 'other']).optional()
  ),
  current_address: optionalString,
  permanent_address: optionalString,
  postal_code: optionalString,
  chinese_name: optionalString,
  marital_status: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : val,
    z.enum(['single', 'married', 'divorced', 'widowed']).optional()
  ),
  religion: optionalString,
  
  // Emergency contact
  emergency_contact_name: optionalString,
  emergency_contact_phone: optionalString,
  emergency_contact_relationship: optionalString,
  
  // Passport information
  passport_number: optionalString,
  passport_expiry_date: z.string().optional().refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'Invalid date format (YYYY-MM-DD)',
  }),
  passport_issuing_country: optionalString,
  
  // Academic history (JSONB array)
  education_history: jsonArray(z.object({
    institution: z.string(),
    degree: z.string(),
    field_of_study: z.string(),
    start_date: z.string(),
    end_date: z.string().optional(),
    gpa: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  })),
  
  // Work experience (JSONB array)
  work_experience: jsonArray(z.object({
    company: z.string(),
    position: z.string(),
    start_date: z.string(),
    end_date: z.string().optional(),
    description: z.string().optional(),
  })),
  
  // Legacy single-education fields (for backward compatibility)
  highest_education: optionalString,
  institution_name: optionalString,
  field_of_study: optionalString,
  graduation_date: z.string().optional().refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'Invalid date format (YYYY-MM-DD)',
  }),
  gpa: optionalString,
  
  // Language scores - allow empty strings
  hsk_level: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : Number(val),
    z.number().int().min(1).max(6).optional()
  ),
  hsk_score: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : Number(val),
    z.number().int().positive().optional()
  ),
  ielts_score: optionalString,
  toefl_score: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : Number(val),
    z.number().int().positive().optional()
  ),
  
  // Family members (JSONB array)
  family_members: jsonArray(z.object({
    name: z.string(),
    relationship: z.string(),
    occupation: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  })),
  
  // Additional activities (JSONB arrays)
  extracurricular_activities: jsonArray(z.object({
    activity: z.string(),
    role: z.string().optional(),
    organization: z.string().optional(),
    start_date: z.string(),
    end_date: z.string().optional(),
    description: z.string().optional(),
  })),
  
  awards: jsonArray(z.object({
    title: z.string(),
    issuing_organization: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
  })),
  
  publications: jsonArray(z.object({
    title: z.string(),
    publisher: z.string().optional(),
    publication_date: z.string().optional(),
    url: z.string().optional(),
    description: z.string().optional(),
  })),
  
  research_experience: jsonArray(z.object({
    topic: z.string(),
    institution: z.string().optional(),
    supervisor: z.string().optional(),
    start_date: z.string(),
    end_date: z.string().optional(),
    description: z.string().optional(),
  })),
  
  // Preferences
  study_mode: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : val,
    z.enum(['full-time', 'part-time', 'online', 'full_time', 'part_time']).optional()
  ),
  funding_source: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : val,
    z.enum(['self-funded', 'scholarship', 'loan', 'other', 'self_funded', 'csc_scholarship', 'university_scholarship', 'government_scholarship']).optional()
  ),
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
