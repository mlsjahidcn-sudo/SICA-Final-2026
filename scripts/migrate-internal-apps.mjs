import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

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

const sql = fs.readFileSync(path.join(__dirname, '../migrations/022_internal_applications.sql'), 'utf8');

async function runMigration() {
  console.log('🚀 Executing migration via Supabase SQL API...\n');
  
  try {
    // Try using the exec_sql RPC function if it exists
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.log('⚠️  RPC method not available, trying direct table creation...\n');
      
      // Fallback: Create the table by making a simple insert that will fail
      // but this won't work for DDL. We need to use a different approach.
      
      console.log('Please execute the migration manually in Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/maqzxlcsgfpwnfyleoga/sql/new\n');
      console.log('Or run this command:\n');
      console.log('cat migrations/022_internal_applications.sql | psql $DATABASE_URL\n');
      
      // As a last resort, try to create the table using the REST API
      // This won't work for DDL, but let's show a helpful message
      console.log('\n📋 SQL to execute:\n');
      console.log('```sql');
      console.log(sql);
      console.log('```\n');
      
      process.exit(1);
    }
    
    console.log('✅ Migration executed successfully!');
    console.log('   Table created: internal_applications');
    
    // Verify the table exists
    const { data: verifyData, error: verifyError } = await supabase
      .from('internal_applications')
      .select('id')
      .limit(1);
    
    if (verifyError) {
      console.log('⚠️  Warning: Could not verify table creation:', verifyError.message);
    } else {
      console.log('✅ Table verified and ready to use!');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runMigration();
