import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireStudent } from '@/lib/auth-utils';
import { calculateProfileCompletion } from '@/lib/profile-completion';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireStudent(request);
    if (authUser instanceof NextResponse) return authUser;

    const supabase = getSupabaseClient();

    // Get student record first (applications.student_id references students.id, not users.id)
    const { data: studentRecord, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', authUser.id)
      .single();

    if (studentError || !studentRecord) {
      console.error('Error fetching student record:', studentError);
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    const studentId = studentRecord.id;

    // Get application statistics using student.id (not authUser.id)
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('status, id')
      .eq('student_id', studentId);

    if (appsError) {
      console.error('Error fetching applications:', appsError);
    }

    const appIds = (applications || []).map(a => a.id);

    const stats = {
      total: applications?.length || 0,
      draft: applications?.filter(a => a.status === 'draft').length || 0,
      submitted: applications?.filter(a => a.status === 'submitted').length || 0,
      underReview: applications?.filter(a => a.status === 'under_review').length || 0,
      interviewScheduled: applications?.filter(a => a.status === 'interview_scheduled').length || 0,
      accepted: applications?.filter(a => a.status === 'accepted').length || 0,
      rejected: applications?.filter(a => a.status === 'rejected').length || 0,
    };

    // Get upcoming meetings (step-by-step to avoid nested query issues)
    const { data: upcomingMeetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('id, title, meeting_date, duration_minutes, platform, meeting_url, application_id')
      .eq('student_id', studentId)
      .eq('status', 'scheduled')
      .gte('meeting_date', new Date().toISOString())
      .order('meeting_date', { ascending: true })
      .limit(3);

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
    }

    // Enrich meetings with program/university info
    const meetingAppIds = (upcomingMeetings || []).map(m => m.application_id).filter(Boolean);
    let meetingsEnriched: any[] = [];
    if (meetingAppIds.length > 0) {
      const { data: meetingApps } = await supabase
        .from('applications')
        .select('id, program_id')
        .in('id', meetingAppIds);
      const programIds = (meetingApps || []).map(a => a.program_id).filter(Boolean);
      const { data: programs } = programIds.length > 0
        ? await supabase.from('programs').select('id, name, university_id').in('id', programIds)
        : { data: [] };
      const uniIds = (programs || []).map(p => p.university_id).filter(Boolean);
      const { data: universities } = uniIds.length > 0
        ? await supabase.from('universities').select('id, name_en').in('id', uniIds)
        : { data: [] };

      const programMap = Object.fromEntries((programs || []).map(p => [p.id, p]));
      const uniMap = Object.fromEntries((universities || []).map(u => [u.id, u]));
      const appMap = Object.fromEntries((meetingApps || []).map(a => [a.id, a]));

      meetingsEnriched = (upcomingMeetings || []).map(m => {
        const app = appMap[m.application_id];
        const prog = app ? programMap[app.program_id] : null;
        const uni = prog ? uniMap[prog.university_id] : null;
        return {
          ...m,
          applications: {
            id: m.application_id,
            programs: prog ? {
              name: prog.name,
              name_en: prog.name,
              universities: uni ? { name_en: uni.name_en } : null,
            } : null,
          },
        };
      });
    }

    // Get pending documents from documents table (not application_documents)
    // Query by student_id directly
    let pendingDocuments: any[] = [];
    const { data: pendingDocs, error: docsError } = await supabase
      .from('documents')
      .select('id, document_type, status, application_id, file_name, created_at')
      .eq('student_id', studentId)
      .in('status', ['pending', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (docsError) {
      console.error('Error fetching pending documents:', docsError);
    }

    // Enrich with program info
    const docAppIds = (pendingDocs || []).map(d => d.application_id).filter(Boolean);
    if (docAppIds.length > 0) {
      const { data: docApps } = await supabase
        .from('applications')
        .select('id, program_id')
        .in('id', docAppIds);
      const docProgramIds = (docApps || []).map(a => a.program_id).filter(Boolean);
      const { data: docPrograms } = docProgramIds.length > 0
        ? await supabase.from('programs').select('id, name').in('id', docProgramIds)
        : { data: [] };
      const docAppMap = Object.fromEntries((docApps || []).map(a => [a.id, a]));
      const docProgMap = Object.fromEntries((docPrograms || []).map(p => [p.id, p]));

      pendingDocuments = (pendingDocs || []).map(d => {
        const app = d.application_id ? docAppMap[d.application_id] : null;
        const prog = app ? docProgMap[app.program_id] : null;
        return {
          ...d,
          applications: app ? {
            id: app.id,
            programs: prog ? { name: prog.name, name_en: prog.name } : null,
          } : null,
        };
      });
    } else {
      pendingDocuments = pendingDocs || [];
    }

    // Get recent applications (step-by-step)
    const { data: recentApplicationsRaw, error: recentAppsError } = await supabase
      .from('applications')
      .select('id, status, created_at, updated_at, program_id')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (recentAppsError) {
      console.error('Error fetching recent applications:', recentAppsError);
    }

    let recentApplications: any[] = [];
    const recentProgIds = (recentApplicationsRaw || []).map(a => a.program_id).filter(Boolean);
    if (recentProgIds.length > 0) {
      const { data: recentPrograms } = await supabase
        .from('programs')
        .select('id, name, degree_level, university_id')
        .in('id', recentProgIds);
      const recentUniIds = (recentPrograms || []).map(p => p.university_id).filter(Boolean);
      const { data: recentUniversities } = recentUniIds.length > 0
        ? await supabase.from('universities').select('id, name_en, city').in('id', recentUniIds)
        : { data: [] };
      const recentProgMap = Object.fromEntries((recentPrograms || []).map(p => [p.id, p]));
      const recentUniMap = Object.fromEntries((recentUniversities || []).map(u => [u.id, u]));

      recentApplications = (recentApplicationsRaw || []).map(a => {
        const prog = a.program_id ? recentProgMap[a.program_id] : null;
        const uni = prog?.university_id ? recentUniMap[prog.university_id] : null;
        return {
          ...a,
          programs: prog ? {
            name: prog.name,
            name_en: prog.name,
            degree_level: prog.degree_level,
            universities: uni ? { name_en: uni.name_en, city: uni.city } : null,
          } : null,
        };
      });
    } else {
      recentApplications = recentApplicationsRaw || [];
    }

    // Get profile completion
    const { data: studentProfile } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    const { data: userData } = await supabase
      .from('users')
      .select('full_name, phone')
      .eq('id', authUser.id)
      .single();

    const profileCompletion = calculateProfileCompletion(userData, studentProfile);

    return NextResponse.json({
      stats,
      upcomingMeetings: meetingsEnriched,
      pendingDocuments,
      recentApplications,
      profileCompletion,
    });

  } catch (error) {
    console.error('Student dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
