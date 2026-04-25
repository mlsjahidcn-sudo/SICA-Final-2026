import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createRateLimitMiddleware } from '@/lib/rate-limit';
import { errors } from '@/lib/api-response';

// Rate limit: 10 contact form submissions per hour per IP
const contactRateLimit = createRateLimitMiddleware({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
});

// Lazy-initialize Resend to avoid build-time crash when API key is missing
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// POST /api/contact - Submit contact form
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to prevent contact form spam
    const rateLimitResult = contactRateLimit(request);
    if (!rateLimitResult.allowed) {
      return errors.rateLimit(rateLimitResult.resetTime);
    }

    const body: ContactFormData = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send notification email to support team
    try {
      const resend = getResend();
      if (resend) {
        await resend.emails.send({
        from: 'Team SICA <info@studyinchina.academy>',
        to: ['info@studyinchina.academy'],
        subject: `[Contact Form] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">New Contact Form Submission</h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            <div style="margin: 20px 0;">
              <h3 style="color: #374151;">Message:</h3>
              <p style="white-space: pre-wrap; color: #6b7280;">${message}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
              This email was sent from the SICA contact form.
              Reply directly to this email to respond to the inquiry.
            </p>
          </div>
        `,
        replyTo: email,
      });
      }
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      // Continue even if email fails - we'll log it
    }

    // Send confirmation email to the user
    try {
      const resend = getResend();
      if (resend) {
        await resend.emails.send({
        from: 'Team SICA <info@studyinchina.academy>',
        to: [email],
        subject: 'We received your message - SICA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f59e0b; margin: 0;">SICA</h1>
              <p style="color: #6b7280; margin: 5px 0;">Study In China Academy</p>
            </div>
            
            <h2 style="color: #111827;">Thank you for contacting us, ${name}!</h2>
            
            <p style="color: #4b5563;">
              We have received your message and will get back to you within 24 hours.
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Your Message Summary</h3>
              <p><strong>Subject:</strong> ${subject}</p>
              <p style="white-space: pre-wrap; color: #6b7280;">${message.substring(0, 200)}${message.length > 200 ? '...' : ''}</p>
            </div>
            
            <p style="color: #4b5563;">
              In the meantime, you can:
            </p>
            <ul style="color: #4b5563;">
              <li>Browse our <a href="https://studyinchina.academy/programs" style="color: #f59e0b;">programs</a></li>
              <li>Explore <a href="https://studyinchina.academy/universities" style="color: #f59e0b;">universities</a></li>
              <li>Check our <a href="https://studyinchina.academy/faq" style="color: #f59e0b;">FAQ</a> for quick answers</li>
            </ul>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px;">
              This is an automated response. Please do not reply to this email.
              For follow-up inquiries, contact us at info@studyinchina.academy
            </p>
          </div>
        `,
      });
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue even if confirmation email fails
    }

    // Store the inquiry in database (optional - for tracking)
    // You could add a contact_submissions table here

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully',
    });
  } catch (error) {
    console.error('Error in contact form submission:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
