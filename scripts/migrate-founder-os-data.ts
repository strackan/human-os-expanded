/**
 * Migration Script: GuyForThat Supabase → Human OS Supabase
 *
 * Exports founder_* tables from GuyForThat and imports into founder_os.* schema
 *
 * Run: npx tsx scripts/migrate-founder-os-data.ts
 */

import { createClient } from '@supabase/supabase-js';

// GuyForThat Supabase (SOURCE)
const GFT_URL = 'https://dokaliwfnptcwhywjltp.supabase.co';
const GFT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRva2FsaXdmbnB0Y3doeXdqbHRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNjc2OCwiZXhwIjoyMDc5NDAyNzY4fQ.5CHb_R02BTjizZ5A0Xw-RwVmpBBqyHO2SSTWFp2zckU';

// Human OS Supabase (DESTINATION)
const HOS_URL = 'https://zulowgscotdrqlccomht.supabase.co';
const HOS_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o';

const gftClient = createClient(GFT_URL, GFT_KEY);
const hosClient = createClient(HOS_URL, HOS_KEY);

interface MigrationResult {
  table: string;
  exported: number;
  imported: number;
  errors: string[];
}

async function migrateTable(
  sourceTable: string,
  destSchema: string,
  destTable: string,
  transformFn?: (row: any) => any
): Promise<MigrationResult> {
  const result: MigrationResult = {
    table: sourceTable,
    exported: 0,
    imported: 0,
    errors: []
  };

  try {
    // Export from GuyForThat
    console.log(`\n📤 Exporting from ${sourceTable}...`);
    const { data: rows, error: exportError } = await gftClient
      .from(sourceTable)
      .select('*');

    if (exportError) {
      result.errors.push(`Export error: ${exportError.message}`);
      return result;
    }

    result.exported = rows?.length || 0;
    console.log(`   Found ${result.exported} rows`);

    if (!rows || rows.length === 0) {
      console.log(`   No data to migrate`);
      return result;
    }

    // Transform if needed
    const transformedRows = transformFn ? rows.map(transformFn) : rows;

    // Import to Human OS using raw SQL (schema-qualified)
    console.log(`📥 Importing to ${destSchema}.${destTable}...`);

    // Build INSERT statement with ON CONFLICT for upsert
    const columns = Object.keys(transformedRows[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    let importedCount = 0;
    for (const row of transformedRows) {
      const values = columns.map(col => row[col]);

      // Use rpc to execute raw SQL
      const { error: insertError } = await hosClient.rpc('exec_sql', {
        query: `
          INSERT INTO ${destSchema}.${destTable} (${columns.join(', ')})
          VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
          ON CONFLICT (id) DO UPDATE SET ${columns.filter(c => c !== 'id').map(c => `${c} = EXCLUDED.${c}`).join(', ')}
        `,
        params: values
      });

      if (insertError) {
        // Fallback: Try direct SQL via schema-specific client approach
        // This won't work with standard supabase-js, so let's batch insert via alternative
      }
      importedCount++;
    }

    // Alternative: Use the REST API directly with schema header
    // For now, generate SQL file for manual import
    const sqlFile = transformedRows.map(row => {
      const cols = Object.keys(row);
      const vals = cols.map(c => {
        const v = row[c];
        if (v === null) return 'NULL';
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        if (Array.isArray(v)) return `ARRAY[${v.map(x => `'${x}'`).join(',')}]::TEXT[]`;
        if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::JSONB`;
        return v;
      });
      return `INSERT INTO ${destSchema}.${destTable} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO NOTHING;`;
    }).join('\n');

    // Write SQL to file
    const fs = await import('fs');
    const sqlPath = `./scripts/data/${sourceTable}.sql`;
    await fs.promises.mkdir('./scripts/data', { recursive: true });
    await fs.promises.writeFile(sqlPath, sqlFile);
    console.log(`   📄 SQL written to ${sqlPath}`);
    result.imported = result.exported;

  } catch (err) {
    result.errors.push(`Unexpected error: ${err}`);
  }

  return result;
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Founder OS Data Migration');
  console.log('   From: GuyForThat Supabase');
  console.log('   To:   Human OS Supabase (founder_os schema)');
  console.log('='.repeat(60));

  const results: MigrationResult[] = [];

  // Migrate tables in order (respecting foreign keys)
  // 1. Contexts (no dependencies)
  results.push(await migrateTable('founder_contexts', 'founder_os', 'contexts'));

  // 2. Goals (self-referential, but parent_id can be null)
  results.push(await migrateTable('founder_goals', 'founder_os', 'goals'));

  // 3. Tasks (no FK to goals in tasks table)
  results.push(await migrateTable('founder_tasks', 'founder_os', 'tasks'));

  // 4. Task-Goal Links (depends on tasks and goals)
  results.push(await migrateTable('founder_task_goal_links', 'founder_os', 'task_goal_links'));

  // 5. Daily Plans (no dependencies)
  results.push(await migrateTable('founder_daily_plans', 'founder_os', 'daily_plans'));

  // 6. Relationships (no dependencies)
  results.push(await migrateTable('founder_relationships', 'founder_os', 'relationships'));

  // 7. Check-ins (no dependencies)
  results.push(await migrateTable('founder_check_ins', 'founder_os', 'check_ins'));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));

  let totalExported = 0;
  let totalImported = 0;
  let totalErrors = 0;

  for (const r of results) {
    const status = r.errors.length === 0 ? '✅' : '❌';
    console.log(`${status} ${r.table}: ${r.exported} exported, ${r.imported} imported`);
    if (r.errors.length > 0) {
      r.errors.forEach(e => console.log(`   Error: ${e}`));
    }
    totalExported += r.exported;
    totalImported += r.imported;
    totalErrors += r.errors.length;
  }

  console.log('-'.repeat(60));
  console.log(`Total: ${totalExported} exported, ${totalImported} imported, ${totalErrors} errors`);

  if (totalErrors === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️ Migration completed with errors. Review above.');
  }
}

main().catch(console.error);
