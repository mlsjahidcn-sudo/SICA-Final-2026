import { z } from 'zod';

/**
 * Application validation schemas
 */

export const createApplicationSchema = z.object({
  program_id: z.string().uuid('Invalid program ID'),
  university_id: z.string().uuid('Invalid university ID').optional(),
  partner_id: z.string().uuid('Invalid partner ID').optional(),
  personal_statement: z.string().min(100, 'Personal statement must be at least 100 characters').max(5000, 'Personal statement is too long').optional(),
  study_plan: z.string().min(50, 'Study plan must be at least 50 characters').max(3000, 'Study plan is too long').optional(),
  intake: z.string().min(1, 'Intake is required').optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial();

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['draft', 'submitted', 'under_review', 'document_request', 'interview_scheduled', 'accepted', 'rejected', 'withdrawn']),
  review_notes: z.string().max(2000, 'Review notes are too long').optional(),
});

export const prioritySchema = z.object({
  priority: z.number().int().min(0).max(3), // 0=normal, 1=low, 2=high, 3=urgent
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type PriorityInput = z.infer<typeof prioritySchema>;
