import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase-server';

export async function GET(request: NextRequest) {
  console.log('API: Using NEW database version - fetching from Supabase');
  
  const supabase = await createServerSupabaseClient();
  
  // Get date parameter from query string
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  
  let overrideDate: string | null = null;
  
  if (dateParam) {
    try {
      // Parse date in format YYYYMMDD
      const year = dateParam.substring(0, 4);
      const month = dateParam.substring(4, 6);
      const day = dateParam.substring(6, 8);
      
      // Validate the date format
      if (year && month && day) {
        overrideDate = `${year}-${month}-${day}`;
        console.log('API: Using override date:', overrideDate);
      }
    } catch (error) {
      console.warn('API: Error parsing date parameter:', dateParam, error);
    }
  }

  // Call the database function with optional date parameter
  const { data, error } = await supabase.rpc('get_next_priority_task', {
    override_date: overrideDate
  });

  if (error) {
    console.error('Error fetching next task:', error);
    return NextResponse.json({ error: 'Failed to fetch next task' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    const message = overrideDate 
      ? `No urgent renewal tasks on ${overrideDate}. Try a different date or check back later.`
      : 'No urgent renewal tasks today. Check back tomorrow for new priorities.';
      
    return NextResponse.json({
      task: null,
      message,
      overrideDate
    });
  }

  // The function returns an array, but we only want the top task
  const task = data[0];
  console.log('API: Found task:', task);

  return NextResponse.json({ 
    task,
    overrideDate 
  });
}