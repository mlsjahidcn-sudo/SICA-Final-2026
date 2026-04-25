import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';
import { createRateLimitMiddleware } from '@/lib/rate-limit';
import { errors } from '@/lib/api-response';
import {
  sendEmail,
  logEmail,
  getApplicationSubmittedTemplate,
  getApplicationStatusUpdateTemplate,
  getDocumentStatusTemplate,
  getWelcomeTemplate,
  getNewApplicationAdminTemplate,
  getMeetingScheduledTemplate,
  getMeetingCancelledTemplate,
  ADMIN_EMAIL,
} from '@/lib/email';

// Rate limit: 20 emails per hour per user
const emailRateLimit = createRateLimitMiddleware({
  maxRequests: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
});

// POST - Send email notification
export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting to prevent email abuse
    const rateLimitResult = emailRateLimit(request, authUser.id);
    if (!rateLimitResult.allowed) {
      return errors.rateLimit(rateLimitResult.resetTime);
    }

    // Only admins and partners can trigger certain emails
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let emailPayload;
    let recipient: string;

    switch (type) {
      case 'welcome':
        // Can be triggered during registration
        emailPayload = getWelcomeTemplate(data);
        recipient = data.email;
        break;

      case 'application_submitted':
        // Student receives confirmation, admin gets notification
        if (authUser.role !== 'student' && authUser.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        emailPayload = getApplicationSubmittedTemplate(data);
        recipient = data.studentEmail;
        break;

      case 'application_status_update':
        // Admin triggers status update email to student
        if (authUser.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        emailPayload = getApplicationStatusUpdateTemplate(data);
        recipient = data.studentEmail;
        break;

      case 'document_status':
        // Admin triggers document verification email to student
        if (authUser.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        emailPayload = getDocumentStatusTemplate(data);
        recipient = data.studentEmail;
        break;

      case 'new_application_admin':
        // Notify admin of new application
        if (authUser.role !== 'student' && authUser.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        emailPayload = getNewApplicationAdminTemplate(data);
        recipient = ADMIN_EMAIL;
        break;

      case 'meeting_scheduled':
        // Admin schedules meeting for student
        if (authUser.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        emailPayload = getMeetingScheduledTemplate(data);
        recipient = data.studentEmail;
        break;

      case 'meeting_cancelled':
        // Admin cancels meeting, notify student
        if (authUser.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        emailPayload = getMeetingCancelledTemplate(data);
        recipient = data.studentEmail;
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    const result = await sendEmail(emailPayload);

    // Log the email
    await logEmail({
      userId: authUser.id,
      emailType: type,
      recipient,
      subject: emailPayload.subject,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error in email API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
