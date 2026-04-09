-- Enhance Student Profile for Education Consultancy Requirements
-- Migration: Restructure for international student admissions consultancy
-- Adds: family members (JSONB), education history (JSONB)
-- Removes: visa fields, criminal record, previous china study (not needed from students)

-- ============================================================================
-- 1. Add new columns
-- ============================================================================

-- Personal information
ALTER TABLE students ADD COLUMN IF NOT EXISTS chinese_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS religion VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Passport only (no visa info needed from students)
ALTER TABLE students ADD COLUMN IF NOT EXISTS passport_issuing_country VARCHAR(100);

-- Education history (JSONB array - supports multiple institutions)
ALTER TABLE students ADD COLUMN IF NOT EXISTS education_history JSONB DEFAULT '[]';
-- education_history schema: [{ institution: string, degree: string, field_of_study: string, start_date: string, end_date: string, gpa: string, city: string, country: string }]

-- Family information (JSONB array - supports multiple family members)
ALTER TABLE students ADD COLUMN IF NOT EXISTS family_members JSONB DEFAULT '[]';
-- family_members schema: [{ name: string, relationship: string, occupation: string, phone: string, email: string, address: string }]

-- Work experience (JSONB array)
ALTER TABLE students ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]';
-- work_experience schema: [{ company: string, position: string, start_date: string, end_date: string, description: string }]

-- Study preferences (relevant for consultancy processing)
ALTER TABLE students ADD COLUMN IF NOT EXISTS study_mode VARCHAR(20) DEFAULT 'full_time';
ALTER TABLE students ADD COLUMN IF NOT EXISTS funding_source VARCHAR(50);

-- Communication
ALTER TABLE students ADD COLUMN IF NOT EXISTS wechat_id VARCHAR(50);

-- ============================================================================
-- 2. Drop columns not needed from students (visa/criminal/previous china study)
-- ============================================================================

-- These fields are NOT needed from students since the consultancy handles
-- visa processing and university submissions internally
ALTER TABLE students DROP COLUMN IF EXISTS current_visa_type;
ALTER TABLE students DROP COLUMN IF EXISTS has_criminal_record;
ALTER TABLE students DROP COLUMN IF EXISTS criminal_record_details;
ALTER TABLE students DROP COLUMN IF EXISTS previous_china_study;
ALTER TABLE students DROP COLUMN IF EXISTS previous_china_study_details;
ALTER TABLE students DROP COLUMN IF EXISTS health_condition;

-- ============================================================================
-- 3. Add column comments for documentation
-- ============================================================================

COMMENT ON COLUMN students.chinese_name IS 'Chinese name (中文名) for registration with Chinese education system';
COMMENT ON COLUMN students.marital_status IS 'Marital status: single, married, divorced, widowed - required for university forms';
COMMENT ON COLUMN students.religion IS 'Religious affiliation - some Chinese universities require this';
COMMENT ON COLUMN students.postal_code IS 'Postal code for correspondence';
COMMENT ON COLUMN students.passport_issuing_country IS 'Country that issued the passport (may differ from nationality)';
COMMENT ON COLUMN students.education_history IS 'JSONB array of education history entries - supports multiple institutions';
COMMENT ON COLUMN students.family_members IS 'JSONB array of family member entries - required by many Chinese universities';
COMMENT ON COLUMN students.work_experience IS 'JSONB array of work experience entries for graduate program applications';
COMMENT ON COLUMN students.study_mode IS 'Preferred study mode: full_time or part_time';
COMMENT ON COLUMN students.funding_source IS 'Funding source: self_funded, csc_scholarship, university_scholarship, government_scholarship, other';
COMMENT ON COLUMN students.wechat_id IS 'WeChat ID - primary communication method in China';

-- ============================================================================
-- 4. Add check constraints
-- ============================================================================

ALTER TABLE students ADD CONSTRAINT students_marital_status_check
  CHECK (marital_status IS NULL OR marital_status IN ('single', 'married', 'divorced', 'widowed'));

ALTER TABLE students ADD CONSTRAINT students_study_mode_check
  CHECK (study_mode IS NULL OR study_mode IN ('full_time', 'part_time'));

ALTER TABLE students ADD CONSTRAINT students_funding_source_check
  CHECK (funding_source IS NULL OR funding_source IN (
    'self_funded', 'csc_scholarship', 'university_scholarship',
    'government_scholarship', 'other'
  ));

-- ============================================================================
-- 5. Add indexes for commonly queried new fields
-- ============================================================================

CREATE INDEX IF NOT EXISTS students_funding_source_idx ON students(funding_source)
  WHERE funding_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS students_study_mode_idx ON students(study_mode)
  WHERE study_mode IS NOT NULL;

CREATE INDEX IF NOT EXISTS students_passport_issuing_country_idx ON students(passport_issuing_country)
  WHERE passport_issuing_country IS NOT NULL;

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS students_work_experience_idx ON students USING GIN(work_experience);
CREATE INDEX IF NOT EXISTS students_education_history_idx ON students USING GIN(education_history);
CREATE INDEX IF NOT EXISTS students_family_members_idx ON students USING GIN(family_members);

-- ============================================================================
-- 6. Fix RLS policies - replace overly permissive policies with proper auth checks
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS students_用户读取自己的数据 ON students;
DROP POLICY IF EXISTS students_用户插入自己的数据 ON students;
DROP POLICY IF EXISTS students_用户更新自己的数据 ON students;
DROP POLICY IF EXISTS students_用户删除自己的数据 ON students;

-- Create helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Create helper function to check partner role
CREATE OR REPLACE FUNCTION is_partner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'partner'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- SELECT: Students can read own data, admins can read all, partners can read students linked to them
CREATE POLICY students_select_own ON students
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR (is_partner() AND assigned_partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    ))
  );

-- INSERT: Students can insert their own data, admins can insert any
CREATE POLICY students_insert_own ON students
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- UPDATE: Students can update their own data, admins can update any
CREATE POLICY students_update_own ON students
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- DELETE: Students can delete their own data, admins can delete any
CREATE POLICY students_delete_own ON students
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ============================================================================
-- 7. Add updated_at trigger for automatic timestamp updates
-- ============================================================================

CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS students_updated_at_trigger ON students;
CREATE TRIGGER students_updated_at_trigger
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_students_updated_at();

-- ============================================================================
-- 8. Add profile_snapshot to applications table for profile sync
-- ============================================================================

ALTER TABLE applications ADD COLUMN IF NOT EXISTS profile_snapshot JSONB;
COMMENT ON COLUMN applications.profile_snapshot IS 'Snapshot of student profile data at time of application creation, for auto-population and reference';

-- ============================================================================
-- 9. Ensure RLS is enabled on the students table
-- ============================================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
