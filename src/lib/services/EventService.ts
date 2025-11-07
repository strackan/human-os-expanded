import { createClient } from '@/lib/supabase';
import { Severity, type SeverityLevel } from '@/lib/constants/status-enums';

export interface Event {
  id: string;
  renewal_id: string;
  event_type: string;
  event_severity: SeverityLevel;
  total_action_score?: number;
  trigger_threshold?: number;
  contributing_updates?: string[];
  auto_triggered: boolean;
  manual_trigger_user_id?: string;
  event_data?: any;
  processed_at?: string;
  workflow_instances_created: number;
  created_at: string;
}

export class EventService {
  private static getClient() {
    return createClient();
  }

  static async createEvent(data: Omit<Event, 'id' | 'created_at' | 'workflow_instances_created'>): Promise<Event> {
    const { data: event, error } = await this.getClient()
      .from('events')
      .insert([{
        ...data,
        workflow_instances_created: 0
      }])
      .select()
      .single();
      
    if (error) throw error;
    return event;
  }
  
  static async getUnprocessedEvents(): Promise<Event[]> {
    const { data, error } = await this.getClient()
      .from('events')
      .select('*')
      .is('processed_at', null)
      .order('total_action_score', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }
  
  static async markEventProcessed(eventId: string, workflowsCreated: number = 0): Promise<void> {
    const { error } = await this.getClient()
      .from('events')
      .update({ 
        processed_at: new Date().toISOString(),
        workflow_instances_created: workflowsCreated
      })
      .eq('id', eventId);
      
    if (error) throw error;
  }

  static async getEventsForRenewal(renewalId: string): Promise<Event[]> {
    const { data, error } = await this.getClient()
      .from('events')
      .select('*')
      .eq('renewal_id', renewalId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }

  static async getLatestEventByType(renewalId: string, eventType: string): Promise<Event | null> {
    const { data, error } = await this.getClient()
      .from('events')
      .select('*')
      .eq('renewal_id', renewalId)
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  }
} 