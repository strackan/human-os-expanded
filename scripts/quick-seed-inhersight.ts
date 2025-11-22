#!/usr/bin/env npx tsx
/**
 * Quick seed for InHerSight workflows
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://amugmkrihnjsxlpwdzcy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdWdta3JpaG5qc3hscHdkemN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNjg5MiwiZXhwIjoyMDc3MDgyODkyfQ.gnUWQYmviaKUcm3haH672v-VK-G1p-Bqyq-EfBNXYfo'
);

const template = {
  name: 'inhersight_90day_renewal',
  display_name: 'InHerSight 90-Day Renewal',
  description: 'Standard renewal workflow for InHerSight customers with brand exposure analysis',
  category: 'renewal',
  base_steps: [
    {
      step_id: 'review-performance',
      step_name: 'Review Performance Data',
      step_type: 'analysis',
      description: `Great! Let me pull up {{customer.name}}'s performance data from InHerSight...

Review the brand exposure report to the right. How do the metrics look?`,
      shows_artifacts: ['brand-exposure-report'],
      creates_tasks: [],
      metadata: {
        estimated_minutes: 15,
        requires_ai: false,
        buttons: [
          { label: 'Performance looks good', value: 'continue', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
          { label: 'See concerning trends', value: 'concerns', 'label-background': 'bg-yellow-600', 'label-text': 'text-white' }
        ]
      }
    }
  ],
  base_artifacts: [
    {
      artifact_id: 'brand-exposure-report',
      artifact_name: 'Brand Exposure Report',
      artifact_type: 'brand-exposure-report',
      component_id: 'artifact.brand-exposure',
      config: {
        title: '{{customer.name}} - Brand Performance Report',
        period: 'Last 30 days',
        health_score: '{{customer.health_score}}',
        metrics: {
          brand_impressions: '{{customer.brand_impressions}}',
          impressions_trend: '{{customer.impressions_trend}}'
        }
      }
    }
  ]
};

async function main() {
  console.log('Seeding InHerSight 90-day template...');

  // Delete existing
  await supabase
    .from('workflow_templates')
    .delete()
    .eq('name', 'inhersight_90day_renewal');

  // Insert
  const { data, error } = await supabase
    .from('workflow_templates')
    .insert(template)
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('✅ Seeded!', data.id);
}

main();
