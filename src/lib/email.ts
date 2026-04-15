import { getSupabaseClient } from '@/storage/database/supabase-client';

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'SICA <noreply@studyinchina.academy>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@studyinchina.academy';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://studyinchina.academy';

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
  userId: string | null;
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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <h2>Application Successfully Submitted!</h2>
  
  <p>Dear ${data.studentName},</p>
  
  <p>Thank you for submitting your application to <strong>${data.programName}</strong> at <strong>${data.universityName}</strong>.</p>
  
  <p><strong>Application ID:</strong> ${data.applicationId}<br>
  <strong>Status:</strong> Under Review</p>
  
  <h3>What's Next?</h3>
  <ol>
    <li>Our team will review your application and documents</li>
    <li>You may be contacted for additional information</li>
    <li>You'll receive updates on your application status via email</li>
  </ol>
  
  <p>Track your application status: <a href="${APP_URL}/student/applications">View Application</a></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy">info@studyinchina.academy</a>
  </p>
  
  <p>Best regards,<br><strong>Team SICA</strong></p>
</div>
  `;

  const text = `
Application Successfully Submitted!

Dear ${data.studentName},

Thank you for submitting your application to ${data.programName} at ${data.universityName}.

Application ID: ${data.applicationId}
Status: Under Review

What's Next?
1. Our team will review your application and documents
2. You may be contacted for additional information
3. You'll receive updates on your application status via email

Track your application status: View Application
${APP_URL}/student/applications

---
If you have any questions, please contact us at info@studyinchina.academy

Best regards,
Team SICA
  `.trim();

  return { to: data.studentEmail, subject, html, text };
}

/**
 * Application status update email
 */
export function getApplicationStatusUpdateTemplate(data: ApplicationEmailData): EmailPayload {
  const statusMessages: Record<string, string> = {
    under_review: 'Under Review',
    document_request: 'Additional Documents Required',
    interview_scheduled: 'Interview Scheduled',
    accepted: 'Congratulations! Accepted',
    rejected: 'Application Update',
  };

  const statusTitle = statusMessages[data.status || 'under_review'] || 'Under Review';
  const subject = `Application Update: ${statusTitle} - ${data.programName}`;

  let statusDetails = '';
  let statusDetailsText = '';

  if (data.status === 'interview_scheduled' && data.interviewDate) {
    statusDetails = `<p><strong>Interview Date:</strong> ${data.interviewDate}</p>`;
    if (data.interviewLink) {
      statusDetails += `<p>Join Link: <a href="${data.interviewLink}">${data.interviewLink}</a></p>`;
    }
    statusDetailsText = `Interview Date: ${data.interviewDate}\n${data.interviewLink ? `Join Link: ${data.interviewLink}` : ''}`;
  }

  if (data.status === 'rejected' && data.rejectionReason) {
    statusDetails = `<p><strong>Reason:</strong> ${data.rejectionReason}</p>`;
    statusDetailsText = `Reason: ${data.rejectionReason}`;
  }

  if (data.status === 'accepted') {
    statusDetails = `<p>Congratulations! Your application has been accepted. You will receive further instructions shortly.</p>`;
    statusDetailsText = 'Congratulations! Your application has been accepted. You will receive further instructions shortly.';
  }
  
  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <h2>Application Status Update</h2>
  
  <p>Dear ${data.studentName},</p>
  
  <p>Your application to <strong>${data.programName}</strong> at <strong>${data.universityName}</strong> has been updated.</p>
  
  <p><strong>Status:</strong> ${statusTitle}<br>
  <strong>Application ID:</strong> ${data.applicationId}</p>
  
  ${statusDetails}
  
  <p>View your application details: <a href="${APP_URL}/student/applications">View Application</a></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy">info@studyinchina.academy</a>
  </p>
  
  <p>Best regards,<br><strong>Team SICA</strong></p>
</div>
  `;

  const text = `
Application Status Update

Dear ${data.studentName},

Your application to ${data.programName} at ${data.universityName} has been updated.

Status: ${statusTitle}
Application ID: ${data.applicationId}

${statusDetailsText}

View your application details: ${APP_URL}/student/applications

---
If you have any questions, please contact us at info@studyinchina.academy

Best regards,
Team SICA
  `.trim();

  return { to: data.studentEmail, subject, html, text };
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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <h2>Document Status Update</h2>
  
  <p>Dear ${data.studentName},</p>
  
  ${isVerified ? `
    <p><strong>Your ${data.documentType} has been verified!</strong></p>
    <p>Great news! Your submitted document has been reviewed and approved by our team.</p>
  ` : `
    <p><strong>Your ${data.documentType} needs revision</strong></p>
    ${data.rejectionReason ? `<p><strong>Reason:</strong> ${data.rejectionReason}</p>` : ''}
    <p>Please log in to your portal to upload a corrected version of your document.</p>
  `}
  
  <p><a href="${APP_URL}/student/applications">View Application</a></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy">info@studyinchina.academy</a>
  </p>
  
  <p>Best regards,<br><strong>Team SICA</strong></p>
</div>
  `;

  const text = `
Document Status Update

Dear ${data.studentName},

${isVerified ? 
`Your ${data.documentType} has been verified!

Great news! Your submitted document has been reviewed and approved by our team.` :
`Your ${data.documentType} needs revision.

${data.rejectionReason ? `Reason: ${data.rejectionReason}\n\n` : ''}Please log in to your portal to upload a corrected version of your document.`
}

View your applications: ${APP_URL}/student/applications

---
If you have any questions, please contact us at info@studyinchina.academy

Best regards,
Team SICA
  `.trim();

  return { to: data.studentEmail, subject, html, text };
}

/**
 * New application notification for admins
 */
export function getNewApplicationAdminTemplate(data: ApplicationEmailData): EmailPayload {
  const subject = `New Application Received - ${data.studentName}`;
  
  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <h2>New Application Received</h2>
  
  <p>A new application has been submitted:</p>
  
  <p>
    <strong>Student:</strong> ${data.studentName}<br>
    <strong>Email:</strong> ${data.studentEmail}<br>
    <strong>Program:</strong> ${data.programName}<br>
    <strong>University:</strong> ${data.universityName}<br>
    <strong>Application ID:</strong> ${data.applicationId}
  </p>
  
  <p>Review this application: <a href="${APP_URL}/admin/applications/${data.applicationId}">Review Now</a></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 12px; color: #999;">
    This is an automated notification from SICA Admin Portal
  </p>
</div>
  `;

  const text = `
New Application Received

A new application has been submitted:

Student: ${data.studentName}
Email: ${data.studentEmail}
Program: ${data.programName}
University: ${data.universityName}
Application ID: ${data.applicationId}

Review this application: ${APP_URL}/admin/applications/${data.applicationId}

---
This is an automated notification from SICA Admin Portal
  `.trim();

  return { to: ADMIN_EMAIL, subject, html, text };
}

/**
 * Welcome email for new users
 */
export function getWelcomeTemplate(data: { name: string; email: string; role: string }): EmailPayload {
  const subject = 'Welcome to Study In China Academy';
  
  const roleText = data.role === 'partner' 
    ? 'As a partner, you can manage student applications and track their progress through our partner portal.'
    : 'As a student, you can explore programs, submit applications, and track your application status through our student portal.';

  const dashboardUrl = `${APP_URL}/${data.role === 'partner' ? 'partner' : 'student'}/applications`;
  
  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <h2>Welcome to Study In China Academy!</h2>
  
  <p>Hello ${data.name}!</p>
  
  <p>Welcome to <strong>Study In China Academy</strong>! We're excited to have you on board.</p>
  
  <p>${roleText}</p>
  
  <h3>Getting Started:</h3>
  <ol>
    <li>Complete your profile information</li>
    <li>Browse available programs</li>
    <li>${data.role === 'partner' ? 'Connect with students' : 'Submit your first application'}</li>
  </ol>
  
  <p>Go to your dashboard: <a href="${dashboardUrl}">Dashboard</a></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy">info@studyinchina.academy</a>
  </p>
  
  <p>Best regards,<br><strong>Team SICA</strong></p>
</div>
  `;

  const text = `
Welcome to Study In China Academy!

Hello ${data.name}!

Welcome to Study In China Academy! We're excited to have you on board.

${roleText}

Getting Started:
1. Complete your profile information
2. Browse available programs
3. ${data.role === 'partner' ? 'Connect with students' : 'Submit your first application'}

Go to your dashboard: ${dashboardUrl}

---
If you have any questions, please contact us at info@studyinchina.academy

Best regards,
Team SICA
  `.trim();

  return { to: data.email, subject, html, text };
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
  
  const platformName = data.platform ? data.platform.replace('_', ' ') : '';
  
  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <h2>Interview Scheduled</h2>
  
  <p>Dear ${data.studentName},</p>
  
  <p>Your interview for <strong>${data.programName}</strong> at <strong>${data.universityName}</strong> has been scheduled.</p>
  
  <h3>${data.meetingTitle}</h3>
  
  <p>
    <strong>Date:</strong> ${data.meetingDate}<br>
    <strong>Time:</strong> ${data.meetingTime}<br>
    <strong>Duration:</strong> ${data.duration}
    ${platformName ? `<br><strong>Platform:</strong> ${platformName}` : ''}
  </p>
  
  ${data.meetingUrl ? `
    <p><strong>Join Meeting:</strong> <a href="${data.meetingUrl}">Join Now</a></p>
  ` : ''}
  
  ${data.meetingId || data.meetingPassword ? `
    <p>
      ${data.meetingId ? `<strong>Meeting ID:</strong> ${data.meetingId}<br>` : ''}
      ${data.meetingPassword ? `<strong>Password:</strong> ${data.meetingPassword}` : ''}
    </p>
  ` : ''}
  
  <h3>Important:</h3>
  <ul>
    <li>Please join the meeting 5 minutes before the scheduled time</li>
    <li>Ensure you have a stable internet connection</li>
    <li>Test your camera and microphone beforehand</li>
    <li>Find a quiet environment for the interview</li>
  </ul>
  
  <p>View all your meetings: <a href="${APP_URL}/student/meetings">View Meetings</a></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    If you need to reschedule or have questions, please contact us at <a href="mailto:info@studyinchina.academy">info@studyinchina.academy</a>
  </p>
  
  <p>Best regards,<br><strong>Team SICA</strong></p>
</div>
  `;

  const text = `
Interview Scheduled

Dear ${data.studentName},

Your interview for ${data.programName} at ${data.universityName} has been scheduled.

${data.meetingTitle}

Date: ${data.meetingDate}
Time: ${data.meetingTime}
Duration: ${data.duration}
${platformName ? `Platform: ${platformName}\n` : ''}

${data.meetingUrl ? `Join Meeting: ${data.meetingUrl}\n\n` : ''}

${data.meetingId || data.meetingPassword ? 
`${data.meetingId ? `Meeting ID: ${data.meetingId}\n` : ''}${data.meetingPassword ? `Password: ${data.meetingPassword}\n` : ''}\n` : ''}

Important:
- Please join the meeting 5 minutes before the scheduled time
- Ensure you have a stable internet connection
- Test your camera and microphone beforehand
- Find a quiet environment for the interview

View all your meetings: ${APP_URL}/student/meetings

---
If you need to reschedule or have questions, please contact us at info@studyinchina.academy

Best regards,
Team SICA
  `.trim();

  return { to: data.studentEmail, subject, html, text };
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
  const subject = `Reminder: ${data.meetingTitle} ${data.timeUntil}`;
  
  const platformName = data.platform ? data.platform.replace('_', ' ') : '';
  
  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <h2>Meeting Reminder</h2>
  
  <p>Hi ${data.studentName},</p>
  
  <p>This is a friendly reminder that you have an interview scheduled <strong>${data.timeUntil}</strong>.</p>
  
  <h3>${data.meetingTitle}</h3>
  
  <p>
    <strong>Date:</strong> ${data.meetingDate}<br>
    <strong>Time:</strong> ${data.meetingTime}<br>
    <strong>Duration:</strong> ${data.duration}
    ${platformName ? `<br><strong>Platform:</strong> ${platformName}` : ''}
  </p>
  
  ${data.meetingUrl ? `
    <p><strong>Join Meeting:</strong> <a href="${data.meetingUrl}">Join Now</a></p>
  ` : ''}
  
  <h3>Quick Tips:</h3>
  <ul>
    <li>Test your audio and video before the meeting</li>
    <li>Join 5 minutes early to check your connection</li>
    <li>Have your documents ready if needed</li>
  </ul>
  
  <p>View meeting details: <a href="${APP_URL}/student/meetings">View Meetings</a></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    Questions? Contact us at <a href="mailto:info@studyinchina.academy">info@studyinchina.academy</a>
  </p>
  
  <p>Best regards,<br><strong>Team SICA</strong></p>
</div>
  `;

  const text = `
Meeting Reminder

Hi ${data.studentName},

This is a friendly reminder that you have an interview scheduled ${data.timeUntil}.

${data.meetingTitle}

Date: ${data.meetingDate}
Time: ${data.meetingTime}
Duration: ${data.duration}
${platformName ? `Platform: ${platformName}\n` : ''}

${data.meetingUrl ? `Join Meeting: ${data.meetingUrl}\n\n` : ''}

Quick Tips:
- Test your audio and video before the meeting
- Join 5 minutes early to check your connection
- Have your documents ready if needed

View meeting details: ${APP_URL}/student/meetings

---
Questions? Contact us at info@studyinchina.academy

Best regards,
Team SICA
  `.trim();

  return { to: data.studentEmail, subject, html, text };
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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <h2>Meeting Cancelled</h2>
  
  <p>Dear ${data.studentName},</p>
  
  <p>We regret to inform you that your meeting "<strong>${data.meetingTitle}</strong>" has been cancelled.</p>
  
  ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
  
  <p>A new meeting will be scheduled soon. You will receive a notification when a new time is available.</p>
  
  <p>If you have any questions or would like to reschedule, please contact us at <a href="mailto:info@studyinchina.academy">info@studyinchina.academy</a></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p>Best regards,<br><strong>Team SICA</strong></p>
</div>
  `;

  const text = `
Meeting Cancelled

Dear ${data.studentName},

We regret to inform you that your meeting "${data.meetingTitle}" has been cancelled.

${data.reason ? `Reason: ${data.reason}\n\n` : ''}

A new meeting will be scheduled soon. You will receive a notification when a new time is available.

If you have any questions or would like to reschedule, please contact us at info@studyinchina.academy

---
Best regards,
Team SICA
  `.trim();

  return { to: data.studentEmail, subject, html, text };
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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <h2>Assessment Received</h2>
  
  <p>Dear ${data.studentName},</p>
  
  <p>Thank you for submitting your free assessment request to <strong>Study In China Academy</strong>!</p>
  
  <p><strong>Your Tracking Code:</strong> ${data.trackingCode}</p>
  
  <h3>What Happens Next?</h3>
  <ol>
    <li>Our AI will analyze your academic profile and preferences</li>
    <li>We'll generate personalized university recommendations</li>
    <li>You'll receive your comprehensive assessment report within 24-48 hours</li>
  </ol>
  
  <p>Track your assessment: <a href="${APP_URL}/assessment/track?code=${data.trackingCode}">Check Status</a></p>
  
  <p style="font-size: 14px; color: #666;">
    Please save your tracking code. You'll need it along with your email to check your assessment status.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy">info@studyinchina.academy</a>
  </p>
  
  <p>Best regards,<br><strong>Team SICA</strong></p>
</div>
  `;

  const text = `
Assessment Received

Dear ${data.studentName},

Thank you for submitting your free assessment request to Study In China Academy!

Your Tracking Code: ${data.trackingCode}

What Happens Next?
1. Our AI will analyze your academic profile and preferences
2. We'll generate personalized university recommendations
3. You'll receive your comprehensive assessment report within 24-48 hours

Track your assessment: ${APP_URL}/assessment/track?code=${data.trackingCode}

Please save your tracking code. You'll need it along with your email to check your assessment status.

---
If you have any questions, please contact us at info@studyinchina.academy

Best regards,
Team SICA
  `.trim();

  return { to: data.studentEmail, subject, html, text };
}

/**
 * Assessment Report Ready Email
 */
export function getAssessmentReportReadyTemplate(data: {
  studentName: string;
  studentEmail: string;
  trackingCode: string;
}): EmailPayload {
  const subject = `Your Assessment Report is Ready!`;
  
  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <h2>Your Report is Ready!</h2>
  
  <p>Dear ${data.studentName},</p>
  
  <p>Great news! Your personalized assessment report has been generated and is ready for review.</p>
  
  <h3>Your Report Includes:</h3>
  <ul>
    <li>Personalized university recommendations</li>
    <li>Scholarship eligibility assessment</li>
    <li>Application timeline & checklist</li>
    <li>Cost estimates & budget planning</li>
    <li>Practical tips for success</li>
  </ul>
  
  <p>View your report: <a href="${APP_URL}/assessment/track?code=${data.trackingCode}">Access Report</a></p>
  
  <p style="font-size: 14px; color: #666;">
    For the complete detailed report with all recommendations and personalized guidance, please contact our team via WhatsApp or email.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 14px; color: #666;">
    If you have any questions, please contact us at <a href="mailto:info@studyinchina.academy">info@studyinchina.academy</a>
  </p>
  
  <p>Best regards,<br><strong>Team SICA</strong></p>
</div>
  `;

  const text = `
Your Report is Ready!

Dear ${data.studentName},

Great news! Your personalized assessment report has been generated and is ready for review.

Your Report Includes:
- Personalized university recommendations
- Scholarship eligibility assessment
- Application timeline & checklist
- Cost estimates & budget planning
- Practical tips for success

View your report: ${APP_URL}/assessment/track?code=${data.trackingCode}

For the complete detailed report with all recommendations and personalized guidance, please contact our team via WhatsApp or email.

---
If you have any questions, please contact us at info@studyinchina.academy

Best regards,
Team SICA
  `.trim();

  return { to: data.studentEmail, subject, html, text };
}

export { ADMIN_EMAIL };
