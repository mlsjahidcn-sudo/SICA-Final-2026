-- Migration: Fix universities schema and enable multi-select type
-- Description: Add missing address field and change type to JSONB array for multi-select support

-- Add missing address field if it doesn't exist
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Change type field from VARCHAR to JSONB to support multiple classifications
-- First, create a temporary column to store existing data
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS type_new JSONB;

-- Migrate existing type data to array format
-- Convert single type values to arrays (e.g., '985' -> ['985'])
UPDATE universities 
SET type_new = CASE 
  WHEN type IS NOT NULL THEN jsonb_build_array(type)
  ELSE jsonb_build_array('Provincial')::jsonb
END;

-- Drop the old type column
ALTER TABLE universities DROP COLUMN type;

-- Rename the new column to type
ALTER TABLE universities RENAME COLUMN type_new TO type;

-- Set NOT NULL constraint on type column
ALTER TABLE universities ALTER COLUMN type SET NOT NULL;

-- Add comment documenting the change
COMMENT ON COLUMN universities.type IS 'Array of university classifications (e.g., ["985", "211", "Double First-Class"])';

-- Update existing records to ensure type is always an array
UPDATE universities 
SET type = COALESCE(type, '["Provincial"]'::jsonb)
WHERE type IS NULL;
