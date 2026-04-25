/**
 * Validation schema for Add Application Form using Zod
 */

import { z } from 'zod';

export const applicationSchema = z.object({
  student_id: z.string().min(1, "Please select a student"),
  
  program_id: z.string().optional(),
  
  requested_university_program_note: z.string()
    .max(500, "Custom program request must be 500 characters or less")
    .optional(),
  
  intake: z.string()
    .max(100, "Intake period must be 100 characters or less")
    .optional(),
  
  personal_statement: z.string()
    .max(5000, "Personal statement must be 5000 characters or less")
    .optional(),
  
  study_plan: z.string()
    .max(5000, "Study plan must be 5000 characters or less")
    .optional(),
  
  notes: z.string()
    .max(2000, "Admin notes must be 2000 characters or less")
    .optional(),
  
  priority: z.number().min(0).max(3),
}).refine(
  data => data.program_id || data.requested_university_program_note,
  {
    message: "Please select a program or enter a custom request",
    path: ["program_id"],
  }
);

export type ApplicationFormData = z.infer<typeof applicationSchema>;
