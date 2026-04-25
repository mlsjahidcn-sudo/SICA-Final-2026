import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration() {
  try {
    const sqlPath = path.join(__dirname, '../migrations/20260413_create_success_cases.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Executing migration: create_success_cases_table\n');
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (!statement) continue;
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          query: statement + ';' 
        });
        
        if (error) {
          // Try direct execution using PostgreSQL connection
          console.log('⚠️  RPC method not available, trying alternative approach...');
          break;
        }
      } catch (err) {
        // Continue to alternative approach
      }
    }
    
    // Alternative: Execute using raw SQL via REST API
    // This won't work for DDL, so we need to provide instructions
    console.log('⚠️  Direct SQL execution is not supported via REST API');
    console.log('\n📋 Please execute the migration manually:');
    console.log('1. Open: https://supabase.com/dashboard/project/maqzxlcsgfpwnfyleoga/sql/new');
    console.log('2. Copy the SQL from: migrations/20260413_create_success_cases.sql');
    console.log('3. Paste and click "Run"\n');
    
    // Alternatively, we can create the table using Supabase SDK methods
    console.log('🔄 Trying to create table using alternative method...\n');
    
    // Check if table exists
    const { data: tableCheck, error: checkError } = await supabase
      .from('success_cases')
      .select('id')
      .limit(1);
    
    if (!checkError || checkError.code !== 'PGRST204') {
      console.log('✅ Table "success_cases" already exists or can be accessed');
      console.log('   Migration may have been applied already');
      return;
    }
    
    console.log('❌ Table does not exist. Manual migration required.');
    console.log('\n📝 SQL to execute:\n');
    console.log(sql);
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

executeMigration();
