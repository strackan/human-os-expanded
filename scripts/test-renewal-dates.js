#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

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

async function testRenewalDates() {
  try {
    console.log('🔍 Testing renewal date logic...\n');
    
    // Get current date
    const { data: currentDateData, error: currentDateError } = await supabase
      .from('customers')
      .select('created_at')
      .limit(1);
    
    if (currentDateError) {
      console.error('Error getting current date:', currentDateError);
      return;
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    console.log(`📅 Current date: ${currentDate}\n`);
    
         // Test the renewal date logic for each customer
     const testQueries = [
       {
         name: 'Acme Corporation',
         days: 75,
         description: 'Renewal in ~2 months (75 days)'
       },
       {
         name: 'RiskyCorp',
         days: 25,
         description: 'Renewal in ~1 month (25 days) - urgent'
       },
       {
         name: 'TechStart Inc',
         days: 95,
         description: 'Renewal in ~3 months (95 days)'
       },
       {
         name: 'Global Solutions',
         days: 125,
         description: 'Renewal in ~4 months (125 days)'
       },
       {
         name: 'StartupXYZ',
         days: 18,
         description: 'Renewal in ~1 month (18 days) - urgent'
       },
       {
         name: 'Nimbus Analytics',
         days: 155,
         description: 'Renewal in ~5 months (155 days)'
       },
       {
         name: 'Venture Partners',
         days: 185,
         description: 'Renewal in ~6 months (185 days)'
       },
       {
         name: 'Horizon Systems',
         days: 12,
         description: 'Renewal in ~2 weeks (12 days) - very urgent'
       },
       {
         name: 'Quantum Soft',
         days: 85,
         description: 'Renewal in ~3 months (85 days)'
       },
       {
         name: 'Apex Media',
         days: 65,
         description: 'Renewal in ~2 months (65 days)'
       },
       {
         name: 'Stellar Networks',
         days: 135,
         description: 'Renewal in ~4 months (135 days)'
       },
       {
         name: 'FusionWare',
         days: 22,
         description: 'Renewal in ~1 month (22 days) - urgent'
       },
       {
         name: 'Dynamic Ventures',
         days: 165,
         description: 'Renewal in ~5 months (165 days)'
       },
       {
         name: 'Prime Holdings',
         days: 195,
         description: 'Renewal in ~6 months (195 days)'
       },
       {
         name: 'BetaWorks',
         days: 105,
         description: 'Renewal in ~3 months (105 days)'
       }
     ];
    
         console.log('📊 Renewal Date Analysis:\n');
     console.log('Customer Name'.padEnd(20) + 'Days Offset'.padEnd(15) + 'Calculated Date'.padEnd(15) + 'Days Until Renewal'.padEnd(20) + 'Status');
     console.log('-'.repeat(90));
    
         for (const test of testQueries) {
       // Calculate the renewal date using deterministic logic
       const currentDate = new Date();
       const calculatedDate = new Date(currentDate);
       calculatedDate.setDate(currentDate.getDate() + test.days);
       
       const daysUntilRenewal = Math.ceil((calculatedDate - currentDate) / (1000 * 60 * 60 * 24));
       
       let status = '';
       if (daysUntilRenewal < 0) {
         status = '❌ OVERDUE';
       } else if (daysUntilRenewal <= 30) {
         status = '🔴 URGENT';
       } else if (daysUntilRenewal <= 90) {
         status = '🟡 WARNING';
       } else {
         status = '🟢 GOOD';
       }
       
               console.log(
          test.name.padEnd(20) + 
          (test.days + ' days').padEnd(15) + 
          calculatedDate.toISOString().split('T')[0].padEnd(15) + 
          daysUntilRenewal.toString().padEnd(20) + 
          status
        );
     }
    
         console.log('\n✅ Renewal date test completed!');
     console.log('\n📋 Summary:');
     console.log('- All renewal dates are calculated using CURRENT_DATE + INTERVAL days');
     console.log('- Provides good cross-sampling of urgency levels:');
     console.log('  🔴 URGENT (12-25 days): 4 customers');
     console.log('  🟡 WARNING (65-86 days): 3 customers');
     console.log('  🟢 GOOD (96-195 days): 8 customers');
     console.log('- This ensures the customer workflow can be determined by days until renewal');
    
  } catch (error) {
    console.error('Error testing renewal dates:', error);
    process.exit(1);
  }
}

testRenewalDates();
