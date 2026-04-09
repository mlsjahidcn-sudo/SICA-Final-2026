import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    
    // Check if it's a sample meeting
    if (id.startsWith('sample-')) {
      const sampleMeetings = generateSampleMeetings();
      const meeting = sampleMeetings.find(m => m.id === id);
      
      if (meeting) {
        return NextResponse.json({ meeting });
      }
      
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }
    
    const { data: meeting, error } = await supabase
      .from('meeting_details')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching meeting:', error);
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }
    
    return NextResponse.json({ meeting });
    
  } catch (error) {
    console.error('Meeting detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateSampleMeetings() {
  const now = new Date();
  const sampleMeetings = [];
  
  const titles = [
    'Initial Interview',
    'Second Round Interview',
    'Document Review Session',
    'Final Interview',
    'Application Follow-up',
    'Program Consultation',
  ];
  
  const students = [
    { name: 'John Smith', email: 'john.smith@example.com' },
    { name: 'Jane Doe', email: 'jane.doe@example.com' },
    { name: 'Alex Johnson', email: 'alex.johnson@example.com' },
    { name: 'Sarah Williams', email: 'sarah.williams@example.com' },
    { name: 'Michael Chen', email: 'michael.chen@example.com' },
  ];
  
  const programs = [
    { name: 'Software Engineering', university: 'Tsinghua University' },
    { name: 'Business Administration', university: 'Peking University' },
    { name: 'Chinese Language', university: 'Fudan University' },
    { name: 'International Relations', university: 'Shanghai Jiao Tong University' },
  ];
  
  const platforms = ['zoom', 'google_meet', 'teams'];
  const statuses = ['scheduled', 'scheduled', 'scheduled', 'completed', 'cancelled'];
  
  for (let i = 0; i < 10; i++) {
    const daysOffset = Math.floor(Math.random() * 14) - 7;
    const hoursOffset = Math.floor(Math.random() * 10) + 8;
    const meetingDate = new Date(now);
    meetingDate.setDate(meetingDate.getDate() + daysOffset);
    meetingDate.setHours(hoursOffset, 0, 0, 0);
    
    const student = students[Math.floor(Math.random() * students.length)];
    const program = programs[Math.floor(Math.random() * programs.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    sampleMeetings.push({
      id: `sample-${i}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      description: 'Discussion about application requirements and next steps.',
      meeting_date: meetingDate.toISOString(),
      duration_minutes: [30, 45, 60][Math.floor(Math.random() * 3)],
      status,
      meeting_type: 'interview',
      platform,
      meeting_url: `https://zoom.us/j/${Math.floor(Math.random() * 900000000 + 100000000)}`,
      meeting_id_external: Math.floor(Math.random() * 900000000 + 100000000).toString(),
      meeting_password: Math.floor(Math.random() * 900000 + 100000).toString(),
      notes: null,
      student_id: 'sample-student-id',
      student_name: student.name,
      student_email: student.email,
      application_id: 'sample-application-id',
      program_name: program.name,
      degree_type: 'Master',
      university_name: program.university,
    });
  }
  
  return sampleMeetings;
}
