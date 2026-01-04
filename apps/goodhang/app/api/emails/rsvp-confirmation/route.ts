import { NextRequest, NextResponse } from 'next/server';
import { resend, FROM_EMAIL } from '@/lib/resend/client';
import { generateRSVPConfirmationHTML } from '@/lib/resend/templates';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, rsvpId } = body;

    if (!eventId || !rsvpId) {
      return NextResponse.json(
        { error: 'Missing eventId or rsvpId' },
        { status: 400 }
      );
    }

    // Get event and RSVP details from Supabase
    const supabase = await createClient();

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const { data: rsvp, error: rsvpError } = await supabase
      .from('rsvps')
      .select('*')
      .eq('id', rsvpId)
      .single();

    if (rsvpError || !rsvp) {
      return NextResponse.json(
        { error: 'RSVP not found' },
        { status: 404 }
      );
    }

    // Format date and time
    const eventDate = new Date(event.event_datetime);
    const dateStr = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Generate HTML email
    const htmlEmail = generateRSVPConfirmationHTML({
      eventTitle: event.title,
      eventDate: dateStr,
      eventTime: timeStr,
      eventLocation: event.location,
      guestName: rsvp.guest_name || 'there',
      plusOnes: rsvp.plus_ones || 0,
      eventUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/events/${event.id}`,
    });

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: rsvp.guest_email,
      subject: `You're confirmed for ${event.title}!`,
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
