-- Migration: Enhance universities table with additional fields
-- Description: Add missing fields for bilingual content, tuition, admissions, and contact info

-- Add bilingual description fields
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_cn TEXT;

-- Add bilingual facilities fields
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS facilities_en TEXT,
ADD COLUMN IF NOT EXISTS facilities_cn TEXT;

-- Add bilingual accommodation info fields
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS accommodation_info TEXT,
ADD COLUMN IF NOT EXISTS accommodation_info_en TEXT,
ADD COLUMN IF NOT EXISTS accommodation_info_cn TEXT;

-- Add bilingual address fields
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS address_en TEXT,
ADD COLUMN IF NOT EXISTS address_cn TEXT;

-- Add student and faculty count
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS student_count INTEGER,
ADD COLUMN IF NOT EXISTS international_student_count INTEGER,
ADD COLUMN IF NOT EXISTS faculty_count INTEGER;

-- Add teaching languages
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS teaching_languages JSONB;

-- Add contact information
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);

-- Add geographic coordinates
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Add country field
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Add tuition fields
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS tuition_min NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS tuition_max NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS tuition_currency VARCHAR(10);

-- Add scholarship percentage and detailed info
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS scholarship_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scholarship_info TEXT,
ADD COLUMN IF NOT EXISTS scholarship_info_cn TEXT;

-- Add admission-related fields
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS application_deadline VARCHAR(50),
ADD COLUMN IF NOT EXISTS intake_months JSONB,
ADD COLUMN IF NOT EXISTS csca_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_application_fee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS acceptance_flexibility VARCHAR(50);

-- Add media fields
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS images JSONB,
ADD COLUMN IF NOT EXISTS video_urls JSONB,
ADD COLUMN IF NOT EXISTS og_image VARCHAR(500);

-- Add SEO fields
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(500),
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords JSONB;

-- Add tier field
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS tier VARCHAR(20);

-- Add default tuition fields
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS default_tuition_per_year NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS default_tuition_currency VARCHAR(10),
ADD COLUMN IF NOT EXISTS use_default_tuition BOOLEAN DEFAULT FALSE;

-- Add tuition and scholarship by degree
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS tuition_by_degree JSONB,
ADD COLUMN IF NOT EXISTS scholarship_by_degree JSONB;

-- Set default country for existing records
UPDATE universities 
SET country = 'China' 
WHERE country IS NULL;

-- Add comment to document the changes
COMMENT ON TABLE universities IS 'Universities table with bilingual content, tuition, admissions, and contact information';
