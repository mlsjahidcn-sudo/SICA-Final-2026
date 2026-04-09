/**
 * Seed script to create test users for development
 * 
 * Creates:
 * - Admin user: admin@test.com
 * - Partner user: partner@test.com
 * - Student user: student@test.com
 * 
 * Password for all: Test123456!
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.COZE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please set COZE_SUPABASE_URL and COZE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_PASSWORD = 'Test123456!';

const testUsers = [
  {
    email: 'admin@test.com',
    password: TEST_PASSWORD,
    full_name: 'Test Admin',
    role: 'admin',
    approval_status: 'approved',
  },
  {
    email: 'partner@test.com',
    password: TEST_PASSWORD,
    full_name: 'Test Partner',
    role: 'partner',
    approval_status: 'approved', // Pre-approve for testing
  },
  {
    email: 'student@test.com',
    password: TEST_PASSWORD,
    full_name: 'Test Student',
    role: 'student',
    approval_status: 'approved',
  },
];

async function createUser(userData: typeof testUsers[0]) {
  console.log(`\n📝 Creating user: ${userData.email}`);
  
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userData.email)
      .single();
    
    if (existingUser) {
      console.log(`  ⚠️  User ${userData.email} already exists, skipping...`);
      return;
    }

    // Create auth user with admin API (auto-confirm email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role,
        },
        emailRedirectTo: undefined, // Disable email confirmation redirect
      },
    });

    if (authError) {
      // If signUp fails, try using admin invite
      if (authError.message.includes('already registered')) {
        console.log(`  ⚠️  Auth user ${userData.email} already exists, updating profile...`);
        
        // Get existing user
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingAuthUser = users.find(u => u.email === userData.email);
        
        if (existingAuthUser) {
          // Update user profile
          const { error: updateError } = await supabase
            .from('users')
            .upsert({
              id: existingAuthUser.id,
              email: existingAuthUser.email!,
              full_name: userData.full_name,
              role: userData.role,
              approval_status: userData.approval_status,
              updated_at: new Date().toISOString(),
            });
          
          if (updateError) {
            console.error(`  ❌ Failed to update profile: ${updateError.message}`);
          } else {
            console.log(`  ✅ Updated profile for ${userData.email}`);
          }
        }
        return;
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    // Auto-confirm email using admin API
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      authData.user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.log(`  ⚠️  Could not auto-confirm email: ${confirmError.message}`);
    }

    // Create/update user profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        approval_status: userData.approval_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error(`  ❌ Failed to create profile: ${profileError.message}`);
    } else {
      console.log(`  ✅ Created ${userData.role} user: ${userData.email}`);
    }
  } catch (error) {
    console.error(`  ❌ Error creating user ${userData.email}:`, error);
  }
}

async function main() {
  console.log('🌱 Seeding test users...\n');
  console.log('======================================');
  console.log('Test Credentials:');
  console.log('======================================');
  console.log('Admin:   admin@test.com');
  console.log('Partner: partner@test.com');
  console.log('Student: student@test.com');
  console.log('Password: Test123456!');
  console.log('======================================\n');

  for (const userData of testUsers) {
    await createUser(userData);
  }

  console.log('\n✅ Seed completed!');
}

main().catch(console.error);
