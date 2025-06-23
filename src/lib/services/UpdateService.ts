export interface Update {
  id: string;
  type: string;
  title: string;
  description: string;
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