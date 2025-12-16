/**
 * Import data to Human OS founder_os schema using Supabase REST API
 *
 * Run: npx tsx scripts/run-import.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Use pooler URL for multiple schema support
const HOS_URL = 'https://zulowgscotdrqlccomht.supabase.co';
const HOS_POOLER_URL = 'https://zulowgscotdrqlccomht.pooler.supabase.com';
const HOS_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o';

// Tables in order (respecting foreign keys)
const tables = [
  { source: 'founder_contexts.sql', table: 'contexts', schema: 'founder_os' },
  { source: 'founder_goals.sql', table: 'goals', schema: 'founder_os' },
  { source: 'founder_tasks.sql', table: 'tasks', schema: 'founder_os' },
  { source: 'founder_daily_plans.sql', table: 'daily_plans', schema: 'founder_os' },
  { source: 'founder_relationships.sql', table: 'relationships', schema: 'founder_os' },
  { source: 'founder_check_ins.sql', table: 'check_ins', schema: 'founder_os' }
];

// Parse SQL INSERT statement to extract data
function parseInsertStatement(sql: string): Record<string, any> | null {
  // Pattern: INSERT INTO schema.table (columns) VALUES (values) ON CONFLICT...
  const match = sql.match(/INSERT INTO \S+ \(([^)]+)\) VALUES \((.+)\) ON CONFLICT/);
  if (!match) return null;

  const columns = match[1].split(', ').map(c => c.trim());
  const valuesStr = match[2];

  // Parse values - handle strings, nulls, arrays, etc.
  const values: any[] = [];
  let current = '';
  let inString = false;
  let depth = 0;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];

    if (char === "'" && valuesStr[i - 1] !== "'") {
      if (inString && valuesStr[i + 1] === "'") {
        current += "'";
        i++;
        continue;
      }
      inString = !inString;
      current += char;
    } else if (char === '(' || char === '[') {
      depth++;
      current += char;
    } else if (char === ')' || char === ']') {
      depth--;
      current += char;
    } else if (char === ',' && !inString && depth === 0) {
      values.push(parseValue(current.trim()));
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    values.push(parseValue(current.trim()));
  }

  const result: Record<string, any> = {};
  columns.forEach((col, i) => {
    result[col] = values[i];
  });

  return result;
}

function parseValue(val: string): any {
  if (val === 'NULL') return null;
  if (val === 'TRUE') return true;
  if (val === 'FALSE') return false;
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/''/g, "'");
  }
  if (val.startsWith("ARRAY[")) {
    const arrayContent = val.match(/ARRAY\[(.+)\]::TEXT\[\]/)?.[1] || '';
    return arrayContent.split(',').map(v => v.trim().replace(/^'|'$/g, ''));
  }
  if (val.endsWith("::JSONB")) {
    const jsonStr = val.slice(1, -8).replace(/''/g, "'");
    try {
      return JSON.parse(jsonStr);
    } catch {
      return jsonStr;
    }
  }
  const num = Number(val);
  return isNaN(num) ? val : num;
}

async function insertToSupabase(schema: string, table: string, data: Record<string, any>, debug = false): Promise<{ success: boolean; error?: string }> {
  const url = `${HOS_URL}/rest/v1/${table}`;

  const headers = {
    'apikey': HOS_KEY,
    'Authorization': `Bearer ${HOS_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=ignore-duplicates,return=minimal',
    'Accept-Profile': schema,
    'Content-Profile': schema
  };

  if (debug) {
    console.log('\n--- DEBUG REQUEST ---');
    console.log('URL:', url);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Body:', JSON.stringify(data, null, 2));
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (debug) {
      console.log('Response Status:', response.status);
      console.log('Response:', errorText);
    }
    return { success: false, error: errorText };
  }

  return { success: true };
}

async function main() {
  const dataDir = path.join(__dirname, 'data');

  console.log('='.repeat(60));
  console.log('📥 Importing data to Human OS Supabase (founder_os schema)');
  console.log('='.repeat(60));

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const { source, table, schema } of tables) {
    const filePath = path.join(dataDir, source);

    if (!fs.existsSync(filePath)) {
      console.log(`\n⏭️  ${source} - not found, skipping`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    const statements = sql.split('\n').filter(s => s.trim().length > 0);

    console.log(`\n📄 ${source} → ${schema}.${table} (${statements.length} rows)`);

    let success = 0;
    let failed = 0;
    let errors: string[] = [];

    let isFirst = true;
    for (const statement of statements) {
      const data = parseInsertStatement(statement);
      if (!data) {
        failed++;
        errors.push('Failed to parse statement');
        continue;
      }

      // Debug first request of each table
      const result = await insertToSupabase(schema, table, data, isFirst);
      isFirst = false;
      if (result.success) {
        success++;
      } else {
        failed++;
        if (errors.length < 3) {
          errors.push(result.error || 'Unknown error');
        }
      }
    }

    console.log(`   ✅ ${success} succeeded, ❌ ${failed} failed`);
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.slice(0, 2).join('; ')}`);
    }

    totalSuccess += success;
    totalFailed += failed;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Total: ${totalSuccess} succeeded, ${totalFailed} failed`);
  console.log('='.repeat(60));
}

main().catch(console.error);
