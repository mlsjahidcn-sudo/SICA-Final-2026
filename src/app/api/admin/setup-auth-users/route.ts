import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is a one-time setup script to create auth users for existing public.users
export async function POST(request: NextRequest) {
  try {
    // Verify this is called with the service role key
    const authHeader = request.headers.get('authorization');
    const providedKey = authHeader?.replace('Bearer ', '');
    
    const supabaseUrl = 'https://maqzxlcsgfpwnfyleoga.supabase.co';
    const expectedServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY';
    
    if (providedKey !== expectedServiceKey) {
      return NextResponse.json({ error: 'Unauthorized', hint: 'Use service role key' }, { status: 401 });
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, expectedServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Define the known users from public.users (with UUID format)
    const usersToCreate = [
      { id: 'a0000000-0000-0000-0000-000000000001', email: 'admin@studyinchina.academy', role: 'admin', full_name: 'Admin User' },
      { id: 'a0000000-0000-0000-0000-000000000002', email: 'partner@example.com', role: 'partner', full_name: 'Partner User' },
      { id: 'a0000000-0000-0000-0000-000000000003', email: 'student1@example.com', role: 'student', full_name: 'John Smith' },
      { id: 'a0000000-0000-0000-0000-000000000004', email: 'student2@example.com', role: 'student', full_name: 'Jane Doe' },
      { id: 'a0000000-0000-0000-0000-000000000005', email: 'student3@example.com', role: 'student', full_name: 'Ahmed Hassan' },
    ];

    const results = [];
    const defaultPassword = 'Test123456!';

    // First, list all existing auth users
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    console.log('Existing auth users:', existingUsers?.users?.map(u => u.email));
    
    if (listError) {
      console.error('Error listing users:', listError);
    }

    for (const user of usersToCreate) {
      console.log(`Processing user: ${user.email} with ID: ${user.id}`);
      
      // Check if auth user already exists by ID
      const existingUser = existingUsers?.users?.find(u => u.id === user.id || u.email === user.email);
      
      if (existingUser) {
        results.push({ email: user.email, status: 'already_exists', id: existingUser.id });
        continue;
      }

      // Create auth user with the same ID
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        id: user.id,
        email: user.email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          role: user.role,
          full_name: user.full_name,
        },
      });

      if (authError) {
        console.error(`Error creating auth user ${user.email}:`, authError);
        results.push({ email: user.email, status: 'error', error: authError.message });
      } else {
        console.log(`Created auth user: ${user.email} with ID: ${authData.user?.id}`);
        results.push({ email: user.email, status: 'created', id: authData.user?.id });
      }
    }

    // List auth users after creation
    const { data: finalUsers } = await supabase.auth.admin.listUsers();
    const authUserCount = finalUsers?.users?.length || 0;

    return NextResponse.json({
      success: true,
      message: 'Auth users setup complete',
      defaultPassword,
      totalAuthUsers: authUserCount,
      results,
    });
  } catch (error) {
    console.error('Setup auth users error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
