/**
 * Workflow Context API
 *
 * GET /api/workflows/context/[customerId]
 * - Returns complete workflow context for template resolution
 * - Used by frontend to resolve notification templates ({{customer.name}}, etc.)
 * - Matches backend context structure from workflowExecutor.js
 * - Includes INTEL context for LLM personalization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import { getINTELContext, buildINTELSummary, buildGreetingContext } from '@/lib/skills/INTELService';
import { getWorkflowEnrichmentService } from '@/lib/services/WorkflowEnrichmentService';
import type { WorkflowEnrichment } from '@/lib/services/WorkflowEnrichmentService';

// =====================================================
// Types
// =====================================================

interface WorkflowContext {
  customer: {
    id: string;
    name: string;
    slug: string;
    arr: number;
    renewalDate: string;
    contractTerm: number;
    industry: string | null;
    employeeCount: number | null;
    hasAccountPlan: boolean;
    accountPlan: {
      owner: string;
      ownerName: string;
      team: string;
      lastUpdated: string | null;
    } | null;
  };
  csm: {
    id: string;
    email: string;
    name: string;
    title: string | null;
    manager: string | null;
    managerName: string | null;
    managerTitle: string | null;
  };
  workflow: {
    executionId: string | null;
    currentStage: string | null;
    daysUntilRenewal: number;
    hoursUntilRenewal: number;
    renewalARR: number;
    currentDate: string;
    currentTimestamp: string;
    isOverdue: boolean;
    daysOverdue: number;
  };
  company: {
    name: string;
    vpCustomerSuccess: string | null;
    vpCustomerSuccessName: string | null;
    ceo: string | null;
    ceoName: string | null;
    csTeamEmail: string | null;
    execTeamEmail: string | null;
  };
  accountTeam: {
    ae: string | null;
    aeName: string | null;
    sa: string | null;
    saName: string | null;
    executiveSponsor: string | null;
    executiveSponsorName: string | null;
    allEmails: string;
  };
}

// =====================================================
// Helper Functions
// =====================================================

function calculateDaysUntilRenewal(renewalDate: string): number {
  const renewal = new Date(renewalDate);
  const today = new Date();
  const diffTime = renewal.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateHoursUntilRenewal(renewalDate: string): number {
  const renewal = new Date(renewalDate);
  const today = new Date();
  const diffTime = renewal.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60));
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// =====================================================
// Main Handler
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const resolvedParams = await params;
    const customerId = resolvedParams.customerId;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user (skip auth check in demo mode)
    if (!demoMode && !authBypassEnabled) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // =====================================================
    // 1. Fetch Customer Data
    // =====================================================

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        contracts (
          *,
          renewals (*)
        )
      `)
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get latest contract and renewal
    const latestContract = customer.contracts?.[0];
    const renewalDate = latestContract?.end_date || customer.renewal_date;

    // =====================================================
    // 2. Fetch CSM Details
    // =====================================================

    const { data: csm, error: csmError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        title,
        manager:users!users_manager_id_fkey (
          email,
          name,
          title
        )
      `)
      .eq('id', customer.csm_id)
      .single();

    if (csmError) {
      console.error('Error fetching CSM:', csmError);
    }

    // =====================================================
    // 3. Fetch Company Settings
    // =====================================================

    const { data: companySettings, error: companyError } = await supabase
      .from('company_settings')
      .select(`
        company_name,
        customer_success_team_email,
        executive_team_email,
        vp_cs:users!company_settings_vp_customer_success_id_fkey (
          email,
          name
        ),
        ceo_user:users!company_settings_ceo_id_fkey (
          email,
          name
        )
      `)
      .limit(1)
      .single();

    if (companyError) {
      console.error('Error fetching company settings:', companyError);
    }

    // =====================================================
    // 4. Fetch Account Team (if has account plan)
    // =====================================================

    let accountTeamData: any = {
      ae: null,
      aeName: null,
      sa: null,
      saName: null,
      executiveSponsor: null,
      executiveSponsorName: null,
      allEmails: ''
    };

    if (customer.has_account_plan) {
      const { data: accountTeam, error: teamError } = await supabase
        .from('customers')
        .select(`
          account_executive:users!customers_account_executive_id_fkey (
            email,
            name
          ),
          solutions_architect:users!customers_solutions_architect_id_fkey (
            email,
            name
          ),
          executive_sponsor:users!customers_executive_sponsor_id_fkey (
            email,
            name
          )
        `)
        .eq('id', customerId)
        .single();

      if (!teamError && accountTeam) {
        const ae = Array.isArray(accountTeam.account_executive) ? accountTeam.account_executive[0] : accountTeam.account_executive;
        const sa = Array.isArray(accountTeam.solutions_architect) ? accountTeam.solutions_architect[0] : accountTeam.solutions_architect;
        const es = Array.isArray(accountTeam.executive_sponsor) ? accountTeam.executive_sponsor[0] : accountTeam.executive_sponsor;

        const allEmails = [
          ae?.email,
          sa?.email,
          es?.email,
          csm?.email
        ].filter(Boolean).join(',');

        accountTeamData = {
          ae: ae?.email || null,
          aeName: ae?.name || null,
          sa: sa?.email || null,
          saName: sa?.name || null,
          executiveSponsor: es?.email || null,
          executiveSponsorName: es?.name || null,
          allEmails
        };
      }
    }

    // =====================================================
    // 5. Get Latest Workflow Execution (optional)
    // =====================================================

    const { data: latestExecution } = await supabase
      .from('workflow_executions')
      .select('id, workflow_name, stage')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // =====================================================
    // 6. Build Context Object
    // =====================================================

    const daysUntilRenewal = calculateDaysUntilRenewal(renewalDate);
    const hoursUntilRenewal = calculateHoursUntilRenewal(renewalDate);
    const now = new Date();

    // Handle potential arrays from foreign key joins
    const manager = csm?.manager ? (Array.isArray(csm.manager) ? csm.manager[0] : csm.manager) : null;
    const vpCs = companySettings?.vp_cs ? (Array.isArray(companySettings.vp_cs) ? companySettings.vp_cs[0] : companySettings.vp_cs) : null;
    const ceoUser = companySettings?.ceo_user ? (Array.isArray(companySettings.ceo_user) ? companySettings.ceo_user[0] : companySettings.ceo_user) : null;

    const context: WorkflowContext = {
      customer: {
        id: customer.id,
        name: customer.name,
        slug: customer.slug || generateSlug(customer.name),
        arr: latestContract?.arr || customer.arr || 0,
        renewalDate: renewalDate,
        contractTerm: latestContract?.term || customer.contract_term || 12,
        industry: customer.industry || null,
        employeeCount: customer.employee_count || null,
        hasAccountPlan: customer.has_account_plan || false,
        accountPlan: customer.has_account_plan ? {
          owner: customer.account_plan_owner_email || '',
          ownerName: customer.account_plan_owner_name || '',
          team: accountTeamData.allEmails,
          lastUpdated: customer.account_plan_last_updated || null
        } : null
      },

      csm: {
        id: csm?.id || '',
        email: csm?.email || '',
        name: csm?.name || '',
        title: csm?.title || null,
        manager: manager?.email || null,
        managerName: manager?.name || null,
        managerTitle: manager?.title || null
      },

      workflow: {
        executionId: latestExecution?.id || null,
        currentStage: latestExecution?.workflow_name || null,
        daysUntilRenewal,
        hoursUntilRenewal,
        renewalARR: latestContract?.arr || customer.arr || 0,
        currentDate: now.toISOString(),
        currentTimestamp: now.toISOString(),
        isOverdue: daysUntilRenewal < 0,
        daysOverdue: daysUntilRenewal < 0 ? Math.abs(daysUntilRenewal) : 0
      },

      company: {
        name: companySettings?.company_name || 'Company',
        vpCustomerSuccess: vpCs?.email || null,
        vpCustomerSuccessName: vpCs?.name || null,
        ceo: ceoUser?.email || null,
        ceoName: ceoUser?.name || null,
        csTeamEmail: companySettings?.customer_success_team_email || null,
        execTeamEmail: companySettings?.executive_team_email || null
      },

      accountTeam: accountTeamData
    };

    // =====================================================
    // 7. Fetch INTEL Context (Customer Intelligence)
    // =====================================================

    let intel = null;
    let intelSummary = '';
    let greetingContext = null;

    try {
      // Get INTEL for this customer
      const intelContext = await getINTELContext(customer.name, 'grace');

      if (intelContext.customer || intelContext.contacts) {
        intel = intelContext;
        intelSummary = buildINTELSummary(intelContext);
        greetingContext = buildGreetingContext(intelContext);
      }
    } catch (intelError) {
      // INTEL is optional - log but don't fail
      console.warn('Could not load INTEL context:', intelError);
    }

    // =====================================================
    // 8. Fetch Human-OS Enrichment (External Intelligence)
    // =====================================================

    let humanOSEnrichment: WorkflowEnrichment | null = null;

    try {
      const enrichmentService = getWorkflowEnrichmentService();

      if (enrichmentService.isAvailable()) {
        // Build contact list from various sources
        const contactsForEnrichment = [];

        // Add primary contact from INTEL if available
        if (intel?.contacts?.length) {
          for (const intelContact of intel.contacts.slice(0, 3)) {
            contactsForEnrichment.push({
              name: intelContact.name,
              company_name: customer.name,
            });
          }
        }

        // Add CSM's primary contact if known
        // (This would come from stakeholders in a full implementation)

        // Get enrichment
        // Build internal context from INTEL (adapted to WorkflowEnrichmentService types)
        const internalContext = intel ? {
          intel: {
            customer: intel.customer ? {
              summary: intel.customer.content, // INTEL stores full content
              key_points: intel.customer.frontmatter?.key_points || [],
            } : undefined,
            contacts: intel.contacts?.map((c: { name: string; content?: string }) => ({
              name: c.name,
              summary: c.content,
            })),
          },
        } : undefined;

        humanOSEnrichment = await enrichmentService.enrichWorkflowContext(
          {
            name: customer.name,
            domain: customer.domain || undefined,
          },
          contactsForEnrichment,
          internalContext
        );

        if (humanOSEnrichment.triangulation.insights.length > 0) {
          console.log(
            `[WorkflowContext] Human-OS enrichment complete: ${humanOSEnrichment.triangulation.insights.length} insights`
          );
        }
      }
    } catch (humanOSError) {
      // Human-OS is optional - log but don't fail
      console.warn('Could not load Human-OS enrichment:', humanOSError);
    }

    return NextResponse.json({
      success: true,
      context,
      intel,
      intelSummary,
      greetingContext,
      // Human-OS enrichment (0.2.0)
      humanOS: humanOSEnrichment,
    });

  } catch (error) {
    console.error('Error building workflow context:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build context' },
      { status: 500 }
    );
  }
}
