import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOTT_AUTH_ID = '083591d4-7008-4538-a929-c1e7d0c9bfb0';
const SCOTT_HUMAN_OS_ID = '4841b64f-4f76-40af-bb10-5fba5061e5b3';

async function debug() {
  console.log('=== Debug Scott Products ===\n');

  // Check users table (try both public and human_os schema)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, auth_id, slug, display_name')
    .eq('auth_id', SCOTT_AUTH_ID)
    .single();

  console.log('1. users table (by auth_id):', user, 'error:', userError?.message);

  // Try human_os schema
  const { data: userHumanOs, error: userHumanOsError } = await supabase
    .schema('human_os')
    .from('users')
    .select('id, auth_id, slug, display_name')
    .eq('auth_id', SCOTT_AUTH_ID)
    .single();

  console.log('1b. human_os.users (by auth_id):', userHumanOs, 'error:', userHumanOsError?.message);

  // Check user_products in different schemas
  const { data: productsByHumanOs, error: prodError1 } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', SCOTT_HUMAN_OS_ID);

  console.log('\n2. user_products (by human_os user_id):', productsByHumanOs, 'error:', prodError1?.message);

  // Try founder_os schema
  const { data: productsFounderOs, error: prodError2 } = await supabase
    .schema('founder_os')
    .from('user_products')
    .select('*')
    .eq('user_id', SCOTT_HUMAN_OS_ID);

  console.log('\n2b. founder_os.user_products (by human_os user_id):', productsFounderOs, 'error:', prodError2?.message);

  // Try global schema
  const { data: productsGlobal, error: prodError3 } = await supabase
    .schema('global')
    .from('user_products')
    .select('*')
    .eq('user_id', SCOTT_HUMAN_OS_ID);

  console.log('\n2c. global.user_products (by human_os user_id):', productsGlobal, 'error:', prodError3?.message);

  // Try human_os schema for user_products
  const { data: productsHumanOs2, error: prodError4 } = await supabase
    .schema('human_os')
    .from('user_products')
    .select('*')
    .eq('user_id', SCOTT_HUMAN_OS_ID);

  console.log('\n2d. human_os.user_products (by human_os user_id):', productsHumanOs2, 'error:', prodError4?.message);

  // Check if user_products uses auth_id
  const { data: productsByAuth } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', SCOTT_AUTH_ID);

  console.log('\n3. user_products (by auth user_id):', productsByAuth);

  // List all user_products to see structure
  const { data: allProducts, error: allError } = await supabase
    .from('user_products')
    .select('*')
    .limit(5);

  console.log('\n4. Sample user_products:', allProducts, 'error:', allError?.message);
}

debug().catch(console.error);
