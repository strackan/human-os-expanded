const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uuvdjjclwwulvyeboavk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dmRqamNsd3d1bHZ5ZWJvYXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTc2MjM3NCwiZXhwIjoyMDY1MzM4Mzc0fQ.uaWFNXt8zWh_3qmpBPMNXsExo0d-u_vVmd11A-JRaDs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = [
    { name: 'users', schema: 'mvp', description: 'User profiles linked to auth.users' },
    { name: 'customers', schema: 'mvp', description: 'Customer accounts with health scores, ARR, renewal dates' },
    { name: 'renewals', schema: 'mvp', description: 'Renewal tracking with stages, probability, risk levels' },
    { name: 'tasks', schema: 'mvp', description: 'Task management linked to renewals' },
    { name: 'events', schema: 'mvp', description: 'Customer events and interactions' },
    { name: 'notes', schema: 'mvp', description: 'Notes attached to customers/renewals' }
  ];

  console.log('=== RENUBU MVP DATABASE ANALYSIS ===\n');

  for (const table of tables) {
    console.log(`\n${table.schema}.${table.name}`);
    console.log(`Description: ${table.description}`);
    console.log('---');

    try {
      // Get count using RPC or direct query
      const { count, error } = await supabase
        .from(`${table.schema}_${table.name}`)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`Error: ${error.message}`);
        console.log('Trying alternative query method...');

        // Try direct query
        const { data, error: error2 } = await supabase
          .rpc('exec_sql', {
            query: `SELECT COUNT(*) FROM ${table.schema}.${table.name}`
          });

        if (error2) {
          console.log(`Count: Unable to query (${error2.message})`);
        } else {
          console.log(`Count: ${data}`);
        }
      } else {
        console.log(`Count: ${count || 0} records`);
      }
    } catch (err) {
      console.log(`Count: Error - ${err.message}`);
    }
  }
}

checkTables().catch(console.error);
