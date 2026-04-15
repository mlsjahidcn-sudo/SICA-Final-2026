-- ============================================
-- Migration: Enable RLS on All Public Tables (Fixed)
-- Date: 2026-04-15
-- Purpose: Fix critical security vulnerabilities
-- ============================================

-- ============================================
-- 1. Enable RLS on students table
-- ============================================
-- Students table already has policies, just need to enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Public Read Tables (Universities, Programs, etc.)
-- ============================================

-- Enable RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

-- Universities: Public read, admin write
CREATE POLICY "universities_public_select" ON public.universities
  FOR SELECT TO public USING (true);

CREATE POLICY "universities_admin_all" ON public.universities
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Programs: Public read, admin write
CREATE POLICY "programs_public_select" ON public.programs
  FOR SELECT TO public USING (true);

CREATE POLICY "programs_admin_all" ON public.programs
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Program Translations: Public read, admin write
CREATE POLICY "program_translations_public_select" ON public.program_translations
  FOR SELECT TO public USING (true);

CREATE POLICY "program_translations_admin_all" ON public.program_translations
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Program Stats: Public read, admin write
CREATE POLICY "program_stats_public_select" ON public.program_stats
  FOR SELECT TO public USING (true);

CREATE POLICY "program_stats_admin_all" ON public.program_stats
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Scholarships: Public read, admin write
CREATE POLICY "scholarships_public_select" ON public.scholarships
  FOR SELECT TO public USING (true);

CREATE POLICY "scholarships_admin_all" ON public.scholarships
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================
-- 3. User-Specific Tables
-- ============================================

-- Enable RLS
ALTER TABLE public.program_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_reviews ENABLE ROW LEVEL SECURITY;

-- Program Favorites: Users can manage their own favorites
CREATE POLICY "program_favorites_user_select" ON public.program_favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "program_favorites_user_insert" ON public.program_favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "program_favorites_user_update" ON public.program_favorites
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "program_favorites_user_delete" ON public.program_favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "program_favorites_admin_all" ON public.program_favorites
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Program Comparisons: Users can manage their own comparisons
CREATE POLICY "program_comparisons_user_select" ON public.program_comparisons
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "program_comparisons_user_insert" ON public.program_comparisons
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "program_comparisons_user_update" ON public.program_comparisons
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "program_comparisons_user_delete" ON public.program_comparisons
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "program_comparisons_admin_all" ON public.program_comparisons
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Program Reviews: Users can manage their own reviews, public can read published
CREATE POLICY "program_reviews_public_select" ON public.program_reviews
  FOR SELECT TO public
  USING (is_published = true);

CREATE POLICY "program_reviews_user_select" ON public.program_reviews
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "program_reviews_user_insert" ON public.program_reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "program_reviews_user_update" ON public.program_reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "program_reviews_user_delete" ON public.program_reviews
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "program_reviews_admin_all" ON public.program_reviews
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================
-- 4. Partner and Admin Tables
-- ============================================

-- Enable RLS
ALTER TABLE public.partner_team_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_applications ENABLE ROW LEVEL SECURITY;

-- Partner Team Activity: Partners can view their team's activity
CREATE POLICY "partner_team_activity_partner_select" ON public.partner_team_activity
  FOR SELECT TO authenticated
  USING (
    partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "partner_team_activity_admin_all" ON public.partner_team_activity
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Assessment Applications: Public can submit, users can track, admins manage
CREATE POLICY "assessment_applications_public_insert" ON public.assessment_applications
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "assessment_applications_user_select" ON public.assessment_applications
  FOR SELECT TO authenticated
  USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "assessment_applications_admin_all" ON public.assessment_applications
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Internal Applications: Partners can view their students' applications
CREATE POLICY "internal_applications_partner_select" ON public.internal_applications
  FOR SELECT TO authenticated
  USING (
    partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "internal_applications_admin_all" ON public.internal_applications
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================
-- 5. Grant necessary permissions
-- ============================================

-- Ensure authenticated role can access tables
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO public;

-- Grant SELECT on public read tables
GRANT SELECT ON public.universities TO public;
GRANT SELECT ON public.programs TO public;
GRANT SELECT ON public.program_translations TO public;
GRANT SELECT ON public.program_stats TO public;
GRANT SELECT ON public.scholarships TO public;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_comparisons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_reviews TO authenticated;
GRANT SELECT ON public.partner_team_activity TO authenticated;
GRANT SELECT, INSERT ON public.assessment_applications TO authenticated;
GRANT SELECT ON public.internal_applications TO authenticated;

-- ============================================
-- Verification Queries (run manually after migration)
-- ============================================
/*
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false;

-- Verify policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
*/
