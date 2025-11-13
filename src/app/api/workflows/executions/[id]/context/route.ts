/**
 * Customer Context API
 *
 * GET /api/workflows/executions/[id]/context
 * - Fetch rich customer context for workflow execution
 * - Used by LLM for personalized responses
 * - Used by artifacts for variable injection ({{customer.name}}, etc.)
 *
 * Phase 3.3: Customer Context Integration (CRITICAL FOR DEMO)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const executionId = resolvedParams.id;

    // Authenticate user
    const supabase = createServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 403 }
      );
    }

    // Get workflow execution with customer relationship
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .select(`
        id,
        workflow_config_id,
        workflow_name,
        workflow_type,
        status,
        current_step_id,
        customer_id,
        customer:customers (
          id,
          name,
          company_id,
          industry,
          size,
          arr,
          contract_start_date,
          contract_end_date,
          health_score,
          risk_score,
          renewal_date,
          days_until_renewal,
          logo_url,
          website,
          primary_contact_name,
          primary_contact_email
        )
      `)
      .eq('id', executionId)
      .single();

    if (executionError || !execution) {
      console.error('[Context API] Execution error:', executionError);
      return NextResponse.json(
        { error: 'Workflow execution not found' },
        { status: 404 }
      );
    }

    const customerId = execution.customer_id;

    // Handle potential array from foreign key join and verify ownership
    const rawCustomer = execution.customer;
    const customerFromDb = rawCustomer ? (Array.isArray(rawCustomer) ? rawCustomer[0] : rawCustomer) : null;

    // Verify customer belongs to user's company
    if (customerFromDb && customerFromDb.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'Workflow execution not found' },
        { status: 404 }
      );
    }

    // For demo: If customer data is missing, use mock data
    const customerData = customerFromDb || {
      id: customerId,
      name: 'Acme Corporation',
      industry: 'Technology',
      size: 'Enterprise',
      arr: 125000,
      health_score: 75,
      risk_score: 45,
      renewal_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      days_until_renewal: 90,
      contract_start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      contract_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      primary_contact_name: 'John Doe',
      primary_contact_email: 'john.doe@acme.com'
    };

    // TODO: Fetch additional intelligence data from customer_intelligence table (post-migration)
    // For now, provide mock intelligence data for demo
    const intelligence = {
      riskScore: customerData.risk_score || 45,
      healthScore: customerData.health_score || 75,
      sentiment: 'positive',
      engagementLevel: 'high',
      lastMeetingDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      lastMeetingNotes: 'Very positive conversation. Customer excited about new features.',
      aiInsights: [
        'Strong product adoption in Q3',
        'Executive sponsor highly engaged',
        'Expansion opportunity identified'
      ]
    };

    // TODO: Fetch financial data from contracts/financials tables (post-migration)
    // For now, provide mock financial data for demo
    const financials = {
      currentARR: customerData.arr || 125000,
      previousARR: 100000,
      growthRate: 25,
      contractValue: customerData.arr || 125000,
      paymentStatus: 'current',
      outstandingBalance: 0,
      expansionOpportunity: 50000,
      projectedARR: 175000
    };

    // TODO: Fetch usage data from usage_metrics table (post-migration)
    // For now, provide mock usage data for demo
    const usage = {
      trend: 'increasing',
      lastActiveDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      activeUsers: 45,
      totalUsers: 50,
      adoptionRate: 90,
      keyFeatureUsage: {
        reporting: 85,
        collaboration: 92,
        automation: 78
      },
      monthlyActiveUsers: [38, 42, 45, 45], // Last 4 months
      averageSessionDuration: 28 // minutes
    };

    // TODO: Fetch support data from support_tickets table (post-migration)
    // For now, provide mock support data for demo
    const support = {
      openTickets: 2,
      recentTickets: [
        {
          id: 'TICK-001',
          title: 'Question about reporting feature',
          status: 'resolved',
          priority: 'low',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'TICK-002',
          title: 'Need help with user permissions',
          status: 'in_progress',
          priority: 'medium',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      averageResponseTime: 4.5, // hours
      satisfactionScore: 4.8 // out of 5
    };

    // TODO: Fetch engagement data from customer_engagement table (post-migration)
    // For now, provide mock engagement data for demo
    const engagement = {
      lastLoginDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      loginFrequency: 'daily',
      emailOpenRate: 78,
      emailClickRate: 45,
      webinarAttendance: 3,
      qbrScheduled: true,
      qbrDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      executiveSponsor: 'John Doe',
      championScore: 85
    };

    // Assemble complete context object
    const context = {
      customer: customerData,
      intelligence,
      financials,
      usage,
      support,
      engagement,
      workflow: {
        executionId: execution.id,
        workflowType: execution.workflow_type,
        workflowName: execution.workflow_name,
        configId: execution.workflow_config_id,
        status: execution.status,
        currentStep: execution.current_step_id,
        daysUntilRenewal: customerData.days_until_renewal || 90
      }
    };

    return NextResponse.json({
      success: true,
      context
    });

  } catch (error) {
    console.error('Error fetching customer context:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch customer context' },
      { status: 500 }
    );
  }
}
