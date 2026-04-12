import { z } from 'zod';

/**
 * Validation schemas for student transfer functionality
 */

// Transfer student between partners
export const transferStudentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  new_partner_id: z.string().uuid('Invalid partner ID'),
  reason: z.string()
    .min(10, 'Transfer reason must be at least 10 characters')
    .max(500, 'Transfer reason is too long'),
  notify_student: z.boolean().default(true),
  notify_old_partner: z.boolean().default(true),
  transfer_applications: z.boolean().default(true), // Transfer all applications to new partner
});

// Reassign single application to different partner
export const reassignApplicationSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),
  new_partner_id: z.string().uuid('Invalid partner ID'),
  reason: z.string()
    .min(10, 'Reassignment reason must be at least 10 characters')
    .max(500, 'Reassignment reason is too long'),
  notify_student: z.boolean().default(true),
});

// Bulk transfer students
export const bulkTransferSchema = z.object({
  student_ids: z.array(z.string().uuid()).min(1, 'At least one student required'),
  new_partner_id: z.string().uuid('Invalid partner ID'),
  reason: z.string()
    .min(10, 'Transfer reason must be at least 10 characters')
    .max(500, 'Transfer reason is too long'),
  notify_students: z.boolean().default(true),
  notify_old_partners: z.boolean().default(true),
});

export type TransferStudentInput = z.infer<typeof transferStudentSchema>;
export type ReassignApplicationInput = z.infer<typeof reassignApplicationSchema>;
export type BulkTransferInput = z.infer<typeof bulkTransferSchema>;
