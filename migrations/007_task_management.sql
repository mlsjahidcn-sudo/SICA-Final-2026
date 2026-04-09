-- Task Management System Migration
-- Creates tables for admin/partner task management

-- Tasks table
CREATE TABLE IF NOT EXISTS admin_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo', -- todo, in_progress, review, done, blocked
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    assignee_id UUID REFERENCES auth.users(id),
    assignee_role TEXT, -- 'admin' or 'partner'
    creator_id UUID REFERENCES auth.users(id) NOT NULL,
    creator_role TEXT NOT NULL, -- 'admin' or 'partner'
    related_to_type TEXT, -- application, student, university, partner, program
    related_to_id UUID,
    partner_id UUID, -- If related partner (for visibility)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task comments
CREATE TABLE IF NOT EXISTS admin_task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES admin_tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    user_role TEXT NOT NULL, -- 'admin' or 'partner'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task attachments
CREATE TABLE IF NOT EXISTS admin_task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES admin_tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_key TEXT NOT NULL, -- S3 object key
    file_size BIGINT,
    content_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subtasks/checklist
CREATE TABLE IF NOT EXISTS admin_task_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES admin_tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_task_subtasks ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to admin_tasks
CREATE TRIGGER update_admin_tasks_updated_at BEFORE UPDATE ON admin_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON admin_tasks(status);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_priority ON admin_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assignee ON admin_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_creator ON admin_tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_partner ON admin_tasks(partner_id);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_related ON admin_tasks(related_to_type, related_to_id);
CREATE INDEX IF NOT EXISTS idx_admin_task_comments_task ON admin_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_admin_task_attachments_task ON admin_task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_admin_task_subtasks_task ON admin_task_subtasks(task_id);
