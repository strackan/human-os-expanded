import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function queryData() {
  // Get releases
  const { data: releases, error: relError } = await supabase
    .from('releases')
    .select('*')
    .order('version');

  console.log('=== RELEASES ===');
  console.log(JSON.stringify(releases, null, 2));
  if (relError) console.error('Release error:', relError);

  // Get release statuses
  const { data: statuses } = await supabase
    .from('release_statuses')
    .select('*');

  console.log('\n=== RELEASE STATUSES ===');
  console.log(JSON.stringify(statuses, null, 2));

  // Get feature statuses
  const { data: featureStatuses } = await supabase
    .from('feature_statuses')
    .select('*');

  console.log('\n=== FEATURE STATUSES ===');
  console.log(JSON.stringify(featureStatuses, null, 2));

  // Get feature categories
  const { data: categories } = await supabase
    .from('feature_categories')
    .select('*');

  console.log('\n=== FEATURE CATEGORIES ===');
  console.log(JSON.stringify(categories, null, 2));

  // Get existing features for reference
  const { data: features } = await supabase
    .from('features')
    .select('*')
    .limit(3);

  console.log('\n=== SAMPLE FEATURES ===');
  console.log(JSON.stringify(features, null, 2));
}

queryData().catch(console.error);
