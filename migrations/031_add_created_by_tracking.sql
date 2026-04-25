-- Migration: Add created_by and updated_by tracking to users and applications tables
-- Purpose: Track which partner team member created/updated students and applications

-- ============================================
-- Users table: Add created_by and updated_by
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- ============================================
-- Applications table: Add created_by and updated_by
-- ============================================
ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- ============================================
-- Create indexes for faster lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON users(updated_by);
CREATE INDEX IF NOT EXISTS idx_applications_created_by ON applications(created_by);
CREATE INDEX IF NOT EXISTS idx_applications_updated_by ON applications(updated_by);

-- ============================================
-- Add comments for documentation
-- ============================================
COMMENT ON COLUMN users.created_by IS 'User ID of the partner team member who created this student record';
COMMENT ON COLUMN users.updated_by IS 'User ID of the partner team member who last updated this student record';
COMMENT ON COLUMN applications.created_by IS 'User ID of the partner team member who created this application';
COMMENT ON COLUMN applications.updated_by IS 'User ID of the partner team member who last updated this application';