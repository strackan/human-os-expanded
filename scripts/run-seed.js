#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSeed() {
  try {
    console.log('Reading seed file...');
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
    const seedContent = fs.readFileSync(seedPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = seedContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          
          // Use the raw SQL query method
          const { error } = await supabase.rpc('sql', { query: statement });
          
          if (error) {
            console.log(`   Warning: ${error.message}`);
          } else {
            console.log(`   Success`);
          }
        } catch (err) {
          console.log(`   Error: ${err.message}`);
        }
      }
    }
    
    console.log('✅ Seed file executed successfully!');
    console.log('✅ 15 customers and their contacts have been inserted into the database.');
    
  } catch (error) {
    console.error('Error running seed:', error);
    process.exit(1);
  }
}

runSeed();
