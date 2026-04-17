/**
 * Document utility functions for partner portal
 */

import { getDocumentTypeLabel } from '@/lib/document-types';

/**
 * Document status types
 */
export type DocumentStatus = 'pending' | 'verified' | 'rejected';

/**
 * Document expiry status types
 */
export type ExpiryStatus = 'expired' | 'expiring' | 'valid';

/**
 * Document request priority types
 */
export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Document request status types
 */
export type RequestStatus = 'pending' | 'in_progress' | 'fulfilled' | 'cancelled';

/**
 * Notification types for document activities
 */
export type DocumentNotificationType = 
  | 'document_uploaded'
  | 'document_verified'
  | 'document_rejected'
  | 'document_expiring'
  | 'document_expired'
  | 'document_request_created'
  | 'document_request_fulfilled';

/**
 * Check if a document is expiring within a given number of days
 */
export function isDocumentExpiring(expiresAt: string | null | undefined, daysThreshold = 30): boolean {
  if (!expiresAt) return false;
  
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  
  return expiryDate >= now && expiryDate <= thresholdDate;
}

/**
 * Check if a document is expired
 */
export function isDocumentExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  
  return new Date(expiresAt) < new Date();
}

/**
 * Calculate days until expiry (negative if expired)
 */
export function calculateDaysUntilExpiry(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get expiry status for a document
 */
export function getExpiryStatus(expiresAt: string | null | undefined): ExpiryStatus | null {
  if (!expiresAt) return null;
  
  if (isDocumentExpired(expiresAt)) return 'expired';
  if (isDocumentExpiring(expiresAt)) return 'expiring';
  return 'valid';
}

/**
 * Get expiry badge variant
 */
export function getExpiryBadgeVariant(expiryStatus: ExpiryStatus | null): 'destructive' | 'outline' | 'default' {
  switch (expiryStatus) {
    case 'expired':
      return 'destructive';
    case 'expiring':
      return 'outline';
    default:
      return 'default';
  }
}

/**
 * Get expiry badge text
 */
export function getExpiryBadgeText(expiryStatus: ExpiryStatus | null, daysUntilExpiry: number | null): string {
  if (!expiryStatus) return '';
  
  switch (expiryStatus) {
    case 'expired':
      return `Expired ${Math.abs(daysUntilExpiry || 0)} days ago`;
    case 'expiring':
      return `Expires in ${daysUntilExpiry} days`;
    default:
      return '';
  }
}

/**
 * Get priority badge variant
 */
export function getPriorityBadgeVariant(priority: RequestPriority): 'destructive' | 'outline' | 'secondary' | 'default' {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'high':
      return 'outline';
    case 'low':
      return 'secondary';
    default:
      return 'default';
  }
}

/**
 * Get priority badge class
 */
export function getPriorityBadgeClass(priority: RequestPriority): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500 text-white';
    case 'high':
      return 'border-orange-500 text-orange-600';
    case 'low':
      return 'bg-gray-100 text-gray-600';
    default:
      return '';
  }
}

/**
 * Format document for display
 */
export function formatDocumentForDisplay(doc: any) {
  return {
    ...doc,
    document_type_label: getDocumentTypeLabel(doc.type || doc.document_type),
    expiry_status: getExpiryStatus(doc.expires_at),
    days_until_expiry: calculateDaysUntilExpiry(doc.expires_at),
    student_name: doc.students 
      ? `${doc.students.first_name} ${doc.students.last_name}`
      : doc.student?.name || 'Unknown',
  };
}

/**
 * Format document request for display
 */
export function formatDocumentRequestForDisplay(req: any) {
  const daysUntilDue = req.due_date ? calculateDaysUntilExpiry(req.due_date) : null;
  
  return {
    ...req,
    document_type_label: getDocumentTypeLabel(req.document_type),
    is_overdue: daysUntilDue !== null && daysUntilDue < 0 && !['fulfilled', 'cancelled'].includes(req.status),
    student_name: req.students 
      ? `${req.students.first_name} ${req.students.last_name}`
      : req.student?.name || 'Unknown',
  };
}

/**
 * Document types that require expiry tracking
 */
export const EXPIRY_TRACKING_DOCUMENT_TYPES = [
  'passport',
  'visa',
  'medical_exam',
  'english_test',
  'police_clearance',
];

/**
 * Check if a document type requires expiry tracking
 */
export function requiresExpiryTracking(documentType: string): boolean {
  return EXPIRY_TRACKING_DOCUMENT_TYPES.includes(documentType);
}

/**
 * Get default expiry date for a document type (if applicable)
 */
export function getDefaultExpiryDate(documentType: string): Date | null {
  if (!requiresExpiryTracking(documentType)) return null;
  
  const now = new Date();
  
  switch (documentType) {
    case 'passport':
      // Passports typically valid for 10 years
      now.setFullYear(now.getFullYear() + 10);
      return now;
    case 'visa':
      // Visas typically valid for 1-5 years, default to 2 years
      now.setFullYear(now.getFullYear() + 2);
      return now;
    case 'medical_exam':
      // Medical exams typically valid for 6 months to 1 year
      now.setMonth(now.getMonth() + 6);
      return now;
    case 'english_test':
      // IELTS/TOEFL valid for 2 years
      now.setFullYear(now.getFullYear() + 2);
      return now;
    case 'police_clearance':
      // Police clearance typically valid for 6 months
      now.setMonth(now.getMonth() + 6);
      return now;
    default:
      return null;
  }
}
