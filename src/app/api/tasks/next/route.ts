import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase-server';

export async function GET(request: NextRequest) {
  console.log('API: Using NEW database version - fetching from Supabase');
  
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc('get_next_priority_task');

  if (error) {
    console.error('Error fetching next task:', error);
    return NextResponse.json({ error: 'Failed to fetch next task' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({
      task: null,
      message: 'No urgent renewal tasks today. Check back tomorrow for new priorities.'
    });
  }

  // The function returns an array, but we only want the top task
  const task = data[0];
  console.log('API: Found task:', task);

  return NextResponse.json({ task });
}