import { NextRequest, NextResponse } from 'next/server';
import { resend, FROM_EMAIL } from '@/lib/resend/client';
import { generateMembershipApprovedHTML } from '@/lib/resend/templates';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Get user profile from Supabase
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Generate HTML email
    const htmlEmail = generateMembershipApprovedHTML({
      name: profile.name || 'there',
      loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/members`,
      directoryUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/members/directory`,
      eventsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/events`,
    });

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: profile.email,
      subject: '🎉 Welcome to Good Hang!',
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
  } catch (error: unknown) {
    console.error('Email sending error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
