// Test email configuration
// Run with: npx tsx scripts/test-email.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'SICA <noreply@sica.edu>';

async function testEmailConfig() {
  console.log('=== Email Configuration Test ===\n');
  
  // Check environment variables
  console.log('1. Checking environment variables...');
  console.log(`   RESEND_API_KEY: ${RESEND_API_KEY ? '✅ Set (' + RESEND_API_KEY.substring(0, 10) + '...)' : '❌ Not set'}`);
  console.log(`   EMAIL_FROM: ${FROM_EMAIL}`);
  console.log(`   NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Not set'}`);
  console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'Not set'}`);
  
  if (!RESEND_API_KEY) {
    console.log('\n❌ RESEND_API_KEY is not set. Please configure it in .env.local');
    return;
  }
  
  console.log('\n2. Testing Resend API connection...');
  
  try {
    // Use Resend's test email address for verification
    // Note: You need to verify your domain at https://resend.com/domains
    const testEmail = 'onboarding@resend.dev';
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL, // Use configured sender
        to: [testEmail],
        subject: 'SICA Email Configuration Test',
        html: `
          <h1>Email Configuration Test Successful!</h1>
          <p>This is a test email from Team SICA (Study In China Academy).</p>
          <p>If you received this email, your Resend configuration is working correctly.</p>
          <p><strong>Sender:</strong> ${FROM_EMAIL}</p>
          <hr>
          <p><small>Sent at: ${new Date().toISOString()}</small></p>
        `,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Email sent successfully!');
      console.log(`   Email ID: ${data.id}`);
    } else {
      console.log('   ❌ Failed to send email');
      console.log(`   Error: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log('   ❌ Error connecting to Resend API');
    console.log(`   Error: ${error}`);
  }
  
  console.log('\n=== Test Complete ===');
}

testEmailConfig();
