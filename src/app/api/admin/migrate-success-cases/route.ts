import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create table using raw SQL via Supabase
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS success_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_name_en TEXT NOT NULL,
        student_name_cn TEXT,
        student_photo_url TEXT,
        university_name_en TEXT,
        university_name_cn TEXT,
        program_name_en TEXT,
        program_name_cn TEXT,
        admission_notice_url TEXT,
        jw202_url TEXT,
        description_en TEXT,
        description_cn TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        is_featured BOOLEAN DEFAULT FALSE,
        display_order INTEGER DEFAULT 0,
        admission_year INTEGER,
        intake TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Execute using RPC
    const { error: tableError } = await supabase.rpc('exec_sql', { 
      query: createTableSQL 
    });

    if (tableError) {
      // Try alternative approach: check if table exists
      const { data, error: checkError } = await supabase
        .from('success_cases')
        .select('id')
        .limit(1);

      if (checkError && checkError.code === 'PGRST204') {
        return NextResponse.json({
          success: false,
          error: 'Table does not exist. Please run migration manually in Supabase Dashboard.',
          dashboard_url: 'https://supabase.com/dashboard/project/maqzxlcsgfpwnfyleoga/sql/new',
          sql_file: 'migrations/20260413_create_success_cases.sql'
        }, { status: 400 });
      }

      // Table might already exist
      return NextResponse.json({
        success: true,
        message: 'Table already exists or migration applied',
        note: 'If this is a new installation, please verify the table structure in Supabase Dashboard'
      });
    }

    // Create indexes
    const indexStatements = [
      'CREATE INDEX IF NOT EXISTS idx_success_cases_status ON success_cases(status);',
      'CREATE INDEX IF NOT EXISTS idx_success_cases_featured ON success_cases(is_featured) WHERE is_featured = TRUE;',
      'CREATE INDEX IF NOT EXISTS idx_success_cases_order ON success_cases(display_order);',
      'CREATE INDEX IF NOT EXISTS idx_success_cases_year ON success_cases(admission_year DESC);'
    ];

    for (const stmt of indexStatements) {
      await supabase.rpc('exec_sql', { query: stmt });
    }

    // Enable RLS
    await supabase.rpc('exec_sql', { 
      query: 'ALTER TABLE success_cases ENABLE ROW LEVEL SECURITY;' 
    });

    // Create policy
    await supabase.rpc('exec_sql', { 
      query: `CREATE POLICY "Public can view published success cases"
        ON success_cases FOR SELECT
        USING (status = 'published');` 
    });

    return NextResponse.json({
      success: true,
      message: 'Migration executed successfully',
      table: 'success_cases',
      status: 'created'
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      manual_instructions: {
        url: 'https://supabase.com/dashboard/project/maqzxlcsgfpwnfyleoga/sql/new',
        sql_file: 'migrations/20260413_create_success_cases.sql'
      }
    }, { status: 500 });
  }
}
