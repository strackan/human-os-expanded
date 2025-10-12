/**
 * Execute ACO Demo Data Seeding
 * Runs the seed_aco_demo_data.sql script via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uuvdjjclwwulvyeboavk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dmRqamNsd3d1bHZ5ZWJvYXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTc2MjM3NCwiZXhwIjoyMDY1MzM4Mzc0fQ.uaWFNXt8zWh_3qmpBPMNXsExo0d-u_vVmd11A-JRaDs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🌱 Seeding ACO demo data...\n');

// Read SQL file
const sqlPath = join(__dirname, '..', 'supabase', 'scripts', 'seed_aco_demo_data.sql');
const sql = readFileSync(sqlPath, 'utf8');

// Execute SQL
try {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Seeding complete!');
  console.log('\nVerifying data...\n');

  // Verify customer was created
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('id, name, arr, health_score, renewal_date, is_demo')
    .eq('name', 'Apex Consolidated Operations')
    .single();

  if (custError) {
    console.log('⚠️  Could not verify customer:', custError.message);
  } else {
    console.log('✅ ACO Customer found:');
    console.log(`   ID: ${customer.id}`);
    console.log(`   ARR: $${customer.arr.toLocaleString()}`);
    console.log(`   Health Score: ${customer.health_score / 10}/10`);
    console.log(`   Renewal Date: ${customer.renewal_date}`);
  }

  // Verify contacts
  const { data: contacts, error: contactError } = await supabase
    .from('contacts')
    .select('first_name, last_name, title, email')
    .eq('customer_id', customer?.id || '550e8400-e29b-41d4-a716-446655440001');

  if (!contactError && contacts) {
    console.log(`\n✅ Contacts found: ${contacts.length}`);
    contacts.forEach(c => {
      console.log(`   ${c.first_name} ${c.last_name} - ${c.title}`);
    });
  }

  // Verify operations
  const { data: operations, error: opsError } = await supabase
    .from('demo_operations')
    .select('name, status, cost_impact')
    .eq('customer_id', customer?.id || '550e8400-e29b-41d4-a716-446655440001');

  if (!opsError && operations) {
    console.log(`\n✅ Operations found: ${operations.length}`);
    operations.forEach(op => {
      const cost = op.cost_impact ? `cost $${op.cost_impact.toLocaleString()}` : '';
      console.log(`   ${op.name} - ${op.status} ${cost}`);
    });
  }

  // Verify tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('demo_support_tickets')
    .select('ticket_number, subject, sentiment')
    .eq('customer_id', customer?.id || '550e8400-e29b-41d4-a716-446655440001');

  if (!ticketsError && tickets) {
    console.log(`\n✅ Support Tickets found: ${tickets.length}`);
    const frustrated = tickets.filter(t => t.sentiment === 'frustrated').length;
    console.log(`   ${frustrated} frustrated, ${tickets.length - frustrated} neutral/satisfied`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ ACO Demo Data Seeding Complete!');
  console.log('='.repeat(60) + '\n');

} catch (err) {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
}
