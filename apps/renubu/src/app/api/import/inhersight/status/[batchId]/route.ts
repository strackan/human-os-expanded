/**
 * InHerSight CSV Import - Status Endpoint
 * Get status of an import batch
 *
 * GET /api/import/inhersight/status/[batchId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface StatusResult {
  success: boolean;
  batch?: any;
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
): Promise<NextResponse<StatusResult>> {
  try {
    const supabase = await createClient();
    const { batchId } = await params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get batch with company check
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .select(`
        *,
        companies:company_id (
          id,
          name
        )
      `)
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Get staging row counts
    const { data: stagingCounts } = await supabase
      .from('inhersight_import_staging')
      .select('status')
      .eq('import_batch_id', batchId);

    const statusBreakdown = {
      pending: 0,
      processing: 0,
      imported: 0,
      failed: 0,
      skipped: 0
    };

    stagingCounts?.forEach((row: { status: string }) => {
      const status = row.status as keyof typeof statusBreakdown;
      if (status in statusBreakdown) {
        statusBreakdown[status]++;
      }
    });

    return NextResponse.json({
      success: true,
      batch: {
        ...batch,
        statusBreakdown
      }
    });

  } catch (error) {
    console.error('Import status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get import status'
      },
      { status: 500 }
    );
  }
}
