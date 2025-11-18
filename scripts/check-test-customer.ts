/**
 * Check Test Customer Data
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCustomer() {
  // Get customer
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('*')
    .eq('name', 'Test')
    .single();

  console.log('Customer:', JSON.stringify(customer, null, 2));
  console.log('Error:', custError);

  if (customer?.company_id) {
    const { data: company, error: compError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', customer.company_id)
      .single();
    console.log('\nCompany:', JSON.stringify(company, null, 2));
    console.log('Error:', compError);
  }

  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('*')
    .eq('customer_id', customer.id);

  console.log('\nContacts:', JSON.stringify(contacts, null, 2));
  console.log('Error:', contactsError);
}

checkCustomer()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
