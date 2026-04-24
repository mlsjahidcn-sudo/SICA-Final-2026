-- Migration: Add RLS policies for tables with RLS enabled but no policies
-- Date: 2026-04-15
-- Fixes: 9 tables with RLS enabled but missing access policies

-- ============================================================================
-- Admin Tasks System (admin-only access)
-- ============================================================================

-- admin_tasks: Admin-only task management
CREATE POLICY "admin_tasks_admin_all"
ON public.admin_tasks
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- admin_task_attachments: Admin-only attachments
CREATE POLICY "admin_task_attachments_admin_all"
ON public.admin_task_attachments
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- admin_task_comments: Admin-only comments
CREATE POLICY "admin_task_comments_admin_all"
ON public.admin_task_comments
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- admin_task_labels: Admin-only task-label associations
CREATE POLICY "admin_task_labels_admin_all"
ON public.admin_task_labels
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- admin_task_subtasks: Admin-only subtasks
CREATE POLICY "admin_task_subtasks_admin_all"
ON public.admin_task_subtasks
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- ============================================================================
-- Task Labels & Templates (Admin manage, Users read)
-- ============================================================================

-- task_labels: Admin can manage, authenticated users can read
CREATE POLICY "task_labels_admin_all"
ON public.task_labels
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

CREATE POLICY "task_labels_public_select"
ON public.task_labels
FOR SELECT
TO public
USING (true);

-- task_templates: Admin can manage, authenticated users can read
CREATE POLICY "task_templates_admin_all"
ON public.task_templates
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

CREATE POLICY "task_templates_public_select"
ON public.task_templates
FOR SELECT
TO public
USING (true);

-- ============================================================================
-- Meetings (Role-based access)
-- ============================================================================

-- meetings: Students can see their meetings, Partners/Admins can see related meetings
-- Columns: student_id, created_by, application_id

-- Admin full access
CREATE POLICY "meetings_admin_all"
ON public.meetings
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- Students can see meetings where they are participants
CREATE POLICY "meetings_student_select"
ON public.meetings
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Partners can see meetings for students they referred (via application)
CREATE POLICY "meetings_partner_select"
ON public.meetings
FOR SELECT
TO authenticated
USING (
  -- Partner created the meeting
  created_by IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  )
  -- Or meeting is for a student they referred
  OR student_id IN (
    SELECT s.id FROM students s
    JOIN partners p ON p.id = s.partner_id
    WHERE p.user_id = auth.uid()
  )
);

-- Partners can insert meetings for their students
CREATE POLICY "meetings_partner_insert"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (
  created_by IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  )
);

-- Partners can update meetings they created
CREATE POLICY "meetings_partner_update"
ON public.meetings
FOR UPDATE
TO authenticated
USING (
  created_by IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  created_by IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  )
);

-- Admins and meeting creators can delete meetings
CREATE POLICY "meetings_delete"
ON public.meetings
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  OR created_by IN (SELECT id FROM partners WHERE user_id = auth.uid())
);

-- ============================================================================
-- Notifications (Users own their notifications)
-- ============================================================================

-- notifications: Users can only access their own notifications

-- Users can read their own notifications
CREATE POLICY "notifications_user_select"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System can insert notifications for any user (service role bypasses RLS)
-- Allow authenticated users with admin role to insert
CREATE POLICY "notifications_admin_insert"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "notifications_user_update"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_user_delete"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
