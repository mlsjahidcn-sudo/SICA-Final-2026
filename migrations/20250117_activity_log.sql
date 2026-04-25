-- Activity Log Table for Partner Portal Enhancement
-- Tracks all actions on students, applications, and documents

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('student', 'application', 'document', 'meeting')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'status_changed', 'assigned', 'unassigned', 'note_added', 'document_uploaded', 'document_verified', 'document_rejected', 'meeting_scheduled', 'meeting_completed')),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_role TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor ON activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- RLS Policies
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Partners can see activity logs for entities they have access to
CREATE POLICY "Partners can view activity logs for their accessible entities"
  ON activity_log FOR SELECT
  USING (
    -- For applications: check if partner has access
    (entity_type = 'application' AND EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = activity_log.entity_id
      AND (
        -- Admin sees all from their org
        EXISTS (
          SELECT 1 FROM partners p
          JOIN users u ON u.id = p.user_id
          WHERE p.id = a.partner_id
          AND (u.id = auth.uid() OR u.partner_id = auth.uid())
        )
        -- Or student was referred by this partner user
        OR EXISTS (
          SELECT 1 FROM students s
          JOIN users su ON su.id = s.user_id
          WHERE s.id = a.student_id
          AND su.referred_by_partner_id = auth.uid()
        )
      )
    ))
    OR
    -- For students: check if partner has access
    (entity_type = 'student' AND EXISTS (
      SELECT 1 FROM students s
      JOIN users su ON su.id = s.user_id
      WHERE s.id = activity_log.entity_id
      AND (
        su.referred_by_partner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users pu
          WHERE pu.id = auth.uid()
          AND (pu.partner_role IS NULL OR pu.partner_role = 'partner_admin')
          AND EXISTS (
            SELECT 1 FROM users tm
            WHERE tm.referred_by_partner_id = pu.id
            AND tm.id = su.referred_by_partner_id
          )
        )
      )
    ))
    OR
    -- For documents: check if partner has access to the student
    (entity_type = 'document' AND EXISTS (
      SELECT 1 FROM documents d
      JOIN students s ON s.id = d.student_id
      JOIN users su ON su.id = s.user_id
      WHERE d.id = activity_log.entity_id
      AND (
        su.referred_by_partner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users pu
          WHERE pu.id = auth.uid()
          AND (pu.partner_role IS NULL OR pu.partner_role = 'partner_admin')
          AND EXISTS (
            SELECT 1 FROM users tm
            WHERE tm.referred_by_partner_id = pu.id
            AND tm.id = su.referred_by_partner_id
          )
        )
      )
    ))
    OR
    -- For meetings: check if partner has access to the application
    (entity_type = 'meeting' AND EXISTS (
      SELECT 1 FROM meetings m
      JOIN applications a ON a.id = m.application_id
      WHERE m.id = activity_log.entity_id
      AND (
        EXISTS (
          SELECT 1 FROM partners p
          JOIN users u ON u.id = p.user_id
          WHERE p.id = a.partner_id
          AND (u.id = auth.uid() OR u.partner_id = auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM students s
          JOIN users su ON su.id = s.user_id
          WHERE s.id = a.student_id
          AND su.referred_by_partner_id = auth.uid()
        )
      )
    ))
  );

-- Partners can insert activity logs (for their own actions)
CREATE POLICY "Partners can insert activity logs for their actions"
  ON activity_log FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- Admins can see all activity logs
CREATE POLICY "Admins can view all activity logs"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Function to log activity (for use in triggers or application code)
CREATE OR REPLACE FUNCTION log_activity(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_actor_id UUID DEFAULT auth.uid(),
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_actor_name TEXT;
  v_actor_role TEXT;
  v_log_id UUID;
BEGIN
  -- Get actor info
  SELECT full_name, role INTO v_actor_name, v_actor_role
  FROM users WHERE id = p_actor_id;

  INSERT INTO activity_log (
    entity_type,
    entity_id,
    action,
    actor_id,
    actor_name,
    actor_role,
    metadata
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    p_actor_id,
    v_actor_name,
    v_actor_role,
    p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
