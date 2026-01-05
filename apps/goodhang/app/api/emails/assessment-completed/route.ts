import { NextRequest, NextResponse } from 'next/server';
// import { resend, FROM_EMAIL } from '@/lib/resend/client';
// TODO: Implement generateAssessmentCompletedHTML in templates.ts
// import { generateAssessmentCompletedHTML } from '@/lib/resend/templates';

export async function POST(_request: NextRequest) {
  // TODO: Implement this endpoint once generateAssessmentCompletedHTML is ready
  return NextResponse.json(
    { error: 'Endpoint not yet implemented' },
    { status: 501 }
  );

  /* Implementation template for when generateAssessmentCompletedHTML is ready:
  try {
    const body = await request.json();
    const { email, name, overallScore, tier, archetype, sessionId } = body;

    if (!email || !name || !overallScore || !tier || !archetype || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build results URL
    const resultsUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/assessment/results/${sessionId}`;

    // Generate HTML email
    const htmlEmail = generateAssessmentCompletedHTML({
      name,
      overallScore,
      tier,
      archetype,
      resultsUrl,
    });

    // Determine subject based on tier
    const tierSubjects = {
      top_1: '🌟 Your Assessment Results - Top 1% Tier!',
      benched: '🎯 Your Assessment Results - Welcome to the Talent Bench!',
      passed: '✅ Your CS Assessment Results',
    };

    const subject = tierSubjects[tier as keyof typeof tierSubjects] || '✅ Your CS Assessment Results';

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
