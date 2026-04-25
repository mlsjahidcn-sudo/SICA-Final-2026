-- Migration: Remove unnecessary public access from internal tables
-- Date: 2026-04-15
-- Issue: Some tables allow full public access when they shouldn't

-- ============================================================================
-- Keep public access for marketing/catalog data (intentionally public)
-- These are OK to remain public:
--   - programs (public catalog)
--   - universities (public catalog)
--   - scholarships (public catalog)
--   - blog_tags (public content)
--   - program_translations (public content)
--   - program_stats (public statistics)
-- ============================================================================

-- ============================================================================
-- Remove public access from internal/administrative tables
-- ============================================================================

-- task_labels: Administrative task labels, not public content
DROP POLICY IF EXISTS "task_labels_public_select" ON public.task_labels;

-- task_templates: Administrative task templates, not public content
DROP POLICY IF EXISTS "task_templates_public_select" ON public.task_templates;

-- Note: Authenticated users who need access can be granted specific policies
-- For now, only admins have access via the admin_all policies
