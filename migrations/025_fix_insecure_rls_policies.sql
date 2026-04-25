-- Migration: Fix insecure RLS policies that allow public role full access
-- Date: 2026-04-15
-- Fixes: Policies with public role and no row-level checks

-- ============================================================================
-- Drop insecure policies
-- ============================================================================

-- Assessment tables - remove public ALL access
DROP POLICY IF EXISTS "assessment_documents_admin_all" ON public.assessment_documents;
DROP POLICY IF EXISTS "assessment_reports_admin_all" ON public.assessment_reports;
DROP POLICY IF EXISTS "assessment_status_history_admin_all" ON public.assessment_status_history;

-- Blog tables - remove public ALL access
DROP POLICY IF EXISTS "blog_categories_admin_all" ON public.blog_categories;
DROP POLICY IF EXISTS "blog_post_tags_admin_all" ON public.blog_post_tags;
DROP POLICY IF EXISTS "blog_posts_admin_all" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_tags_admin_all" ON public.blog_tags;

-- User settings - remove overly permissive policy
DROP POLICY IF EXISTS "Service role full access" ON public.user_settings;

-- Also remove public INSERT policies that allow anyone to insert
DROP POLICY IF EXISTS "assessment_applications_public_insert" ON public.assessment_applications;
DROP POLICY IF EXISTS "assessment_documents_public_insert" ON public.assessment_documents;

-- ============================================================================
-- Create secure admin policies (authenticated + admin role check)
-- ============================================================================

-- Assessment tables - admin only
CREATE POLICY "assessment_documents_admin_all"
ON public.assessment_documents
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

CREATE POLICY "assessment_reports_admin_all"
ON public.assessment_reports
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

CREATE POLICY "assessment_status_history_admin_all"
ON public.assessment_status_history
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- Blog tables - admin only for write, public read for published content
CREATE POLICY "blog_categories_admin_all"
ON public.blog_categories
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

CREATE POLICY "blog_post_tags_admin_all"
ON public.blog_post_tags
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

CREATE POLICY "blog_posts_admin_all"
ON public.blog_posts
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

CREATE POLICY "blog_tags_admin_all"
ON public.blog_tags
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- User settings - authenticated users only
CREATE POLICY "user_settings_admin_all"
ON public.user_settings
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- Assessment applications - authenticated only for insert
CREATE POLICY "assessment_applications_authenticated_insert"
ON public.assessment_applications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Assessment documents - authenticated only for insert  
CREATE POLICY "assessment_documents_authenticated_insert"
ON public.assessment_documents
FOR INSERT
TO authenticated
WITH CHECK (true);
