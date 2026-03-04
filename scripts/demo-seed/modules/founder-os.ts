/**
 * FounderOS seeder — daily plans, some referencing renubu customer names.
 * 10 daily plan entries, 3 with cross-product customer references.
 *
 * Schema: founder_os.daily_plans (id, user_id, plan_date, morning_intention,
 *         time_blocks, evening_reflection, energy_level, stress_level,
 *         created_at, updated_at)
 *         UNIQUE(user_id, plan_date)
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { DEMO_USER_ID, JOURNAL_IDS, COMPANIES } from '../constants.js';

interface SeedOptions {
  dryRun: boolean;
}

function dateStringDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function timestampDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function seedFounderOs(supabase: SupabaseClient, opts: SeedOptions) {
  const plans = [
    // 3 entries that reference renubu customers
    {
      id: JOURNAL_IDS[0],
      user_id: DEMO_USER_ID,
      plan_date: dateStringDaysAgo(2),
      morning_intention: `Great QBR call with ${COMPANIES.acmeCorp.name} today. They're expanding into new markets and want to increase their contract. John Smith mentioned they're evaluating competitors but our ARI scores give us a strong position.`,
      evening_reflection: 'Need to prepare the expansion proposal by Friday. Key talking points: ARI score advantage, cross-product integration story.',
      energy_level: 9,
      stress_level: 3,
      created_at: timestampDaysAgo(2),
      updated_at: timestampDaysAgo(2),
    },
    {
      id: JOURNAL_IDS[1],
      user_id: DEMO_USER_ID,
      plan_date: dateStringDaysAgo(5),
      morning_intention: `Concerned about ${COMPANIES.riskyCorp.name}. Their ARI score dropped from 45 to 28 over the past quarter. Sarah Johnson hasn't responded to the last two emails. Need to escalate — this is a $380K renewal at risk.`,
      evening_reflection: 'Setting up an exec-to-exec call. Need to prepare data showing their visibility decline and our plan to address it.',
      energy_level: 5,
      stress_level: 8,
      created_at: timestampDaysAgo(5),
      updated_at: timestampDaysAgo(5),
    },
    {
      id: JOURNAL_IDS[2],
      user_id: DEMO_USER_ID,
      plan_date: dateStringDaysAgo(1),
      morning_intention: `${COMPANIES.horizonSystems.name} renewal deadline is in 12 days. Jennifer Brown's team is still evaluating. The drop in their ARI visibility score isn't helping our pitch — need to address that head-on in the next meeting.`,
      evening_reflection: 'Called Jennifer directly. She appreciated the transparency about the ARI score. Meeting scheduled for Thursday.',
      energy_level: 7,
      stress_level: 6,
      created_at: timestampDaysAgo(1),
      updated_at: timestampDaysAgo(1),
    },
    // 7 general founder daily plans
    {
      id: JOURNAL_IDS[3],
      user_id: DEMO_USER_ID,
      plan_date: dateStringDaysAgo(7),
      morning_intention: 'Reviewing the product roadmap. The intelligence loop between ARI scores and customer health is proving its value — we can now predict churn 45 days earlier than before. This is the killer feature for enterprise.',
      evening_reflection: 'Roadmap session went well. Team aligned on prioritizing the cross-product dashboard for Q2.',
      energy_level: 8,
      stress_level: 3,
      created_at: timestampDaysAgo(7),
      updated_at: timestampDaysAgo(7),
    },
    {
      id: JOURNAL_IDS[4],
      user_id: DEMO_USER_ID,
      plan_date: dateStringDaysAgo(10),
      morning_intention: 'Team standup — need to tighten the feedback loop between CS and product. When a customer raises an issue, it should surface in the workflow system within hours, not days.',
      evening_reflection: 'Proposed a Slack-to-task integration. Engineering says 2 sprints. Worth it.',
      energy_level: 7,
      stress_level: 4,
      created_at: timestampDaysAgo(10),
      updated_at: timestampDaysAgo(10),
    },
    {
      id: JOURNAL_IDS[5],
      user_id: DEMO_USER_ID,
      plan_date: dateStringDaysAgo(14),
      morning_intention: 'Good mentor session with the GoodHang community this afternoon. Three of our network contacts are also customers — the cross-pollination between professional network and business relationships is exactly what the platform vision is about.',
      evening_reflection: 'Grateful for the connections. This platform effect is real.',
      energy_level: 8,
      stress_level: 2,
      created_at: timestampDaysAgo(14),
      updated_at: timestampDaysAgo(14),
    },
    {
      id: JOURNAL_IDS[6],
      user_id: DEMO_USER_ID,
      plan_date: dateStringDaysAgo(3),
      morning_intention: 'Refining the demo script for next week. The 5-step cross-product walkthrough (ARI score → customer health → workflow trigger → journal insight → network connection) tells a compelling story.',
      evening_reflection: 'Need to make sure the data is consistent across all views. Running seed validation tomorrow.',
      energy_level: 8,
      stress_level: 4,
      created_at: timestampDaysAgo(3),
      updated_at: timestampDaysAgo(3),
    },
    {
      id: JOURNAL_IDS[7],
      user_id: DEMO_USER_ID,
      plan_date: dateStringDaysAgo(20),
      morning_intention: 'Board prep: ARR is tracking well, but expansion revenue needs work. The ARI-driven upsell motion is our best bet for Q3. If we can show that companies with high ARI scores expand 2x faster, the narrative writes itself.',
      evening_reflection: 'Deck is 80% done. Need investor-grade metrics on the intelligence loop.',
      energy_level: 7,
      stress_level: 5,
      created_at: timestampDaysAgo(20),
      updated_at: timestampDaysAgo(20),
    },
    {
      id: JOURNAL_IDS[8],
      user_id: DEMO_USER_ID,
      plan_date: dateStringDaysAgo(28),
      morning_intention: 'Shipped the entity resolution engine this sprint. Now contacts, companies, and interactions are properly linked across Renubu, ARI, and GoodHang. The entity spine is the foundation everything else builds on.',
      evening_reflection: 'Big milestone. Team celebration tonight.',
      energy_level: 9,
      stress_level: 2,
      created_at: timestampDaysAgo(28),
      updated_at: timestampDaysAgo(28),
    },
    {
      id: JOURNAL_IDS[9],
      user_id: DEMO_USER_ID,
      plan_date: dateStringDaysAgo(35),
      morning_intention: 'Quiet Sunday reflection. Building a platform is harder than building a product, but the compounding effects are starting to show. Each new data source makes every other view more valuable.',
      evening_reflection: 'Keep going. The long game is the only game.',
      energy_level: 6,
      stress_level: 3,
      created_at: timestampDaysAgo(35),
      updated_at: timestampDaysAgo(35),
    },
  ];

  const customerRefCount = plans.filter(
    (p) => p.morning_intention.includes('Corp') || p.morning_intention.includes('Horizon'),
  ).length;

  if (opts.dryRun) {
    console.log(`  [dry-run] FounderOS: ${plans.length} daily plans (${customerRefCount} with customer refs)`);
    return { plans: plans.length };
  }

  const foDb = supabase.schema('founder_os');

  const { error } = await foDb
    .from('daily_plans')
    .upsert(plans, { onConflict: 'id' });

  if (error) throw new Error(`FounderOS daily_plans: ${error.message}`);

  console.log(`  FounderOS: ${plans.length} daily plans (${customerRefCount} with customer refs)`);
  return { plans: plans.length };
}
