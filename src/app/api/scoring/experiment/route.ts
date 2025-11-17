/**
 * Scoring Experiment API
 * Compare different scoring approaches for InHerSight customers
 *
 * POST /api/scoring/experiment
 * Body: { customerId: string, methods?: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { inhersightScoringService, CustomerData } from '@/lib/services/InHerSightScoringService';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { customerId, methods } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch customer data with all related information
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        customer_properties (*),
        contacts (
          id,
          first_name,
          last_name,
          email,
          is_primary,
          created_at
        ),
        contracts (
          id,
          contract_term_months,
          auto_renewal
        ),
        customer_engagement_metrics (
          brand_impressions,
          profile_views,
          profile_completion_pct,
          job_matches,
          apply_clicks,
          article_inclusions,
          new_ratings,
          engagement_score,
          period_start,
          period_end
        )
      `)
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get latest metrics
    const latestMetrics = customer.customer_engagement_metrics?.sort(
      (a: any, b: any) => new Date(b.period_end).getTime() - new Date(a.period_end).getTime()
    )[0] || {};

    // Get last interaction
    const { data: lastEvent } = await supabase
      .from('events')
      .select('event_date, metadata')
      .eq('customer_id', customerId)
      .order('event_date', { ascending: false })
      .limit(1)
      .single();

    const lastInteractionDays = lastEvent
      ? Math.floor((Date.now() - new Date(lastEvent.event_date).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Get recent sentiment from events
    const { data: recentEvents } = await supabase
      .from('events')
      .select('sentiment')
      .eq('customer_id', customerId)
      .not('sentiment', 'is', null)
      .order('event_date', { ascending: false })
      .limit(5);

    const recentSentiment = recentEvents?.[0]?.sentiment || null;

    // Get open support tickets count
    const { count: openTickets } = await supabase
      .from('demo_support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .is('resolution_time_hours', null);

    // Build customer data object
    const customerData: CustomerData = {
      customer_id: customer.id,
      name: customer.name,
      health_score: customer.health_score || 0,
      current_arr: customer.current_arr || 0,
      renewal_date: customer.renewal_date,

      // Properties
      revenue_impact_tier: customer.customer_properties?.[0]?.revenue_impact_tier,
      churn_risk_score: customer.customer_properties?.[0]?.churn_risk_score,
      usage_score: customer.customer_properties?.[0]?.usage_score,
      nps_score: customer.customer_properties?.[0]?.nps_score,

      // Metrics
      brand_impressions: latestMetrics.brand_impressions,
      profile_views: latestMetrics.profile_views,
      profile_completion_pct: latestMetrics.profile_completion_pct,
      job_matches: latestMetrics.job_matches,
      apply_clicks: latestMetrics.apply_clicks,
      article_inclusions: latestMetrics.article_inclusions,
      new_ratings: latestMetrics.new_ratings,
      engagement_score: latestMetrics.engagement_score,

      // Contract
      contract_term_months: customer.contracts?.[0]?.contract_term_months,
      auto_renewal: customer.contracts?.[0]?.auto_renewal,

      // Contacts
      primary_contact_present: customer.contacts?.some((c: any) => c.is_primary) || false,
      contact_changes_recent: this.hasRecentContactChanges(customer.contacts),

      // Interactions
      last_interaction_days: lastInteractionDays,
      recent_sentiment: recentSentiment,
      support_tickets_open: openTickets || 0
    };

    // Run scoring experiments
    const methodsToRun = methods || ['rule-based', 'claude-hybrid', 'ml'];
    const results: any = {};

    if (methodsToRun.includes('rule-based')) {
      results.ruleBased = await inhersightScoringService.scoreRuleBased(customerData);
    }

    if (methodsToRun.includes('claude-hybrid')) {
      results.claudeHybrid = await inhersightScoringService.scoreClaudeHybrid(customerData);
    }

    if (methodsToRun.includes('ml')) {
      results.ml = await inhersightScoringService.scoreML(customerData);
    }

    // Calculate comparison metrics
    const comparison = this.compareResults(results);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        arr: customer.current_arr,
        renewal_date: customer.renewal_date
      },
      results,
      comparison
    });

  } catch (error) {
    console.error('Scoring experiment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Scoring experiment failed'
      },
      { status: 500 }
    );
  }

  private hasRecentContactChanges(contacts: any[]): boolean {
    if (!contacts || contacts.length === 0) return true;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return contacts.some(c => new Date(c.created_at) > thirtyDaysAgo);
  }

  private compareResults(results: any) {
    const methods = Object.keys(results);
    if (methods.length === 0) return {};

    // Calculate agreement (how close are the scores?)
    const riskScores = methods.map(m => results[m].risk_score);
    const oppScores = methods.map(m => results[m].opportunity_score);

    const riskStdDev = this.standardDeviation(riskScores);
    const oppStdDev = this.standardDeviation(oppScores);

    return {
      agreement: {
        risk: {
          average: Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length),
          stdDev: Math.round(riskStdDev),
          agreement: riskStdDev < 10 ? 'high' : riskStdDev < 20 ? 'medium' : 'low'
        },
        opportunity: {
          average: Math.round(oppScores.reduce((a, b) => a + b, 0) / oppScores.length),
          stdDev: Math.round(oppStdDev),
          agreement: oppStdDev < 10 ? 'high' : oppStdDev < 20 ? 'medium' : 'low'
        }
      },
      performance: {
        fastest: methods.reduce((fastest, method) =>
          results[method].execution_time_ms < results[fastest].execution_time_ms ? method : fastest
        ),
        executionTimes: Object.fromEntries(
          methods.map(m => [m, results[m].execution_time_ms])
        )
      },
      confidence: {
        highest: methods.reduce((highest, method) =>
          results[method].confidence > results[highest].confidence ? method : highest
        ),
        confidenceLevels: Object.fromEntries(
          methods.map(m => [m, results[m].confidence])
        )
      }
    };
  }

  private standardDeviation(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }
}
