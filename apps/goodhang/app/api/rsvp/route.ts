import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== RSVP API Route Called ===');

    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);

    const { eventId, guestName, guestEmail, plusOnes } = body;

    // Validate required fields
    if (!eventId || !guestName || !guestEmail) {
      console.error('Missing required fields:', { eventId, guestName, guestEmail });
      return NextResponse.json(
        { error: 'Missing required fields: eventId, guestName, and guestEmail are required' },
        { status: 400 }
      );
    }

    console.log('Creating Supabase client...');
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // Create Supabase client
    const supabase = await createClient();
    console.log('Supabase client created successfully');

    // Insert RSVP
    console.log('Inserting RSVP with data:', { eventId, guestName, guestEmail, plusOnes });
    const { data: rsvpData, error: insertError } = await supabase
      .from('rsvps')
      .insert({
        event_id: eventId,
        guest_name: guestName,
        guest_email: guestEmail,
        plus_ones: plusOnes || 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: insertError.message, details: insertError },
        { status: 500 }
      );
    }

    console.log('RSVP inserted successfully:', rsvpData);
    return NextResponse.json({ success: true, data: rsvpData });

  } catch (error: unknown) {
    console.error('=== RSVP API Error ===');
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error message:', errorMessage);
    console.error('Error stack:', errorStack);

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
