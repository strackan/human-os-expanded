/**
 * Seed InHerSight Sample Customers
 * Creates mock customers with InHerSight metrics for testing workflows
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const INHERSIGHT_COMPANY_ID = '5abbc60c-797d-43db-97c6-bb0433740107';

// Sample customers with varying risk levels and renewal dates
const sampleCustomers = [
  {
    name: 'TechCorp Solutions',
    domain: 'techcorp.com',
    industry: 'Technology',
    health_score: 45,
    risk_score: 75, // High risk
    opportunity_score: 30,
    current_arr: 50000,
    renewal_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
    metrics: {
      brand_impressions: 15000,
      profile_views: 850,
      profile_completion_pct: 65,
      job_matches: 45,
      apply_clicks: 12,
      article_inclusions: 2,
      new_ratings: 8,
      new_submissions: 5
    }
  },
  {
    name: 'InnovateCo',
    domain: 'innovateco.com',
    industry: 'Software',
    health_score: 85,
    risk_score: 25, // Low risk
    opportunity_score: 80,
    current_arr: 120000,
    renewal_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 120 days
    metrics: {
      brand_impressions: 45000,
      profile_views: 3200,
      profile_completion_pct: 95,
      job_matches: 180,
      apply_clicks: 75,
      article_inclusions: 8,
      new_ratings: 35,
      new_submissions: 28
    }
  },
  {
    name: 'DataDriven Inc',
    domain: 'datadriven.io',
    industry: 'Analytics',
    health_score: 55,
    risk_score: 65, // At-risk
    opportunity_score: 45,
    current_arr: 75000,
    renewal_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 120 days
    metrics: {
      brand_impressions: 22000,
      profile_views: 1200,
      profile_completion_pct: 70,
      job_matches: 65,
      apply_clicks: 18,
      article_inclusions: 3,
      new_ratings: 12,
      new_submissions: 9
    }
  },
  {
    name: 'GrowthStack',
    domain: 'growthstack.com',
    industry: 'Marketing',
    health_score: 92,
    risk_score: 15, // Very healthy
    opportunity_score: 90,
    current_arr: 180000,
    renewal_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
    metrics: {
      brand_impressions: 60000,
      profile_views: 4500,
      profile_completion_pct: 100,
      job_matches: 250,
      apply_clicks: 120,
      article_inclusions: 12,
      new_ratings: 45,
      new_submissions: 40
    }
  },
  {
    name: 'CloudFirst Systems',
    domain: 'cloudfirst.io',
    industry: 'Cloud Services',
    health_score: 40,
    risk_score: 80, // Critical risk
    opportunity_score: 25,
    current_arr: 95000,
    renewal_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days
    metrics: {
      brand_impressions: 8000,
      profile_views: 450,
      profile_completion_pct: 45,
      job_matches: 20,
      apply_clicks: 5,
      article_inclusions: 1,
      new_ratings: 3,
      new_submissions: 2
    }
  }
];

async function seedCustomers() {
  console.log('🌱 Seeding InHerSight sample customers...\n');

  for (const customerData of sampleCustomers) {
    const { metrics, ...customerFields } = customerData;

    // Create customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        ...customerFields,
        company_id: INHERSIGHT_COMPANY_ID,
        is_demo: true
      })
      .select()
      .single();

    if (customerError) {
      console.error(`❌ Failed to create ${customerData.name}:`, customerError.message);
      continue;
    }

    console.log(`✅ Created customer: ${customer.name}`);
    console.log(`   Risk Score: ${customer.risk_score} | ARR: $${customer.current_arr.toLocaleString()}`);

    // Create metrics for last 3 months
    const metricsRecords = [];
    for (let i = 0; i < 3; i++) {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() - i);
      const periodStart = new Date(periodEnd);
      periodStart.setMonth(periodStart.getMonth() - 1);

      // Vary metrics slightly for each month (simulate trends)
      const variance = 1 - (i * 0.1); // Slight decline over time
      metricsRecords.push({
        customer_id: customer.id,
        company_id: INHERSIGHT_COMPANY_ID,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        brand_impressions: Math.floor(metrics.brand_impressions * variance),
        profile_views: Math.floor(metrics.profile_views * variance),
        profile_completion_pct: metrics.profile_completion_pct,
        job_matches: Math.floor(metrics.job_matches * variance),
        apply_clicks: Math.floor(metrics.apply_clicks * variance),
        article_inclusions: Math.floor(metrics.article_inclusions * variance),
        new_ratings: Math.floor(metrics.new_ratings * variance),
        new_submissions: Math.floor(metrics.new_submissions * variance),
        is_demo: true,
        data_source: 'csv_import'
      });
    }

    const { error: metricsError } = await supabase
      .from('customer_engagement_metrics')
      .insert(metricsRecords);

    if (metricsError) {
      console.error(`   ⚠️  Failed to add metrics:`, metricsError.message);
    } else {
      console.log(`   📊 Added ${metricsRecords.length} months of metrics`);
    }

    // Create a primary contact
    const { error: contactError } = await supabase
      .from('contacts')
      .insert({
        customer_id: customer.id,
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: `sarah.johnson@${customerData.domain}`,
        title: 'VP of People',
        is_primary: true,
        is_demo: true
      });

    if (contactError) {
      console.error(`   ⚠️  Failed to add contact:`, contactError.message);
    } else {
      console.log(`   👤 Added primary contact\n`);
    }
  }

  console.log('✨ Sample customer seeding complete!\n');
  console.log('📋 Summary:');
  console.log(`   Total Customers: ${sampleCustomers.length}`);
  console.log(`   High Risk (>60): ${sampleCustomers.filter(c => c.risk_score > 60).length}`);
  console.log(`   90-day renewals: ${sampleCustomers.filter(c => {
    const days = Math.ceil((new Date(c.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days >= 85 && days <= 95;
  }).length}`);
  console.log(`   120-day renewals: ${sampleCustomers.filter(c => {
    const days = Math.ceil((new Date(c.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days >= 115 && days <= 125;
  }).length}`);
}

seedCustomers().catch(console.error);
