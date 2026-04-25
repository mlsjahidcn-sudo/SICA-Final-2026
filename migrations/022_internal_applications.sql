-- Migration: Internal Applications Table
-- Purpose: Temporary standalone module for managing internal application data (Excel replacement)
-- Note: This is NOT linked to students, universities, or programs tables

CREATE TABLE IF NOT EXISTS internal_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student Information
  student_name TEXT NOT NULL,
  passport TEXT,
  nationality TEXT,
  degree TEXT,
  major TEXT,
  
  -- University & Application Details
  university_choice TEXT,  -- Text field, admin enters manually (not FK)
  overview TEXT,           -- Long text field
  missing_docs JSONB DEFAULT '[]',  -- Multi-select array of missing documents
  remarks_for_university TEXT,      -- Long text field
  status TEXT DEFAULT 'pending',    -- Single select status
  
  -- Contact & Reference
  user_id TEXT,            -- Text field (not FK - for reference only)
  email TEXT,
  portal_link TEXT,
  partner TEXT,            -- Text field (not FK)
  
  -- Tracking & Notes
  note TEXT,
  application_date DATE,
  follow_up_date DATE,
  comments TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX idx_internal_applications_status ON internal_applications(status);
CREATE INDEX idx_internal_applications_student_name ON internal_applications(student_name);
CREATE INDEX idx_internal_applications_passport ON internal_applications(passport);
CREATE INDEX idx_internal_applications_email ON internal_applications(email);
CREATE INDEX idx_internal_applications_partner ON internal_applications(partner);
CREATE INDEX idx_internal_applications_university_choice ON internal_applications(university_choice);
CREATE INDEX idx_internal_applications_application_date ON internal_applications(application_date);
CREATE INDEX idx_internal_applications_follow_up_date ON internal_applications(follow_up_date);
CREATE INDEX idx_internal_applications_created_at ON internal_applications(created_at DESC);

-- Add comment to table
COMMENT ON TABLE internal_applications IS 'Standalone internal application tracking (temporary Excel replacement). Not linked to students/universities/programs.';

-- Status values: pending, processing, submitted, accepted, rejected, withdrawn, follow_up
-- Missing docs examples: passport, degree_certificate, transcripts, language_test, recommendation_letters, financial_guarantee, health_certificate, photos, other
