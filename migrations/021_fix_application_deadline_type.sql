-- Migration: Fix application_deadline field type
-- Description: Change application_deadline from DATE to VARCHAR to support flexible formats like "June 30"

-- Check if application_deadline exists and is DATE type, then convert to VARCHAR
DO $$
BEGIN
    -- Check if column exists and is DATE type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'universities' 
        AND column_name = 'application_deadline'
        AND data_type = 'date'
    ) THEN
        -- Create temp column as VARCHAR
        ALTER TABLE universities ADD COLUMN IF NOT EXISTS application_deadline_temp VARCHAR(50);
        
        -- Migrate data (convert DATE to string)
        UPDATE universities 
        SET application_deadline_temp = TO_CHAR(application_deadline, 'Month DD');
        
        -- Drop old column
        ALTER TABLE universities DROP COLUMN application_deadline;
        
        -- Rename temp column
        ALTER TABLE universities RENAME COLUMN application_deadline_temp TO application_deadline;
        
        RAISE NOTICE 'Converted application_deadline from DATE to VARCHAR';
    END IF;
    
    -- Check if column doesn't exist at all
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'universities' 
        AND column_name = 'application_deadline'
    ) THEN
        -- Add as VARCHAR
        ALTER TABLE universities ADD COLUMN application_deadline VARCHAR(50);
        
        RAISE NOTICE 'Added application_deadline as VARCHAR';
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN universities.application_deadline IS 'Application deadline as text (e.g., "June 30", "Rolling", "Multiple deadlines")';
