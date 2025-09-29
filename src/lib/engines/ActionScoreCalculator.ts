import { ActionScoreService, ActionScore } from '../services/ActionScoreService';
import { Update } from '../services/UpdateService';

export class ActionScoreCalculator {
  static async calculateDateProximityScore(update: Update): Promise<ActionScore> {
    const daysUntil = update.current_value.days_until;
    let score = 0;
    
    // Simple scoring logic
    if (daysUntil <= 1) score = 100;      // Urgent
    else if (daysUntil <= 7) score = 85;  // High priority
    else if (daysUntil <= 15) score = 70; // Medium-high
    else if (daysUntil <= 30) score = 55; // Medium
    else if (daysUntil <= 60) score = 40; // Low-medium
    else if (daysUntil <= 90) score = 25; // Low
    
    return await ActionScoreService.createActionScore({
      renewal_id: update.renewal_id,
      update_id: update.id,
      score_type: 'urgency',
      score_value: score,
      score_weight: 1.0,
      calculation_method: 'date_proximity',
      calculation_data: {
        days_until: daysUntil,
        notice_type: update.current_value.notice_type
      },
      contributes_to_total: true
    });
  }

  static async calculateUsageChangeScore(update: Update): Promise<ActionScore> {
    const percentageChange = update.current_value.percentage_change;
    let score = 0;
    
    // Score based on magnitude and direction of change
    if (percentageChange > 0) {
      // Positive changes (increasing usage)
      if (percentageChange >= 50) score = 90;      // Significant growth
      else if (percentageChange >= 25) score = 75; // Strong growth
      else if (percentageChange >= 10) score = 60; // Moderate growth
    } else {
      // Negative changes (decreasing usage)
      if (percentageChange <= -50) score = 100;     // Critical decline
      else if (percentageChange <= -25) score = 85; // Severe decline
      else if (percentageChange <= -10) score = 70; // Moderate decline
    }
    
    return await ActionScoreService.createActionScore({
      renewal_id: update.renewal_id,
      update_id: update.id,
      score_type: 'usage_risk',
      score_value: score,
      score_weight: 1.2, // Weight usage changes more heavily
      calculation_method: 'usage_change',
      calculation_data: {
        percentage_change: percentageChange,
        trend: update.current_value.trend
      },
      contributes_to_total: true
    });
  }

  static async calculateHealthChangeScore(update: Update): Promise<ActionScore> {
    const changeDirection = update.current_value.change_direction;
    let score = 0;
    
    // Score based on health change direction
    switch (changeDirection) {
      case 'deteriorating':
        score = 85; // High priority for health deterioration
        break;
      case 'improving':
        score = 40; // Lower priority for improvements
        break;
      default:
        score = 50; // Neutral priority for no change
    }
    
    return await ActionScoreService.createActionScore({
      renewal_id: update.renewal_id,
      update_id: update.id,
      score_type: 'health_risk',
      score_value: score,
      score_weight: 1.5, // Weight health changes most heavily
      calculation_method: 'health_change',
      calculation_data: {
        change_direction: changeDirection,
        current_health: update.current_value.current_health,
        previous_health: update.current_value.previous_health
      },
      contributes_to_total: true
    });
  }
  
  static async processUpdate(update: Update): Promise<ActionScore[]> {
    const scores = [];
    
    switch (update.update_type) {
      case 'key_date_approaching':
        scores.push(await this.calculateDateProximityScore(update));
        break;
      case 'usage_change':
        scores.push(await this.calculateUsageChangeScore(update));
        break;
      case 'health_change':
        scores.push(await this.calculateHealthChangeScore(update));
        break;
    }
    
    return scores;
  }
} 