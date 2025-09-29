import { createClient } from '@/lib/supabase';

export interface Alert {
  id: string;
  renewal_id: string;
  alert_type: string;
  alert_subtype?: string;
  data_source: string;
  confidence_score: number;
  current_value: any;
  previous_value?: any;
  created_at: string;
  processed_at?: string;
  metadata?: any;
}

export class AlertService {
  private static supabase = createClient();

  static async getRecentAlerts(limit: number = 50): Promise<Alert[]> {
    const { data, error } = await this.supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getUnprocessedAlerts(): Promise<Alert[]> {
    const { data, error } = await this.supabase
      .from('alerts')
      .select('*')
      .is('processed_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createAlert(alert: Omit<Alert, 'id' | 'created_at'>): Promise<Alert> {
    const { data, error } = await this.supabase
      .from('alerts')
      .insert(alert)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markAlertAsProcessed(alertId: string): Promise<void> {
    const { error } = await this.supabase
      .from('alerts')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', alertId);

    if (error) throw error;
  }

  static async getAlertsByRenewalId(renewalId: string): Promise<Alert[]> {
    const { data, error } = await this.supabase
      .from('alerts')
      .select('*')
      .eq('renewal_id', renewalId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
} 