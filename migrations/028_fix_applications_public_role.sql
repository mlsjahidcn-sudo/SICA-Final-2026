-- Migration: Fix applications table using public role with auth checks
-- Date: 2026-04-15
-- Issue: applications policies use public role but check auth.uid()
-- Public role shouldn't have auth context - should use authenticated role

-- Drop incorrect public role policies
DROP POLICY IF EXISTS "Partners can view referred applications" ON public.applications;
DROP POLICY IF EXISTS "Students can view own applications" ON public.applications;

-- Recreate with authenticated role
CREATE POLICY "Partners can view referred applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  partner_id IN (
    SELECT partners.id 
    FROM partners 
    WHERE partners.user_id = auth.uid()
  )
);

CREATE POLICY "Students can view own applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT students.id 
    FROM students 
    WHERE students.user_id = auth.uid()
  )
);
