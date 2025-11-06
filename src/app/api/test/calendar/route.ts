import { NextRequest, NextResponse } from 'next/server';
import { CalendarService } from '@/lib/services/CalendarService';
import { WorkloadAnalysisService } from '@/lib/services/WorkloadAnalysisService';
import { createClient } from '@/lib/supabase/server';

/**
 * Test API for Calendar Service and findNextOpening()
 *
 * GET /api/test/calendar?action=findNextOpening&duration=90&taskType=deep
 * GET /api/test/calendar?action=workload
 * GET /api/test/calendar?action=availability
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'findNextOpening';

    // ================================================================
    // ACTION: findNextOpening
    // ================================================================
    if (action === 'findNextOpening') {
      const duration = parseInt(searchParams.get('duration') || '60');
      const taskType = (searchParams.get('taskType') || 'admin') as any;
      const windowDays = parseInt(searchParams.get('windowDays') || '7');

      console.log(`Testing findNextOpening: duration=${duration}, taskType=${taskType}, windowDays=${windowDays}`);

      const nextSlot = await CalendarService.findNextOpening({
        userId: user.id,
        durationMinutes: duration,
        windowDays,
        taskType,
        supabaseClient: supabase,
      });

      if (!nextSlot) {
        return NextResponse.json({
          success: false,
          message: 'No available slots found in the next ${windowDays} days',
          parameters: {
            duration,
            taskType,
            windowDays,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Found optimal time slot',
        slot: {
          start: nextSlot.start.toISOString(),
          end: nextSlot.end.toISOString(),
          startFormatted: nextSlot.start.toLocaleString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          durationMinutes: nextSlot.durationMinutes,
          score: nextSlot.score,
          reasoning: nextSlot.reasoning,
        },
        parameters: {
          duration,
          taskType,
          windowDays,
        },
      });
    }

    // ================================================================
    // ACTION: workload
    // ================================================================
    if (action === 'workload') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() + (7 - weekStart.getDay())); // Next Monday
      weekStart.setHours(0, 0, 0, 0);

      const workload = await WorkloadAnalysisService.getUpcomingWorkload(
        user.id,
        weekStart,
        { supabaseClient: supabase }
      );

      return NextResponse.json({
        success: true,
        message: 'Workload analysis complete',
        weekStart: weekStart.toISOString(),
        workload: {
          summary: workload.summary,
          snoozed: workload.snoozed.length,
          renewals: workload.renewals.length,
          priorities: workload.priorities.length,
          incomplete: workload.incomplete.length,
          categorized: {
            urgent: workload.categorized.urgent.length,
            important: workload.categorized.important.length,
            routine: workload.categorized.routine.length,
            suggested: workload.categorized.suggested.length,
          },
          items: {
            urgent: workload.categorized.urgent.slice(0, 3),
            important: workload.categorized.important.slice(0, 3),
          },
        },
      });
    }

    // ================================================================
    // ACTION: availability
    // ================================================================
    if (action === 'availability') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // This Monday
      weekStart.setHours(0, 0, 0, 0);

      const availability = await CalendarService.getWeeklyAvailability(
        user.id,
        weekStart,
        supabase
      );

      return NextResponse.json({
        success: true,
        message: 'Weekly availability retrieved',
        weekStart: weekStart.toISOString(),
        availability: availability.map(day => ({
          date: day.date.toISOString(),
          dateFormatted: day.date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          totalHours: Math.round(day.totalMinutes / 60 * 10) / 10,
          availableHours: Math.round(day.availableMinutes / 60 * 10) / 10,
          scheduledHours: Math.round(day.scheduledMinutes / 60 * 10) / 10,
          meetingCount: day.meetingCount,
          utilization: day.totalMinutes > 0
            ? Math.round((day.scheduledMinutes / day.totalMinutes) * 100)
            : 0,
        })),
      });
    }

    // ================================================================
    // ACTION: preferences
    // ================================================================
    if (action === 'preferences') {
      const workHours = await CalendarService.getWorkHours(user.id, supabase);
      const focusBlocks = await CalendarService.getFocusBlocks(user.id, supabase);
      const bufferTime = await CalendarService.getBufferTimePreferences(user.id, supabase);

      return NextResponse.json({
        success: true,
        message: 'User preferences retrieved',
        preferences: {
          workHours,
          focusBlocks,
          bufferTime,
        },
      });
    }

    return NextResponse.json({
      error: 'Invalid action parameter',
      validActions: ['findNextOpening', 'workload', 'availability', 'preferences'],
    }, { status: 400 });

  } catch (error: any) {
    console.error('Calendar test API error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
