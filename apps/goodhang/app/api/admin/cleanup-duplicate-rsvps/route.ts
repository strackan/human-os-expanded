import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint uses service role to clean up duplicate RSVPs
export async function POST(_request: NextRequest) {
  try {
    // Create a service role client (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Fetch all RSVPs
    const { data: rsvps, error: fetchError } = await supabase
      .from('rsvps')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching RSVPs:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Find duplicates
    const seen = new Map();
    const duplicateIds = [];

    for (const rsvp of rsvps) {
      const key = `${rsvp.event_id}_${rsvp.guest_email}`;
      if (seen.has(key)) {
        duplicateIds.push(rsvp.id);
      } else {
        seen.set(key, rsvp);
      }
    }

    console.log(`Found ${duplicateIds.length} duplicate RSVPs`);

    if (duplicateIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No duplicates found',
        deletedCount: 0
      });
    }

    // Delete duplicates
    const { error: deleteError } = await supabase
      .from('rsvps')
      .delete()
      .in('id', duplicateIds);

    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${duplicateIds.length} duplicate RSVPs`,
      deletedCount: duplicateIds.length,
      deletedIds: duplicateIds
    });

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
