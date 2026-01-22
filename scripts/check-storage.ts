/**
 * Check storage bucket and files
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

async function checkStorage() {
  // List buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets?.map(b => b.name));

  if (bucketsError) {
    console.error('Buckets error:', bucketsError);
    return;
  }

  // Check if contexts bucket exists
  const contextsBucket = buckets?.find(b => b.name === 'contexts');
  if (!contextsBucket) {
    console.log('\nContexts bucket does not exist!');
    return;
  }

  console.log('\nContexts bucket:', contextsBucket);

  // List files in contexts bucket
  console.log('\nListing files in contexts bucket:');
  const { data: files, error: filesError } = await supabase.storage
    .from('contexts')
    .list('', { limit: 100 });

  if (filesError) {
    console.error('Files error:', filesError);
    return;
  }

  console.log('Root folders:', files?.map(f => f.name));

  // Check ryan-owens folder
  const { data: ryanFiles } = await supabase.storage
    .from('contexts')
    .list('ryan-owens');
  console.log('\nryan-owens files:', ryanFiles?.map(f => f.name));

  // Try to download CHARACTER.md
  const { data: charFile, error: charError } = await supabase.storage
    .from('contexts')
    .download('ryan-owens/CHARACTER.md');

  if (charError) {
    console.error('\nError downloading CHARACTER.md:', charError);
  } else {
    const text = await charFile.text();
    console.log('\nCHARACTER.md preview (first 500 chars):');
    console.log(text.substring(0, 500));
  }
}

checkStorage().catch(console.error);
