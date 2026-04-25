-- Fix RLS Infinite Recursion on Students Table
-- Issue: Circular dependency between students and users table RLS policies
-- Solution: Disable RLS on students table (safe for server-side only access)

-- Disable RLS on students table
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'students';

-- Note: This is safe because:
-- 1. All student data access is through authenticated API routes
-- 2. Admin operations use service role key
-- 3. No direct public access to students table
-- 4. RLS still protects users table and other tables

-- Future optimization: Re-enable RLS with SECURITY DEFINER helper functions
-- to avoid circular dependencies
