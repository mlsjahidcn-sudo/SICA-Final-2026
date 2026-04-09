import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface StudentExport {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  nationality: string;
  passport_first_name: string;
  passport_last_name: string;
  passport_number: string;
  gender: string;
  city: string;
  province: string;
  created_at: string;
  last_sign_in_at: string;
}

interface ApplicationExport {
  id: string;
  student_name: string;
  student_email: string;
  passport_first_name: string;
  passport_last_name: string;
  nationality: string;
  program_name: string;
  degree_type: string;
  status: string;
  created_at: string;
  submitted_at: string;
}

interface PartnerExport {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  company_name: string;
  approval_status: string;
  created_at: string;
  approved_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseAdmin = getSupabaseClient();
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'students'; // students, applications, partners
    const format = searchParams.get('format') || 'csv'; // csv, json

    let data: StudentExport[] | ApplicationExport[] | PartnerExport[] = [];
    let headers: string[] = [];

    switch (type) {
      case 'students':
        const { data: students } = await supabaseAdmin
          .from('users')
          .select(`
            id,
            email,
            full_name,
            phone,
            nationality,
            created_at,
            last_sign_in_at,
            students!students_user_id_users_id_fk (
              passport_first_name,
              passport_last_name,
              passport_number,
              gender,
              city,
              province
            )
          `)
          .eq('role', 'student');
        
        data = (students || []).map((s): StudentExport => ({
          id: s.id,
          email: s.email,
          full_name: s.full_name,
          phone: s.phone || '',
          nationality: s.nationality || '',
          passport_first_name: s.students?.[0]?.passport_first_name || '',
          passport_last_name: s.students?.[0]?.passport_last_name || '',
          passport_number: s.students?.[0]?.passport_number || '',
          gender: s.students?.[0]?.gender || '',
          city: s.students?.[0]?.city || '',
          province: s.students?.[0]?.province || '',
          created_at: s.created_at,
          last_sign_in_at: s.last_sign_in_at || '',
        }));
        
        headers = [
          'ID', 'Email', 'Full Name', 'Phone', 'Nationality',
          'Passport First Name', 'Passport Last Name', 'Passport Number',
          'Gender', 'City', 'Province', 'Created At', 'Last Sign In'
        ];
        break;

      case 'applications':
        const { data: applications } = await supabaseAdmin
          .from('applications')
          .select(`
            id,
            status,
            created_at,
            submitted_at,
            passport_first_name,
            passport_last_name,
            nationality,
            users ( full_name, email ),
            programs ( name_en, degree_type )
          `);
        
        data = (applications || []).map((a): ApplicationExport => {
          const user = Array.isArray(a.users) ? a.users[0] : a.users;
          const program = Array.isArray(a.programs) ? a.programs[0] : a.programs;
          return {
            id: a.id,
            student_name: user?.full_name || '',
            student_email: user?.email || '',
            passport_first_name: a.passport_first_name,
            passport_last_name: a.passport_last_name,
            nationality: a.nationality || '',
            program_name: program?.name_en || '',
            degree_type: program?.degree_type || '',
            status: a.status,
            created_at: a.created_at,
            submitted_at: a.submitted_at || '',
          };
        });
        
        headers = [
          'ID', 'Student Name', 'Student Email', 'Passport First Name',
          'Passport Last Name', 'Nationality', 'Program', 'Degree Type',
          'Status', 'Created At', 'Submitted At'
        ];
        break;

      case 'partners':
        const { data: partners } = await supabaseAdmin
          .from('users')
          .select(`
            id,
            email,
            full_name,
            phone,
            company_name,
            approval_status,
            created_at,
            approved_at
          `)
          .eq('role', 'partner');
        
        data = (partners || []).map((p): PartnerExport => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          phone: p.phone || '',
          company_name: p.company_name || '',
          approval_status: p.approval_status,
          created_at: p.created_at,
          approved_at: p.approved_at || '',
        }));
        
        headers = [
          'ID', 'Email', 'Full Name', 'Phone', 'Company Name',
          'Status', 'Created At', 'Approved At'
        ];
        break;

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // Generate CSV
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        Object.values(row).map(val => {
          // Escape values containing commas or quotes
          const str = String(val || '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ),
    ];

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
