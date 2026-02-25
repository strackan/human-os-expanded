/**
 * Fix Test Customer - Add Company and Contact
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INHERSIGHT_COMPANY_ID = '5abbc60c-797d-43db-97c6-bb0433740107';

async function fixCustomer() {
  // Get Test customer
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('name', 'Test')
    .single();

  if (!customer) {
    console.error('❌ Test customer not found');
    return;
  }

  console.log(`📝 Fixing customer: ${customer.id}`);

  // Update with company_id
  const { error: updateError } = await supabase
    .from('customers')
    .update({ company_id: INHERSIGHT_COMPANY_ID })
    .eq('id', customer.id);

  if (updateError) {
    console.error('❌ Error updating customer:', updateError);
  } else {
    console.log('✅ Updated customer with company_id');
  }

  // Create contact
  const { error: contactError } = await supabase
    .from('contacts')
    .insert({
      customer_id: customer.id,
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@test.com',
      title: 'VP of Engineering',
      is_primary: true
    });

  if (contactError) {
    console.error('❌ Error creating contact:', contactError);
  } else {
    console.log('✅ Created primary contact');
  }

  // Verify
  const { data: updated } = await supabase
    .from('customers')
    .select('id, name, company_id')
    .eq('id', customer.id)
    .single();

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('customer_id', customer.id);

  console.log('\n📊 Verification:');
  console.log('Customer:', updated);
  console.log('Contacts:', contacts?.length);
}

fixCustomer()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Error:', err);
    process.exit(1);
  });
