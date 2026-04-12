-- Partner Team Member Portal Migration
-- Adds support for partner self-service team management

-- 1. Add partner_role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_role VARCHAR(50) DEFAULT 'member';

-- 2. Add check constraint for valid partner roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_partner_role;
ALTER TABLE users ADD CONSTRAINT valid_partner_role 
  CHECK (partner_role IN ('partner_admin', 'member') OR partner_role IS NULL);

-- 3. Set existing partners to partner_admin
UPDATE users 
SET partner_role = 'partner_admin'
WHERE role = 'partner' AND partner_role IS NULL;

-- 4. Create index for partner_role queries
CREATE INDEX IF NOT EXISTS users_partner_role_idx ON users(partner_role);

-- 5. Add partner_id column to users table (for team member grouping)
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 6. Create index for partner_id queries
CREATE INDEX IF NOT EXISTS users_partner_id_idx ON users(partner_id);

-- 7. Add comments to document new columns
COMMENT ON COLUMN users.partner_role IS 'Partner team role: partner_admin or member (only for partner role users)';
COMMENT ON COLUMN users.partner_id IS 'ID of the partner admin who owns this team member';

-- 8. Create partner_team_activity table for audit logging
CREATE TABLE IF NOT EXISTS partner_team_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  action_details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create indexes for partner_team_activity
CREATE INDEX IF NOT EXISTS partner_team_activity_partner_id_idx ON partner_team_activity(partner_id);
CREATE INDEX IF NOT EXISTS partner_team_activity_actor_id_idx ON partner_team_activity(actor_id);
CREATE INDEX IF NOT EXISTS partner_team_activity_target_user_id_idx ON partner_team_activity(target_user_id);
CREATE INDEX IF NOT EXISTS partner_team_activity_action_idx ON partner_team_activity(action);
CREATE INDEX IF NOT EXISTS partner_team_activity_created_at_idx ON partner_team_activity(created_at);

-- 10. Add comments for partner_team_activity table
COMMENT ON TABLE partner_team_activity IS 'Audit log for partner team management activities';
COMMENT ON COLUMN partner_team_activity.action IS 'Action performed: invite, update_role, remove, update_permissions';
COMMENT ON COLUMN partner_team_activity.action_details IS 'JSON object with action-specific details';
