#!/usr/bin/env node

const https = require('https');
const http = require('http');

async function showTablesSimple() {
  console.log('🔍 Fetching tables using API endpoint...\n');

  const url = 'http://localhost:3000/api/supabase-status';
  
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const status = JSON.parse(data);
          
          console.log('📋 Supabase Status:');
          console.log(`   Environment: ${status.environment.supabase_url}`);
          console.log(`   Connection: ${status.connection.status}`);
          console.log(`   Database: ${status.database.status}`);
          console.log(`   Auth: ${status.auth.status}`);
          
          if (status.database.tables && status.database.tables.length > 0) {
            console.log('\n📋 Available Tables:');
            status.database.tables.forEach((table, index) => {
              console.log(`   ${index + 1}. ${table}`);
            });
          } else {
            console.log('\n📋 No tables found or accessible');
          }
          
          if (status.connection.error) {
            console.log(`\n❌ Connection Error: ${status.connection.error}`);
          }
          
          if (status.database.error) {
            console.log(`\n❌ Database Error: ${status.database.error}`);
          }
          
          resolve();
        } catch (error) {
          console.log('❌ Failed to parse response:', error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Failed to connect to API:', error.message);
      console.log('\n💡 Make sure the Next.js dev server is running: npm run dev');
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Request timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Run the script
showTablesSimple().catch(console.error); 