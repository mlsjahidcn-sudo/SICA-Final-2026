import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isPast, isFuture, differenceInDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a human-readable string
 * @param date - Date string or Date object
 * @param formatStr - Format string (default: 'PPP')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | null | undefined, formatStr: string = 'PPP'): string {
  if (!date) return 'N/A'
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, formatStr)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format a date to relative time (e.g., "2 days ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Check if a date is expired
 * @param date - Date string or Date object
 * @returns Boolean indicating if the date is past
 */
export function isExpired(date: string | Date | null | undefined): boolean {
  if (!date) return false
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return isPast(dateObj)
  } catch {
    return false
  }
}

/**
 * Check if a date is expiring soon (within specified days)
 * @param date - Date string or Date object
 * @param days - Number of days threshold
 * @returns Boolean indicating if the date is expiring soon
 */
export function isExpiringSoon(date: string | Date | null | undefined, days: number = 30): boolean {
  if (!date) return false
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isPast(dateObj)) return false
    const diff = differenceInDays(dateObj, new Date())
    return diff <= days && diff >= 0
  } catch {
    return false
  }
}

/**
 * Get days until a date
 * @param date - Date string or Date object
 * @returns Number of days (negative if past)
 */
export function getDaysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return differenceInDays(dateObj, new Date())
  } catch {
    return null
  }
}

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A lowercase, hyphenated slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a number if necessary
 * @param text - The text to convert to a slug
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 */
export function generateUniqueSlug(text: string, existingSlugs: string[]): string {
  let slug = generateSlug(text);
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${generateSlug(text)}-${counter}`;
    counter++;
  }
  
  return slug;
}
