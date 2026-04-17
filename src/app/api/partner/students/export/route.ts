import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth, getPartnerAdminId } from '@/lib/partner-auth-utils';
import ExcelJS from 'exceljs';

/**
 * Get the list of user IDs whose students the current partner user can see.
 */
async function getVisibleReferrerIds(user: { id: string; partner_role: string | null; partner_id: string | null }): Promise<string[]> {
  const supabase = getSupabaseClient();
  const isAdmin = !user.partner_role || user.partner_role === 'partner_admin';
  
  if (isAdmin) {
    const { data: teamMembers } = await supabase
      .from('users')
      .select('id')
      .or(`id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq('role', 'partner');
    
    const ids = (teamMembers || []).map(m => m.id);
    if (!ids.includes(user.id)) ids.push(user.id);
    return ids;
  } else {
    return [user.id];
  }
}

// GET /api/partner/students/export - Export students to Excel
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;
    const partnerUser = authResult.user;

    const supabase = getSupabaseClient();
    const referrerIds = await getVisibleReferrerIds(partnerUser);

    // Get students referred by any of these partner users
    const { data: referredUsers } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        created_at,
        students (
          id,
          nationality,
          date_of_birth,
          gender,
          current_address,
          chinese_name,
          passport_number,
          passport_expiry_date,
          highest_education,
          gpa,
          hsk_level,
          ielts_score,
          emergency_contact_name,
          emergency_contact_phone
        )
      `)
      .in('referred_by_partner_id', referrerIds)
      .eq('role', 'student');

    // Build students list
    const studentsList = [];
    for (const userData of referredUsers || []) {
      const studentRecords = Array.isArray(userData.students) ? userData.students : [userData.students];
      const studentRecord = studentRecords.find(Boolean);
      
      // Get application stats
      const { data: applications } = await supabase
        .from('applications')
        .select('id, status')
        .eq('student_id', studentRecord?.id);
      
      const stats = {
        total: applications?.length || 0,
        accepted: applications?.filter(a => a.status === 'accepted').length || 0,
        pending: applications?.filter(a => ['submitted', 'under_review', 'document_request', 'interview_scheduled'].includes(a.status)).length || 0,
      };

      studentsList.push({
        fullName: userData.full_name,
        email: userData.email || '',
        phone: userData.phone || '',
        nationality: studentRecord?.nationality || '',
        dateOfBirth: studentRecord?.date_of_birth || '',
        gender: studentRecord?.gender || '',
        chineseName: studentRecord?.chinese_name || '',
        passportNumber: studentRecord?.passport_number || '',
        passportExpiry: studentRecord?.passport_expiry_date || '',
        highestEducation: studentRecord?.highest_education || '',
        gpa: studentRecord?.gpa || '',
        hskLevel: studentRecord?.hsk_level || '',
        ieltsScore: studentRecord?.ielts_score || '',
        emergencyContact: studentRecord?.emergency_contact_name || '',
        emergencyPhone: studentRecord?.emergency_contact_phone || '',
        createdAt: userData.created_at,
        applications: stats.total,
        accepted: stats.accepted,
        pending: stats.pending,
      });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    // Define columns
    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Chinese Name', key: 'chineseName', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Nationality', key: 'nationality', width: 15 },
      { header: 'Date of Birth', key: 'dateOfBirth', width: 12 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Passport Number', key: 'passportNumber', width: 15 },
      { header: 'Passport Expiry', key: 'passportExpiry', width: 12 },
      { header: 'Highest Education', key: 'highestEducation', width: 18 },
      { header: 'GPA', key: 'gpa', width: 8 },
      { header: 'HSK Level', key: 'hskLevel', width: 10 },
      { header: 'IELTS Score', key: 'ieltsScore', width: 10 },
      { header: 'Emergency Contact', key: 'emergencyContact', width: 20 },
      { header: 'Emergency Phone', key: 'emergencyPhone', width: 15 },
      { header: 'Applications', key: 'applications', width: 12 },
      { header: 'Accepted', key: 'accepted', width: 10 },
      { header: 'Pending', key: 'pending', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 18 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    studentsList.forEach(student => {
      worksheet.addRow(student);
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="students_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting students:', error);
    return NextResponse.json({ error: 'Failed to export students' }, { status: 500 });
  }
}
