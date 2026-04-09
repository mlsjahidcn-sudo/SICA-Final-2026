import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { calculateProfileCompletion } from '@/lib/profile-completion';

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    
    // Get application statistics
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('status, id')
      .eq('student_id', authUser.id);
    
    if (appsError) {
      console.error('Error fetching applications:', appsError);
    }
    
    const stats = {
      total: applications?.length || 0,
      draft: applications?.filter(a => a.status === 'draft').length || 0,
      submitted: applications?.filter(a => a.status === 'submitted').length || 0,
      underReview: applications?.filter(a => a.status === 'under_review').length || 0,
      interviewScheduled: applications?.filter(a => a.status === 'interview_scheduled').length || 0,
      accepted: applications?.filter(a => a.status === 'accepted').length || 0,
      rejected: applications?.filter(a => a.status === 'rejected').length || 0,
    };
    
    // Get upcoming meetings
    const { data: upcomingMeetings, error: meetingsError } = await supabase
      .from('meetings')
      .select(`
        id,
        title,
        meeting_date,
        duration_minutes,
        platform,
        meeting_url,
        applications (
          programs (
            name_en,
            universities (
              name_en
            )
          )
        )
      `)
      .eq('student_id', authUser.id)
      .eq('status', 'scheduled')
      .gte('meeting_date', new Date().toISOString())
      .order('meeting_date', { ascending: true })
      .limit(3);
    
    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
    }
    
    // Get pending documents (documents that need to be uploaded or are rejected)
    const { data: pendingDocuments, error: docsError } = await supabase
      .from('application_documents')
      .select(`
        id,
        document_type,
        status,
        applications (
          id,
          programs (
            name_en
          )
        )
      `)
      .eq('applications.student_id', authUser.id)
      .in('status', ['pending', 'rejected']);
    
    if (docsError) {
      console.error('Error fetching documents:', docsError);
    }
    
    // Get recent applications
    const { data: recentApplications, error: recentAppsError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        programs (
          name_en,
          degree_type,
          universities (
            name_en,
            city
          )
        )
      `)
      .eq('student_id', authUser.id)
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (recentAppsError) {
      console.error('Error fetching recent applications:', recentAppsError);
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
      upcomingMeetings: upcomingMeetings || [],
      pendingDocuments: pendingDocuments || [],
      recentApplications: recentApplications || [],
      profileCompletion,
    });
    
  } catch (error) {
    console.error('Student dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
