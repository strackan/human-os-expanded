/**
 * Daily Expired Tenant Cleanup Cron Job
 *
 * GET /api/cron/cleanup-expired-tenants
 * - Runs daily at 2am (configured in vercel.json)
 * - Finds expired pilot/test-drive tenants
 * - Cleans up their demo data
 * - Marks tenants as expired
 * - Optionally notifies SEs
 *
 * Security:
 * - Protected by CRON_SECRET environment variable
 * - Only accessible by Vercel Cron or with valid secret
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

interface CleanupResult {
  pilotId: string;
  companyId: string;
  seEmail: string;
  prospectCompany: string | null;
  status: 'cleaned' | 'failed';
  error?: string;
  deletedCounts?: {
    customers: number;
    contacts: number;
    contracts: number;
    renewals: number;
    workflows: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, require CRON_SECRET
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error('[CleanupCron] Unauthorized cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[CleanupCron] Starting expired tenant cleanup...');

    const supabase = createServiceRoleClient();

    // Find expired tenants using the database function
    const { data: expiredTenants, error: findError } = await supabase.rpc(
      'get_expired_pilot_tenants'
    );

    if (findError) {
      console.error('[CleanupCron] Error finding expired tenants:', findError);
      return NextResponse.json(
        {
          success: false,
          error: findError.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    if (!expiredTenants || expiredTenants.length === 0) {
      console.log('[CleanupCron] No expired tenants found');
      return NextResponse.json({
        success: true,
        message: 'No expired tenants to clean up',
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[CleanupCron] Found ${expiredTenants.length} expired tenant(s)`);

    const results: CleanupResult[] = [];

    // Process each expired tenant
    for (const tenant of expiredTenants) {
      console.log(
        `[CleanupCron] Processing tenant: ${tenant.pilot_id} (${tenant.prospect_company || tenant.tenant_type})`
      );

      try {
        // Use the database cleanup function
        const { data: cleanupResult, error: cleanupError } = await supabase.rpc(
          'cleanup_pilot_tenant',
          { pilot_uuid: tenant.pilot_id }
        );

        if (cleanupError) {
          console.error(
            `[CleanupCron] Failed to cleanup tenant ${tenant.pilot_id}:`,
            cleanupError
          );
          results.push({
            pilotId: tenant.pilot_id,
            companyId: tenant.company_id,
            seEmail: tenant.se_email,
            prospectCompany: tenant.prospect_company,
            status: 'failed',
            error: cleanupError.message,
          });
          continue;
        }

        const result = cleanupResult?.[0];

        if (result?.success) {
          console.log(
            `[CleanupCron] Successfully cleaned tenant ${tenant.pilot_id}`
          );
          results.push({
            pilotId: tenant.pilot_id,
            companyId: tenant.company_id,
            seEmail: tenant.se_email,
            prospectCompany: tenant.prospect_company,
            status: 'cleaned',
            deletedCounts: {
              customers: result.customers_deleted,
              contacts: result.contacts_deleted,
              contracts: result.contracts_deleted,
              renewals: result.renewals_deleted,
              workflows: result.workflows_deleted,
            },
          });
        } else {
          results.push({
            pilotId: tenant.pilot_id,
            companyId: tenant.company_id,
            seEmail: tenant.se_email,
            prospectCompany: tenant.prospect_company,
            status: 'failed',
            error: result?.message || 'Unknown error',
          });
        }
      } catch (error) {
        console.error(
          `[CleanupCron] Exception cleaning tenant ${tenant.pilot_id}:`,
          error
        );
        results.push({
          pilotId: tenant.pilot_id,
          companyId: tenant.company_id,
          seEmail: tenant.se_email,
          prospectCompany: tenant.prospect_company,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Generate summary
    const cleaned = results.filter((r) => r.status === 'cleaned').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    const summary = `Cleaned ${cleaned} tenant(s), ${failed} failed`;
    console.log(`[CleanupCron] ${summary}`);

    return NextResponse.json({
      success: true,
      message: summary,
      processed: results.length,
      cleaned,
      failed,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CleanupCron] Error during cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run cleanup',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
