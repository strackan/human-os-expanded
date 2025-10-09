/**
 * Customer Context API
 *
 * GET /api/workflows/context?customerId={id}
 * - Returns full customer context for workflows
 * - Includes customer data, intelligence, financials, and workflow metadata
 * - Used by LLM for personalized responses and workflow orchestrator
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const workflowExecutionId = searchParams.get('workflowExecutionId');

    if (!customerId && !workflowExecutionId) {
      return NextResponse.json(
        { error: 'customerId or workflowExecutionId is required' },
        { status: 400 }
      );
    }

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let customerIdToFetch = customerId;

    // If workflowExecutionId provided, get customerId from workflow_executions
    if (workflowExecutionId && !customerId) {
      const { data: execution } = await supabase
        .from('workflow_executions')
        .select('customer_id')
        .eq('id', workflowExecutionId)
        .single();

      if (execution) {
        customerIdToFetch = execution.customer_id;
      }
    }

    if (!customerIdToFetch) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerIdToFetch)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate days until renewal
    const renewalDate = new Date(customer.renewal_date);
    const today = new Date();
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate renewal_stage if not stored (fallback)
    let renewalStage = customer.renewal_stage;
    if (!renewalStage) {
      renewalStage = calculateRenewalStage(daysUntilRenewal);
    }

    // Get customer intelligence from database (uses helper function)
    const { data: intelligenceData, error: intelligenceError } = await supabase
      .rpc('get_latest_intelligence', { p_customer_id: customerIdToFetch });

    const intelligence = intelligenceData && intelligenceData.length > 0 ? {
      riskScore: intelligenceData[0].risk_score,
      opportunityScore: intelligenceData[0].opportunity_score,
      healthScore: intelligenceData[0].health_score,
      trends: {
        health: intelligenceData[0].health_trend || 'stable',
        usage: intelligenceData[0].usage_trend || 'stable',
        engagement: intelligenceData[0].engagement_trend || 'moderate'
      },
      churnProbability: intelligenceData[0].churn_probability,
      expansionProbability: intelligenceData[0].expansion_probability
    } : {
      // Fallback to calculated values if no data in table
      riskScore: customer.health_score < 50 ? 75 : customer.health_score < 70 ? 40 : 15,
      opportunityScore: customer.current_arr > 100000 ? 80 : customer.current_arr > 50000 ? 60 : 30,
      healthScore: customer.health_score,
      trends: {
        health: customer.health_score > 70 ? 'improving' : customer.health_score < 50 ? 'declining' : 'stable',
        usage: 'stable',
        engagement: 'moderate'
      }
    };

    // Get financial data from database
    const { data: financialsData, error: financialsError } = await supabase
      .rpc('get_latest_financials', { p_customer_id: customerIdToFetch });

    const financials = financialsData && financialsData.length > 0 ? {
      currentARR: financialsData[0].current_arr,
      previousARR: financialsData[0].previous_arr,
      projectedARR: financialsData[0].projected_arr,
      trend: financialsData[0].arr_trend || 'stable',
      growthRate: financialsData[0].growth_rate,
      paymentStatus: financialsData[0].payment_status
    } : {
      // Fallback if no data
      currentARR: customer.current_arr,
      previousARR: customer.current_arr * 0.9,
      trend: 'growing',
      projectedARR: customer.current_arr * 1.1
    };

    // Get usage data from database
    const { data: usageData, error: usageError } = await supabase
      .rpc('get_latest_usage', { p_customer_id: customerIdToFetch });

    const usage = usageData && usageData.length > 0 ? {
      activeUsers: usageData[0].active_users,
      utilizationRate: usageData[0].utilization_rate,
      lastActivityDate: usageData[0].last_activity_date,
      trend: usageData[0].usage_trend || 'stable',
      adoptionRate: usageData[0].adoption_rate
    } : {
      // Fallback if no data
      activeUsers: Math.floor(customer.current_arr / 5000),
      utilizationRate: customer.health_score,
      trend: 'stable',
      lastActivityDate: new Date().toISOString()
    };

    // Get engagement data from database
    const { data: engagementData, error: engagementError } = await supabase
      .rpc('get_latest_engagement', { p_customer_id: customerIdToFetch });

    const engagement = engagementData && engagementData.length > 0 ? {
      lastContact: engagementData[0].last_contact_date,
      qbrDate: engagementData[0].last_qbr_date,
      npsScore: engagementData[0].nps_score,
      supportTickets: engagementData[0].open_support_tickets,
      engagementScore: engagementData[0].engagement_score,
      sentiment: engagementData[0].sentiment
    } : {
      // Fallback if no data
      lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      qbrDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      supportTickets: 2,
      npsScore: customer.health_score > 70 ? 9 : customer.health_score > 50 ? 7 : 5
    };

    // Get stakeholders for account team
    const { data: stakeholders } = await supabase
      .from('customer_stakeholders')
      .select('*')
      .eq('customer_id', customerIdToFetch)
      .order('influence_level', { ascending: false });

    const accountTeam = {
      csm: {
        id: customer.assigned_to || user.id,
        name: 'Account Manager', // TODO: Fetch from users table
        email: 'csm@company.com' // TODO: Fetch from users table
      },
      stakeholders: stakeholders || [],
      decisionMakers: stakeholders?.filter(s => s.decision_authority) || [],
      champions: stakeholders?.filter(s => s.is_champion) || []
    };

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        domain: customer.domain,
        industry: customer.industry,
        arr: customer.current_arr,
        renewalDate: customer.renewal_date,
        owner: customer.assigned_to,
        accountPlan: customer.account_plan,
        healthScore: customer.health_score
      },
      intelligence,
      data: {
        financials,
        usage,
        engagement
      },
      workflow: {
        daysUntilRenewal,
        renewalStage,
        accountPlan: customer.account_plan,
        priorityScore: calculatePriorityScore(customer, daysUntilRenewal) // Mock priority calculation
      },
      accountTeam
    });

  } catch (error) {
    console.error('Error in customer context API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate renewal stage from days
function calculateRenewalStage(daysUntilRenewal: number): string {
  if (daysUntilRenewal < 0) return 'Overdue';
  if (daysUntilRenewal < 7) return 'Emergency';
  if (daysUntilRenewal < 15) return 'Critical';
  if (daysUntilRenewal < 31) return 'Signature';
  if (daysUntilRenewal < 61) return 'Finalize';
  if (daysUntilRenewal < 91) return 'Negotiate';
  if (daysUntilRenewal < 120) return 'Engage';
  if (daysUntilRenewal < 180) return 'Prepare';
  return 'Monitor';
}

// Helper function to calculate priority score (simplified version of orchestrator logic)
function calculatePriorityScore(customer: any, daysUntilRenewal: number): number {
  let score = 0;

  // ARR weight (0-50 points)
  if (customer.current_arr > 150000) score += 50;
  else if (customer.current_arr > 100000) score += 40;
  else if (customer.current_arr > 50000) score += 30;
  else score += 20;

  // Urgency weight (0-40 points)
  if (daysUntilRenewal < 7) score += 40;
  else if (daysUntilRenewal < 15) score += 35;
  else if (daysUntilRenewal < 31) score += 30;
  else if (daysUntilRenewal < 61) score += 20;
  else score += 10;

  // Health weight (0-20 points)
  if (customer.health_score < 50) score += 20; // At-risk gets higher priority
  else if (customer.health_score < 70) score += 15;
  else score += 10;

  // Account plan weight (0-15 points)
  if (customer.account_plan === 'expand') score += 15;
  else if (customer.account_plan === 'invest') score += 12;
  else if (customer.account_plan === 'manage') score += 8;
  else score += 5;

  return score;
}
