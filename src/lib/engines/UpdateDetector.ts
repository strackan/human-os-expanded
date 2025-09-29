import { UpdateService, Update } from '../services/UpdateService';

export class UpdateDetector {
  static async detectKeyDateUpdates(renewal: any): Promise<Update | null> {
    const renewalDate = new Date(renewal.renewal_date);
    const today = new Date();
    const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Create updates for key milestone dates
    if ([90, 60, 30, 15, 7, 1].includes(daysUntil)) {
      return await UpdateService.createUpdate({
        renewal_id: renewal.id,
        update_type: 'key_date_approaching',
        update_subtype: `${daysUntil}_day_notice`,
        current_value: { 
          days_until: daysUntil,
          renewal_date: renewal.renewal_date,
          notice_type: daysUntil >= 60 ? 'advance_notice' : 'urgent_notice'
        },
        data_source: 'system_calculation',
        confidence_score: 1.0
      });
    }
    
    return null;
  }

  static async detectUsageChanges(renewal: any, currentUsage: number, previousUsage: number): Promise<Update | null> {
    const usageChange = ((currentUsage - previousUsage) / previousUsage) * 100;
    
    if (Math.abs(usageChange) >= 10) { // 10% threshold for significant changes
      return await UpdateService.createUpdate({
        renewal_id: renewal.id,
        update_type: 'usage_change',
        update_subtype: usageChange > 0 ? 'usage_increase' : 'usage_decrease',
        current_value: {
          current_usage: currentUsage,
          previous_usage: previousUsage,
          percentage_change: usageChange,
          trend: usageChange > 0 ? 'increasing' : 'decreasing'
        },
        previous_value: {
          usage: previousUsage
        },
        data_source: 'usage_metrics',
        confidence_score: 0.9
      });
    }
    
    return null;
  }

  static async detectHealthChanges(renewal: any, currentHealth: string, previousHealth: string): Promise<Update | null> {
    if (currentHealth !== previousHealth) {
      return await UpdateService.createUpdate({
        renewal_id: renewal.id,
        update_type: 'health_change',
        update_subtype: `${previousHealth}_to_${currentHealth}`,
        current_value: {
          current_health: currentHealth,
          previous_health: previousHealth,
          change_direction: this.getHealthChangeDirection(previousHealth, currentHealth)
        },
        previous_value: {
          health: previousHealth
        },
        data_source: 'health_metrics',
        confidence_score: 0.8
      });
    }
    
    return null;
  }

  private static getHealthChangeDirection(previous: string, current: string): string {
    const healthLevels = ['critical', 'at_risk', 'neutral', 'healthy', 'expansion_ready'];
    const previousIndex = healthLevels.indexOf(previous.toLowerCase());
    const currentIndex = healthLevels.indexOf(current.toLowerCase());
    
    if (currentIndex > previousIndex) return 'improving';
    if (currentIndex < previousIndex) return 'deteriorating';
    return 'unchanged';
  }
} 