-- Document Management Enhancement Migration
-- Adds document expiry tracking and document request functionality

-- ============================================================================
-- 1. Add expires_at column to documents table
-- ============================================================================
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN documents.expires_at IS 'Expiration date for time-sensitive documents (passport, visa, medical exam, etc.)';

-- ============================================================================
-- 2. Add expires_at column to application_documents table
-- ============================================================================
ALTER TABLE application_documents
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN application_documents.expires_at IS 'Expiration date for time-sensitive application documents';

-- ============================================================================
-- 3. Create document_requests table
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who is requesting (partner user)
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Which student needs to upload
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Optional: link to specific application
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Document type requested (from DOCUMENT_TYPES enum)
  document_type TEXT NOT NULL,
  
  -- Request details
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'fulfilled', 'cancelled')),
  
  -- Deadline for upload
  due_date TIMESTAMPTZ,
  
  -- Message to student
  message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- When was it fulfilled
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  
  -- Track notification sent
  notification_sent_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_document_requests_student ON document_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_requested_by ON document_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_document_requests_status ON document_requests(status);
CREATE INDEX IF NOT EXISTS idx_document_requests_due_date ON document_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_document_requests_created_at ON document_requests(created_at DESC);

-- ============================================================================
-- 4. Create document_notifications table
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification type
  type TEXT NOT NULL CHECK (type IN (
    'document_uploaded',
    'document_verified', 
    'document_rejected',
    'document_expiring',
    'document_expired',
    'document_request_created',
    'document_request_fulfilled'
  )),
  
  -- Related entities
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  document_request_id UUID REFERENCES document_requests(id) ON DELETE CASCADE,
  
  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_notifications_user ON document_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_document_notifications_is_read ON document_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_document_notifications_created_at ON document_notifications(created_at DESC);

-- ============================================================================
-- 5. RLS Policies for document_requests
-- ============================================================================
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

-- Partners can view requests they created or requests for their students
CREATE POLICY "Partners can view their document requests"
  ON document_requests FOR SELECT
  USING (
    -- Requester can see their own requests
    requested_by = auth.uid()
    OR
    -- Partner admin can see requests for students from their org
    EXISTS (
      SELECT 1 FROM students s
      JOIN users su ON su.id = s.user_id
      WHERE s.id = document_requests.student_id
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
    )
  );

-- Partners can create requests for their students
CREATE POLICY "Partners can create document requests"
  ON document_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students s
      JOIN users su ON su.id = s.user_id
      WHERE s.id = document_requests.student_id
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
    )
  );

-- Partners can update their own requests
CREATE POLICY "Partners can update their document requests"
  ON document_requests FOR UPDATE
  USING (requested_by = auth.uid())
  WITH CHECK (requested_by = auth.uid());

-- Partners can delete their own requests
CREATE POLICY "Partners can delete their document requests"
  ON document_requests FOR DELETE
  USING (requested_by = auth.uid());

-- Students can view requests for themselves
CREATE POLICY "Students can view their document requests"
  ON document_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = document_requests.student_id
      AND s.user_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "Admins have full access to document_requests"
  ON document_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 6. RLS Policies for document_notifications
-- ============================================================================
ALTER TABLE document_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON document_notifications FOR SELECT
  USING (user_id = auth.uid());

-- System can insert notifications (via service role or triggers)
CREATE POLICY "Service can insert notifications"
  ON document_notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON document_notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 7. Helper functions
-- ============================================================================

-- Function to check if a document is expiring soon
CREATE OR REPLACE FUNCTION is_document_expiring(
  p_expires_at TIMESTAMPTZ,
  p_days_threshold INTEGER DEFAULT 30
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_expires_at IS NOT NULL 
    AND p_expires_at <= NOW() + (p_days_threshold || ' days')::INTERVAL
    AND p_expires_at > NOW();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if a document is expired
CREATE OR REPLACE FUNCTION is_document_expired(
  p_expires_at TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_expires_at IS NOT NULL AND p_expires_at < NOW();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to auto-fulfill document requests when a document is uploaded
CREATE OR REPLACE FUNCTION fulfill_document_requests()
RETURNS TRIGGER AS $$
BEGIN
  -- Update matching pending document requests
  UPDATE document_requests
  SET 
    status = 'fulfilled',
    fulfilled_at = NOW(),
    fulfilled_by_document_id = NEW.id,
    updated_at = NOW()
  WHERE student_id = NEW.student_id
    AND document_type = NEW.type
    AND status IN ('pending', 'in_progress');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-fulfill requests
DROP TRIGGER IF EXISTS trigger_fulfill_document_requests ON documents;
CREATE TRIGGER trigger_fulfill_document_requests
  AFTER INSERT OR UPDATE ON documents
  FOR EACH ROW
  WHEN (NEW.status = 'verified')
  EXECUTE FUNCTION fulfill_document_requests();

-- ============================================================================
-- 8. Add activity types for document requests
-- ============================================================================
ALTER TABLE activity_log
DROP CONSTRAINT IF EXISTS activity_log_action_check;

ALTER TABLE activity_log
ADD CONSTRAINT activity_log_action_check
CHECK (action IN (
  'created', 'updated', 'deleted', 'status_changed', 'assigned', 'unassigned',
  'note_added', 'document_uploaded', 'document_verified', 'document_rejected',
  'document_request_created', 'document_request_fulfilled', 'document_request_cancelled',
  'meeting_scheduled', 'meeting_completed'
));

-- ============================================================================
-- 9. Views for common queries
-- ============================================================================

-- View: Expiring documents
CREATE OR REPLACE VIEW expiring_documents AS
SELECT 
  d.id,
  d.type,
  d.file_name,
  d.expires_at,
  d.student_id,
  s.first_name,
  s.last_name,
  su.email,
  d.expires_at - NOW() AS days_until_expiry
FROM documents d
JOIN students s ON s.id = d.student_id
LEFT JOIN users su ON su.id = s.user_id
WHERE d.expires_at IS NOT NULL
  AND d.expires_at <= NOW() + INTERVAL '30 days'
  AND d.expires_at > NOW()
ORDER BY d.expires_at ASC;

-- View: Expired documents
CREATE OR REPLACE VIEW expired_documents AS
SELECT 
  d.id,
  d.type,
  d.file_name,
  d.expires_at,
  d.student_id,
  s.first_name,
  s.last_name,
  su.email
FROM documents d
JOIN students s ON s.id = d.student_id
LEFT JOIN users su ON su.id = s.user_id
WHERE d.expires_at IS NOT NULL
  AND d.expires_at < NOW()
ORDER BY d.expires_at DESC;

-- View: Document request statistics
CREATE OR REPLACE VIEW document_request_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
  COUNT(*) FILTER (WHERE status = 'fulfilled') AS fulfilled_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
  COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('fulfilled', 'cancelled')) AS overdue_count,
  COUNT(*) AS total_count
FROM document_requests;

-- ============================================================================
-- 10. Grant permissions
-- ============================================================================
GRANT SELECT ON expiring_documents TO authenticated;
GRANT SELECT ON expired_documents TO authenticated;
GRANT SELECT ON document_request_stats TO authenticated;

-- ============================================================================
-- 11. Comments
-- ============================================================================
COMMENT ON TABLE document_requests IS 'Document upload requests from partners to students';
COMMENT ON TABLE document_notifications IS 'Notifications related to document activities';
COMMENT ON COLUMN document_requests.priority IS 'Request priority: low, normal, high, urgent';
COMMENT ON COLUMN document_requests.status IS 'Request status: pending, in_progress, fulfilled, cancelled';
COMMENT ON COLUMN document_notifications.type IS 'Notification type for document-related events';
