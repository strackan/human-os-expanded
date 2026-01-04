export interface Update {
  id: string;
  type?: string;
  title?: string;
  description?: string;
  renewal_id: string;
  update_type: string;
  update_subtype?: string;
  current_value: any;
  previous_value?: any;
  data_source?: string;
  confidence_score?: number;
  created_at: string;
  updated_at: string;
}

export class UpdateService {
  static async getUpdates(): Promise<Update[]> {
    // Placeholder implementation
    return [];
  }

  static async createUpdate(update: Omit<Update, 'id' | 'created_at' | 'updated_at'>): Promise<Update> {
    // Placeholder implementation
    return {
      id: 'update-id',
      ...update,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
} 