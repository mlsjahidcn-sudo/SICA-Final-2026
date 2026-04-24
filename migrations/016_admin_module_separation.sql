-- Admin Module Separation Migration
-- Adds indexes and updates partner_id on applications for better filtering

-- 1. Ensure partner_id column exists on applications (it should already exist)
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_partner_id ON applications(partner_id);
CREATE INDEX IF NOT EXISTS idx_users_referred_by_partner ON users(referred_by_partner_id) WHERE role = 'student';

-- 3. Update existing applications to set partner_id based on student's referred_by_partner_id
-- This links applications to partners for proper filtering
UPDATE applications a
SET partner_id = u.referred_by_partner_id
FROM users u
WHERE a.student_id = u.id
  AND u.referred_by_partner_id IS NOT NULL
  AND a.partner_id IS NULL;

-- 4. Verify the update
-- Count applications with partner_id set
SELECT 
  COUNT(*) as total_applications,
  COUNT(partner_id) as applications_with_partner,
  COUNT(*) - COUNT(partner_id) as applications_without_partner
FROM applications;

-- 5. Add comment to document the partner_id usage
COMMENT ON COLUMN applications.partner_id IS 'Partner associated with this application. Derived from student''s referred_by_partner_id for filtering and tracking.';
