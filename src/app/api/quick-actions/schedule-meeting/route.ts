import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, date, time, duration, attendees } = body;

    console.log('[Quick Action] Schedule Meeting:', { title, date, time, duration, attendees });

    // Demo mode: Just return success without actually creating calendar event
    // In production, this would:
    // 1. Create a record in the calendar_events table
    // 2. Send calendar invites to attendees
    // 3. Sync with external calendar service

    return NextResponse.json({
      success: true,
      message: 'Meeting scheduled successfully (demo mode)',
      data: {
        title,
        date,
        time,
        duration: `${duration} minutes`,
        attendees,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Quick Action] Schedule Meeting Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule meeting' },
      { status: 500 }
    );
  }
}
