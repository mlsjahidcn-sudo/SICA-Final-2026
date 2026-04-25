-- Migration: Ensure all universities fields exist
-- Description: Add any missing fields to the universities table

-- Add founded_year if it doesn't exist
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS founded_year INTEGER;

-- Add student_count if it doesn't exist
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS student_count INTEGER;

-- Add international_student_count if it doesn't exist
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS international_student_count INTEGER;

-- Add faculty_count if it doesn't exist
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS faculty_count INTEGER;

-- Add short_name if it doesn't exist
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS short_name VARCHAR(100);

-- Ensure all other fields exist
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_cn TEXT,
ADD COLUMN IF NOT EXISTS facilities TEXT,
ADD COLUMN IF NOT EXISTS facilities_en TEXT,
ADD COLUMN IF NOT EXISTS facilities_cn TEXT,
ADD COLUMN IF NOT EXISTS accommodation_info TEXT,
ADD COLUMN IF NOT EXISTS accommodation_info_en TEXT,
ADD COLUMN IF NOT EXISTS accommodation_info_cn TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS address_en TEXT,
ADD COLUMN IF NOT EXISTS address_cn TEXT,
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS tuition_min NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS tuition_max NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS tuition_currency VARCHAR(10),
ADD COLUMN IF NOT EXISTS scholarship_percentage INTEGER,
ADD COLUMN IF NOT EXISTS scholarship_info TEXT,
ADD COLUMN IF NOT EXISTS scholarship_info_cn TEXT,
ADD COLUMN IF NOT EXISTS teaching_languages JSONB,
ADD COLUMN IF NOT EXISTS application_deadline VARCHAR(50),
ADD COLUMN IF NOT EXISTS intake_months JSONB,
ADD COLUMN IF NOT EXISTS csca_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_application_fee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS acceptance_flexibility VARCHAR(50),
ADD COLUMN IF NOT EXISTS tier VARCHAR(20),
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(500),
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords JSONB,
ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500);

-- Set default country for existing records
UPDATE universities 
SET country = 'China' 
WHERE country IS NULL;

-- Ensure type is JSONB array if it's still VARCHAR
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'universities' 
        AND column_name = 'type' 
        AND data_type = 'character varying'
    ) THEN
        -- Create temporary column
        ALTER TABLE universities ADD COLUMN IF NOT EXISTS type_new JSONB;
        
        -- Migrate data
        UPDATE universities 
        SET type_new = CASE 
            WHEN type IS NOT NULL THEN jsonb_build_array(type)
            ELSE '["Provincial"]'::jsonb
        END;
        
        -- Drop old column
        ALTER TABLE universities DROP COLUMN type;
        
        -- Rename new column
        ALTER TABLE universities RENAME COLUMN type_new TO type;
        
        -- Set NOT NULL
        ALTER TABLE universities ALTER COLUMN type SET NOT NULL;
    END IF;
END $$;

-- Add comment
COMMENT ON TABLE universities IS 'Universities table with comprehensive fields for bilingual content, tuition, admissions, and contact information';
