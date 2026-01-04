import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, city, message } = body;

    // TODO: Integrate with email service (e.g., SendGrid, Resend, etc.)
    // For now, just log the contact request
    console.log('Contact form submission:', {
      email,
      city,
      message,
      timestamp: new Date().toISOString(),
    });

    // You could also save this to Supabase if needed
    // const supabase = await createClient();
    // await supabase.from('contact_requests').insert({ email, city, message });

    return NextResponse.json(
      { success: true, message: 'Contact request received' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    );
  }
}
