import { NextRequest, NextResponse } from 'next/server';
// import { resend, FROM_EMAIL } from '@/lib/resend/client';
// TODO: Implement generateTalentBenchWelcomeHTML in templates.ts
// import { generateTalentBenchWelcomeHTML } from '@/lib/resend/templates';

export async function POST(_request: NextRequest) {
  // TODO: Implement this endpoint once generateTalentBenchWelcomeHTML is ready
  return NextResponse.json(
    { error: 'Endpoint not yet implemented' },
    { status: 501 }
  );

  /* Implementation template for when generateTalentBenchWelcomeHTML is ready:
  try {
    const body = await request.json();
    const { email, name, tier, archetype, overallScore, bestFitRoles } = body;

    if (!email || !name || !tier || !archetype || !overallScore || !bestFitRoles) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only send to top_1 or benched tiers
    if (tier !== 'top_1' && tier !== 'benched') {
      return NextResponse.json(
        { error: 'Invalid tier for talent bench welcome' },
        { status: 400 }
      );
    }

    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/members`;

    // Generate HTML email
    const htmlEmail = generateTalentBenchWelcomeHTML({
      name,
      tier,
      archetype,
      overallScore,
      bestFitRoles,
      dashboardUrl,
    });

    const subject =
      tier === 'top_1'
        ? '🌟 Welcome to the Top 1% CS Talent Network'
        : '🎯 Welcome to the CS Talent Bench';

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: htmlEmail,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
  */
}
