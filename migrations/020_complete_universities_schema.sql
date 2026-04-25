-- Migration: Complete universities schema - ensure all fields exist
-- Description: Comprehensive migration to add ALL missing fields

-- Add all missing fields in one comprehensive ALTER TABLE statement
ALTER TABLE universities 
-- Rankings
ADD COLUMN IF NOT EXISTS ranking_national INTEGER,
ADD COLUMN IF NOT EXISTS ranking_international INTEGER,

-- Basic info
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS short_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),

-- Student counts
ADD COLUMN IF NOT EXISTS student_count INTEGER,
ADD COLUMN IF NOT EXISTS international_student_count INTEGER,
ADD COLUMN IF NOT EXISTS faculty_count INTEGER,

-- Descriptions (bilingual)
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_cn TEXT,

-- Facilities (bilingual)
ADD COLUMN IF NOT EXISTS facilities TEXT,
ADD COLUMN IF NOT EXISTS facilities_en TEXT,
ADD COLUMN IF NOT EXISTS facilities_cn TEXT,

-- Accommodation (bilingual)
ADD COLUMN IF NOT EXISTS accommodation_info TEXT,
ADD COLUMN IF NOT EXISTS accommodation_info_en TEXT,
ADD COLUMN IF NOT EXISTS accommodation_info_cn TEXT,

-- Address (bilingual)
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS address_en TEXT,
ADD COLUMN IF NOT EXISTS address_cn TEXT,

-- Location
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),

-- Contact
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),

-- Media
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS images JSONB,
ADD COLUMN IF NOT EXISTS video_urls JSONB,
ADD COLUMN IF NOT EXISTS og_image VARCHAR(500),

-- Category and Tier
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS tier VARCHAR(20),

-- Teaching
ADD COLUMN IF NOT EXISTS teaching_languages JSONB,

-- Tuition
ADD COLUMN IF NOT EXISTS tuition_min NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS tuition_max NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS tuition_currency VARCHAR(10),
ADD COLUMN IF NOT EXISTS default_tuition_per_year NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS default_tuition_currency VARCHAR(10),
ADD COLUMN IF NOT EXISTS use_default_tuition BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tuition_by_degree JSONB,

-- Scholarship
ADD COLUMN IF NOT EXISTS scholarship_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scholarship_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scholarship_info TEXT,
ADD COLUMN IF NOT EXISTS scholarship_info_cn TEXT,
ADD COLUMN IF NOT EXISTS scholarship_by_degree JSONB,

-- Admissions
ADD COLUMN IF NOT EXISTS application_deadline VARCHAR(50),
ADD COLUMN IF NOT EXISTS intake_months JSONB,
ADD COLUMN IF NOT EXISTS csca_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_application_fee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS acceptance_flexibility VARCHAR(50),

-- SEO
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(500),
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords JSONB,

-- Status
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Set default values
UPDATE universities 
SET country = COALESCE(country, 'China'),
    is_active = COALESCE(is_active, TRUE),
    view_count = COALESCE(view_count, 0)
WHERE country IS NULL OR is_active IS NULL OR view_count IS NULL;

-- Ensure type is JSONB array
DO $$ 
BEGIN
    -- Check if type column exists and is VARCHAR
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'universities' 
        AND column_name = 'type' 
        AND data_type = 'character varying'
    ) THEN
        -- Create temporary column
        ALTER TABLE universities ADD COLUMN IF NOT EXISTS type_temp JSONB;
        
        -- Migrate data from VARCHAR to JSONB array
        UPDATE universities 
        SET type_temp = CASE 
            WHEN type IS NOT NULL AND type != '' THEN 
                CASE 
                    WHEN type = '985' THEN '["985"]'::jsonb
                    WHEN type = '211' THEN '["211"]'::jsonb
                    WHEN type ILIKE '%double%first%' THEN '["Double First-Class"]'::jsonb
                    WHEN type ILIKE '%provincial%' OR type ILIKE '%public%' THEN '["Provincial"]'::jsonb
                    ELSE jsonb_build_array(type)
                END
            ELSE '["Provincial"]'::jsonb
        END;
        
        -- Drop old column
        ALTER TABLE universities DROP COLUMN type;
        
        -- Rename temp column
        ALTER TABLE universities RENAME COLUMN type_temp TO type;
        
        -- Set NOT NULL
        ALTER TABLE universities ALTER COLUMN type SET NOT NULL;
    END IF;
    
    -- Check if type column doesn't exist at all
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'universities' 
        AND column_name = 'type'
    ) THEN
        -- Add type column as JSONB
        ALTER TABLE universities ADD COLUMN type JSONB NOT NULL DEFAULT '["Provincial"]'::jsonb;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS universities_category_idx ON universities(category);
CREATE INDEX IF NOT EXISTS universities_city_idx ON universities(city);
CREATE INDEX IF NOT EXISTS universities_is_active_idx ON universities(is_active);
CREATE INDEX IF NOT EXISTS universities_province_idx ON universities(province);
CREATE INDEX IF NOT EXISTS universities_ranking_national_idx ON universities(ranking_national);
CREATE INDEX IF NOT EXISTS universities_type_idx ON universities USING gin(type);

-- Add comment
COMMENT ON TABLE universities IS 'Universities table with comprehensive bilingual content, tuition, admissions, and contact information';
COMMENT ON COLUMN universities.type IS 'Array of university classifications (JSONB): ["985"], ["211"], ["Double First-Class"], ["Provincial"], or combinations';
