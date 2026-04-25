import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

// GET /api/admin/partners - Get all partner users for admin approval
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Query partner-role users from users table with their partner org info
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        company_name,
        country,
        city,
        website,
        approval_status,
        rejection_reason,
        approved_at,
        created_at,
        updated_at,
        partners(
          id,
          company_name,
          contact_person,
          contact_phone,
          website,
          status,
          commission_rate,
          total_referrals,
          successful_referrals
        )
      `, { count: 'exact' })
      .eq('role', 'partner')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('approval_status', status);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`email.ilike.${searchTerm},full_name.ilike.${searchTerm},company_name.ilike.${searchTerm}`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: partners, error, count } = await query;

    if (error) {
      console.error('Error fetching partners:', error);
      return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
    }

    // Get stats
    const { data: statsData } = await supabase
      .from('users')
      .select('approval_status')
      .eq('role', 'partner');

    const statusCounts = (statsData || []).reduce((acc, u) => {
      const s = u.approval_status || 'approved';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Transform data for the admin UI
    const transformedPartners = (partners || []).map(p => {
      const partnerOrg = Array.isArray(p.partners) ? p.partners[0] : p.partners;
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        phone: p.phone,
        company_name: p.company_name || partnerOrg?.company_name || 'N/A',
        contact_name: p.full_name,
        contact_phone: p.phone || partnerOrg?.contact_phone,
        website: p.website || partnerOrg?.website,
        country: p.country,
        city: p.city,
        status: p.approval_status || 'approved',
        rejection_reason: p.rejection_reason,
        approved_at: p.approved_at,
        partner_org_id: partnerOrg?.id || null,
        commission_rate: partnerOrg?.commission_rate || 0,
        total_referrals: partnerOrg?.total_referrals || 0,
        successful_referrals: partnerOrg?.successful_referrals || 0,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });

    return NextResponse.json({
      partners: transformedPartners,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      stats: {
        total: statsData?.length || 0,
        pending: statusCounts['pending'] || 0,
        approved: statusCounts['approved'] || 0,
        rejected: statusCounts['rejected'] || 0,
      },
    });
  } catch (error) {
    console.error('Error in admin partners API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/partners - Create a new partner (admin-created)
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const {
      user_id,
      company_name,
      company_address,
      business_license,
      contact_person,
      contact_phone,
      website,
      status,
      commission_rate,
    } = body;

    if (!company_name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Only insert columns that exist on the partners table
    const { data: partner, error } = await supabase
      .from('partners')
      .insert({
        user_id,
        company_name,
        company_address,
        business_license,
        contact_person,
        contact_phone,
        website,
        status: status || 'active',
        commission_rate,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating partner:', error);
      return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 });
    }

    return NextResponse.json({ partner });
  } catch (error) {
    console.error('Error in create partner API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
