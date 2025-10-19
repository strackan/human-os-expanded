import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { field, value, notes } = body;

    console.log('[Quick Action] Update Field:', { field, value, notes });

    // Demo mode: Just return success without actually updating database
    // In production, this would:
    // 1. Update the specified field in the appropriate table
    // 2. Log the change in an audit trail
    // 3. Trigger any relevant workflows or notifications

    return NextResponse.json({
      success: true,
      message: 'Field updated successfully (demo mode)',
      data: {
        field,
        oldValue: null,
        newValue: value,
        notes,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Quick Action] Update Field Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update field' },
      { status: 500 }
    );
  }
}
