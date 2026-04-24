import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import { createRateLimitMiddleware, rateLimitPresets } from '@/lib/rate-limit';
import { errors } from '@/lib/api-response';

const exportRateLimit = createRateLimitMiddleware(rateLimitPresets.export);

interface StudentExport {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  nationality: string;
  first_name: string;
  last_name: string;
  passport_number: string;
  gender: string;
  created_at: string;
}

interface ApplicationExport {
  id: string;
  student_name: string;
  student_email: string;
  nationality: string;
  program_name: string;
  degree_level: string;
  university_name: string;
  status: string;
  created_at: string;
  submitted_at: string;
}

interface PartnerExport {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  status: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = exportRateLimit(request);
    if (!rateLimitResult.allowed) {
      return errors.rateLimit(rateLimitResult.resetTime);
    }

    // Use centralized auth helper
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabaseAdmin = getSupabaseClient();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'students';
    const format = searchParams.get('format') || 'csv';

    let data: StudentExport[] | ApplicationExport[] | PartnerExport[] = [];
    let headers: string[] = [];

    switch (type) {
      case 'students': {
        const { data: students } = await supabaseAdmin
          .from('users')
          .select(`
            id,
            email,
            full_name,
            phone,
            created_at,
            students (
              first_name,
              last_name,
              passport_number,
              nationality,
              gender
            )
          `)
          .eq('role', 'student');
        
        data = (students || []).map((s): StudentExport => {
          const student = Array.isArray(s.students) ? s.students[0] : s.students;
          return {
            id: s.id,
            email: s.email,
            full_name: s.full_name,
            phone: s.phone || '',
            nationality: student?.nationality || '',
            first_name: student?.first_name || '',
            last_name: student?.last_name || '',
            passport_number: student?.passport_number || '',
            gender: student?.gender || '',
            created_at: s.created_at,
          };
        });
        
        headers = [
          'ID', 'Email', 'Full Name', 'Phone', 'Nationality',
          'First Name', 'Last Name', 'Passport Number',
          'Gender', 'Created At'
        ];
        break;
      }

      case 'applications': {
        const { data: applications } = await supabaseAdmin
          .from('applications')
          .select(`
            id,
            status,
            created_at,
            submitted_at,
            students (
              first_name,
              last_name,
              nationality,
              email,
              users (
                full_name,
                email
              )
            ),
            programs (
              name,
              degree_level,
              universities (
                name_en
              )
            )
          `);
        
        data = (applications || []).map((a): ApplicationExport => {
          const student = Array.isArray(a.students) ? a.students[0] : a.students;
          const studentUser = student?.users
            ? (Array.isArray(student.users) ? student.users[0] : student.users)
            : null;
          const program = Array.isArray(a.programs) ? a.programs[0] : a.programs;
          const university = program?.universities
            ? (Array.isArray(program.universities) ? program.universities[0] : program.universities)
            : null;
          return {
            id: a.id,
            student_name: studentUser?.full_name || student?.first_name || '',
            student_email: studentUser?.email || student?.email || '',
            nationality: student?.nationality || '',
            program_name: program?.name || '',
            degree_level: program?.degree_level || '',
            university_name: university?.name_en || '',
            status: a.status,
            created_at: a.created_at,
            submitted_at: a.submitted_at || '',
          };
        });
        
        headers = [
          'ID', 'Student Name', 'Student Email', 'Nationality',
          'Program', 'Degree Level', 'University',
          'Status', 'Created At', 'Submitted At'
        ];
        break;
      }

      case 'partners': {
        const { data: partners } = await supabaseAdmin
          .from('partners')
          .select(`
            id,
            company_name,
            contact_person,
            status,
            created_at,
            users (
              email,
              full_name
            )
          `);
        
        data = (partners || []).map((p): PartnerExport => {
          const partnerUser = Array.isArray(p.users) ? p.users[0] : p.users;
          return {
            id: p.id,
            email: partnerUser?.email || '',
            full_name: partnerUser?.full_name || p.contact_person || '',
            company_name: p.company_name || '',
            status: p.status || '',
            created_at: p.created_at,
          };
        });
        
        headers = [
          'ID', 'Email', 'Full Name', 'Company Name',
          'Status', 'Created At'
        ];
        break;
      }

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
