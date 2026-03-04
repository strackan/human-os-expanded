/**
 * GoodHang seeder — public profiles + assessment badges.
 * Seeds 25 public profiles (5 linked to entity spine contacts + 20 filler)
 * and 4 assessment badges.
 *
 * Uses goodhang.public_profiles (no auth.users FK) instead of goodhang.profiles
 * (which has FK to auth.users and would require creating 25 auth users).
 *
 * Schema: goodhang.public_profiles (profile_slug, name, email, career_level,
 *         years_experience, self_description, personality_type, archetype,
 *         badges, best_fit_roles, public_summary, overall_score, category_scores,
 *         published_at, updated_at)
 *         goodhang.assessment_badges (id, name, description, icon, criteria, category, created_at)
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { CONTACTS } from '../constants.js';

interface SeedOptions {
  dryRun: boolean;
}

const BADGE_IDS = {
  connector: 'b0a1b2c3-0001-4f6a-8b9c-0a0000000001',
  mentor: 'b0a1b2c3-0001-4f6a-8b9c-0a0000000002',
  explorer: 'b0a1b2c3-0001-4f6a-8b9c-0a0000000003',
  creator: 'b0a1b2c3-0001-4f6a-8b9c-0a0000000004',
} as const;

const FILLER_NAMES = [
  ['Alex', 'Park'], ['Jordan', 'Rivera'], ['Taylor', 'Patel'], ['Morgan', 'Nguyen'],
  ['Casey', 'Kim'], ['Riley', 'Lopez'], ['Quinn', 'Chen'], ['Avery', 'Yang'],
  ['Sam', 'Okafor'], ['Dakota', 'Singh'], ['Jamie', 'Mueller'], ['Reese', 'Santos'],
  ['Cameron', 'Tanaka'], ['Harper', 'Costa'], ['Emery', 'Ali'], ['Sage', 'Hansen'],
  ['Phoenix', 'Mendez'], ['River', 'Yun'], ['Rowan', 'Fraser'], ['Blair', 'Dubois'],
] as const;

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Media', 'Education',
  'Consulting', 'Design', 'Marketing', 'Engineering', 'Research'];

const CAREER_LEVELS = ['junior', 'mid', 'senior', 'lead'];
const PERSONALITY_TYPES = ['ENTJ', 'INTJ', 'ENFP', 'INFJ'];
const ARCHETYPES = ['The Strategist', 'The Builder', 'The Connector', 'The Visionary'];

export async function seedGoodHang(supabase: SupabaseClient, opts: SeedOptions) {
  const now = new Date().toISOString();

  // 5 linked profiles from entity spine contacts
  const linkedContacts = Object.values(CONTACTS).filter((c) => c.inGoodHang);
  const linkedProfiles = linkedContacts.map((c, i) => ({
    profile_slug: `${c.firstName.toLowerCase()}-${c.lastName.toLowerCase()}`,
    name: `${c.firstName} ${c.lastName}`,
    email: c.email,
    career_level: 'senior',
    years_experience: 10 + i * 3,
    self_description: `${c.title} with expertise in building cross-functional teams.`,
    personality_type: PERSONALITY_TYPES[i % PERSONALITY_TYPES.length],
    archetype: ARCHETYPES[i % ARCHETYPES.length],
    badges: [{ name: 'Connector', icon: 'link' }],
    best_fit_roles: ['Leadership', 'Strategy'],
    public_summary: `Seasoned ${c.title} known for building high-performing teams.`,
    overall_score: 75 + i * 4,
    category_scores: { leadership: 85, collaboration: 80 + i * 2, innovation: 75 + i * 3 },
    published_at: now,
    updated_at: now,
  }));

  // 20 filler profiles
  const fillerProfiles = FILLER_NAMES.map(([first, last], i) => ({
    profile_slug: `${first.toLowerCase()}-${last.toLowerCase()}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@demo.goodhang.com`,
    career_level: CAREER_LEVELS[i % CAREER_LEVELS.length],
    years_experience: 2 + (i * 3) % 16,
    self_description: `Passionate about building meaningful connections in ${INDUSTRIES[i % INDUSTRIES.length].toLowerCase()}.`,
    personality_type: PERSONALITY_TYPES[i % PERSONALITY_TYPES.length],
    archetype: ARCHETYPES[i % ARCHETYPES.length],
    overall_score: 50 + (i * 7) % 40,
    published_at: now,
    updated_at: now,
  }));

  const allProfiles = [...linkedProfiles, ...fillerProfiles];

  // Assessment badges
  const badges = [
    { id: BADGE_IDS.connector, name: 'Connector', description: 'Made 10+ introductions', icon: 'link', category: 'social', created_at: now },
    { id: BADGE_IDS.mentor, name: 'Mentor', description: 'Mentored 5+ community members', icon: 'heart', category: 'leadership', created_at: now },
    { id: BADGE_IDS.explorer, name: 'Explorer', description: 'Attended 10+ events', icon: 'compass', category: 'engagement', created_at: now },
    { id: BADGE_IDS.creator, name: 'Creator', description: 'Published original content', icon: 'pen', category: 'content', created_at: now },
  ];

  if (opts.dryRun) {
    console.log(`  [dry-run] GoodHang: ${allProfiles.length} public profiles, ${badges.length} badges`);
    return { profiles: allProfiles.length, badges: badges.length };
  }

  const ghDb = supabase.schema('goodhang');

  // Assessment badges — upsert by ID
  const { error: badgeErr } = await ghDb.from('assessment_badges').upsert(badges, { onConflict: 'id' });
  if (badgeErr) throw new Error(`GoodHang assessment_badges: ${badgeErr.message}`);

  // Public profiles — delete existing demo profiles, then insert fresh
  // (no PK or unique constraint on public_profiles, so upsert isn't possible)
  await ghDb.from('public_profiles').delete().ilike('email', '%@demo.goodhang.com');
  for (const c of linkedContacts) {
    await ghDb.from('public_profiles').delete().eq('email', c.email);
  }
  const { error: profErr } = await ghDb.from('public_profiles').insert(allProfiles);
  if (profErr) throw new Error(`GoodHang public_profiles: ${profErr.message}`);

  console.log(`  GoodHang: ${allProfiles.length} public profiles, ${badges.length} badges`);
  return { profiles: allProfiles.length, badges: badges.length };
}
