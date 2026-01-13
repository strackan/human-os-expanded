import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reminderDate, reminderTime, notes } = body;

    console.log('[Quick Action] Remind Later:', { reminderDate, reminderTime, notes });

    // Demo mode: Just return success without actually creating reminder
    // In production, this would:
    // 1. Create a record in the reminders table
    // 2. Schedule a notification/email for the specified date/time
    // 3. Link to the relevant customer or task

    return NextResponse.json({
      success: true,
      message: 'Reminder set successfully (demo mode)',
      data: {
        reminderDate,
        reminderTime,
        notes,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Quick Action] Remind Later Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set reminder' },
      { status: 500 }
    );
  }
}
