import { EventService, Event } from '../services/EventService';
import { ActionScoreService, ActionScore } from '../services/ActionScoreService';
import { Severity } from '../constants/status-enums';

export class EventTriggerEngine {
  static async checkAndCreateEvents(renewalId: string): Promise<Event[]> {
    const activeScores = await ActionScoreService.getActiveScoresForRenewal(renewalId);
    const totalScore = ActionScoreService.calculateTotalScore(activeScores);
    
    const events = [];
    
    // Critical threshold (80+)
    if (totalScore >= 80) {
      events.push(await EventService.createEvent({
        renewal_id: renewalId,
        event_type: 'critical_action_required',
        event_severity: Severity.CRITICAL,
        total_action_score: totalScore,
        trigger_threshold: 80,
        contributing_updates: activeScores.map(s => s.update_id),
        auto_triggered: true,
        event_data: {
          primary_trigger: this.identifyPrimaryTrigger(activeScores),
          urgency_level: 'immediate_attention',
          recommended_actions: this.getRecommendedActions(activeScores)
        }
      }));
    } 
    // High threshold (60-79)
    else if (totalScore >= 60) {
      events.push(await EventService.createEvent({
        renewal_id: renewalId,
        event_type: 'review_needed',
        event_severity: Severity.HIGH,
        total_action_score: totalScore,
        trigger_threshold: 60,
        contributing_updates: activeScores.map(s => s.update_id),
        auto_triggered: true,
        event_data: {
          primary_trigger: this.identifyPrimaryTrigger(activeScores),
          urgency_level: 'high_priority',
          recommended_actions: this.getRecommendedActions(activeScores)
        }
      }));
    }
    // Medium threshold (40-59)
    else if (totalScore >= 40) {
      events.push(await EventService.createEvent({
        renewal_id: renewalId,
        event_type: 'monitor_situation',
        event_severity: Severity.MEDIUM,
        total_action_score: totalScore,
        trigger_threshold: 40,
        contributing_updates: activeScores.map(s => s.update_id),
        auto_triggered: true,
        event_data: {
          primary_trigger: this.identifyPrimaryTrigger(activeScores),
          urgency_level: 'standard_priority',
          recommended_actions: this.getRecommendedActions(activeScores)
        }
      }));
    }
    
    return events;
  }
  
  private static identifyPrimaryTrigger(scores: ActionScore[]): string {
    // Find the highest scoring update
    const topScore = scores.reduce((max, score) =>
      score.score_value > max.score_value ? score : max
    );
    return topScore.calculation_method || 'unknown';
  }

  private static getRecommendedActions(scores: ActionScore[]): string[] {
    const actions = new Set<string>();
    
    scores.forEach(score => {
      switch (score.calculation_method) {
        case 'date_proximity':
          if (score.score_value >= 85) {
            actions.add('Schedule immediate executive review');
            actions.add('Prepare renewal proposal');
          } else if (score.score_value >= 70) {
            actions.add('Schedule renewal planning meeting');
          }
          break;
          
        case 'usage_change':
          if (score.score_value >= 85) {
            actions.add('Investigate usage decline');
            actions.add('Schedule customer success review');
          } else if (score.score_value >= 70) {
            actions.add('Review usage patterns');
          }
          break;
          
        case 'health_change':
          if (score.score_value >= 85) {
            actions.add('Schedule executive engagement');
            actions.add('Review customer health metrics');
          } else if (score.score_value >= 70) {
            actions.add('Monitor health indicators');
          }
          break;
      }
    });
    
    return Array.from(actions);
  }
} 