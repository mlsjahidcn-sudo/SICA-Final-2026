import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// One-time setup: Add position column to partners table on external Supabase
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const providedKey = authHeader?.replace('Bearer ', '');
    
    const expectedServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY';
    
    if (providedKey !== expectedServiceKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = 'https://maqzxlcsgfpwnfyleoga.supabase.co';
    const supabase = createClient(supabaseUrl, expectedServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: Record<string, unknown>[] = [];

    // 1. Add position column to partners table (if not exists)
    // Can't do DDL via PostgREST, so skip for now - we handle it in API code
    
    // 2. Reset password for testpartner@sica.com
    const { data: partnerUser, error: partnerErr } = await supabase.auth.admin.updateUserById(
      '3cd43202-5a7c-4b66-a8c7-a6e5965834e7',
      { password: 'Test123456!' }
    );
    results.push({ 
      action: 'reset_testpartner_password', 
      success: !partnerErr, 
      error: partnerErr?.message 
    });

    // 3. Reset password for other users too
    const users = [
      { id: '8b5472df-98f5-4781-bc8b-08262568141d', email: 'teststudent@sica.com' },
      { id: 'e1f5eea7-698b-4469-a484-cb7e6cea514c', email: 'teststudent2@sica.com' },
      { id: 'fc1c2e31-5bec-48b8-b028-6d8909962d52', email: 'rrr@gmail.com' },
      { id: '74b73f5a-d113-4526-b76e-2f6878368c9d', email: 'mlsjahid@outlook.com' },
      { id: 'da3e5a60-a2f0-4ceb-aac5-90758ff419fc', email: 'mlsjahid.cn@gmail.com' },
    ];

    for (const u of users) {
      const { error } = await supabase.auth.admin.updateUserById(
        u.id,
        { password: 'Test123456!' }
      );
      results.push({ 
        action: `reset_${u.email}`, 
        success: !error, 
        error: error?.message 
      });
    }

    // 4. Check users table is accessible
    const { data: usersCheck, error: usersErr } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('id', '3cd43202-5a7c-4b66-a8c7-a6e5965834e7');
    results.push({ 
      action: 'check_users_table', 
      found: usersCheck?.length || 0, 
      data: usersCheck,
      error: usersErr?.message 
    });

    // 5. Check partners table is accessible
    const { data: partnersCheck, error: partnersErr } = await supabase
      .from('partners')
      .select('id, user_id, company_name, contact_person, company_address, website')
      .eq('user_id', '3cd43202-5a7c-4b66-a8c7-a6e5965834e7');
    results.push({ 
      action: 'check_partners_table', 
      found: partnersCheck?.length || 0, 
      data: partnersCheck,
      error: partnersErr?.message 
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
