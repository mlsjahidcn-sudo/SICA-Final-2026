-- Migration: Add Portal Credentials to Internal Applications
-- Purpose: Add portal_username and portal_password fields to store university portal login credentials
-- Related: Internal Applications module (Excel replacement)

-- Add portal credentials columns
ALTER TABLE internal_applications 
ADD COLUMN IF NOT EXISTS portal_username TEXT,
ADD COLUMN IF NOT EXISTS portal_password TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN internal_applications.portal_username IS 'University portal login username for application tracking';
COMMENT ON COLUMN internal_applications.portal_password IS 'University portal login password for application tracking';

-- Create indexes for searching by portal credentials (optional, for future use)
CREATE INDEX IF NOT EXISTS idx_internal_applications_portal_username ON internal_applications(portal_username);
