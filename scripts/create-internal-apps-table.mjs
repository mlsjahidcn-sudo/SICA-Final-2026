import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function createTable() {
  console.log('🚀 Creating internal_applications table...\n');
  
  // SQL to create the table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS internal_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_name TEXT NOT NULL,
      passport TEXT,
      nationality TEXT,
      degree TEXT,
      major TEXT,
      university_choice TEXT,
      overview TEXT,
      missing_docs JSONB DEFAULT '[]',
      remarks_for_university TEXT,
      status TEXT DEFAULT 'pending',
      user_id TEXT,
      email TEXT,
      portal_link TEXT,
      partner TEXT,
      note TEXT,
      application_date DATE,
      follow_up_date DATE,
      comments TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES users(id) ON DELETE SET NULL
    );
  `;
  
  // Try using the exec_sql RPC function
  try {
    console.log('⏳ Attempting to create table via RPC...');
    const { error: rpcError } = await supabase.rpc('exec_sql', { query: createTableSQL });
    
    if (rpcError) {
      console.log('⚠️  RPC method not available, using direct approach...\n');
      throw new Error('RPC not available');
    }
    
    console.log('✅ Table created via RPC!');
    return await verifyTable();
    
  } catch (rpcError) {
    // Fallback: Use the Postgres.js approach or provide manual instructions
    console.log('📋 Direct SQL execution required.\n');
    console.log('Please execute this SQL in the Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/maqzxlcsgfpwnfyleoga/sql/new\n');
    console.log('─'.repeat(80));
    console.log(createTableSQL);
    console.log('─'.repeat(80));
    console.log();
    
    // Try using fetch to call the SQL endpoint directly
    console.log('🔄 Attempting to use SQL execution endpoint...\n');
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: createTableSQL })
      });
      
      if (response.ok) {
        console.log('✅ Table created successfully!');
        return await verifyTable();
      }
    } catch (fetchError) {
      console.log('⚠️  Direct API call failed');
    }
    
    console.log('\n❌ Could not create table automatically.');
    console.log('📌 Please create it manually using the SQL above.');
    return false;
  }
}

async function verifyTable() {
  console.log('\n🔍 Verifying table creation...\n');
  
  const { data, error } = await supabase
    .from('internal_applications')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('❌ Table verification failed:', error.message);
    return false;
  }
  
  console.log('✅ Table "internal_applications" is accessible!');
  
  // Get table structure via REST API
  const { data: columns, error: colError } = await supabase
    .rpc('get_table_columns', { table_name: 'internal_applications' })
    .catch(() => ({ data: null, error: 'RPC not available' }));
  
  console.log('\n📊 Table is ready for use!\n');
  return true;
}

createTable().then(success => {
  process.exit(success ? 0 : 1);
});
