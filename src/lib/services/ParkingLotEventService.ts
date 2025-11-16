/**
 * Parking Lot Event Service
 * Evaluates event-based wake triggers for parking lot items
 *
 * Called by daily cron job to check if any items should surface
 */

import { createClient } from '@/lib/supabase/server';
import { EventDetectionService } from './EventDetectionService';
import type {
  WakeTrigger,
  EventTriggerConfig,
  DateTriggerConfig
} from '@/types/parking-lot';

export class ParkingLotEventService {
  /**
   * Main evaluation function - called by cron job
   * Evaluates all active parking lot items with wake triggers
   */
  static async evaluateAllTriggers(): Promise<{
    evaluated: number;
    surfaced: number;
    errors: number;
  }> {
    try {
      const supabase = await createClient();

      // Fetch items ready for evaluation (from helper function)
      const { data: items, error } = await supabase.rpc(
        'get_parking_lot_items_for_evaluation',
        { p_evaluation_interval_minutes: 1440 } // 24 hours
      );

      if (error) {
        console.error('[ParkingLotEventService] Error fetching items:', error);
        return { evaluated: 0, surfaced: 0, errors: 1 };
      }

      if (!items || items.length === 0) {
        console.log('[ParkingLotEventService] No items to evaluate');
        return { evaluated: 0, surfaced: 0, errors: 0 };
      }

      let surfacedCount = 0;
      let errorCount = 0;

      console.log(`[ParkingLotEventService] Evaluating ${items.length} items`);

      // Evaluate each item
      for (const item of items) {
        try {
          const shouldSurface = await this.evaluateItemTriggers(
            item.id,
            item.user_id,
            item.wake_triggers,
            item.brainstorm_prefer_lighter_day || false
          );

          if (shouldSurface.triggered) {
            await this.surfaceItem(item.id, shouldSurface.reason || 'Trigger condition met');
            surfacedCount++;
          } else {
            // Update last_evaluated_at
            await supabase
              .from('parking_lot_items')
              .update({ last_evaluated_at: new Date().toISOString() })
              .eq('id', item.id);
          }
        } catch (error) {
          console.error(`[ParkingLotEventService] Error evaluating item ${item.id}:`, error);
          errorCount++;
        }
      }

      console.log(`[ParkingLotEventService] Completed: ${items.length} evaluated, ${surfacedCount} surfaced, ${errorCount} errors`);

      return {
        evaluated: items.length,
        surfaced: surfacedCount,
        errors: errorCount
      };
    } catch (error) {
      console.error('[ParkingLotEventService] evaluateAllTriggers error:', error);
      return { evaluated: 0, surfaced: 0, errors: 1 };
    }
  }

  /**
   * Evaluate triggers for a specific item
   * Returns whether the item should surface and why
   */
  static async evaluateItemTriggers(
    itemId: string,
    userId: string,
    wakeTriggers: WakeTrigger[],
    preferLighterDay: boolean
  ): Promise<{ triggered: boolean; reason?: string; triggeredBy?: WakeTrigger }> {
    if (!wakeTriggers || wakeTriggers.length === 0) {
      return { triggered: false };
    }

    // If this is a brainstorm item that prefers lighter days,
    // first check if today is a lighter day
    if (preferLighterDay) {
      const lighterDayResult = await EventDetectionService.checkLighterDay(userId);

      if (!lighterDayResult.triggered) {
        // Not a lighter day - don't surface yet
        return { triggered: false };
      }
    }

    // Evaluate each trigger
    for (const trigger of wakeTriggers) {
      const result = await this.evaluateSingleTrigger(trigger, userId);

      if (result.triggered) {
        return {
          triggered: true,
          reason: result.reason,
          triggeredBy: trigger
        };
      }
    }

    return { triggered: false };
  }

  /**
   * Evaluate a single trigger
   */
  static async evaluateSingleTrigger(
    trigger: WakeTrigger,
    userId: string
  ): Promise<{ triggered: boolean; reason?: string }> {
    switch (trigger.type) {
      case 'date':
        return this.evaluateDateTrigger(trigger.config as DateTriggerConfig);

      case 'event':
        return EventDetectionService.checkEventTrigger(
          trigger.config as EventTriggerConfig,
          userId
        );

      default:
        console.warn(`[ParkingLotEventService] Unknown trigger type: ${trigger.type}`);
        return { triggered: false };
    }
  }

  /**
   * Evaluate date-based trigger
   */
  static async evaluateDateTrigger(
    config: DateTriggerConfig
  ): Promise<{ triggered: boolean; reason?: string }> {
    const now = new Date();

    // Handle absolute date
    if (config.date) {
      const targetDate = new Date(config.date);
      if (now >= targetDate) {
        return {
          triggered: true,
          reason: `Target date reached: ${targetDate.toLocaleDateString()}`
        };
      }
    }

    // Handle relative date (daysFromNow)
    if (config.daysFromNow !== undefined) {
      // This should have been converted to absolute date when created
      // But as fallback, we can check if it was set in the past
      return { triggered: false };
    }

    return { triggered: false };
  }

  /**
   * Surface an item (send notification and update status)
   */
  static async surfaceItem(
    itemId: string,
    reason: string
  ): Promise<void> {
    try {
      const supabase = await createClient();

      // Update item
      const { error: updateError } = await supabase
        .from('parking_lot_items')
        .update({
          trigger_fired_at: new Date().toISOString(),
          fired_trigger_type: 'event',
          last_evaluated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (updateError) {
        console.error('[ParkingLotEventService] Error updating item:', updateError);
        throw updateError;
      }

      // TODO: Send notification to user
      // await NotificationService.notify({
      //   type: 'parking_lot_item_ready',
      //   itemId,
      //   reason
      // });

      console.log(`[ParkingLotEventService] Surfaced item ${itemId}: ${reason}`);
    } catch (error) {
      console.error('[ParkingLotEventService] surfaceItem error:', error);
      throw error;
    }
  }

  /**
   * Manually trigger evaluation for a specific item (for testing)
   */
  static async evaluateItem(itemId: string): Promise<{
    success: boolean;
    triggered: boolean;
    reason?: string;
    error?: string;
  }> {
    try {
      const supabase = await createClient();

      const { data: item, error } = await supabase
        .from('parking_lot_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error || !item) {
        return { success: false, triggered: false, error: 'Item not found' };
      }

      const result = await this.evaluateItemTriggers(
        item.id,
        item.user_id,
        item.wake_triggers,
        item.brainstorm_prefer_lighter_day
      );

      if (result.triggered) {
        await this.surfaceItem(itemId, result.reason || 'Manual evaluation');
      }

      return {
        success: true,
        triggered: result.triggered,
        reason: result.reason
      };
    } catch (error: any) {
      console.error('[ParkingLotEventService] evaluateItem error:', error);
      return {
        success: false,
        triggered: false,
        error: error.message
      };
    }
  }
}
