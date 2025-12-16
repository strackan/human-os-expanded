/**
 * Test script for Renubu MCP enrichment tools
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node test/test-enrichment.ts
 */

import {
  enrichContact,
  enrichCompany,
  getFullEnrichment,
} from '../src/tools/enrichment.js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Renubu MCP Enrichment Test');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }

  // Test 1: Contact enrichment by name
  console.log('Test 1: enrich_contact by name');
  console.log('─────────────────────────────────────────');
  const contactResult = await enrichContact(SUPABASE_URL, SUPABASE_KEY, {
    contact_name: 'John',  // Common name - should return multiple matches
  });
  console.log('Result:', JSON.stringify(contactResult, null, 2));
  console.log();

  // Test 2: Company enrichment
  console.log('Test 2: enrich_company by name');
  console.log('─────────────────────────────────────────');
  const companyResult = await enrichCompany(SUPABASE_URL, SUPABASE_KEY, {
    company_name: 'Tech',  // Partial match
  });
  console.log('Result:', JSON.stringify(companyResult, null, 2));
  console.log();

  // Test 3: Full enrichment
  console.log('Test 3: get_full_enrichment');
  console.log('─────────────────────────────────────────');
  const fullResult = await getFullEnrichment(SUPABASE_URL, SUPABASE_KEY, {
    contact_name: 'John',
    company_name: 'Tech',
  });
  console.log('Result:', JSON.stringify(fullResult, null, 2));
  console.log();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Tests Complete');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
