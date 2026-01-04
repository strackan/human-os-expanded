import { createClient } from '@/lib/supabase';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';

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
  private static getClient() {
    return createClient();
  }

  static async getRecentAlerts(limit: number = 50): Promise<Alert[]> {
    const { data, error } = await this.getClient()
      .from(DB_TABLES.ALERTS)
      .select('*')
      .order(DB_COLUMNS.CREATED_AT, { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getUnprocessedAlerts(): Promise<Alert[]> {
    const { data, error } = await this.getClient()
      .from(DB_TABLES.ALERTS)
      .select('*')
      .is(DB_COLUMNS.PROCESSED_AT, null)
      .order(DB_COLUMNS.CREATED_AT, { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createAlert(alert: Omit<Alert, 'id' | 'created_at'>): Promise<Alert> {
    const { data, error } = await this.getClient()
      .from(DB_TABLES.ALERTS)
      .insert(alert)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markAlertAsProcessed(alertId: string): Promise<void> {
    const { error } = await this.getClient()
      .from(DB_TABLES.ALERTS)
      .update({ [DB_COLUMNS.PROCESSED_AT]: new Date().toISOString() })
      .eq(DB_COLUMNS.ID, alertId);

    if (error) throw error;
  }

  static async getAlertsByRenewalId(renewalId: string): Promise<Alert[]> {
    const { data, error } = await this.getClient()
      .from(DB_TABLES.ALERTS)
      .select('*')
      .eq(DB_COLUMNS.RENEWAL_ID, renewalId)
      .order(DB_COLUMNS.CREATED_AT, { ascending: false });

    if (error) throw error;
    return data;
  }
} 