/**
 * Seed InHerSight Demo Data
 * Creates 5 demo customers for testing workflows
 *
 * Usage: npx tsx scripts/seed-inhersight-demo-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Demo customers with different renewal scenarios
const demoCustomers = [
  {
    name: 'TechVista Solutions',
    domain: 'techvista.com',
    industry: 'Technology',
    health_score: 85,
    current_arr: 75000,
    renewal_date_offset: 30, // 30 days out
    scenario: 'healthy_renewal',
    contacts: [
      { firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah.mitchell@techvista.com', title: 'VP of HR', isPrimary: true },
      { firstName: 'James', lastName: 'Chen', email: 'james.chen@techvista.com', title: 'Director of Talent', isPrimary: false }
    ],
    metrics: {
      brand_impressions: 15000,
      profile_views: 850,
      job_matches: 420,
      apply_clicks: 95,
      article_inclusions: 3,
      profile_completion_pct: 95
    }
  },
  {
    name: 'BuildRight Construction',
    domain: 'buildright.com',
    industry: 'Construction',
    health_score: 45,
    current_arr: 120000,
    renewal_date_offset: 90, // 90 days out
    scenario: 'at_risk_renewal',
    contacts: [
      { firstName: 'Marcus', lastName: 'Turner', email: 'marcus.turner@buildright.com', title: 'CHRO', isPrimary: true }
    ],
    metrics: {
      brand_impressions: 5000,
      profile_views: 210,
      job_matches: 85,
      apply_clicks: 12,
      article_inclusions: 0,
      profile_completion_pct: 45
    }
  },
  {
    name: 'HealthFirst Medical Group',
    domain: 'healthfirst.com',
    industry: 'Healthcare',
    health_score: 92,
    current_arr: 95000,
    renewal_date_offset: 60, // 60 days out
    scenario: 'expansion_opportunity',
    contacts: [
      { firstName: 'Dr. Emily', lastName: 'Rodriguez', email: 'emily.rodriguez@healthfirst.com', title: 'Chief People Officer', isPrimary: true },
      { firstName: 'Amanda', lastName: 'Foster', email: 'amanda.foster@healthfirst.com', title: 'Talent Acquisition Lead', isPrimary: false }
    ],
    metrics: {
      brand_impressions: 22000,
      profile_views: 1250,
      job_matches: 680,
      apply_clicks: 145,
      article_inclusions: 5,
      profile_completion_pct: 100
    }
  },
  {
    name: 'GreenLeaf Sustainability',
    domain: 'greenleaf-sustain.com',
    industry: 'Environmental Services',
    health_score: 72,
    current_arr: 45000,
    renewal_date_offset: 45, // 45 days out
    scenario: 'steady_renewal',
    contacts: [
      { firstName: 'Maya', lastName: 'Patel', email: 'maya.patel@greenleaf-sustain.com', title: 'Head of People & Culture', isPrimary: true }
    ],
    metrics: {
      brand_impressions: 8500,
      profile_views: 420,
      job_matches: 185,
      apply_clicks: 38,
      article_inclusions: 2,
      profile_completion_pct: 78
    }
  },
  {
    name: 'DataFlow Analytics',
    domain: 'dataflow.ai',
    industry: 'Data Analytics',
    health_score: 55,
    current_arr: 85000,
    renewal_date_offset: 120, // 120 days out
    scenario: 'lost_contact',
    contacts: [
      { firstName: 'Rachel', lastName: 'Kim', email: 'rachel.kim@dataflow.ai', title: 'Former VP of HR (Left Company)', isPrimary: false },
      { firstName: 'New Contact', lastName: 'Unknown', email: 'hr@dataflow.ai', title: 'Unknown', isPrimary: true }
    ],
    metrics: {
      brand_impressions: 12000,
      profile_views: 380,
      job_matches: 195,
      apply_clicks: 28,
      article_inclusions: 1,
      profile_completion_pct: 62
    }
  }
];

async function seedDemoData() {
  try {
    console.log('🌱 Starting InHerSight demo data seed...\n');

    // Get InHerSight company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('domain', 'inhersight.com')
      .single();

    if (companyError || !company) {
      throw new Error('InHerSight company not found. Run setup-inhersight-user.ts first.');
    }

    console.log(`✅ Found InHerSight company: ${company.id}\n`);

    let totalCustomers = 0;
    let totalContacts = 0;
    let totalContracts = 0;
    let totalMetrics = 0;

    // Seed each demo customer
    for (const demo of demoCustomers) {
      console.log(`📊 Creating ${demo.name}...`);

      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + demo.renewal_date_offset);

      // Create customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          company_id: company.id,
          name: demo.name,
          domain: demo.domain,
          industry: demo.industry,
          health_score: demo.health_score,
          current_arr: demo.current_arr,
          renewal_date: renewalDate.toISOString().split('T')[0],
          is_demo: true
        })
        .select()
        .single();

      if (customerError) {
        console.error(`❌ Failed to create ${demo.name}:`, customerError.message);
        continue;
      }

      totalCustomers++;

      // Create customer properties
      await supabase.from('customer_properties').insert({
        customer_id: customer.id,
        health_score: demo.health_score,
        current_arr: demo.current_arr,
        revenue_impact_tier: demo.current_arr > 100000 ? 4 : demo.current_arr > 75000 ? 3 : 2,
        churn_risk_score: demo.health_score < 50 ? 4 : demo.health_score < 70 ? 3 : demo.health_score < 85 ? 2 : 1,
        usage_score: demo.health_score
      });

      // Create contacts
      const contacts = demo.contacts.map(c => ({
        customer_id: customer.id,
        first_name: c.firstName,
        last_name: c.lastName,
        email: c.email,
        title: c.title,
        is_primary: c.isPrimary,
        is_demo: true
      }));

      const { data: createdContacts } = await supabase
        .from('contacts')
        .insert(contacts)
        .select();

      totalContacts += createdContacts?.length || 0;

      // Create contract
      const contractStart = new Date(renewalDate);
      contractStart.setFullYear(contractStart.getFullYear() - 1);

      const { data: contract } = await supabase
        .from('contracts')
        .insert({
          customer_id: customer.id,
          contract_number: `IHS-${demo.name.split(' ')[0].toUpperCase()}-2024`,
          start_date: contractStart.toISOString().split('T')[0],
          end_date: renewalDate.toISOString().split('T')[0],
          arr: demo.current_arr,
          seats: Math.floor(demo.current_arr / 250), // Rough estimate
          contract_type: 'subscription',
          status: 'active',
          auto_renewal: false,
          product_mix: [
            { name: 'Profile Enhancement', quantity: 1, cost: Math.floor(demo.current_arr * 0.4) },
            { name: 'Job Postings', quantity: 1, cost: Math.floor(demo.current_arr * 0.6) }
          ],
          payment_terms: 'annual',
          is_demo: true
        })
        .select()
        .single();

      if (contract) {
        totalContracts++;

        // Create renewal
        await supabase.from('renewals').insert({
          contract_id: contract.id,
          customer_id: customer.id,
          renewal_date: renewalDate.toISOString().split('T')[0],
          current_arr: demo.current_arr,
          proposed_arr: demo.current_arr * (demo.scenario === 'expansion_opportunity' ? 1.3 : 1.0),
          probability: demo.health_score,
          stage: demo.renewal_date_offset > 90 ? 'planning' : demo.renewal_date_offset > 60 ? 'discovery' : 'negotiation',
          risk_level: demo.health_score < 50 ? 'high' : demo.health_score < 70 ? 'medium' : 'low',
          expansion_opportunity: demo.scenario === 'expansion_opportunity' ? demo.current_arr * 0.3 : 0,
          current_phase: 'planning',
          is_demo: true
        });
      }

      // Create engagement metrics for last 3 months
      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() - monthOffset);
        periodEnd.setDate(1);
        periodEnd.setDate(0); // Last day of previous month

        const periodStart = new Date(periodEnd);
        periodStart.setDate(1);

        await supabase.from('customer_engagement_metrics').insert({
          customer_id: customer.id,
          company_id: company.id,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          brand_impressions: Math.floor(demo.metrics.brand_impressions * (0.8 + Math.random() * 0.4)),
          profile_views: Math.floor(demo.metrics.profile_views * (0.8 + Math.random() * 0.4)),
          profile_completion_pct: demo.metrics.profile_completion_pct,
          job_matches: Math.floor(demo.metrics.job_matches * (0.8 + Math.random() * 0.4)),
          apply_clicks: Math.floor(demo.metrics.apply_clicks * (0.8 + Math.random() * 0.4)),
          article_inclusions: Math.floor(demo.metrics.article_inclusions * (monthOffset === 0 ? 1 : 0.5)),
          new_ratings: Math.floor(Math.random() * 10),
          is_demo: true,
          data_source: 'seed_script'
        });

        totalMetrics++;
      }

      console.log(`   ✅ Created ${demo.name} (${demo.scenario}) - Renewal in ${demo.renewal_date_offset} days`);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✨ InHerSight Demo Data Seed Complete!');
    console.log('='.repeat(70));
    console.log(`
📊 Created:
   - ${totalCustomers} demo customers
   - ${totalContacts} contacts
   - ${totalContracts} contracts & renewals
   - ${totalMetrics} monthly engagement metrics

🎯 Scenarios:
   - Healthy Renewal: TechVista Solutions (30 days out)
   - At-Risk Renewal: BuildRight Construction (90 days out)
   - Expansion Opportunity: HealthFirst Medical (60 days out)
   - Steady Renewal: GreenLeaf Sustainability (45 days out)
   - Lost Contact: DataFlow Analytics (120 days out)

📝 Next Steps:
   - Login as grace@inhersight.com
   - View customers on dashboard
   - Test 90-day renewal workflow with BuildRight Construction
   - Import additional CSV data if needed
    `);
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

// Run seed
seedDemoData();
