/**
 * Renubu seeder — customers, contacts, renewals, tasks, workflows.
 * Adapted from apps/renubu/supabase/seed.sql but uses Supabase SDK for idempotency.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { COMPANIES, CONTACTS, RENEWAL_IDS, DEMO_USER_ID } from '../constants.js';

interface SeedOptions {
  dryRun: boolean;
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const CUSTOMER_DETAILS: Record<string, { healthScore: number; currentArr: number; renewalDays: number; usageScore: number; npsScore: number }> = {
  acmeCorp:        { healthScore: 85, currentArr: 450000, renewalDays: 75,  usageScore: 92, npsScore: 45 },
  globalSolutions: { healthScore: 92, currentArr: 750000, renewalDays: 125, usageScore: 88, npsScore: 60 },
  stellarNetworks: { healthScore: 88, currentArr: 620000, renewalDays: 135, usageScore: 91, npsScore: 55 },
  quantumSoft:     { healthScore: 82, currentArr: 190000, renewalDays: 85,  usageScore: 85, npsScore: 40 },
  horizonSystems:  { healthScore: 55, currentArr: 305000, renewalDays: 12,  usageScore: 60, npsScore: 5 },
  fusionWare:      { healthScore: 58, currentArr: 97000,  renewalDays: 22,  usageScore: 63, npsScore: 10 },
  riskyCorp:       { healthScore: 45, currentArr: 380000, renewalDays: 25,  usageScore: 65, npsScore: -10 },
  startupXYZ:      { healthScore: 35, currentArr: 85000,  renewalDays: 18,  usageScore: 50, npsScore: -20 },
};

export async function seedRenubu(supabase: SupabaseClient, opts: SeedOptions) {
  const now = new Date().toISOString();

  // ─── Customers ───
  const customers = Object.entries(COMPANIES).map(([key, c]) => {
    const d = CUSTOMER_DETAILS[key];
    return {
      id: c.id,
      name: c.name,
      domain: c.domain,
      industry: c.industry,
      health_score: d.healthScore,
      current_arr: d.currentArr,
      renewal_date: daysFromNow(d.renewalDays),
      created_at: now,
      updated_at: now,
    };
  });

  // ─── Customer Properties ───
  const customerProperties = Object.entries(COMPANIES).map(([key, c]) => {
    const d = CUSTOMER_DETAILS[key];
    return {
      customer_id: c.id,
      usage_score: d.usageScore,
      health_score: d.healthScore,
      nps_score: d.npsScore,
      current_arr: d.currentArr,
      created_at: now,
      last_updated: now,
    };
  });

  // ─── Contacts ───
  const contacts = Object.values(CONTACTS).map((c) => ({
    id: c.id,
    first_name: c.firstName,
    last_name: c.lastName,
    email: c.email,
    title: c.title,
    customer_id: COMPANIES[c.companyKey].id,
    is_primary: true,
    created_at: now,
    updated_at: now,
  }));

  // ─── Renewals ───
  const renewals = [
    {
      id: RENEWAL_IDS.acmeCorp,
      customer_id: COMPANIES.acmeCorp.id,
      renewal_date: daysFromNow(75),
      current_arr: 450000,
      proposed_arr: 495000,
      probability: 90,
      stage: 'negotiation',
      risk_level: 'low',
      notes: 'Champion account. Expansion opportunity for Q2.',
      created_at: now,
      updated_at: now,
    },
    {
      id: RENEWAL_IDS.riskyCorp,
      customer_id: COMPANIES.riskyCorp.id,
      renewal_date: daysFromNow(25),
      current_arr: 380000,
      proposed_arr: 342000,
      probability: 35,
      stage: 'at_risk',
      risk_level: 'high',
      notes: 'ARI score declining sharply. Usage dropped 30% last quarter.',
      created_at: now,
      updated_at: now,
    },
    {
      id: RENEWAL_IDS.horizonSystems,
      customer_id: COMPANIES.horizonSystems.id,
      renewal_date: daysFromNow(12),
      current_arr: 305000,
      proposed_arr: 290000,
      probability: 50,
      stage: 'discovery',
      risk_level: 'high',
      notes: 'Urgent — renewal in 12 days. Needs executive attention.',
      created_at: now,
      updated_at: now,
    },
    {
      id: RENEWAL_IDS.fusionWare,
      customer_id: COMPANIES.fusionWare.id,
      renewal_date: daysFromNow(22),
      current_arr: 97000,
      proposed_arr: 107000,
      probability: 55,
      stage: 'discovery',
      risk_level: 'medium',
      notes: 'Product adoption challenges. Additional training recommended.',
      created_at: now,
      updated_at: now,
    },
    {
      id: RENEWAL_IDS.stellarNetworks,
      customer_id: COMPANIES.stellarNetworks.id,
      renewal_date: daysFromNow(135),
      current_arr: 620000,
      proposed_arr: 682000,
      probability: 85,
      stage: 'negotiation',
      risk_level: 'low',
      notes: 'Healthy account. Discussing multi-year deal.',
      created_at: now,
      updated_at: now,
    },
  ];

  // ─── Tasks ───
  const tasks = [
    {
      id: '550e8400-e29b-41d4-a716-446655440030',
      renewal_id: RENEWAL_IDS.acmeCorp,
      customer_id: COMPANIES.acmeCorp.id,
      title: 'QBR Preparation',
      description: 'Prepare quarterly business review materials for Acme Corp expansion discussion',
      status: 'in_progress',
      priority: 'high',
      due_date: daysFromNow(7),
      created_at: now,
      updated_at: now,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440031',
      renewal_id: RENEWAL_IDS.riskyCorp,
      customer_id: COMPANIES.riskyCorp.id,
      title: 'Churn Risk Mitigation',
      description: 'Review ARI decline data and prepare retention strategy',
      status: 'pending',
      priority: 'high',
      due_date: daysFromNow(3),
      created_at: now,
      updated_at: now,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440032',
      renewal_id: RENEWAL_IDS.horizonSystems,
      customer_id: COMPANIES.horizonSystems.id,
      title: 'Executive Escalation',
      description: 'Urgent: schedule VP call before renewal deadline',
      status: 'pending',
      priority: 'high',
      due_date: daysFromNow(2),
      created_at: now,
      updated_at: now,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440033',
      renewal_id: RENEWAL_IDS.fusionWare,
      customer_id: COMPANIES.fusionWare.id,
      title: 'Training Session Setup',
      description: 'Schedule product training to improve adoption metrics',
      status: 'in_progress',
      priority: 'medium',
      due_date: daysFromNow(10),
      created_at: now,
      updated_at: now,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440034',
      renewal_id: RENEWAL_IDS.stellarNetworks,
      customer_id: COMPANIES.stellarNetworks.id,
      title: 'Multi-Year Proposal',
      description: 'Draft multi-year pricing proposal with 10% expansion',
      status: 'in_progress',
      priority: 'medium',
      due_date: daysFromNow(21),
      created_at: now,
      updated_at: now,
    },
  ];

  if (opts.dryRun) {
    console.log(`  [dry-run] Renubu: ${customers.length} customers, ${contacts.length} contacts, ${renewals.length} renewals, ${tasks.length} tasks`);
    return { customers: customers.length, contacts: contacts.length, renewals: renewals.length, tasks: tasks.length };
  }

  // Use renubu schema
  const renubuDb = supabase.schema('renubu');

  const { error: custErr } = await renubuDb.from('customers').upsert(customers, { onConflict: 'id' });
  if (custErr) throw new Error(`Renubu customers: ${custErr.message}`);

  // customer_properties has no unique constraint on customer_id, so delete+insert
  for (const prop of customerProperties) {
    await renubuDb.from('customer_properties').delete().eq('customer_id', prop.customer_id);
  }
  const { error: propErr } = await renubuDb.from('customer_properties').insert(customerProperties);
  if (propErr) throw new Error(`Renubu customer_properties: ${propErr.message}`);

  const { error: contErr } = await renubuDb.from('contacts').upsert(contacts, { onConflict: 'id' });
  if (contErr) throw new Error(`Renubu contacts: ${contErr.message}`);

  const { error: renErr } = await renubuDb.from('renewals').upsert(renewals, { onConflict: 'id' });
  if (renErr) throw new Error(`Renubu renewals: ${renErr.message}`);

  const { error: taskErr } = await renubuDb.from('tasks').upsert(tasks, { onConflict: 'id' });
  if (taskErr) throw new Error(`Renubu tasks: ${taskErr.message}`);

  console.log(`  Renubu: ${customers.length} customers, ${contacts.length} contacts, ${renewals.length} renewals, ${tasks.length} tasks`);
  return { customers: customers.length, contacts: contacts.length, renewals: renewals.length, tasks: tasks.length };
}
