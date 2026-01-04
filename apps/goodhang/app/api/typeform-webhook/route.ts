import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Typeform webhook sends form responses in this format
    const formResponse = data.form_response;

    if (!formResponse) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Extract answers from Typeform response
    const answers = formResponse.answers as Array<{
      field: { ref: string };
      text?: string;
      email?: string;
      url?: string;
      choice?: { label: string };
    }>;
    const findAnswer = (ref: string) => {
      const answer = answers.find((a) => a.field.ref === ref);
      return answer?.text || answer?.email || answer?.url || answer?.choice?.label || '';
    };

    // Map Typeform fields to database fields
    // You'll need to update these refs based on your actual Typeform field refs
    const applicationData = {
      email: findAnswer('email') || formResponse.hidden?.email,
      name: findAnswer('name'),
      linkedin_url: findAnswer('linkedin'),
      why_join: findAnswer('why_join'),
      contribution: findAnswer('contribution'),
      referral_source: findAnswer('referral'),
      status: 'pending' as const,
    };

    // Insert into Supabase
    const supabase = await createClient();
    const { error } = await supabase
      .from('applications')
      .insert(applicationData);

    if (error) {
      console.error('Error inserting application:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
