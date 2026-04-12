-- Add student referral tracking
-- Adds a column to track which partner referred/created a student

-- 1. Add referred_by_partner_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_partner_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Create index for referred_by_partner_id queries
CREATE INDEX IF NOT EXISTS users_referred_by_partner_id_idx ON users(referred_by_partner_id);

-- 3. Add comment
COMMENT ON COLUMN users.referred_by_partner_id IS 'ID of the partner who referred or created this student account';
