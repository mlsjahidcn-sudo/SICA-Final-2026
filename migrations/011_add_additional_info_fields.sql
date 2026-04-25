-- Add Additional Information fields to Student Profile
-- Migration: 011 - Adds extracurricular activities, awards, publications, research experience,
-- scholarship application, and financial guarantee as JSONB columns

-- ============================================================================
-- 1. Add new JSONB columns for Additional Information
-- ============================================================================

-- Extracurricular activities (JSONB array)
ALTER TABLE students ADD COLUMN IF NOT EXISTS extracurricular_activities JSONB DEFAULT '[]';
-- extracurricular_activities schema: [{ activity: string, role: string, organization: string, start_date: string, end_date: string, description: string }]

-- Awards and achievements (JSONB array)
ALTER TABLE students ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '[]';
-- awards schema: [{ title: string, issuing_organization: string, date: string, description: string, certificate_url: string }]

-- Publications (JSONB array)
ALTER TABLE students ADD COLUMN IF NOT EXISTS publications JSONB DEFAULT '[]';
-- publications schema: [{ title: string, publisher: string, publication_date: string, url: string, description: string }]

-- Research experience (JSONB array)
ALTER TABLE students ADD COLUMN IF NOT EXISTS research_experience JSONB DEFAULT '[]';
-- research_experience schema: [{ topic: string, institution: string, supervisor: string, start_date: string, end_date: string, description: string }]

-- Scholarship application (JSONB single object)
ALTER TABLE students ADD COLUMN IF NOT EXISTS scholarship_application JSONB;
-- scholarship_application schema: { type: string, name: string, coverage: string, status: string, notes: string }

-- Financial guarantee (JSONB single object)
ALTER TABLE students ADD COLUMN IF NOT EXISTS financial_guarantee JSONB;
-- financial_guarantee schema: { guarantor_name: string, guarantor_relationship: string, guarantor_occupation: string, annual_income: string, income_currency: string, bank_statement_url: string, sponsor_letter_url: string }

-- ============================================================================
-- 2. Add column comments for documentation
-- ============================================================================

COMMENT ON COLUMN students.extracurricular_activities IS 'JSONB array of extracurricular activities - supports multiple entries for university applications';
COMMENT ON COLUMN students.awards IS 'JSONB array of awards and achievements - supports multiple entries';
COMMENT ON COLUMN students.publications IS 'JSONB array of publications - for graduate program applications';
COMMENT ON COLUMN students.research_experience IS 'JSONB array of research experience - for graduate program applications';
COMMENT ON COLUMN students.scholarship_application IS 'JSONB object for scholarship application details - single entry per application cycle';
COMMENT ON COLUMN students.financial_guarantee IS 'JSONB object for financial guarantee information - single entry with guarantor and income details';

-- ============================================================================
-- 3. Add GIN indexes for JSONB columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS students_extracurricular_activities_idx ON students USING GIN(extracurricular_activities);
CREATE INDEX IF NOT EXISTS students_awards_idx ON students USING GIN(awards);
CREATE INDEX IF NOT EXISTS students_publications_idx ON students USING GIN(publications);
CREATE INDEX IF NOT EXISTS students_research_experience_idx ON students USING GIN(research_experience);
