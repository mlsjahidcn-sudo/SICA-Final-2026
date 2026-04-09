import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Get all meetings with related data using the meeting_details view
    const { data: meetings, error } = await supabase
      .from('meeting_details')
      .select('*')
      .order('meeting_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching meetings:', error);
      // Return sample data if query fails
      return NextResponse.json({ meetings: generateSampleMeetings() });
    }
    
    // If no meetings found, return sample data for demo
    if (!meetings || meetings.length === 0) {
      return NextResponse.json({ meetings: generateSampleMeetings() });
    }
    
    return NextResponse.json({ meetings });
    
  } catch (error) {
    console.error('Meetings API error:', error);
    return NextResponse.json({ meetings: generateSampleMeetings() });
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
    const daysOffset = Math.floor(Math.random() * 14) - 7; // -7 to +7 days
    const hoursOffset = Math.floor(Math.random() * 10) + 8; // 8 AM to 6 PM
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
      student_name: student.name,
      student_email: student.email,
      program_name: program.name,
      university_name: program.university,
    });
  }
  
  return sampleMeetings.sort((a, b) => 
    new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime()
  );
}
