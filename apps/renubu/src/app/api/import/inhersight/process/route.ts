/**
 * InHerSight CSV Import - Process Endpoint
 * Processes staged CSV data and imports into main tables
 *
 * POST /api/import/inhersight/process
 * Body: { batchId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

interface ProcessResult {
  success: boolean;
  imported?: number;
  failed?: number;
  skipped?: number;
  error?: string;
}

/**
 * Map InHerSight company data to customers table
 */
function mapCompanyData(raw: any) {
  return {
    name: raw['Name'] || raw['Company Name'],
    domain: raw['Website URL'] || raw['Domain'],
    industry: raw['Primary Industry'] || raw['Industry'],
    health_score: parseFloat(raw['IHS Score']) || null,
    is_demo: true, // Mark imported data as demo for testing
    data_source: 'inhersight'
  };
}

/**
 * Map InHerSight admin data to contacts table
 */
function mapContactData(raw: any, customerId: string) {
  const adminNames = (raw['Admin Names'] || raw['Admins'] || '').split(',');
  const adminEmails = (raw['Admin Emails'] || raw['Admin Email'] || '').split(',');
  const adminTitles = (raw['Admin Titles'] || raw['Admin Title'] || '').split(',');

  const contacts = [];
  for (let i = 0; i < adminNames.length; i++) {
    const fullName = adminNames[i]?.trim();
    if (!fullName) continue;

    const nameParts = fullName.split(' ');
    contacts.push({
      customer_id: customerId,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: adminEmails[i]?.trim() || '',
      title: adminTitles[i]?.trim() || 'Administrator',
      is_primary: i === 0,
      is_demo: true
    });
  }
  return contacts;
}

/**
 * Map InHerSight package data to contracts table
 */

/**
 * Map InHerSight metrics data to customer_engagement_metrics table
 */
function mapMetricsData(raw: any, customerId: string) {
  return {
    customer_id: customerId,
    period_start: raw['Period Start'] || raw['Month Start'],
    period_end: raw['Period End'] || raw['Month End'],
    brand_impressions: parseInt(raw['Brand Impressions']) || 0,
    profile_views: parseInt(raw['Profile Views']) || 0,
    profile_completion_pct: parseFloat(raw['Profile Completion']) || 0,
    job_matches: parseInt(raw['Job Matches']) || 0,
    apply_clicks: parseInt(raw['Apply Clicks']) || 0,
    article_inclusions: parseInt(raw['Articles']) || parseInt(raw['Article Inclusions']) || 0,
    new_ratings: parseInt(raw['New Ratings']) || parseInt(raw['New Submissions']) || 0,
    new_submissions: parseInt(raw['New Submissions']) || 0,
    is_demo: true,
    data_source: 'csv_import'
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<ProcessResult>> {
  try {
    const supabase = createServiceRoleClient();
    const { batchId } = await request.json();

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Batch ID required' },
        { status: 400 }
      );
    }

    // Get batch info
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Update batch status to processing
    await supabase
      .from('import_batches')
      .update({ status: 'processing' })
      .eq('id', batchId);

    // Get all pending staging records for this batch
    const { data: stagingRows, error: stagingError } = await supabase
      .from('inhersight_import_staging')
      .select('*')
      .eq('import_batch_id', batchId)
      .eq('status', 'pending')
      .order('row_number');

    if (stagingError || !stagingRows || stagingRows.length === 0) {
      await supabase
        .from('import_batches')
        .update({
          status: 'failed',
          error_log: { error: 'No pending rows to process' }
        })
        .eq('id', batchId);

      return NextResponse.json(
        { success: false, error: 'No pending rows to process' },
        { status: 400 }
      );
    }

    let imported = 0;
    let failed = 0;
    let skipped = 0;

    // Process each row
    for (const row of stagingRows) {
      try {
        const rawData = row.raw_data as any;

        // Determine data type and process accordingly
        if (rawData['Name'] || rawData['Company Name']) {
          // Company data
          const customerData = {
            ...mapCompanyData(rawData),
            company_id: batch.company_id
          };

          const { data: customer, error: customerError } = await supabase
            .from('customers')
            .insert(customerData)
            .select()
            .single();

          if (customerError) {
            throw customerError;
          }

          // Also create contacts if admin data present
          if (rawData['Admin Names'] || rawData['Admins']) {
            const contacts = mapContactData(rawData, customer.id);
            if (contacts.length > 0) {
              await supabase.from('contacts').insert(contacts);
            }
          }

          // Update staging row
          await supabase
            .from('inhersight_import_staging')
            .update({
              status: 'imported',
              processed_at: new Date().toISOString(),
              mapped_customer_data: customerData
            })
            .eq('id', row.id);

          imported++;

        } else if (rawData['Brand Impressions'] || rawData['Profile Views']) {
          // Metrics data - need to find customer first
          const customerName = rawData['Company'] || rawData['Company Name'];
          const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('name', customerName)
            .eq('company_id', batch.company_id)
            .single();

          if (!customer) {
            throw new Error(`Customer not found: ${customerName}`);
          }

          const metricsData = {
            ...mapMetricsData(rawData, customer.id),
            company_id: batch.company_id
          };

          await supabase
            .from('customer_engagement_metrics')
            .insert(metricsData);

          await supabase
            .from('inhersight_import_staging')
            .update({
              status: 'imported',
              processed_at: new Date().toISOString(),
              mapped_metrics_data: metricsData
            })
            .eq('id', row.id);

          imported++;

        } else {
          // Unknown format, skip
          await supabase
            .from('inhersight_import_staging')
            .update({
              status: 'skipped',
              error_message: 'Unknown data format',
              processed_at: new Date().toISOString()
            })
            .eq('id', row.id);

          skipped++;
        }

      } catch (error) {
        failed++;
        await supabase
          .from('inhersight_import_staging')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            processed_at: new Date().toISOString()
          })
          .eq('id', row.id);
      }
    }

    // Update batch status
    const finalStatus = failed > 0 && imported === 0 ? 'failed'
                      : failed > 0 ? 'partially_completed'
                      : 'completed';

    await supabase
      .from('import_batches')
      .update({
        status: finalStatus,
        rows_imported: imported,
        rows_failed: failed,
        rows_skipped: skipped,
        completed_at: new Date().toISOString(),
        import_summary: {
          imported,
          failed,
          skipped,
          total: stagingRows.length
        }
      })
      .eq('id', batchId);

    return NextResponse.json({
      success: true,
      imported,
      failed,
      skipped
    });

  } catch (error) {
    console.error('Import process error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process import'
      },
      { status: 500 }
    );
  }
}
