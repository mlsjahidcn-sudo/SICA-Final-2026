import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('   Please ensure COZE_SUPABASE_URL and COZE_SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  const email = 'admin@test.com';
  const password = 'Admin123!';
  const fullName = 'Test Admin';

  console.log('🔐 Creating admin account...\n');

  try {
    // Check if admin already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .maybeSingle();

    if (existingUsers) {
      console.log('✅ Admin already exists:');
      console.log('   Email:', email);
      console.log('   Role:', existingUsers.role);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('   Login credentials:');
      console.log('   Email: admin@test.com');
      console.log('   Password: Admin123!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('📍 Login page: http://localhost:3000/login\n');
      return;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin',
          full_name: fullName
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists in auth system');
        console.log('   Updating role to admin...\n');
        
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
          await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', existingUser.id);

          console.log('✅ Admin role updated!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('   Email: admin@test.com');
          console.log('   Password: Admin123!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
        return;
      }
      
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    console.log('✅ Auth user created');

    // Create user record
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: email,
        role: 'admin',
        full_name: fullName
      });

    if (userError) {
      console.error('❌ Failed to create user record:', userError.message);
      return;
    }

    console.log('✅ User record created');
    console.log('\n🎉 Admin account created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Login credentials:');
    console.log('   Email: admin@test.com');
    console.log('   Password: Admin123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📍 Login page: http://localhost:3000/login\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdmin();
