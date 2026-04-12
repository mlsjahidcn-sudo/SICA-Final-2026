import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { sendEmail, logEmail } from '@/lib/email';

/**
 * POST /api/admin/students/[id]/claim
 * Send a claim invitation email to an orphan student
 * 
 * Request body:
 * - email: string (the email to send invitation to)
 * - full_name?: string (optional, overrides the name in admin_notes)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const { email, full_name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 1. Verify the student record exists and is orphan (user_id IS NULL)
    const { data: studentRecord, error: studentError } = await supabase
      .from('students')
      .select('id, user_id, admin_notes, created_at')
      .eq('id', studentId)
      .is('user_id', null)
      .maybeSingle();

    if (studentError) {
      console.error('Error checking student record:', studentError);
      return NextResponse.json(
        { error: 'Failed to verify student record' },
        { status: 500 }
      );
    }

    if (!studentRecord) {
      return NextResponse.json(
        { error: 'Student record not found or already has an account' },
        { status: 404 }
      );
    }

    // 2. Check if email is already used
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return NextResponse.json(
        { error: 'Failed to verify email availability' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // 3. Extract student name from admin_notes or use provided full_name
    // admin_notes format: "NAME: {name}" or "Created via admin"
    let studentName = full_name;
    if (!studentName && studentRecord.admin_notes) {
      const nameMatch = studentRecord.admin_notes.match(/NAME:\s*([^|]+)/);
      if (nameMatch) {
        studentName = nameMatch[1].trim();
      }
    }
    if (!studentName) {
      studentName = 'Student';
    }

    // 4. Generate claim URL
    const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/claim-student?student_id=${studentId}&email=${encodeURIComponent(email)}`;

    // 5. Send invitation email
    const emailPayload = {
      to: email,
      subject: 'Claim Your Student Account - SICA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to SICA!</h1>
          <p>Dear ${studentName},</p>
          <p>You have been added to our student database. To complete your registration and access your student portal, please claim your account by clicking the link below:</p>
          <div style="margin: 30px 0;">
            <a href="${claimUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Claim Your Account</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all;">${claimUrl}</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you did not expect this email, please disregard it.</p>
          <p>Best regards,<br>SICA Team</p>
        </div>
      `,
      text: `
Welcome to SICA!

Dear ${studentName},

You have been added to our student database. To complete your registration and access your student portal, please claim your account by visiting:

${claimUrl}

If you did not expect this email, please disregard it.

Best regards,
SICA Team
      `,
    };

    const result = await sendEmail(emailPayload);

    if (!result.success) {
      console.error('Failed to send claim invitation email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

    // 6. Update admin_notes to track invitation
    const timestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('students')
      .update({
        admin_notes: studentRecord.admin_notes
          ? `${studentRecord.admin_notes} | Invitation sent to ${email} at ${timestamp}`
          : `Invitation sent to ${email} at ${timestamp}`,
        updated_at: timestamp,
      })
      .eq('id', studentId);

    if (updateError) {
      console.error('Error updating student record:', updateError);
      // Non-critical, continue
    }

    // 7. Log email
    await logEmail({
      userId: null,
      emailType: 'claim_invitation',
      recipient: email,
      subject: emailPayload.subject,
      status: 'sent',
    });

    return NextResponse.json({
      success: true,
      message: 'Claim invitation sent successfully',
      claim_url: claimUrl,
    });
  } catch (error) {
    console.error('Send claim invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
