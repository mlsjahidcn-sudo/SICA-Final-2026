import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireStudent } from '@/lib/auth-utils';
import { calculateProfileCompletion } from '@/lib/profile-completion';
import { apiCache, CACHE_TTL, withTimeout } from '@/lib/api-cache';

const QUERY_TIMEOUT = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireStudent(request);
    if (authUser instanceof NextResponse) return authUser;

    // Check cache first (1 minute TTL for student dashboard)
    const cacheKey = `student:dashboard:${authUser.id}`;
    const cached = apiCache.get(cacheKey) as Record<string, unknown> | null;
    if (cached) {
      return NextResponse.json(cached);
    }

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

    // Fetch all base data in parallel for better performance
    const [
      applicationsResult,
      upcomingMeetingsResult,
      pendingDocsResult,
      recentApplicationsRawResult,
    ] = await Promise.allSettled([
      // Application statistics
      withTimeout(
        supabase.from('applications').select('status, id').eq('student_id', studentId),
        QUERY_TIMEOUT,
        'Applications query timed out'
      ),
      // Upcoming meetings
      withTimeout(
        supabase.from('meetings')
          .select('id, title, meeting_date, duration_minutes, platform, meeting_url, application_id')
          .eq('student_id', studentId)
          .eq('status', 'scheduled')
          .gte('meeting_date', new Date().toISOString())
          .order('meeting_date', { ascending: true })
          .limit(3),
        QUERY_TIMEOUT,
        'Meetings query timed out'
      ),
      // Pending documents
      withTimeout(
        supabase.from('documents')
          .select('id, document_type, status, application_id, file_name, created_at')
          .eq('student_id', studentId)
          .in('status', ['pending', 'rejected'])
          .order('created_at', { ascending: false })
          .limit(10),
        QUERY_TIMEOUT,
        'Documents query timed out'
      ),
      // Recent applications
      withTimeout(
        supabase.from('applications')
          .select('id, status, created_at, updated_at, program_id')
          .eq('student_id', studentId)
          .order('updated_at', { ascending: false })
          .limit(5),
        QUERY_TIMEOUT,
        'Recent applications query timed out'
      ),
    ]);

    // Extract data from results
    const applications = applicationsResult.status === 'fulfilled' ? applicationsResult.value.data : [];
    const upcomingMeetings = upcomingMeetingsResult.status === 'fulfilled' ? upcomingMeetingsResult.value.data : [];
    const pendingDocs = pendingDocsResult.status === 'fulfilled' ? pendingDocsResult.value.data : [];
    const recentApplicationsRaw = recentApplicationsRawResult.status === 'fulfilled' ? recentApplicationsRawResult.value.data : [];

    // Log errors if any
    if (applicationsResult.status === 'rejected') console.error('Error fetching applications:', applicationsResult.reason);
    if (upcomingMeetingsResult.status === 'rejected') console.error('Error fetching meetings:', upcomingMeetingsResult.reason);
    if (pendingDocsResult.status === 'rejected') console.error('Error fetching documents:', pendingDocsResult.reason);
    if (recentApplicationsRawResult.status === 'rejected') console.error('Error fetching recent applications:', recentApplicationsRawResult.reason);

    // Calculate stats
    const stats = {
      total: applications?.length || 0,
      draft: applications?.filter(a => a.status === 'draft').length || 0,
      submitted: applications?.filter(a => a.status === 'submitted').length || 0,
      underReview: applications?.filter(a => a.status === 'under_review').length || 0,
      interviewScheduled: applications?.filter(a => a.status === 'interview_scheduled').length || 0,
      accepted: applications?.filter(a => a.status === 'accepted').length || 0,
      rejected: applications?.filter(a => a.status === 'rejected').length || 0,
    };

    // Collect ALL application IDs that need enrichment
    const meetingAppIds = (upcomingMeetings || []).map(m => m.application_id).filter(Boolean);
    const docAppIds = (pendingDocs || []).map(d => d.application_id).filter(Boolean);
    const recentAppIds = (recentApplicationsRaw || []).map(a => a.id).filter(Boolean);
    
    // Get unique program IDs from all sources
    const allAppIdsNeedingEnrichment = [...new Set([...meetingAppIds, ...docAppIds, ...recentAppIds])];

    // Fetch all enrichment data in parallel
    let allAppsMap: Record<string, any> = {};
    let allProgramsMap: Record<string, any> = {};
    let allUniversitiesMap: Record<string, any> = {};

    if (allAppIdsNeedingEnrichment.length > 0) {
      const [appsResult] = await Promise.allSettled([
        withTimeout(
          supabase.from('applications').select('id, program_id').in('id', allAppIdsNeedingEnrichment),
          QUERY_TIMEOUT,
          'Application enrichment query timed out'
        ),
      ]);

      const allApps = appsResult.status === 'fulfilled' ? appsResult.value.data : [];
      allAppsMap = Object.fromEntries((allApps || []).map(a => [a.id, a]));

      const allProgramIds = [...new Set((allApps || []).map(a => a.program_id).filter(Boolean))];
      
      if (allProgramIds.length > 0) {
        const [programsRes] = await Promise.allSettled([
          withTimeout(
            supabase.from('programs').select('id, name, degree_level, university_id').in('id', allProgramIds),
            QUERY_TIMEOUT,
            'Programs enrichment query timed out'
          ),
        ]);

        const allPrograms = programsRes.status === 'fulfilled' ? programsRes.value.data : [];
        allProgramsMap = Object.fromEntries((allPrograms || []).map(p => [p.id, p]));

        const allUniIds = [...new Set((allPrograms || []).map(p => p.university_id).filter(Boolean))];
        
        if (allUniIds.length > 0) {
          const universitiesRes = await withTimeout(
            supabase.from('universities').select('id, name_en, city').in('id', allUniIds),
            QUERY_TIMEOUT,
            'Universities enrichment query timed out'
          );
          allUniversitiesMap = Object.fromEntries((universitiesRes.data || []).map(u => [u.id, u]));
        }
      }
    }

    // Enrich meetings
    let meetingsEnriched: any[] = [];
    if (upcomingMeetings && upcomingMeetings.length > 0) {
      meetingsEnriched = upcomingMeetings.map(m => {
        const app = allAppsMap[m.application_id];
        const prog = app ? allProgramsMap[app.program_id] : null;
        const uni = prog ? allUniversitiesMap[prog.university_id] : null;
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

    // Enrich pending documents
    let pendingDocuments: any[] = [];
    if (pendingDocs && pendingDocs.length > 0) {
      pendingDocuments = pendingDocs.map(d => {
        const app = d.application_id ? allAppsMap[d.application_id] : null;
        const prog = app ? allProgramsMap[app.program_id] : null;
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

    // Enrich recent applications
    let recentApplications: any[] = [];
    if (recentApplicationsRaw && recentApplicationsRaw.length > 0) {
      recentApplications = recentApplicationsRaw.map(a => {
        const prog = a.program_id ? allProgramsMap[a.program_id] : null;
        const uni = prog?.university_id ? allUniversitiesMap[prog.university_id] : null;
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

    const responseData = {
      stats,
      upcomingMeetings: meetingsEnriched,
      pendingDocuments,
      recentApplications,
      profileCompletion,
    };

    // Cache the response for 1 minute
    apiCache.set(cacheKey, responseData, CACHE_TTL.MEDIUM);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Student dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
