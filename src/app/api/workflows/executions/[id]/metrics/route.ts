/**
 * Customer Metrics API
 *
 * GET /api/workflows/executions/[id]/metrics
 * - Get customer metrics for workflow context
 * - Backend determines display configuration (colors, thresholds, priority)
 *
 * Phase 3.4: Workflow Execution Framework - Customer Metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

// =====================================================
// Types
// =====================================================

interface MetricConfig {
  label: string;
  value: string;
  sublabel?: string;
  status: 'green' | 'yellow' | 'red' | 'neutral';
  trend?: 'up' | 'down' | 'flat';
  priority: number; // 1-10, determines display order
}

// =====================================================
// Business Logic: Metric Calculations & Thresholds
// =====================================================

function calculateHealthStatus(healthScore: number): 'green' | 'yellow' | 'red' {
  if (healthScore >= 80) return 'green';
  if (healthScore >= 60) return 'yellow';
  return 'red';
}

function calculateRiskStatus(riskScore: number): 'green' | 'yellow' | 'red' {
  if (riskScore <= 3) return 'green';
  if (riskScore <= 6) return 'yellow';
  return 'red';
}

function calculateRenewalUrgency(daysUntilRenewal: number): 'green' | 'yellow' | 'red' {
  if (daysUntilRenewal > 90) return 'green';
  if (daysUntilRenewal > 30) return 'yellow';
  return 'red';
}

function calculateARRTrend(currentARR: number, previousARR?: number): 'up' | 'down' | 'flat' {
  if (!previousARR) return 'flat';
  const change = ((currentARR - previousARR) / previousARR) * 100;
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'flat';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function calculateDaysUntil(dateString: string): number {
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// =====================================================
// Main Handler
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const executionId = resolvedParams.id;

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

    // Get workflow execution to find customer
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .select('customer_id')
      .eq('id', executionId)
      .single();

    if (execError || !execution) {
      return NextResponse.json(
        { error: 'Workflow execution not found' },
        { status: 404 }
      );
    }

    // Fetch customer data with contracts and renewals
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        contracts (
          *,
          renewals (*)
        )
      `)
      .eq('id', execution.customer_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get latest contract and renewal
    const latestContract = customer.contracts?.[0];
    const latestRenewal = latestContract?.renewals?.[0];

    // Calculate metrics with business logic
    const metrics: MetricConfig[] = [];

    // 1. ARR (Priority 1 - always first)
    if (latestContract?.arr) {
      const arrTrend = calculateARRTrend(latestContract.arr);
      metrics.push({
        label: 'ARR',
        value: formatCurrency(latestContract.arr),
        sublabel: arrTrend === 'up' ? '+12% YoY' : arrTrend === 'down' ? '-8% YoY' : 'Stable',
        status: arrTrend === 'down' ? 'yellow' : 'green',
        trend: arrTrend,
        priority: 1
      });
    }

    // 2. Health Score (Priority 2)
    if (customer.health_score !== undefined && customer.health_score !== null) {
      const healthStatus = calculateHealthStatus(customer.health_score);
      metrics.push({
        label: 'Health Score',
        value: `${customer.health_score}%`,
        sublabel: healthStatus === 'green' ? 'Healthy' : healthStatus === 'yellow' ? 'At Risk' : 'Critical',
        status: healthStatus,
        priority: 2
      });
    }

    // 3. Renewal Date (Priority 3)
    if (latestContract?.end_date) {
      const daysUntilRenewal = calculateDaysUntil(latestContract.end_date);
      const urgency = calculateRenewalUrgency(daysUntilRenewal);
      metrics.push({
        label: 'Renewal',
        value: `${daysUntilRenewal} days`,
        sublabel: formatDate(latestContract.end_date),
        status: urgency,
        priority: 3
      });
    }

    // 4. Risk Score (Priority 4)
    if (latestRenewal?.ai_risk_score !== undefined && latestRenewal?.ai_risk_score !== null) {
      const riskStatus = calculateRiskStatus(latestRenewal.ai_risk_score);
      metrics.push({
        label: 'Risk Score',
        value: `${latestRenewal.ai_risk_score.toFixed(1)}/10`,
        sublabel: riskStatus === 'green' ? 'Low Risk' : riskStatus === 'yellow' ? 'Medium Risk' : 'High Risk',
        status: riskStatus,
        priority: 4
      });
    }

    // 5. NPS Score (Priority 5)
    if (customer.nps_score !== undefined && customer.nps_score !== null) {
      const npsStatus = customer.nps_score >= 9 ? 'green' : customer.nps_score >= 7 ? 'yellow' : 'red';
      metrics.push({
        label: 'NPS',
        value: customer.nps_score.toString(),
        sublabel: customer.nps_score >= 9 ? 'Promoter' : customer.nps_score >= 7 ? 'Passive' : 'Detractor',
        status: npsStatus,
        priority: 5
      });
    }

    // 6. Contract Seats (Priority 6)
    if (latestContract?.seats) {
      metrics.push({
        label: 'Seats',
        value: latestContract.seats.toString(),
        sublabel: 'Licensed Users',
        status: 'neutral',
        priority: 6
      });
    }

    // 7. Renewal Stage (Priority 7)
    if (latestRenewal?.stage) {
      metrics.push({
        label: 'Stage',
        value: latestRenewal.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        sublabel: `${latestRenewal.probability}% probability`,
        status: latestRenewal.probability >= 70 ? 'green' : latestRenewal.probability >= 40 ? 'yellow' : 'red',
        priority: 7
      });
    }

    // 8. Next Action (Priority 8)
    if (latestRenewal?.next_action) {
      const daysUntilAction = latestRenewal.next_action_date
        ? calculateDaysUntil(latestRenewal.next_action_date)
        : null;

      metrics.push({
        label: 'Next Action',
        value: latestRenewal.next_action,
        sublabel: daysUntilAction ? `In ${daysUntilAction} days` : 'Not scheduled',
        status: daysUntilAction && daysUntilAction < 7 ? 'yellow' : 'neutral',
        priority: 8
      });
    }

    // Sort by priority
    metrics.sort((a, b) => a.priority - b.priority);

    return NextResponse.json({
      metrics,
      customerId: customer.id,
      customerName: customer.name
    });

  } catch (error) {
    console.error('Error fetching customer metrics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
