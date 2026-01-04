import { NextRequest, NextResponse } from 'next/server';
import { resend, FROM_EMAIL } from '@/lib/resend/client';

/**
 * Test endpoint to verify Resend email is working
 * POST /api/emails/test
 * Body: { email: "your@email.com" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    // Send simple test email
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Test Email from GoodHang',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a0a2e 0%, #0f172a 100%); border: 1px solid #8b5cf6; border-radius: 12px; padding: 40px;">
    <h1 style="color: #a78bfa; margin: 0 0 20px 0;">✅ Email Test Successful!</h1>

    <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 20px 0;">
      This is a test email from GoodHang to verify that Resend is configured correctly.
    </p>

    <div style="background: rgba(139, 92, 246, 0.1); border-left: 3px solid #8b5cf6; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #c4b5fd; font-size: 14px;">
        <strong>From:</strong> ${FROM_EMAIL}<br>
        <strong>Time:</strong> ${new Date().toISOString()}<br>
        <strong>Status:</strong> DNS and SMTP working correctly
      </p>
    </div>

    <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0;">
      If you received this email, your Resend configuration is working properly!
    </p>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send email',
          details: error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: 'Test email sent successfully',
      from: FROM_EMAIL,
      to: email,
    });
  } catch (error: unknown) {
    console.error('Email test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
