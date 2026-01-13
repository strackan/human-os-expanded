/**
 * InHerSight CSV Import - Upload Endpoint
 * Handles CSV file uploads and stages data for import
 *
 * POST /api/import/inhersight/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

interface CSVRow {
  [key: string]: string;
}

interface ImportResult {
  success: boolean;
  batchId?: string;
  totalRows?: number;
  message?: string;
  error?: string;
}

/**
 * Parse CSV content into rows
 */
function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}. Skipping.`);
      continue;
    }

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Generate deduplication key from row data
 */
function generateDedupKey(row: CSVRow, rowType: string): string {
  // Different dedup strategies based on data type
  if (rowType === 'company') {
    return `company:${row['Name'] || row['Company Name']}:${row['Domain'] || row['Website URL']}`;
  } else if (rowType === 'customer') {
    return `customer:${row['Admin Email'] || row['Email']}`;
  } else if (rowType === 'package') {
    return `package:${row['Package Name']}:${row['Company Name']}`;
  } else if (rowType === 'metrics') {
    return `metrics:${row['Company']}:${row['Month'] || row['Period']}`;
  }
  return `unknown:${JSON.stringify(row)}`;
}

/**
 * Detect CSV type based on headers
 */
function detectCSVType(headers: string[]): string {
  const headerSet = new Set(headers.map(h => h.toLowerCase()));

  if (headerSet.has('brand impressions') || headerSet.has('profile views') || headerSet.has('job matches')) {
    return 'metrics';
  } else if (headerSet.has('package name') || headerSet.has('products')) {
    return 'package';
  } else if (headerSet.has('admin') || headerSet.has('accepter')) {
    return 'customer';
  } else if (headerSet.has('ihs score') || headerSet.has('number of participants')) {
    return 'company';
  }

  return 'unknown';
}

export async function POST(request: NextRequest): Promise<NextResponse<ImportResult>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user and company
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { success: false, error: 'User company not found' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const batchName = formData.get('batchName') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const content = await file.text();
    const rows = parseCSV(content);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data rows found in CSV' },
        { status: 400 }
      );
    }

    // Detect CSV type
    const csvType = detectCSVType(Object.keys(rows[0]));
    console.log(`Detected CSV type: ${csvType}`);

    // Generate batch ID
    const batchId = crypto.randomUUID();

    // Create import batch record
    const { error: batchError } = await supabase
      .from('import_batches')
      .insert({
        id: batchId,
        company_id: profile.company_id,
        batch_name: batchName || `Import ${new Date().toISOString()}`,
        file_name: file.name,
        total_rows: rows.length,
        status: 'pending',
        imported_by: user.id
      });

    if (batchError) {
      console.error('Failed to create import batch:', batchError);
      return NextResponse.json(
        { success: false, error: 'Failed to create import batch' },
        { status: 500 }
      );
    }

    // Stage rows for import
    const stagingRecords = rows.map((row, index) => ({
      company_id: profile.company_id,
      import_batch_id: batchId,
      imported_by: user.id,
      file_name: file.name,
      row_number: index + 2, // +2 because row 1 is headers, index starts at 0
      status: 'pending',
      raw_data: row,
      dedup_key: generateDedupKey(row, csvType)
    }));

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < stagingRecords.length; i += batchSize) {
      const batch = stagingRecords.slice(i, i + batchSize);
      const { error: stagingError } = await supabase
        .from('inhersight_import_staging')
        .insert(batch);

      if (stagingError) {
        console.error(`Failed to stage rows ${i}-${i + batch.length}:`, stagingError);
        // Update batch status to failed
        await supabase
          .from('import_batches')
          .update({ status: 'failed', error_log: { error: stagingError.message } })
          .eq('id', batchId);

        return NextResponse.json(
          { success: false, error: `Failed to stage rows: ${stagingError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      batchId,
      totalRows: rows.length,
      message: `Successfully staged ${rows.length} rows for import`
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload CSV'
      },
      { status: 500 }
    );
  }
}
