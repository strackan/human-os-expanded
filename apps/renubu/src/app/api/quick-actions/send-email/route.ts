import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody } = body;

    console.log('[Quick Action] Send Email:', { to, subject, body: emailBody });

    // Demo mode: Just return success without actually sending email
    // In production, this would:
    // 1. Create a record in the communications table
    // 2. Send the email via an email service
    // 3. Log the activity

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully (demo mode)',
      data: {
        to,
        subject,
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Quick Action] Send Email Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
