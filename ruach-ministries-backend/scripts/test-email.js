/**
 * Email Testing Script
 *
 * Tests if Resend email provider is properly configured
 *
 * Usage: node scripts/test-email.js <recipient-email>
 */

require('dotenv').config();
const { Resend } = require('resend');

async function testEmail() {
  const recipientEmail = process.argv[2];

  if (!recipientEmail) {
    console.error('❌ Error: Please provide a recipient email address');
    console.error('Usage: node scripts/test-email.js your@email.com');
    process.exit(1);
  }

  console.log('🧪 Testing Resend Email Configuration\n');

  // Check environment variables
  console.log('📋 Checking environment variables...');
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    console.error('   Please add it to your .env file');
    process.exit(1);
  }

  console.log(`✓ RESEND_API_KEY is set (${apiKey.substring(0, 8)}...)`);

  // Test email sending
  console.log(`\n📧 Sending test email to: ${recipientEmail}`);

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_DEFAULT_FROM || 'Ruach <no-reply@updates.joinruach.org>',
      to: recipientEmail,
      subject: 'Test Email from Ruach Ministries',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your Ruach Ministries application.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Sent at: ${new Date().toISOString()}<br>
          Environment: ${process.env.NODE_ENV || 'development'}
        </p>
      `,
    });

    if (result.error) {
      console.error('\n❌ Email failed to send:');
      console.error(JSON.stringify(result.error, null, 2));
      process.exit(1);
    }

    console.log('\n✅ Email sent successfully!');
    console.log(`   Email ID: ${result.data.id}`);
    console.log(`\n📬 Check your inbox at: ${recipientEmail}`);
    console.log('   (It may take a few moments to arrive)');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error(error.message);
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testEmail();
