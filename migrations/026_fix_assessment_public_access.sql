-- Migration: Fix assessment tables public access policies
-- Date: 2026-04-15
-- Issue: Assessment tables allow public SELECT which exposes sensitive personal data

-- Remove overly permissive public SELECT policies
DROP POLICY IF EXISTS "assessment_documents_public_select" ON public.assessment_documents;
DROP POLICY IF EXISTS "assessment_reports_public_select" ON public.assessment_reports;

-- Assessment documents: Only authenticated users (admin manages all, authenticated can insert)
-- Admin already has full access via assessment_documents_admin_all
-- Authenticated users can insert via assessment_documents_authenticated_insert
-- No public read access - documents contain sensitive personal information

-- Assessment reports: Only admin can access
-- Admin already has full access via assessment_reports_admin_all
-- Reports contain sensitive assessment data - no public access
