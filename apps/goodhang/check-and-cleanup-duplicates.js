const { createClient } = require('@supabase/supabase-js');

// Read .env.local file manually
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCleanupDuplicates() {
  try {
    console.log('Fetching all RSVPs...');
    const { data: rsvps, error } = await supabase
      .from('rsvps')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching RSVPs:', error);
      return;
    }

    console.log(`Total RSVPs found: ${rsvps.length}\n`);

    // Find duplicates
    const seen = new Map();
    const duplicates = [];

    for (const rsvp of rsvps) {
      const key = `${rsvp.event_id}_${rsvp.guest_email}`;
      if (seen.has(key)) {
        duplicates.push({
          id: rsvp.id,
          email: rsvp.guest_email,
          event_id: rsvp.event_id,
          created_at: rsvp.created_at,
          kept_id: seen.get(key).id
        });
      } else {
        seen.set(key, rsvp);
      }
    }

    console.log(`Found ${duplicates.length} duplicate RSVPs:\n`);
    duplicates.forEach(dup => {
      console.log(`  Email: ${dup.email}`);
      console.log(`  Duplicate ID: ${dup.id} (created: ${dup.created_at})`);
      console.log(`  Will keep ID: ${dup.kept_id}`);
      console.log('');
    });

    if (duplicates.length === 0) {
      console.log('No duplicates found!');
      return;
    }

    // Delete duplicates
    console.log(`Deleting ${duplicates.length} duplicate RSVPs...`);
    const idsToDelete = duplicates.map(d => d.id);

    const { error: deleteError } = await supabase
      .from('rsvps')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError);
      return;
    }

    console.log(`\nSuccessfully deleted ${duplicates.length} duplicate RSVPs!`);

    // Verify count
    const { count, error: countError } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`Remaining RSVPs: ${count}`);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAndCleanupDuplicates();
