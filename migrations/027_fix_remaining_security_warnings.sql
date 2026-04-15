-- Migration: Fix remaining security warnings
-- Date: 2026-04-15
-- Issues: 
--   1. user_settings and users tables use public role (should use authenticated)
--   2. Storage allows public read access to documents bucket

-- ============================================================================
-- Fix 1: Change public role to authenticated for user-related tables
-- ============================================================================

-- Drop existing public role policies
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Recreate with authenticated role for user_settings
CREATE POLICY "Users can insert own settings"
ON public.user_settings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
ON public.user_settings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own settings"
ON public.user_settings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Recreate with authenticated role for users
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- ============================================================================
-- Fix 2: Remove public read access from storage documents bucket
-- ============================================================================

-- Remove public read policy for documents
DROP POLICY IF EXISTS "Public read access to documents" ON storage.objects;

-- Note: If documents need to be publicly accessible (e.g., public attachments),
-- create specific policies per use case. For now, only authenticated users
-- and admins/partners can access documents.

-- If you need public document access, create a separate bucket like 'public-assets'
-- and apply public policy only to that bucket.
