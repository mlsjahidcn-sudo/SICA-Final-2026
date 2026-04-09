import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client to avoid build-time errors
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    
    supabase = createClient(url, key);
  }
  return supabase;
}

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'SICA <noreply@sica.edu>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sica.edu';

// Document type labels for email templates
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  passport: 'Passport Copy',
  diploma: 'Diploma/Certificate',
  transcript: 'Academic Transcript',
  language_certificate: 'Language Certificate',
  photo: 'Passport Photo',
  recommendation: 'Recommendation Letter',
  other: 'Document',
};

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface ApplicationEmailData {
  applicationId: string;
  studentName: string;
  studentEmail: string;
  programName: string;
  universityName: string;
  status?: string;
  rejectionReason?: string;
  interviewDate?: string;
  interviewLink?: string;
}

interface DocumentEmailData {
  studentName: string;
  studentEmail: string;
  documentType: string;
  status: 'verified' | 'rejected';
  rejectionReason?: string;
}

/**
 * Send email using Resend API
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to send email:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Save email log to database
 */
export async function logEmail(params: {
  userId: string;
  emailType: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  error?: string;
}): Promise<void> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase not configured, skipping email log');
      return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).from('email_logs').insert({
      user_id: params.userId,
      email_type: params.emailType,
      recipient: params.recipient,
      subject: params.subject,
      status: params.status,
      error: params.error,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

// ============== EMAIL TEMPLATES ==============

/**
 * Application submission confirmation email
 */
export function getApplicationSubmittedTemplate(data: ApplicationEmailData): EmailPayload {
  const subject = `Application Submitted - ${data.programName} at ${data.universityName}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Submitted</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Study In China Academy</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Application Successfully Submitted!</h2>
    
    <p>Dear ${data.studentName},</p>
    
    <p>Thank you for submitting your application to <strong>${data.programName}</strong> at <strong>${data.universityName}</strong>.</p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
      <p style="margin: 10px 0 0 0;"><strong>Status:</strong> Under Review</p>
    </div>
    
    <h3 style="color: #374151;">What's Next?</h3>
    <ol style="color: #4b5563;">
      <li>Our team will review your application and documents</li>
      <li>You may be contacted for additional information</li>
      <li>You'll receive updates on your application status via email</li>
    </ol>
    
    <p>You can track your application status by logging into your student portal.</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/student/applications" 
       style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
      View Your Application
    </a>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy" style="color: #f59e0b;">info@studyinchina.academy</a>
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
      Best regards,<br><strong>Team SICA</strong>
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} Study In China Academy. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  return { to: data.studentEmail, subject, html };
}

/**
 * Application status update email
 */
export function getApplicationStatusUpdateTemplate(data: ApplicationEmailData): EmailPayload {
  const statusMessages: Record<string, { title: string; color: string }> = {
    under_review: { title: 'Under Review', color: '#3b82f6' },
    document_request: { title: 'Additional Documents Required', color: '#f59e0b' },
    interview_scheduled: { title: 'Interview Scheduled', color: '#8b5cf6' },
    accepted: { title: 'Congratulations! Accepted', color: '#10b981' },
    rejected: { title: 'Application Update', color: '#ef4444' },
  };

  const statusInfo = statusMessages[data.status || 'under_review'] || statusMessages.under_review;
  const subject = `Application Update: ${statusInfo.title} - ${data.programName}`;

  let additionalContent = '';

  if (data.status === 'interview_scheduled' && data.interviewDate) {
    additionalContent = `
      <div style="background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Interview Date:</strong> ${data.interviewDate}</p>
        ${data.interviewLink ? `<p style="margin: 10px 0 0 0;"><a href="${data.interviewLink}" style="color: #8b5cf6;">Join Interview</a></p>` : ''}
      </div>
    `;
  }

  if (data.status === 'rejected' && data.rejectionReason) {
    additionalContent = `
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Reason:</strong> ${data.rejectionReason}</p>
      </div>
    `;
  }

  if (data.status === 'accepted') {
    additionalContent = `
      <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;">Congratulations! Your application has been accepted. You will receive further instructions shortly.</p>
      </div>
    `;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Status Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Study In China Academy</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Application Status Update</h2>
    
    <p>Dear ${data.studentName},</p>
    
    <p>Your application to <strong>${data.programName}</strong> at <strong>${data.universityName}</strong> has been updated.</p>
    
    <div style="background: ${statusInfo.color}15; border-left: 4px solid ${statusInfo.color}; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 18px; color: ${statusInfo.color};"><strong>${statusInfo.title}</strong></p>
      <p style="margin: 10px 0 0 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
    </div>
    
    ${additionalContent}
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/student/applications" 
       style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
      View Application Details
    </a>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy" style="color: #f59e0b;">info@studyinchina.academy</a>
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
      Best regards,<br><strong>Team SICA</strong>
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} Study In China Academy. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  return { to: data.studentEmail, subject, html };
}

/**
 * Document verification email
 */
export function getDocumentStatusTemplate(data: DocumentEmailData): EmailPayload {
  const isVerified = data.status === 'verified';
  const subject = isVerified 
    ? `Document Verified - ${data.documentType}` 
    : `Document Requires Attention - ${data.documentType}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Status Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Study In China Academy</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Document Status Update</h2>
    
    <p>Dear ${data.studentName},</p>
    
    ${isVerified ? `
      <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #10b981;"><strong>✓ Your ${data.documentType} has been verified!</strong></p>
      </div>
      <p>Great news! Your submitted document has been reviewed and approved by our team.</p>
    ` : `
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #ef4444;"><strong>✗ Your ${data.documentType} needs revision</strong></p>
        ${data.rejectionReason ? `<p style="margin: 10px 0 0 0;"><strong>Reason:</strong> ${data.rejectionReason}</p>` : ''}
      </div>
      <p>Please log in to your portal to upload a corrected version of your document.</p>
    `}
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/student/applications" 
       style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
      ${isVerified ? 'View Application' : 'Update Document'}
    </a>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy" style="color: #f59e0b;">info@studyinchina.academy</a>
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
      Best regards,<br><strong>Team SICA</strong>
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} Study In China Academy. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  return { to: data.studentEmail, subject, html };
}

/**
 * New application notification for admins
 */
export function getNewApplicationAdminTemplate(data: ApplicationEmailData): EmailPayload {
  const subject = `New Application Received - ${data.studentName}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Application</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">SICA Admin</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">New Application Received</h2>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Student:</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${data.studentName}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${data.studentEmail}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Program:</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${data.programName}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>University:</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${data.universityName}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0;"><strong>Application ID:</strong></td>
        <td style="padding: 10px 0;">${data.applicationId}</td>
      </tr>
    </table>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/admin/applications/${data.applicationId}" 
       style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
      Review Application
    </a>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      This is an automated notification from SICA Admin Portal
    </p>
  </div>
</body>
</html>
  `;

  return { to: ADMIN_EMAIL, subject, html };
}

/**
 * Welcome email for new users
 */
export function getWelcomeTemplate(data: { name: string; email: string; role: string }): EmailPayload {
  const subject = 'Welcome to Study In China Academy';
  
  const roleContent = data.role === 'partner' 
    ? `<p>As a partner, you can manage student applications and track their progress through our partner portal.</p>`
    : `<p>As a student, you can explore programs, submit applications, and track your application status through our student portal.</p>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SICA</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to SICA!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.name}!</h2>
    
    <p>Welcome to <strong>Study In China Academy</strong>! We're excited to have you on board.</p>
    
    ${roleContent}
    
    <h3 style="color: #374151;">Getting Started:</h3>
    <ol style="color: #4b5563;">
      <li>Complete your profile information</li>
      <li>Browse available programs</li>
      <li>${data.role === 'partner' ? 'Connect with students' : 'Submit your first application'}</li>
    </ol>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/${data.role === 'partner' ? 'partner' : 'student'}/applications" 
       style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
      Go to Dashboard
    </a>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy" style="color: #f59e0b;">info@studyinchina.academy</a>
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
      Best regards,<br><strong>Team SICA</strong>
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} Study In China Academy. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  return { to: data.email, subject, html };
}

/**
 * Meeting scheduled email for students
 */
export function getMeetingScheduledTemplate(data: {
  studentName: string;
  studentEmail: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  duration: string;
  platform?: string;
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  programName: string;
  universityName: string;
}): EmailPayload {
  const subject = `Interview Scheduled: ${data.meetingTitle} - ${data.programName}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Scheduled</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Interview Scheduled</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Dear ${data.studentName},</h2>
    
    <p>Your interview for <strong>${data.programName}</strong> at <strong>${data.universityName}</strong> has been scheduled.</p>
    
    <div style="background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 15px 0; color: #6d28d9;">${data.meetingTitle}</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>📅 Date:</strong></td>
          <td style="padding: 8px 0;">${data.meetingDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>🕐 Time:</strong></td>
          <td style="padding: 8px 0;">${data.meetingTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>⏱️ Duration:</strong></td>
          <td style="padding: 8px 0;">${data.duration}</td>
        </tr>
        ${data.platform ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>💻 Platform:</strong></td>
          <td style="padding: 8px 0; text-transform: capitalize;">${data.platform.replace('_', ' ')}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    ${data.meetingUrl ? `
    <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #16a34a;">Join Your Meeting</p>
      <a href="${data.meetingUrl}" 
         style="display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Join Now
      </a>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #6b7280; word-break: break-all;">Or copy link: ${data.meetingUrl}</p>
    </div>
    ` : ''}
    
    ${(data.meetingId || data.meetingPassword) ? `
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #374151;">Meeting Details:</p>
      ${data.meetingId ? `<p style="margin: 5px 0;"><strong>Meeting ID:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${data.meetingId}</code></p>` : ''}
      ${data.meetingPassword ? `<p style="margin: 5px 0;"><strong>Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${data.meetingPassword}</code></p>` : ''}
    </div>
    ` : ''}
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;"><strong>⚠️ Important:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #92400e;">
        <li>Please join the meeting 5 minutes before the scheduled time</li>
        <li>Ensure you have a stable internet connection</li>
        <li>Test your camera and microphone beforehand</li>
        <li>Find a quiet environment for the interview</li>
      </ul>
    </div>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/student/meetings" 
       style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
      View All Meetings
    </a>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      If you need to reschedule or have questions, please contact us at <a href="mailto:info@studyinchina.academy" style="color: #f59e0b;">info@studyinchina.academy</a>
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
      Best regards,<br><strong>Team SICA</strong>
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} Study In China Academy. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  return { to: data.studentEmail, subject, html };
}

/**
 * Meeting reminder email (sent 24 hours before)
 */
export function getMeetingReminderTemplate(data: {
  studentName: string;
  studentEmail: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  duration: string;
  platform?: string;
  meetingUrl?: string;
  timeUntil: string;
}): EmailPayload {
  const subject = `⏰ Reminder: ${data.meetingTitle} ${data.timeUntil}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Meeting Reminder</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.studentName},</h2>
    
    <p>This is a friendly reminder that you have an interview scheduled <strong>${data.timeUntil}</strong>.</p>
    
    <div style="background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 15px 0; color: #6d28d9;">${data.meetingTitle}</h3>
      <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${data.meetingDate}</p>
      <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${data.meetingTime}</p>
      <p style="margin: 5px 0;"><strong>⏱️ Duration:</strong> ${data.duration}</p>
      ${data.platform ? `<p style="margin: 5px 0;"><strong>💻 Platform:</strong> <span style="text-transform: capitalize;">${data.platform.replace('_', ' ')}</span></p>` : ''}
    </div>
    
    ${data.meetingUrl ? `
    <div style="text-align: center; margin: 25px 0;">
      <a href="${data.meetingUrl}" 
         style="display: inline-block; background: #22c55e; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Join Meeting Now
      </a>
    </div>
    ` : ''}
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;"><strong>Quick Tips:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #92400e;">
        <li>Test your audio and video before the meeting</li>
        <li>Join 5 minutes early to check your connection</li>
        <li>Have your documents ready if needed</li>
      </ul>
    </div>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/student/meetings" 
       style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
      View Meeting Details
    </a>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Questions? Contact us at <a href="mailto:info@studyinchina.academy" style="color: #f59e0b;">info@studyinchina.academy</a>
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
      Best regards,<br><strong>Team SICA</strong>
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} Study In China Academy. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  return { to: data.studentEmail, subject, html };
}

/**
 * Meeting cancelled email
 */
export function getMeetingCancelledTemplate(data: {
  studentName: string;
  studentEmail: string;
  meetingTitle: string;
  reason?: string;
}): EmailPayload {
  const subject = `Meeting Cancelled: ${data.meetingTitle}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Cancelled</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #ef4444; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Meeting Cancelled</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Dear ${data.studentName},</h2>
    
    <p>We regret to inform you that your meeting "<strong>${data.meetingTitle}</strong>" has been cancelled.</p>
    
    ${data.reason ? `
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Reason:</strong> ${data.reason}</p>
    </div>
    ` : ''}
    
    <p>A new meeting will be scheduled soon. You will receive a notification when a new time is available.</p>
    
    <p>If you have any questions or would like to reschedule, please contact us at <a href="mailto:info@studyinchina.academy" style="color: #f59e0b;">info@studyinchina.academy</a></p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
      Best regards,<br><strong>Team SICA</strong>
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} Study In China Academy. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  return { to: data.studentEmail, subject, html };
}

/**
 * Free Assessment Submission Confirmation
 */
export function getAssessmentSubmittedTemplate(data: {
  studentName: string;
  studentEmail: string;
  trackingCode: string;
}): EmailPayload {
  const subject = `Free Assessment Submitted - ${data.trackingCode}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Submitted</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Assessment Received</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Dear ${data.studentName},</h2>
    
    <p>Thank you for submitting your free assessment request to <strong>Study In China Academy</strong>!</p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #92400e;"><strong>Your Tracking Code:</strong></p>
      <p style="margin: 10px 0 0 0; font-size: 24px; font-family: monospace; color: #f59e0b; font-weight: bold;">${data.trackingCode}</p>
    </div>
    
    <h3 style="color: #374151;">What Happens Next?</h3>
    <ol style="color: #4b5563;">
      <li>Our AI will analyze your academic profile and preferences</li>
      <li>We'll generate personalized university recommendations</li>
      <li>You'll receive your comprehensive assessment report within 24-48 hours</li>
    </ol>
    
    <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #16a34a;">Track Your Assessment</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/assessment/track?code=${data.trackingCode}" 
         style="display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Check Status
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Please save your tracking code. You'll need it along with your email to check your assessment status.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy" style="color: #f59e0b;">info@studyinchina.academy</a>
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
      Best regards,<br><strong>Team SICA</strong>
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} Study In China Academy. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  return { to: data.studentEmail, subject, html };
}

/**
 * Assessment Report Ready Email
 */
export function getAssessmentReportReadyTemplate(data: {
  studentName: string;
  studentEmail: string;
  trackingCode: string;
}): EmailPayload {
  const subject = `Your Assessment Report is Ready! 🎉`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Report Ready</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Your Report is Ready!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Dear ${data.studentName},</h2>
    
    <p>Great news! Your personalized assessment report has been generated and is ready for review.</p>
    
    <div style="background: #d1fae5; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 15px 0; color: #16a34a;">Your Report Includes:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #166534;">
        <li>Personalized university recommendations</li>
        <li>Scholarship eligibility assessment</li>
        <li>Application timeline & checklist</li>
        <li>Cost estimates & budget planning</li>
        <li>Practical tips for success</li>
      </ul>
    </div>
    
    <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #16a34a;">View Your Report</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/assessment/track?code=${data.trackingCode}" 
         style="display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Access Report
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      For the complete detailed report with all recommendations and personalized guidance, please contact our team via WhatsApp or email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy" style="color: #f59e0b;">info@studyinchina.academy</a>
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
      Best regards,<br><strong>Team SICA</strong>
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} Study In China Academy. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  return { to: data.studentEmail, subject, html };
}

export { ADMIN_EMAIL };
