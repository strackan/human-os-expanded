import { createClient } from '@/lib/supabase';

export interface ActionScore {
  id: string;
  renewal_id: string;
  update_id: string;
  score_type: string;
  score_value: number;
  score_weight?: number;
  calculation_method?: string;
  calculation_data?: any;
  contributes_to_total: boolean;
  expires_at?: string;
  created_at: string;
}

export class ActionScoreService {
  private static supabase = createClient();
  
  static async createActionScore(data: Omit<ActionScore, 'id' | 'created_at'>): Promise<ActionScore> {
    const { data: score, error } = await this.supabase
      .from('action_scores')
      .insert([data])
      .select()
      .single();
      
    if (error) throw error;
    return score;
  }
  
  static async getActiveScoresForRenewal(renewalId: string): Promise<ActionScore[]> {
    const { data, error } = await this.supabase
      .from('action_scores')
      .select('*')
      .eq('renewal_id', renewalId)
      .eq('contributes_to_total', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }
  
  static calculateTotalScore(scores: ActionScore[]): number {
    return scores.reduce((total, score) => {
      return total + (score.score_value * (score.score_weight || 1.0));
    }, 0);
  }

  static async getLatestScoreByType(renewalId: string, scoreType: string): Promise<ActionScore | null> {
    const { data, error } = await this.supabase
      .from('action_scores')
      .select('*')
      .eq('renewal_id', renewalId)
      .eq('score_type', scoreType)
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