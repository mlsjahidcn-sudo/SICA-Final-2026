-- Task Management Enhancements Migration
-- Adds templates, labels, and extended task features

-- Task templates table
CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'application', 'visa', 'onboarding', 'interview', 'general'
    subtasks JSONB DEFAULT '[]', -- [{title, order}]
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task labels for filtering
CREATE TABLE IF NOT EXISTS task_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1', -- hex color
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for task-label many-to-many
CREATE TABLE IF NOT EXISTS admin_task_labels (
    task_id UUID REFERENCES admin_tasks(id) ON DELETE CASCADE,
    label_id UUID REFERENCES task_labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

-- Add new columns to admin_tasks
ALTER TABLE admin_tasks ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';
ALTER TABLE admin_tasks ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES task_templates(id);
ALTER TABLE admin_tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2);
ALTER TABLE admin_tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2);

-- Enable RLS on new tables
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_task_labels ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_created_by ON task_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_template ON admin_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_admin_task_labels_task ON admin_task_labels(task_id);
CREATE INDEX IF NOT EXISTS idx_admin_task_labels_label ON admin_task_labels(label_id);

-- Add updated_at trigger to task_templates
CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default labels
INSERT INTO task_labels (name, color) VALUES
    ('Urgent', '#ef4444'),
    ('High Priority', '#f97316'),
    ('Application', '#3b82f6'),
    ('Visa', '#8b5cf6'),
    ('Interview', '#10b981'),
    ('Document', '#6366f1'),
    ('Follow-up', '#ec4899'),
    ('Onboarding', '#14b8a6')
ON CONFLICT (name) DO NOTHING;

-- Insert default templates
INSERT INTO task_templates (name, description, category, subtasks, is_public) VALUES
    (
        'Application Follow-up',
        'Standard follow-up tasks for new applications',
        'application',
        '[{"title": "Review application documents", "order": 1}, {"title": "Contact student for missing documents", "order": 2}, {"title": "Schedule initial consultation", "order": 3}, {"title": "Prepare application summary", "order": 4}]',
        true
    ),
    (
        'Interview Preparation',
        'Prepare student for university interview',
        'interview',
        '[{"title": "Review interview guidelines", "order": 1}, {"title": "Practice common questions", "order": 2}, {"title": "Prepare introduction speech", "order": 3}, {"title": "Mock interview session", "order": 4}, {"title": "Final preparation review", "order": 5}]',
        true
    ),
    (
        'Visa Application Checklist',
        'Complete visa application process',
        'visa',
        '[{"title": "Collect required documents", "order": 1}, {"title": "Verify passport validity", "order": 2}, {"title": "Complete visa application form", "order": 3}, {"title": "Schedule visa appointment", "order": 4}, {"title": "Prepare for visa interview", "order": 5}, {"title": "Submit visa application", "order": 6}]',
        true
    ),
    (
        'Partner Onboarding',
        'Onboard new partner to the platform',
        'onboarding',
        '[{"title": "Send welcome email", "order": 1}, {"title": "Create partner account", "order": 2}, {"title": "Platform training session", "order": 3}, {"title": "Share marketing materials", "order": 4}, {"title": "Set up referral tracking", "order": 5}]',
        true
    );
