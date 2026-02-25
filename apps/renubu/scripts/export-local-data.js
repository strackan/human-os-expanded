const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Local Supabase configuration
const localSupabaseUrl = 'http://127.0.0.1:54321';
const localSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(localSupabaseUrl, localSupabaseKey);

async function exportTableData(tableName) {
  try {
    console.log(`Exporting data from ${tableName}...`);
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`Error exporting ${tableName}:`, error);
      return null;
    }
    
    console.log(`✓ Exported ${data.length} records from ${tableName}`);
    return data;
  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error);
    return null;
  }
}

async function exportAllData() {
  const tables = [
    'companies',
    'profiles', 
    'customers',
    'customer_properties',
    'contacts',
    'contracts',
    'renewals',
    'tasks',
    'events',
    'alerts',
    'notes'
  ];
  
  const exportData = {};
  
  for (const table of tables) {
    const data = await exportTableData(table);
    if (data !== null) {
      exportData[table] = data;
    }
  }
  
  // Save to file
  const outputPath = path.join(__dirname, '..', 'local_data_export.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  
  console.log(`\n✓ Data exported to ${outputPath}`);
  console.log('\nSummary:');
  Object.entries(exportData).forEach(([table, data]) => {
    console.log(`  ${table}: ${data.length} records`);
  });
}

exportAllData().catch(console.error);

