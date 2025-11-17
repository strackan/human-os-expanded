/**
 * InHerSight Scoring Service
 * Implements multiple scoring approaches for comparison
 *
 * Experiments:
 * A) Rule-based scoring
 * B) Claude + Rules hybrid
 * C) ML-based scoring (POC)
 * D) Data enrichment integration
 */

import { AnthropicService } from './AnthropicService';

export interface CustomerData {
  customer_id: string;
  name: string;
  health_score: number;
  current_arr: number;
  renewal_date: string;

  // Customer properties
  revenue_impact_tier?: number;
  churn_risk_score?: number;
  usage_score?: number;
  nps_score?: number;

  // Engagement metrics (latest month)
  brand_impressions?: number;
  profile_views?: number;
  profile_completion_pct?: number;
  job_matches?: number;
  apply_clicks?: number;
  article_inclusions?: number;
  new_ratings?: number;
  engagement_score?: number;

  // Contract info
  contract_term_months?: number;
  auto_renewal?: boolean;

  // Contact info
  primary_contact_present?: boolean;
  contact_changes_recent?: boolean;

  // Interaction history
  last_interaction_days?: number;
  recent_sentiment?: string;
  support_tickets_open?: number;
}

export interface ScoringResult {
  method: 'rule-based' | 'claude-hybrid' | 'ml' | 'enriched';
  risk_score: number; // 0-100, higher = more risk
  opportunity_score: number; // 0-100, higher = more opportunity
  confidence: number; // 0-100
  factors: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    value: any;
  }[];
  recommendations: string[];
  execution_time_ms: number;
}

export class InHerSightScoringService {
  private anthropic: AnthropicService;

  constructor() {
    this.anthropic = new AnthropicService();
  }

  /**
   * EXPERIMENT A: Rule-based Scoring
   * Pure algorithmic approach using business rules
   */
  async scoreRuleBased(customer: CustomerData): Promise<ScoringResult> {
    const startTime = Date.now();
    const factors: ScoringResult['factors'] = [];

    let riskScore = 0;
    let opportunityScore = 0;

    // ====================
    // RISK FACTORS
    // ====================

    // Health score (0-30 points of risk)
    if (customer.health_score < 50) {
      const riskPoints = (50 - customer.health_score) * 0.6;
      riskScore += riskPoints;
      factors.push({
        name: 'Low Health Score',
        impact: 'negative',
        weight: riskPoints,
        value: customer.health_score
      });
    }

    // Profile completion (0-15 points of risk)
    if (customer.profile_completion_pct && customer.profile_completion_pct < 70) {
      const riskPoints = (70 - customer.profile_completion_pct) * 0.2;
      riskScore += riskPoints;
      factors.push({
        name: 'Incomplete Profile',
        impact: 'negative',
        weight: riskPoints,
        value: `${customer.profile_completion_pct}%`
      });
    }

    // Low engagement (0-20 points of risk)
    if (customer.engagement_score && customer.engagement_score < 20) {
      const riskPoints = (20 - customer.engagement_score) * 1;
      riskScore += riskPoints;
      factors.push({
        name: 'Low Platform Engagement',
        impact: 'negative',
        weight: riskPoints,
        value: customer.engagement_score
      });
    }

    // Lack of recent interaction (0-15 points of risk)
    if (customer.last_interaction_days && customer.last_interaction_days > 60) {
      const riskPoints = Math.min((customer.last_interaction_days - 60) * 0.25, 15);
      riskScore += riskPoints;
      factors.push({
        name: 'No Recent Contact',
        impact: 'negative',
        weight: riskPoints,
        value: `${customer.last_interaction_days} days`
      });
    }

    // Lost primary contact (20 points of risk)
    if (!customer.primary_contact_present || customer.contact_changes_recent) {
      riskScore += 20;
      factors.push({
        name: 'Primary Contact Lost/Changed',
        impact: 'negative',
        weight: 20,
        value: 'Yes'
      });
    }

    // Negative sentiment (0-10 points of risk)
    if (customer.recent_sentiment === 'negative' || customer.recent_sentiment === 'frustrated') {
      riskScore += 10;
      factors.push({
        name: 'Negative Recent Sentiment',
        impact: 'negative',
        weight: 10,
        value: customer.recent_sentiment
      });
    }

    // Open support tickets (0-10 points of risk)
    if (customer.support_tickets_open && customer.support_tickets_open > 2) {
      const riskPoints = Math.min(customer.support_tickets_open * 3, 10);
      riskScore += riskPoints;
      factors.push({
        name: 'Multiple Open Support Tickets',
        impact: 'negative',
        weight: riskPoints,
        value: customer.support_tickets_open
      });
    }

    // ====================
    // OPPORTUNITY FACTORS
    // ====================

    // High engagement (0-30 points of opportunity)
    if (customer.engagement_score && customer.engagement_score > 35) {
      const oppPoints = (customer.engagement_score - 35) * 2;
      opportunityScore += oppPoints;
      factors.push({
        name: 'High Platform Engagement',
        impact: 'positive',
        weight: oppPoints,
        value: customer.engagement_score
      });
    }

    // High profile completion (0-15 points of opportunity)
    if (customer.profile_completion_pct && customer.profile_completion_pct > 90) {
      opportunityScore += 15;
      factors.push({
        name: 'Excellent Profile Completion',
        impact: 'positive',
        weight: 15,
        value: `${customer.profile_completion_pct}%`
      });
    }

    // High apply clicks rate (0-20 points of opportunity)
    if (customer.apply_clicks && customer.job_matches) {
      const clickRate = (customer.apply_clicks / customer.job_matches) * 100;
      if (clickRate > 15) {
        const oppPoints = Math.min((clickRate - 15) * 1, 20);
        opportunityScore += oppPoints;
        factors.push({
          name: 'Strong Job Application Rate',
          impact: 'positive',
          weight: oppPoints,
          value: `${clickRate.toFixed(1)}%`
        });
      }
    }

    // Article inclusions (0-15 points of opportunity)
    if (customer.article_inclusions && customer.article_inclusions > 2) {
      const oppPoints = Math.min(customer.article_inclusions * 5, 15);
      opportunityScore += oppPoints;
      factors.push({
        name: 'Featured in Articles',
        impact: 'positive',
        weight: oppPoints,
        value: customer.article_inclusions
      });
    }

    // High ARR (0-20 points of opportunity for expansion)
    if (customer.current_arr > 100000) {
      opportunityScore += 20;
      factors.push({
        name: 'High-Value Account (Expansion Potential)',
        impact: 'positive',
        weight: 20,
        value: `$${customer.current_arr.toLocaleString()}`
      });
    }

    // Normalize scores to 0-100
    riskScore = Math.min(Math.max(riskScore, 0), 100);
    opportunityScore = Math.min(Math.max(opportunityScore, 0), 100);

    // Generate recommendations based on factors
    const recommendations = this.generateRecommendations(factors, customer);

    return {
      method: 'rule-based',
      risk_score: Math.round(riskScore),
      opportunity_score: Math.round(opportunityScore),
      confidence: 85, // Rule-based is deterministic, high confidence
      factors: factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
      recommendations,
      execution_time_ms: Date.now() - startTime
    };
  }

  /**
   * EXPERIMENT B: Claude + Rules Hybrid
   * Use rules as foundation, Claude for nuanced analysis
   */
  async scoreClaudeHybrid(customer: CustomerData): Promise<ScoringResult> {
    const startTime = Date.now();

    // First get rule-based score
    const ruleBasedResult = await this.scoreRuleBased(customer);

    // Now enhance with Claude analysis
    const prompt = `You are analyzing a customer account for InHerSight (employer branding platform for women).

Customer: ${customer.name}
Current ARR: $${customer.current_arr.toLocaleString()}
Renewal Date: ${customer.renewal_date}
Days to Renewal: ${Math.floor((new Date(customer.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}

Metrics Summary:
- Health Score: ${customer.health_score}/100
- Profile Completion: ${customer.profile_completion_pct || 'unknown'}%
- Brand Impressions (monthly): ${customer.brand_impressions || 0}
- Profile Views (monthly): ${customer.profile_views || 0}
- Job Apply Clicks (monthly): ${customer.apply_clicks || 0}
- Article Features: ${customer.article_inclusions || 0}
- Engagement Score: ${customer.engagement_score || 0}/50

Risk Factors Identified (Rule-based):
${ruleBasedResult.factors.filter(f => f.impact === 'negative').map(f => `- ${f.name}: ${f.value}`).join('\n')}

Opportunity Factors Identified (Rule-based):
${ruleBasedResult.factors.filter(f => f.impact === 'positive').map(f => `- ${f.name}: ${f.value}`).join('\n')}

Rule-Based Scores:
- Risk: ${ruleBasedResult.risk_score}/100
- Opportunity: ${ruleBasedResult.opportunity_score}/100

Based on this data, provide:
1. Adjusted risk score (0-100) considering context and nuance
2. Adjusted opportunity score (0-100)
3. Confidence level (0-100) in your assessment
4. 2-3 specific, actionable recommendations for the CSM

Respond in this exact JSON format:
{
  "risk_score": <number>,
  "opportunity_score": <number>,
  "confidence": <number>,
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"],
  "reasoning": "<brief explanation of adjustments made>"
}`;

    try {
      const claudeResponse = await this.anthropic.generateText(prompt, {
        maxTokens: 500,
        temperature: 0.3
      });

      // Parse Claude's response
      const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse Claude response');
      }

      const claudeAnalysis = JSON.parse(jsonMatch[0]);

      // Add Claude's reasoning as a factor
      const enhancedFactors = [
        ...ruleBasedResult.factors,
        {
          name: 'AI Nuanced Analysis',
          impact: 'neutral' as const,
          weight: Math.abs(claudeAnalysis.risk_score - ruleBasedResult.risk_score),
          value: claudeAnalysis.reasoning
        }
      ];

      return {
        method: 'claude-hybrid',
        risk_score: claudeAnalysis.risk_score,
        opportunity_score: claudeAnalysis.opportunity_score,
        confidence: claudeAnalysis.confidence,
        factors: enhancedFactors,
        recommendations: claudeAnalysis.recommendations,
        execution_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error('Claude hybrid scoring failed, falling back to rule-based:', error);
      return {
        ...ruleBasedResult,
        method: 'claude-hybrid',
        execution_time_ms: Date.now() - startTime
      };
    }
  }

  /**
   * EXPERIMENT C: ML-based Scoring (POC)
   * Simple logistic regression approach
   */
  async scoreML(customer: CustomerData): Promise<ScoringResult> {
    const startTime = Date.now();

    // Note: This is a SIMPLIFIED ML POC
    // In production, this would use a trained model with historical data

    // Feature engineering
    const features = {
      health_normalized: (customer.health_score || 0) / 100,
      profile_completion_normalized: (customer.profile_completion_pct || 0) / 100,
      engagement_normalized: (customer.engagement_score || 0) / 50,
      arr_log: Math.log(customer.current_arr + 1) / Math.log(1000000), // Normalize ARR
      days_to_renewal_normalized: Math.min((this.getDaysToRenewal(customer.renewal_date) || 180) / 180, 1),
      has_primary_contact: customer.primary_contact_present ? 1 : 0,
      recent_interaction_score: customer.last_interaction_days
        ? Math.max(0, 1 - (customer.last_interaction_days / 90))
        : 0.5
    };

    // Weights (these would be learned from training data)
    // For POC, using domain knowledge to set reasonable weights
    const riskWeights = {
      health_normalized: -40, // Lower health = higher risk
      profile_completion_normalized: -15,
      engagement_normalized: -20,
      arr_log: -5, // Higher ARR = lower relative risk (they have more to lose)
      days_to_renewal_normalized: 15, // Closer to renewal = higher risk
      has_primary_contact: -20,
      recent_interaction_score: -15
    };

    const opportunityWeights = {
      health_normalized: 30, // Higher health = more opportunity
      profile_completion_normalized: 15,
      engagement_normalized: 25,
      arr_log: 20, // Higher ARR = more opportunity value
      days_to_renewal_normalized: -5, // Closer to renewal = less time for expansion
      has_primary_contact: 10,
      recent_interaction_score: 10
    };

    // Calculate scores (simplified logistic regression)
    let riskScore = 50; // Base score
    let opportunityScore = 50;

    Object.keys(features).forEach(key => {
      const featureKey = key as keyof typeof features;
      riskScore += features[featureKey] * riskWeights[featureKey];
      opportunityScore += features[featureKey] * opportunityWeights[featureKey];
    });

    // Normalize to 0-100
    riskScore = Math.min(Math.max(riskScore, 0), 100);
    opportunityScore = Math.min(Math.max(opportunityScore, 0), 100);

    // Create factor explanations
    const factors: ScoringResult['factors'] = Object.entries(features).map(([key, value]) => {
      const riskWeight = riskWeights[key as keyof typeof riskWeights];
      const impact = riskWeight * value < 0 ? 'positive' : riskWeight * value > 0 ? 'negative' : 'neutral';

      return {
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        impact: impact as 'positive' | 'negative' | 'neutral',
        weight: Math.abs(riskWeight * value),
        value: value.toFixed(2)
      };
    });

    const recommendations = [
      riskScore > 60 ? 'High risk detected - prioritize immediate outreach' : 'Risk level manageable - maintain regular cadence',
      opportunityScore > 60 ? 'Strong expansion opportunity - prepare upsell materials' : 'Focus on retention over expansion',
      'ML model confidence is preliminary - validate with CSM judgment'
    ];

    return {
      method: 'ml',
      risk_score: Math.round(riskScore),
      opportunity_score: Math.round(opportunityScore),
      confidence: 60, // Lower confidence for POC without trained model
      factors: factors.sort((a, b) => b.weight - a.weight),
      recommendations,
      execution_time_ms: Date.now() - startTime
    };
  }

  /**
   * Generate recommendations from factors
   */
  private generateRecommendations(factors: ScoringResult['factors'], customer: CustomerData): string[] {
    const recommendations: string[] = [];
    const topNegative = factors.filter(f => f.impact === 'negative').slice(0, 3);
    const topPositive = factors.filter(f => f.impact === 'positive').slice(0, 2);

    // Address top risks
    topNegative.forEach(factor => {
      if (factor.name.includes('Health Score')) {
        recommendations.push('Schedule health assessment call to understand satisfaction drivers');
      } else if (factor.name.includes('Profile')) {
        recommendations.push('Offer profile optimization session to improve completion and visibility');
      } else if (factor.name.includes('Contact')) {
        recommendations.push('URGENT: Identify and establish relationship with new primary contact');
      } else if (factor.name.includes('Engagement')) {
        recommendations.push('Review platform usage patterns and provide targeted training');
      } else if (factor.name.includes('Sentiment')) {
        recommendations.push('Address negative feedback immediately - escalate to leadership if needed');
      }
    });

    // Leverage opportunities
    topPositive.forEach(factor => {
      if (factor.name.includes('Engagement')) {
        recommendations.push('High engagement indicates satisfaction - excellent timing for case study or expansion discussion');
      } else if (factor.name.includes('Profile') || factor.name.includes('Article')) {
        recommendations.push('Showcase their success in marketing materials - potential for advocacy/reference');
      } else if (factor.name.includes('Value')) {
        recommendations.push('Prepare expansion proposal focusing on additional products/features');
      }
    });

    // Ensure at least 2 recommendations
    if (recommendations.length === 0) {
      recommendations.push('Maintain regular cadence - schedule quarterly business review');
      recommendations.push('Monitor engagement metrics for early warning signs');
    }

    return recommendations.slice(0, 4);
  }

  /**
   * Helper to calculate days to renewal
   */
  private getDaysToRenewal(renewalDate: string): number {
    const now = new Date();
    const renewal = new Date(renewalDate);
    return Math.floor((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
}

export const inhersightScoringService = new InHerSightScoringService();
