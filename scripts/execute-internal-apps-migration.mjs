import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   COZE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   COZE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
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
    const sqlPath = path.join(__dirname, '../migrations/022_internal_applications.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Executing migration: 022_internal_applications\n');
    console.log('📋 SQL File:', sqlPath);
    console.log('');
    
    // Check if table already exists
    const { data: tableCheck, error: checkError } = await supabase
      .from('internal_applications')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Table "internal_applications" already exists');
      console.log('   Migration may have been applied already');
      return;
    }
    
    console.log('⚠️  Table does not exist, need to create it\n');
    
    // Try to execute SQL using the pg_net extension or direct query
    // Since we can't execute DDL via REST API, we need to use a workaround
    
    console.log('📝 Please execute the migration manually:');
    console.log('');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/maqzxlcsgfpwnfyleoga/sql/new');
    console.log('');
    console.log('2. Copy the SQL below and paste it into the editor:');
    console.log('');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('');
    console.log('3. Click "Run" to execute the migration');
    console.log('');
    
    // Try alternative: execute via psql if available
    console.log('🔄 Attempting alternative execution via psql...\n');
    
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not found');
      }
      
      // Execute the SQL file using psql
      const { stdout, stderr } = await execAsync(
        `PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\\(.*\\)@.*/\\1/p') psql "${databaseUrl}" -f "${sqlPath}"`
      );
      
      if (stderr && !stderr.includes('already exists')) {
        console.error('⚠️  psql stderr:', stderr);
      }
      
      console.log('✅ Migration executed successfully via psql');
      console.log(stdout);
      
      // Verify table creation
      const { data: verify, error: verifyError } = await supabase
        .from('internal_applications')
        .select('id')
        .limit(1);
      
      if (!verifyError) {
        console.log('\n✅ Table "internal_applications" created successfully!');
      }
      
    } catch (psqlError) {
      console.log('⚠️  Could not execute via psql:', psqlError.message);
      console.log('\n📋 Please execute the migration manually using the Supabase dashboard');
    }
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

executeMigration();
