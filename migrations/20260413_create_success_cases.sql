-- Migration: Create success_cases table for admission success stories
-- Created: 2026-04-13
-- Purpose: Store and display successful admission cases with documents

-- Create success_cases table
CREATE TABLE IF NOT EXISTS success_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student Information
  student_name_en TEXT NOT NULL,
  student_name_cn TEXT,
  student_photo_url TEXT,
  
  -- University and Program
  university_name_en TEXT,
  university_name_cn TEXT,
  program_name_en TEXT,
  program_name_cn TEXT,
  
  -- Documents (A4 size: admission notice and JW202)
  admission_notice_url TEXT,
  jw202_url TEXT,
  
  -- Description
  description_en TEXT,
  description_cn TEXT,
  
  -- Status and Display
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  admission_year INTEGER,
  intake TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_success_cases_status ON success_cases(status);
CREATE INDEX IF NOT EXISTS idx_success_cases_featured ON success_cases(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_success_cases_order ON success_cases(display_order);
CREATE INDEX IF NOT EXISTS idx_success_cases_year ON success_cases(admission_year DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE success_cases ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (only published cases)
CREATE POLICY "Public can view published success cases"
  ON success_cases FOR SELECT
  USING (status = 'published');

-- Create trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_success_cases_updated_at
  BEFORE UPDATE ON success_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
-- Public can only read published cases (handled by RLS policy above)
-- Admin operations will use service role key to bypass RLS

-- Add comment to table
COMMENT ON TABLE success_cases IS 'Stores successful admission cases with documents for public display';
