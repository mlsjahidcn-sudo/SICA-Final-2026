import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * Check if a user with the given email already exists
 * @param email - The email to check
 * @returns Object with exists boolean and optional userId
 */
export async function checkEmailExists(email: string): Promise<{
  exists: boolean;
  userId?: string;
  role?: string;
}> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', email)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking email existence:', error);
    throw error;
  }
  
  if (data) {
    return {
      exists: true,
      userId: data.id,
      role: data.role,
    };
  }
  
  return { exists: false };
}

/**
 * Validate email format
 * @param email - The email to validate
 * @returns Boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if an orphan student record exists (for account claiming)
 * @param studentId - The student record ID
 * @returns Object with exists boolean and student data
 */
export async function checkOrphanStudent(studentId: string): Promise<{
  exists: boolean;
  hasUserAccount: boolean;
  student?: {
    id: string;
    user_id: string | null;
    email?: string | null;
  };
}> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('students')
    .select('id, user_id, email')
    .eq('id', studentId)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking orphan student:', error);
    throw error;
  }
  
  if (!data) {
    return { exists: false, hasUserAccount: false };
  }
  
  return {
    exists: true,
    hasUserAccount: data.user_id !== null,
    student: data,
  };
}
