import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { sendEmail, getMeetingReminderTemplate, logEmail } from '@/lib/email';

/**
 * Cron job endpoint to send meeting reminders
 * Should be called every hour via a cron service
 * 
 * Query params:
 * - hours: Number of hours before meeting to send reminder (default: 24)
 * - secret: API secret for authentication (optional but recommended)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const secret = searchParams.get('secret');
    
    // Optional: Verify secret for security
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    // Calculate time window for reminders
    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + (hours - 0.5) * 60 * 60 * 1000); // hours - 30 mins
    const reminderWindowEnd = new Date(now.getTime() + (hours + 0.5) * 60 * 60 * 1000); // hours + 30 mins
    
    // Get meetings that need reminders
    const { data: meetings, error } = await supabase
      .from('meeting_details')
      .select('*')
      .eq('status', 'scheduled')
      .eq('reminder_sent', false)
      .gte('meeting_date', reminderWindowStart.toISOString())
      .lte('meeting_date', reminderWindowEnd.toISOString());
    
    if (error) {
      console.error('Error fetching meetings for reminders:', error);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }
    
    if (!meetings || meetings.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No meetings requiring reminders',
        sent: 0 
      });
    }
    
    let sentCount = 0;
    let failedCount = 0;
    
    // Send reminder for each meeting
    for (const meeting of meetings) {
      const meetingDate = new Date(meeting.meeting_date);
      
      // Calculate time until meeting
      const diffMs = meetingDate.getTime() - now.getTime();
      const diffHours = Math.round(diffMs / (60 * 60 * 1000));
      const timeUntil = diffHours <= 1 
        ? 'in less than 1 hour' 
        : `in ${diffHours} hours`;
      
      // Send reminder email
      const emailPayload = getMeetingReminderTemplate({
        studentName: meeting.student_name,
        studentEmail: meeting.student_email,
        meetingTitle: meeting.title,
        meetingDate: meetingDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        meetingTime: meetingDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        duration: `${meeting.duration_minutes} minutes`,
        platform: meeting.platform,
        meetingUrl: meeting.meeting_url,
        timeUntil,
      });
      
      const result = await sendEmail(emailPayload);
      
      // Log the email
      await logEmail({
        userId: meeting.student_id,
        emailType: 'meeting_reminder',
        recipient: meeting.student_email,
        subject: emailPayload.subject,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
      });
      
      if (result.success) {
        // Mark reminder as sent
        await supabase
          .from('meetings')
          .update({ reminder_sent: true })
          .eq('id', meeting.id);
        
        sentCount++;
      } else {
        failedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} reminders, ${failedCount} failed`,
      sent: sentCount,
      failed: failedCount,
    });
    
  } catch (error) {
    console.error('Meeting reminders cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
