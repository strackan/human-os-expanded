/**
 * Review ALL tables in OLD GFT database
 */

import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://assxvqtqjinoagwcpxpo.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzc3h2cXRxamlub2Fnd2NweHBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcxOTMzNCwiZXhwIjoyMDc0Mjk1MzM0fQ.gNQ-Puth3WfHahtGu8lSoP4jh_3LTBljyEd3Ki_S7Rw';

// Comprehensive list of potential table names
const POTENTIAL_TABLES = [
  // Core CRM
  'contacts', 'companies', 'activities', 'interactions', 'deals', 'opportunities',
  // Tags and labels
  'tags', 'contact_tags', 'labels', 'contact_labels',
  // Locations
  'regions', 'locations', 'metros', 'cities', 'states', 'countries',
  // Personas and tiers
  'personas', 'tiers', 'relationship_types', 'contact_personas', 'contact_tiers',
  // LinkedIn specific
  'linkedin_profiles', 'linkedin_connections', 'linkedin_messages', 'linkedin_posts',
  'li_posts', 'li_post_engagements', 'linkedin_invitations',
  // Enrichment
  'enrichment_jobs', 'enrichment_results', 'enrichment_queue',
  // Import/Export
  'imports', 'import_mappings', 'exports', 'csv_imports',
  // Users and accounts
  'users', 'profiles', 'accounts', 'settings', 'preferences', 'api_keys',
  // Pipeline and stages
  'pipelines', 'stages', 'deal_stages',
  // Tasks and notes
  'tasks', 'notes', 'reminders', 'events', 'calendar_events',
  // Lists and segments
  'lists', 'list_members', 'segments', 'segment_rules', 'saved_searches',
  // Email
  'emails', 'email_templates', 'email_campaigns', 'email_sequences',
  // Integrations
  'integrations', 'webhooks', 'sync_logs', 'connection_logs',
  // Analytics
  'analytics', 'events_log', 'pageviews', 'metrics',
  // Search
  'search_index', 'search_queries', 'recent_searches',
  // Files
  'files', 'attachments', 'documents', 'images',
  // Outreach
  'outreach_campaigns', 'outreach_sequences', 'outreach_templates',
  'connection_requests', 'messages', 'message_templates',
  // Scoring
  'lead_scores', 'scoring_rules', 'contact_scores',
  // Custom fields
  'custom_fields', 'custom_field_values', 'field_definitions',
  // Workflow
  'workflows', 'workflow_steps', 'automations', 'triggers',
  // Misc
  'audit_logs', 'notifications', 'feedback', 'surveys',
];

async function main() {
  console.log('Reviewing ALL tables in OLD GFT database...\n');

  const client = createClient(OLD_URL, OLD_KEY);

  const tablesWithData: Array<{ name: string; count: number; columns: string[]; sample?: unknown }> = [];
  const emptyTables: string[] = [];
  const errorTables: string[] = [];

  for (const table of POTENTIAL_TABLES) {
    try {
      const { data, error, count } = await client
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(3);

      if (error) {
        if (!error.message.includes('does not exist')) {
          errorTables.push(`${table}: ${error.message}`);
        }
        continue;
      }

      const rowCount = count ?? data?.length ?? 0;
      const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

      if (rowCount > 0) {
        tablesWithData.push({
          name: table,
          count: rowCount,
          columns,
          sample: data?.[0]
        });
      } else {
        emptyTables.push(table);
      }
    } catch (e) {
      // Ignore
    }
  }

  // Sort by row count descending
  tablesWithData.sort((a, b) => b.count - a.count);

  console.log('=== TABLES WITH DATA ===\n');
  for (const table of tablesWithData) {
    console.log(`📦 ${table.name} (${table.count} rows)`);
    console.log(`   Columns: ${table.columns.join(', ')}`);
    if (table.sample) {
      const sampleStr = JSON.stringify(table.sample, null, 2)
        .split('\n')
        .slice(0, 6)
        .join('\n');
      console.log(`   Sample:\n${sampleStr.split('\n').map(l => '   ' + l).join('\n')}`);
    }
    console.log('');
  }

  console.log('=== EMPTY TABLES ===\n');
  console.log(emptyTables.join(', ') || 'None');

  console.log('\n=== SUMMARY ===');
  console.log(`Tables with data: ${tablesWithData.length}`);
  console.log(`Empty tables: ${emptyTables.length}`);
  console.log(`Total rows: ${tablesWithData.reduce((sum, t) => sum + t.count, 0)}`);
}

main().catch(console.error);
