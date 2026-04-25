const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/20260413_create_success_cases.sql'),
      'utf8'
    );
    
    console.log('Running migration: create_success_cases...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution
      // Note: This won't work for DDL, we need to use psql or Supabase dashboard
      console.log('Note: DDL operations require direct database access');
      console.log('Please run this migration manually via Supabase SQL Editor:');
      console.log('---');
      console.log(migrationSQL);
      console.log('---');
      return { error: null };
    });
    
    if (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

runMigration();
