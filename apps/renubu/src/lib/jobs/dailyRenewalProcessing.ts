import { createClient } from '@/lib/supabase';
import { UpdateDetector } from '../engines/UpdateDetector';
import { ActionScoreCalculator } from '../engines/ActionScoreCalculator';
import { EventTriggerEngine } from '../engines/EventTriggerEngine';
import { EventService } from '../services/EventService';

export async function runDailyRenewalProcessing() {
  console.log('Starting daily renewal processing...');
  const supabase = createClient();
  
  try {
    // 1. Get all active renewals
    const { data: renewals, error } = await supabase
      .from('renewals')
      .select('*')
      .eq('status', 'active');
      
    if (error) {
      console.error('Error fetching renewals:', error);
      return;
    }
    
    for (const renewal of renewals || []) {
      try {
        console.log(`Processing renewal ${renewal.id} for ${renewal.customer_name}`);
        
        // 2. Detect updates for this renewal
        const dateUpdate = await UpdateDetector.detectKeyDateUpdates(renewal);
        
        if (dateUpdate) {
          console.log(`Created date update for renewal ${renewal.id}:`, dateUpdate.update_type);
          
          // 3. Calculate action scores for the update
          const scores = await ActionScoreCalculator.processUpdate(dateUpdate);
          console.log(`Created ${scores.length} action scores`);
          
          // 4. Check if any events should be triggered
          const events = await EventTriggerEngine.checkAndCreateEvents(renewal.id);
          
          if (events.length > 0) {
            console.log(`Created ${events.length} events for renewal ${renewal.id}`);
            
            // 5. Process events (create workflows) - implement this next
            for (const event of events) {
              await processEvent(event);
            }
          }
        }

        // 6. Check for usage changes
        const { data: usageData } = await supabase
          .from('customer_usage')
          .select('*')
          .eq('customer_id', renewal.customer_id)
          .order('created_at', { ascending: false })
          .limit(2);

        if (usageData && usageData.length >= 2) {
          const [current, previous] = usageData;
          const usageUpdate = await UpdateDetector.detectUsageChanges(
            renewal,
            current.usage_value,
            previous.usage_value
          );

          if (usageUpdate) {
            console.log(`Created usage update for renewal ${renewal.id}`);
            const scores = await ActionScoreCalculator.processUpdate(usageUpdate);
            const events = await EventTriggerEngine.checkAndCreateEvents(renewal.id);
            
            for (const event of events) {
              await processEvent(event);
            }
          }
        }

        // 7. Check for health changes
        const { data: healthData } = await supabase
          .from('customer_health')
          .select('*')
          .eq('customer_id', renewal.customer_id)
          .order('created_at', { ascending: false })
          .limit(2);

        if (healthData && healthData.length >= 2) {
          const [current, previous] = healthData;
          const healthUpdate = await UpdateDetector.detectHealthChanges(
            renewal,
            current.health_status,
            previous.health_status
          );

          if (healthUpdate) {
            console.log(`Created health update for renewal ${renewal.id}`);
            const scores = await ActionScoreCalculator.processUpdate(healthUpdate);
            const events = await EventTriggerEngine.checkAndCreateEvents(renewal.id);
            
            for (const event of events) {
              await processEvent(event);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing renewal ${renewal.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in daily renewal processing:', error);
  }
  
  console.log('Daily renewal processing complete');
}

async function processEvent(event: any) {
  // For now, just log that we would create a workflow
  console.log(`Would create workflow for event: ${event.event_type} (score: ${event.total_action_score})`);
  
  await EventService.markEventProcessed(event.id, 0);
} 