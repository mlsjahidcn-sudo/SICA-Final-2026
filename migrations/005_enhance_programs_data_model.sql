-- Enhanced Data Model for Programs
-- Migration: Add new fields to programs table

-- 1. Add program code and classification fields
ALTER TABLE programs ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS sub_category VARCHAR(255);

-- 2. Add multilingual support
ALTER TABLE programs ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS description_cn TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS curriculum_en TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS curriculum_cn TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS career_prospects_en TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS career_prospects_cn TEXT;

-- 3. Add duration and schedule fields
ALTER TABLE programs ADD COLUMN IF NOT EXISTS duration_years NUMERIC(3, 1);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS start_month VARCHAR(50);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS application_start_date DATE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS application_end_date DATE;

-- 4. Add academic requirements
ALTER TABLE programs ADD COLUMN IF NOT EXISTS min_gpa NUMERIC(3, 2);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS language_requirement TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS entrance_exam_required BOOLEAN DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS entrance_exam_details TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS prerequisites JSONB;

-- 5. Add capacity and statistics
ALTER TABLE programs ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS current_applications INTEGER DEFAULT 0;

-- 6. Add currency fields for fees
ALTER TABLE programs ADD COLUMN IF NOT EXISTS application_fee_currency VARCHAR(10) DEFAULT 'CNY';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS accommodation_fee_currency VARCHAR(10) DEFAULT 'CNY';

-- 7. Enhance scholarship fields
ALTER TABLE programs ADD COLUMN IF NOT EXISTS scholarship_types JSONB;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS scholarship_coverage TEXT;

-- 8. Add media and metadata
ALTER TABLE programs ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS tags JSONB;

-- 9. Add rating and review fields
ALTER TABLE programs ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) DEFAULT 0;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- 10. Add accreditation and outcomes
ALTER TABLE programs ADD COLUMN IF NOT EXISTS accreditation JSONB;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS outcomes JSONB;

-- 11. Add application requirements
ALTER TABLE programs ADD COLUMN IF NOT EXISTS application_requirements TEXT;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS programs_code_idx ON programs(code);
CREATE INDEX IF NOT EXISTS programs_category_idx ON programs(category);
CREATE INDEX IF NOT EXISTS programs_start_month_idx ON programs(start_month);
CREATE INDEX IF NOT EXISTS programs_min_gpa_idx ON programs(min_gpa);
CREATE INDEX IF NOT EXISTS programs_rating_idx ON programs(rating);

-- Create GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS programs_tags_idx ON programs USING GIN(tags);
CREATE INDEX IF NOT EXISTS programs_scholarship_types_idx ON programs USING GIN(scholarship_types);
CREATE INDEX IF NOT EXISTS programs_prerequisites_idx ON programs USING GIN(prerequisites);

-- Update existing records to populate new fields from old fields
UPDATE programs SET
  category = discipline,
  sub_category = major,
  duration_years = CASE 
    WHEN duration_months IS NOT NULL THEN duration_months::NUMERIC / 12 
    ELSE NULL 
  END
WHERE category IS NULL OR sub_category IS NULL OR duration_years IS NULL;

-- Create program_translations table for i18n
CREATE TABLE IF NOT EXISTS program_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  curriculum TEXT,
  career_prospects TEXT,
  application_requirements TEXT,
  scholarship_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(program_id, language)
);

CREATE INDEX IF NOT EXISTS program_translations_program_id_idx ON program_translations(program_id);
CREATE INDEX IF NOT EXISTS program_translations_language_idx ON program_translations(language);

-- Create program_stats table for analytics
CREATE TABLE IF NOT EXISTS program_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  admission_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, stat_date)
);

CREATE INDEX IF NOT EXISTS program_stats_program_id_idx ON program_stats(program_id);
CREATE INDEX IF NOT EXISTS program_stats_stat_date_idx ON program_stats(stat_date);

-- Create program_reviews table
CREATE TABLE IF NOT EXISTS program_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(program_id, user_id)
);

CREATE INDEX IF NOT EXISTS program_reviews_program_id_idx ON program_reviews(program_id);
CREATE INDEX IF NOT EXISTS program_reviews_user_id_idx ON program_reviews(user_id);
CREATE INDEX IF NOT EXISTS program_reviews_rating_idx ON program_reviews(rating);

-- Create function to update program rating
CREATE OR REPLACE FUNCTION update_program_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE programs
  SET 
    rating = (SELECT AVG(rating)::NUMERIC(2,1) FROM program_reviews WHERE program_id = NEW.program_id AND is_published = TRUE),
    review_count = (SELECT COUNT(*) FROM program_reviews WHERE program_id = NEW.program_id AND is_published = TRUE)
  WHERE id = NEW.program_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating program rating
DROP TRIGGER IF EXISTS update_program_rating_trigger ON program_reviews;
CREATE TRIGGER update_program_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON program_reviews
FOR EACH ROW
EXECUTE FUNCTION update_program_rating();

-- Create program_favorites table (enhanced favorites)
CREATE TABLE IF NOT EXISTS program_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, user_id)
);

CREATE INDEX IF NOT EXISTS program_favorites_program_id_idx ON program_favorites(program_id);
CREATE INDEX IF NOT EXISTS program_favorites_user_id_idx ON program_favorites(user_id);

-- Create program_comparisons table
CREATE TABLE IF NOT EXISTS program_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_ids JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add comments to document new fields
COMMENT ON COLUMN programs.code IS 'Unique program code identifier';
COMMENT ON COLUMN programs.category IS 'Main discipline category (Engineering, Business, etc.)';
COMMENT ON COLUMN programs.sub_category IS 'Specific major or specialization';
COMMENT ON COLUMN programs.duration_years IS 'Program duration in years (decimal supported)';
COMMENT ON COLUMN programs.start_month IS 'Primary intake month (September, March, etc.)';
COMMENT ON COLUMN programs.min_gpa IS 'Minimum GPA requirement (0.0 - 4.0 scale)';
COMMENT ON COLUMN programs.language_requirement IS 'Language proficiency requirements (HSK, IELTS, etc.)';
COMMENT ON COLUMN programs.entrance_exam_required IS 'Whether entrance exam is required';
COMMENT ON COLUMN programs.capacity IS 'Maximum enrollment capacity per intake';
COMMENT ON COLUMN programs.scholarship_types IS 'Array of available scholarship types (CSC, University, etc.)';
COMMENT ON COLUMN programs.cover_image IS 'URL to program cover image';
COMMENT ON COLUMN programs.tags IS 'Array of tags for search and filtering';
COMMENT ON COLUMN programs.rating IS 'Average rating from reviews (0.0 - 5.0)';
COMMENT ON COLUMN programs.review_count IS 'Total number of published reviews';
COMMENT ON COLUMN programs.prerequisites IS 'Array of prerequisite courses or requirements';
COMMENT ON COLUMN programs.outcomes IS 'JSON object with career outcomes and statistics';
