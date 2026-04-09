-- Fix RLS policies, constraints, and sync issues
-- Migration: 012 (applied via Supabase on 2026-04-08)

-- ============================================================================
-- 1. Add unique constraint on students.user_id (prevent duplicate student records)
-- ============================================================================

ALTER TABLE students ADD CONSTRAINT students_user_id_key UNIQUE (user_id);

-- ============================================================================
-- 2. Add RLS policies for students table
--    Partners can read students where partner_id matches their partner record
-- ============================================================================

CREATE POLICY students_select_own ON students
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'partner')
        AND partner_id IN (SELECT p.id FROM public.partners p WHERE p.user_id = auth.uid()))
  );

CREATE POLICY students_insert_own ON students
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY students_update_own ON students
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 3. Drop duplicate indexes on applications table (if they exist)
-- ============================================================================

DROP INDEX IF EXISTS idx_applications_partner_id;
DROP INDEX IF EXISTS idx_applications_program_id;
DROP INDEX IF EXISTS idx_applications_status;
DROP INDEX IF EXISTS idx_applications_student_id;
DROP INDEX IF EXISTS idx_applications_university_id;
