/**
 * Demo Profile Generator
 *
 * Generates 100 synthetic profiles for the Good Hang network demo.
 * Uses deterministic seeding for reproducibility.
 *
 * Usage:
 *   npx tsx scripts/demo/generate-profiles.ts --count 100 --seed 42
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import {
  CharacterRace,
  CharacterClass,
  CharacterAlignment,
  MemberCharacter,
} from '@/lib/types/database';
import {
  ATTRIBUTE_TO_BRANCH,
  BRANCH_ALIGNMENT_TO_CLASS,
  determineRace,
  getPrimaryAttribute,
  RACE_DEFINITIONS,
  ALIGNMENT_DEFINITIONS,
  CLASS_DISPLAY_NAMES,
  AttributeScores,
} from '@/lib/character/types';

// =============================================================================
// CONFIGURATION
// =============================================================================

interface ProfileConfig {
  seed: number;
  count: number;
  clearExisting: boolean;
}

const DEFAULT_CONFIG: ProfileConfig = {
  seed: 42,
  count: 100,
  clearExisting: false,
};

// =============================================================================
// DISTRIBUTION CONFIGS
// =============================================================================

const INDUSTRIES = [
  'SaaS/B2B Tech',
  'Consumer Tech',
  'Finance/Fintech',
  'Healthcare/Biotech',
  'Media/Entertainment',
  'E-commerce/Retail',
  'Climate/Sustainability',
  'AI/ML',
  'Consulting/Strategy',
  'Founders/Operators',
];

const ROLES = [
  { weight: 0.20, role: 'Founder/CEO', titles: ['CEO', 'Co-Founder', 'Founder & CEO', 'Managing Partner'] },
  { weight: 0.25, role: 'VP/Director', titles: ['VP of Engineering', 'VP of Product', 'VP of Sales', 'Director of Engineering', 'Director of Product', 'VP GTM', 'VP Operations'] },
  { weight: 0.30, role: 'Manager/IC', titles: ['Staff Engineer', 'Senior PM', 'Engineering Manager', 'Product Manager', 'Tech Lead', 'Principal Engineer', 'Head of Design'] },
  { weight: 0.15, role: 'Advisor/Investor', titles: ['Angel Investor', 'Venture Partner', 'Board Advisor', 'Operating Partner', 'Strategic Advisor'] },
  { weight: 0.10, role: 'Creator/Influencer', titles: ['Content Creator', 'Founder & Creator', 'Author & Speaker', 'Podcast Host', 'Newsletter Author'] },
];

const LOCATIONS = [
  { weight: 0.30, city: 'San Francisco', region: 'SF Bay Area' },
  { weight: 0.20, city: 'New York', region: 'NYC' },
  { weight: 0.15, city: 'Los Angeles', region: 'LA' },
  { weight: 0.10, city: 'Austin', region: 'Austin/Denver' },
  { weight: 0.05, city: 'Denver', region: 'Austin/Denver' },
  { weight: 0.05, city: 'Seattle', region: 'Pacific Northwest' },
  { weight: 0.05, city: 'Miami', region: 'Miami' },
  { weight: 0.03, city: 'London', region: 'International' },
  { weight: 0.03, city: 'Toronto', region: 'International' },
  { weight: 0.02, city: 'Singapore', region: 'International' },
  { weight: 0.02, city: 'Boston', region: 'Boston' },
];

// Network clusters for connection generation
const CLUSTERS = [
  { name: 'YC Mafia', size: 15, density: 0.6, tag: 'yc' },
  { name: 'Ex-Stripe', size: 12, density: 0.5, tag: 'stripe' },
  { name: 'NYC Tech', size: 18, density: 0.4, tag: 'nyc' },
  { name: 'AI/ML Community', size: 15, density: 0.5, tag: 'ai' },
  { name: 'Good Hang OGs', size: 10, density: 0.8, tag: 'og' },
  { name: 'Climate Tech', size: 10, density: 0.4, tag: 'climate' },
  { name: 'Indie Hackers', size: 12, density: 0.3, tag: 'indie' },
  { name: 'Random', size: 8, density: 0.1, tag: 'random' },
];

// Alignment distribution (40% good, 40% neutral, 20% "evil")
const ALIGNMENT_WEIGHTS: Record<CharacterAlignment, number> = {
  LG: 0.15, NG: 0.15, CG: 0.10,  // 40% good
  LN: 0.12, TN: 0.16, CN: 0.12,  // 40% neutral
  LE: 0.08, NE: 0.07, CE: 0.05,  // 20% "evil"
};

// Enneagram types with wing variants
const ENNEAGRAM_TYPES = [
  '1w9', '1w2',  // Perfectionist
  '2w1', '2w3',  // Helper
  '3w2', '3w4',  // Achiever
  '4w3', '4w5',  // Individualist
  '5w4', '5w6',  // Investigator
  '6w5', '6w7',  // Loyalist
  '7w6', '7w8',  // Enthusiast
  '8w7', '8w9',  // Challenger
  '9w8', '9w1',  // Peacemaker
];

// =============================================================================
// SEEDED RANDOM NUMBER GENERATOR
// =============================================================================

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)]!;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j]!, result[i]!];
    }
    return result;
  }

  weightedPick<T extends { weight: number }>(items: T[]): T {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.next() * total;
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) return item;
    }
    return items[items.length - 1]!;
  }

  pickWeightedAlignment(): CharacterAlignment {
    const alignments = Object.entries(ALIGNMENT_WEIGHTS) as [CharacterAlignment, number][];
    const total = alignments.reduce((sum, [, w]) => sum + w, 0);
    let random = this.next() * total;
    for (const [alignment, weight] of alignments) {
      random -= weight;
      if (random <= 0) return alignment;
    }
    return 'TN';
  }
}

// =============================================================================
// FIRST/LAST NAME POOLS
// =============================================================================

const FIRST_NAMES = [
  // Diverse mix of names
  'Maya', 'James', 'Sarah', 'Michael', 'Priya', 'David', 'Lisa', 'Alex', 'Jennifer', 'Chris',
  'Aisha', 'Jason', 'Maria', 'Kevin', 'Samantha', 'Daniel', 'Rachel', 'Ryan', 'Emily', 'Brian',
  'Fatima', 'Eric', 'Anna', 'Marcus', 'Olivia', 'Tyler', 'Michelle', 'Jordan', 'Lauren', 'Scott',
  'Amara', 'Jonathan', 'Sophia', 'Anthony', 'Natalie', 'Brandon', 'Kayla', 'Andrew', 'Hannah', 'Justin',
  'Wei', 'Nathan', 'Jessica', 'Kyle', 'Rebecca', 'Derek', 'Megan', 'Adam', 'Christina', 'Patrick',
  'Yuki', 'Steven', 'Amanda', 'Gregory', 'Ashley', 'Kenneth', 'Nicole', 'Timothy', 'Elizabeth', 'Jeffrey',
  'Aiden', 'Benjamin', 'Carlos', 'Diego', 'Elena', 'Frank', 'Grace', 'Hassan', 'Ivan', 'Julia',
  'Kira', 'Leo', 'Morgan', 'Nina', 'Oscar', 'Petra', 'Quinn', 'Rosa', 'Sven', 'Tara',
];

const LAST_NAMES = [
  'Chen', 'Smith', 'Park', 'Johnson', 'Patel', 'Williams', 'Kim', 'Brown', 'Davis', 'Miller',
  'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson',
  'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen',
  'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker',
  'Gupta', 'Singh', 'Shah', 'Sharma', 'Nguyen', 'Tran', 'Wang', 'Li', 'Zhang', 'Liu',
  'Yamamoto', 'Tanaka', 'Sato', 'Mueller', 'Schmidt', 'Fischer', 'Santos', 'Oliveira', 'Costa', 'Ferreira',
  'O\'Brien', 'Murphy', 'Kelly', 'Sullivan', 'Johansson', 'Berg', 'Stein', 'Wolf', 'Rosen', 'Cohen',
];

const COMPANY_PREFIXES = [
  'Arc', 'Beam', 'Catalyst', 'Delta', 'Echo', 'Flux', 'Grid', 'Harbor', 'Ion', 'Jet',
  'Kite', 'Leap', 'Mesa', 'Nova', 'Orbit', 'Prism', 'Quant', 'Ridge', 'Sync', 'Triad',
  'Unity', 'Vertex', 'Wave', 'Xeno', 'Yield', 'Zenith', 'Apex', 'Bolt', 'Core', 'Dawn',
];

const COMPANY_SUFFIXES = [
  'Labs', 'AI', 'Tech', 'Systems', 'Solutions', 'Digital', 'Dynamics', 'Analytics', 'Cloud', 'Data',
  'Ventures', 'Co', 'Inc', 'HQ', 'Works', 'Studio', 'Group', 'Platform', 'Stack', 'Base',
];

// =============================================================================
// INTERESTS AND SKILLS POOLS
// =============================================================================

const INTERESTS_BY_CATEGORY = {
  outdoor: ['hiking', 'skiing', 'surfing', 'camping', 'rock climbing', 'cycling', 'trail running', 'golf', 'sailing', 'kayaking'],
  creative: ['photography', 'writing', 'painting', 'music production', 'guitar', 'piano', 'pottery', 'woodworking', 'film', 'design'],
  intellectual: ['philosophy', 'history', 'psychology', 'economics', 'science fiction', 'chess', 'puzzles', 'languages', 'astronomy', 'politics'],
  social: ['wine tasting', 'whiskey', 'craft beer', 'cooking', 'hosting dinners', 'travel', 'concerts', 'theater', 'sports', 'board games'],
  wellness: ['meditation', 'yoga', 'running', 'weightlifting', 'martial arts', 'cold plunges', 'biohacking', 'sleep optimization', 'nutrition', 'breathwork'],
  tech: ['AI/ML', 'crypto', 'open source', 'gaming', 'VR/AR', 'robotics', 'hardware', 'space tech', 'biotech', 'quantum computing'],
};

const SKILLS_BY_DOMAIN = {
  engineering: ['system design', 'distributed systems', 'infrastructure', 'security', 'machine learning', 'data engineering', 'mobile development', 'frontend', 'backend', 'DevOps'],
  product: ['product strategy', 'user research', 'roadmapping', 'analytics', 'growth', 'A/B testing', 'competitive analysis', 'pricing', 'market research', 'feature prioritization'],
  gtm: ['sales strategy', 'account management', 'partnership development', 'channel sales', 'enterprise sales', 'PLG', 'demand generation', 'content marketing', 'brand building', 'community'],
  leadership: ['team building', 'executive coaching', 'fundraising', 'board management', 'M&A', 'culture building', 'strategic planning', 'crisis management', 'change management', 'talent development'],
  finance: ['financial modeling', 'valuation', 'due diligence', 'portfolio management', 'deal structuring', 'investor relations', 'budgeting', 'forecasting', 'treasury', 'risk management'],
};

// =============================================================================
// SYNTHETIC PROFILE TYPES
// =============================================================================

interface SyntheticProfile {
  // Core identity
  id: string;
  seed: number;
  name: string;
  slug: string;
  email: string;
  linkedinUrl: string;

  // Demographics
  location: string;
  region: string;

  // Professional
  title: string;
  company: string;
  industry: string;

  // D&D Character
  alignment: CharacterAlignment;
  attributes: AttributeScores;
  race: CharacterRace;
  characterClass: CharacterClass;
  enneagram: string;

  // Identity Packs
  packs: {
    professional: { headline: string; summary: string; tags: string[]; metadata: Record<string, unknown> };
    interests: { headline: string; summary: string; tags: string[]; metadata: Record<string, unknown> };
    social: { headline: string; summary: string; tags: string[]; metadata: Record<string, unknown> };
    expertise: { headline: string; summary: string; tags: string[]; metadata: Record<string, unknown> };
  };

  // Content
  linkedinPosts: string[];
  frameworks: string[];
  hotTakes: string[];

  // Network
  clusterTags: string[];
  isBridge: boolean;
}

// =============================================================================
// PROFILE GENERATOR
// =============================================================================

class ProfileGenerator {
  private rng: SeededRandom;
  private anthropic: Anthropic;
  private supabase: SupabaseClient;
  private generatedSlugs: Set<string> = new Set();
  private generatedEmails: Set<string> = new Set();

  constructor(seed: number, supabaseUrl: string, supabaseKey: string, anthropicKey: string) {
    this.rng = new SeededRandom(seed);
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.anthropic = new Anthropic({ apiKey: anthropicKey });
  }

  private generateName(): { first: string; last: string; full: string } {
    const first = this.rng.pick(FIRST_NAMES);
    const last = this.rng.pick(LAST_NAMES);
    return { first, last, full: `${first} ${last}` };
  }

  private generateSlug(name: string): string {
    let base = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    let slug = base;
    let counter = 1;
    while (this.generatedSlugs.has(slug)) {
      slug = `${base}-${counter}`;
      counter++;
    }
    this.generatedSlugs.add(slug);
    return slug;
  }

  private generateEmail(name: { first: string; last: string }): string {
    const domains = ['gmail.com', 'outlook.com', 'hey.com', 'proton.me', 'icloud.com'];
    let base = `${name.first.toLowerCase()}.${name.last.toLowerCase()}`;
    let email = `${base}@${this.rng.pick(domains)}`;
    let counter = 1;
    while (this.generatedEmails.has(email)) {
      email = `${base}${counter}@${this.rng.pick(domains)}`;
      counter++;
    }
    this.generatedEmails.add(email);
    return email;
  }

  private generateLinkedInUrl(slug: string): string {
    return `https://linkedin.com/in/${slug}`;
  }

  private generateCompany(): string {
    return `${this.rng.pick(COMPANY_PREFIXES)} ${this.rng.pick(COMPANY_SUFFIXES)}`;
  }

  private generateAttributes(): AttributeScores {
    // Generate with some variation but realistic distribution
    // Stats range from 8-18 with average around 12-13
    const baseStats = () => this.rng.nextInt(8, 18);

    // Create initial scores
    const scores: AttributeScores = {
      strength: baseStats(),
      dexterity: baseStats(),
      constitution: baseStats(),
      intelligence: baseStats(),
      wisdom: baseStats(),
      charisma: baseStats(),
    };

    // Ensure at least one stat is high (14+) for character differentiation
    const attrs = Object.keys(scores) as (keyof AttributeScores)[];
    const highAttr = this.rng.pick(attrs);
    scores[highAttr] = Math.max(scores[highAttr], this.rng.nextInt(14, 18));

    return scores;
  }

  private selectCluster(index: number, totalCount: number): { tags: string[]; isBridge: boolean } {
    // Assign to clusters based on index
    let runningTotal = 0;
    for (const cluster of CLUSTERS) {
      runningTotal += cluster.size;
      if (index < runningTotal * (totalCount / 100)) {
        // 15% chance of being a bridge (in 2+ clusters)
        const isBridge = this.rng.next() < 0.15;
        if (isBridge) {
          const otherCluster = this.rng.pick(CLUSTERS.filter(c => c.tag !== cluster.tag));
          return { tags: [cluster.tag, otherCluster.tag], isBridge: true };
        }
        return { tags: [cluster.tag], isBridge: false };
      }
    }
    return { tags: ['random'], isBridge: false };
  }

  private selectInterests(): string[] {
    const categories = Object.keys(INTERESTS_BY_CATEGORY) as (keyof typeof INTERESTS_BY_CATEGORY)[];
    const selected: string[] = [];

    // Pick 4-7 interests from 2-3 categories
    const numCategories = this.rng.nextInt(2, 3);
    const shuffledCategories = this.rng.shuffle(categories).slice(0, numCategories);

    for (const category of shuffledCategories) {
      const categoryInterests = INTERESTS_BY_CATEGORY[category];
      const numFromCategory = this.rng.nextInt(2, 3);
      const shuffled = this.rng.shuffle(categoryInterests).slice(0, numFromCategory);
      selected.push(...shuffled);
    }

    return selected;
  }

  private selectSkills(industry: string): string[] {
    const domains = Object.keys(SKILLS_BY_DOMAIN) as (keyof typeof SKILLS_BY_DOMAIN)[];
    const selected: string[] = [];

    // Map industry to primary skill domain
    const domainMap: Record<string, keyof typeof SKILLS_BY_DOMAIN> = {
      'SaaS/B2B Tech': 'engineering',
      'Consumer Tech': 'product',
      'Finance/Fintech': 'finance',
      'AI/ML': 'engineering',
      'Consulting/Strategy': 'leadership',
      'Founders/Operators': 'leadership',
    };

    const primaryDomain = domainMap[industry] || this.rng.pick(domains);
    const primarySkills = SKILLS_BY_DOMAIN[primaryDomain];
    selected.push(...this.rng.shuffle(primarySkills).slice(0, 3));

    // Add 2 from another domain
    const otherDomain = this.rng.pick(domains.filter(d => d !== primaryDomain));
    selected.push(...this.rng.shuffle(SKILLS_BY_DOMAIN[otherDomain]).slice(0, 2));

    return selected;
  }

  async generateProfile(index: number, totalCount: number): Promise<SyntheticProfile> {
    const name = this.generateName();
    const slug = this.generateSlug(name.full);
    const email = this.generateEmail(name);
    const location = this.rng.weightedPick(LOCATIONS);
    const roleConfig = this.rng.weightedPick(ROLES);
    const industry = this.rng.pick(INDUSTRIES);
    const title = this.rng.pick(roleConfig.titles);
    const company = this.generateCompany();
    const alignment = this.rng.pickWeightedAlignment();
    const attributes = this.generateAttributes();
    const primaryAttr = getPrimaryAttribute(attributes);
    const branch = ATTRIBUTE_TO_BRANCH[primaryAttr];
    const characterClass = BRANCH_ALIGNMENT_TO_CLASS[branch][alignment];
    const race = determineRace(attributes, primaryAttr);
    const enneagram = this.rng.pick(ENNEAGRAM_TYPES);
    const { tags: clusterTags, isBridge } = this.selectCluster(index, totalCount);
    const interests = this.selectInterests();
    const skills = this.selectSkills(industry);

    // Generate identity packs (basic version - will enhance with Claude)
    const packs = {
      professional: {
        headline: `${title} at ${company}`,
        summary: `Experienced ${roleConfig.role.toLowerCase()} in ${industry.toLowerCase()}.`,
        tags: skills,
        metadata: {
          company,
          title,
          industry,
          yearsExperience: this.rng.nextInt(3, 20),
        },
      },
      interests: {
        headline: interests.slice(0, 3).join(' | '),
        summary: `Passionate about ${interests.join(', ')}.`,
        tags: interests,
        metadata: {
          hobbies: interests.slice(0, 4),
          activities: interests.slice(4),
        },
      },
      social: {
        headline: this.generateSocialHeadline(alignment, enneagram),
        summary: this.generateSocialSummary(alignment, race, enneagram),
        tags: this.generateSocialTags(alignment),
        metadata: {
          vibe: this.getVibeFromAlignment(alignment),
          energyLevel: this.getEnergyFromAttributes(attributes),
          idealHang: this.getIdealHangFromEnneagram(enneagram),
        },
      },
      expertise: {
        headline: `Expert in ${skills[0]}`,
        summary: `Deep expertise in ${skills.slice(0, 3).join(', ')}.`,
        tags: skills,
        metadata: {
          topics: skills,
          credentials: [],
        },
      },
    };

    return {
      id: crypto.randomUUID(),
      seed: this.rng.next() * 1000000,
      name: name.full,
      slug,
      email,
      linkedinUrl: this.generateLinkedInUrl(slug),
      location: location.city,
      region: location.region,
      title,
      company,
      industry,
      alignment,
      attributes,
      race,
      characterClass,
      enneagram,
      packs,
      linkedinPosts: [], // Will be enhanced with Claude
      frameworks: [],
      hotTakes: [],
      clusterTags,
      isBridge,
    };
  }

  private generateSocialHeadline(alignment: CharacterAlignment, enneagram: string): string {
    const alignmentVibes: Record<CharacterAlignment, string[]> = {
      LG: ['Team player', 'Reliable friend', 'Structured connector'],
      NG: ['Everyone\'s favorite', 'Naturally helpful', 'Genuine connector'],
      CG: ['Life of the party', 'Adventure seeker', 'Free spirit'],
      LN: ['Thoughtful conversationalist', 'Principled presence', 'Steady companion'],
      TN: ['Go with the flow', 'Balanced vibe', 'Adaptable friend'],
      CN: ['Wild card', 'Spontaneous energy', 'Never boring'],
      LE: ['Strategic networker', 'Calculated charm', 'Power player'],
      NE: ['Opportunistic connector', 'Pragmatic friend', 'Results-focused'],
      CE: ['Disruptor energy', 'Rule breaker', 'Chaos embracer'],
    };
    return this.rng.pick(alignmentVibes[alignment] || alignmentVibes.TN);
  }

  private generateSocialSummary(alignment: CharacterAlignment, race: CharacterRace, enneagram: string): string {
    const raceTraits = RACE_DEFINITIONS[race].description;
    const alignmentDesc = ALIGNMENT_DEFINITIONS[alignment].description;
    return `${raceTraits} ${alignmentDesc}`;
  }

  private generateSocialTags(alignment: CharacterAlignment): string[] {
    const baseTags = ['connector', 'authentic'];
    const alignmentTags: Record<CharacterAlignment, string[]> = {
      LG: ['dependable', 'loyal', 'principled'],
      NG: ['warm', 'generous', 'supportive'],
      CG: ['adventurous', 'creative', 'free-spirited'],
      LN: ['consistent', 'fair', 'organized'],
      TN: ['balanced', 'adaptable', 'chill'],
      CN: ['spontaneous', 'unpredictable', 'fun'],
      LE: ['ambitious', 'strategic', 'polished'],
      NE: ['pragmatic', 'resourceful', 'direct'],
      CE: ['bold', 'disruptive', 'intense'],
    };
    return [...baseTags, ...this.rng.shuffle(alignmentTags[alignment] || []).slice(0, 2)];
  }

  private getVibeFromAlignment(alignment: CharacterAlignment): string {
    const vibes: Record<CharacterAlignment, string> = {
      LG: 'warm and reliable',
      NG: 'genuine and helpful',
      CG: 'exciting and caring',
      LN: 'calm and principled',
      TN: 'balanced and easy-going',
      CN: 'energetic and unpredictable',
      LE: 'impressive and calculated',
      NE: 'direct and practical',
      CE: 'intense and boundary-pushing',
    };
    return vibes[alignment];
  }

  private getEnergyFromAttributes(attrs: AttributeScores): string {
    const avgEnergy = (attrs.charisma + attrs.constitution) / 2;
    if (avgEnergy >= 15) return 'high';
    if (avgEnergy >= 10) return 'medium';
    return 'low';
  }

  private getIdealHangFromEnneagram(enneagram: string): string {
    const baseType = parseInt(enneagram[0]!);
    const idealHangs: Record<number, string> = {
      1: 'Productive activity followed by good conversation',
      2: 'Hosting dinner at home with close friends',
      3: 'High-energy event with interesting people',
      4: 'Intimate conversation over drinks or art',
      5: 'Deep dive discussion on fascinating topic',
      6: 'Reliable group with planned activity',
      7: 'Spontaneous adventure, the more the merrier',
      8: 'Direct, no-BS hangout with good debate',
      9: 'Low-key gathering, good food, easy company',
    };
    return idealHangs[baseType] || 'Quality time with good people';
  }

  async generateAllProfiles(config: ProfileConfig): Promise<SyntheticProfile[]> {
    console.log(`Generating ${config.count} profiles with seed ${config.seed}...`);

    const profiles: SyntheticProfile[] = [];
    for (let i = 0; i < config.count; i++) {
      const profile = await this.generateProfile(i, config.count);
      profiles.push(profile);
      if ((i + 1) % 10 === 0) {
        console.log(`  Generated ${i + 1}/${config.count} profiles`);
      }
    }

    return profiles;
  }

  async enhanceWithClaude(profiles: SyntheticProfile[]): Promise<SyntheticProfile[]> {
    console.log('Enhancing profiles with Claude-generated content...');

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);

      await Promise.all(batch.map(async (profile) => {
        try {
          const enhanced = await this.enhanceSingleProfile(profile);
          Object.assign(profile, enhanced);
        } catch (err) {
          console.warn(`  Failed to enhance ${profile.name}:`, err);
        }
      }));

      if ((i + batchSize) % 20 === 0 || i + batchSize >= profiles.length) {
        console.log(`  Enhanced ${Math.min(i + batchSize, profiles.length)}/${profiles.length} profiles`);
      }
    }

    return profiles;
  }

  private async enhanceSingleProfile(profile: SyntheticProfile): Promise<Partial<SyntheticProfile>> {
    const prompt = `Generate realistic content for a synthetic professional profile. This is for a demo, not a real person.

Profile:
- Name: ${profile.name}
- Title: ${profile.title} at ${profile.company}
- Industry: ${profile.industry}
- Location: ${profile.location}
- D&D Class: ${CLASS_DISPLAY_NAMES[profile.characterClass]} (${ALIGNMENT_DEFINITIONS[profile.alignment].name})
- Interests: ${profile.packs.interests.tags.join(', ')}
- Skills: ${profile.packs.expertise.tags.join(', ')}

Generate the following in JSON format:
{
  "linkedinPosts": [3 realistic LinkedIn posts (50-150 words each) that this person would write],
  "frameworks": [2-3 mental models or frameworks this person believes in],
  "hotTakes": [2-3 contrarian opinions in their professional domain]
}

Be specific and realistic. Match the personality implied by their D&D alignment.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          linkedinPosts: parsed.linkedinPosts || [],
          frameworks: parsed.frameworks || [],
          hotTakes: parsed.hotTakes || [],
        };
      } catch {
        return {};
      }
    }
    return {};
  }

  async saveToDatabase(profiles: SyntheticProfile[]): Promise<void> {
    console.log('Saving profiles to database...');

    for (const profile of profiles) {
      try {
        // 1. Create global entity
        const { data: entity, error: entityError } = await this.supabase
          .schema('global')
          .from('entities')
          .upsert({
            linkedin_url: profile.linkedinUrl,
            email: profile.email,
            name: profile.name,
            headline: profile.packs.professional.headline,
            current_company: profile.company,
            current_title: profile.title,
            location: profile.location,
          }, { onConflict: 'linkedin_url' })
          .select('id')
          .single();

        if (entityError) throw entityError;
        const entityId = entity.id;

        // 2. Create GoodHang profile (if table exists)
        const { error: profileError } = await this.supabase
          .from('profiles')
          .upsert({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            bio: profile.packs.social.summary,
            role: profile.title,
            company: profile.company,
            linkedin_url: profile.linkedinUrl,
            interests: profile.packs.interests.tags,
            membership_tier: 'free',
            membership_status: 'active',
            user_role: 'member',
          }, { onConflict: 'email' });

        if (profileError && !profileError.message.includes('duplicate')) {
          console.warn(`  Profile insert warning for ${profile.name}:`, profileError.message);
        }

        // 3. Create member character
        const { error: characterError } = await this.supabase
          .from('member_characters')
          .upsert({
            user_id: profile.id,
            race: profile.race,
            class: profile.characterClass,
            alignment: profile.alignment,
            attr_strength: profile.attributes.strength,
            attr_dexterity: profile.attributes.dexterity,
            attr_constitution: profile.attributes.constitution,
            attr_intelligence: profile.attributes.intelligence,
            attr_wisdom: profile.attributes.wisdom,
            attr_charisma: profile.attributes.charisma,
            enneagram_type: profile.enneagram,
            avatar_seed: `${profile.seed}`,
            profile_summary: profile.packs.social.summary,
            key_strengths: profile.packs.expertise.tags.slice(0, 3),
            is_active: true,
            is_public: true,
          }, { onConflict: 'user_id' });

        if (characterError && !characterError.message.includes('duplicate')) {
          console.warn(`  Character insert warning for ${profile.name}:`, characterError.message);
        }

        // 4. Create identity packs
        for (const [packType, pack] of Object.entries(profile.packs)) {
          const { error: packError } = await this.supabase
            .from('identity_packs')
            .upsert({
              entity_id: entityId,
              pack_type: packType,
              visibility: 'public',
              headline: pack.headline,
              summary: pack.summary,
              tags: pack.tags,
              metadata: pack.metadata,
            }, { onConflict: 'entity_id,pack_type' });

          if (packError && !packError.message.includes('duplicate')) {
            console.warn(`  Pack insert warning for ${profile.name}/${packType}:`, packError.message);
          }
        }

        // 5. Create GFT contact (if schema exists)
        try {
          const { error: contactError } = await this.supabase
            .schema('gft')
            .from('contacts')
            .upsert({
              owner_id: profile.id,
              global_entity_id: entityId,
              name: profile.name,
              linkedin_url: profile.linkedinUrl,
              email: profile.email,
              company: profile.company,
              current_job_title: profile.title,
              headline: profile.packs.professional.headline,
              location: profile.location,
              connection_degree: '1st',
              labels: profile.clusterTags,
            }, { onConflict: 'linkedin_url' });

          if (contactError && !contactError.message.includes('duplicate')) {
            console.warn(`  Contact insert warning for ${profile.name}:`, contactError.message);
          }
        } catch {
          // GFT schema might not exist
        }

      } catch (err) {
        console.error(`  Failed to save ${profile.name}:`, err);
      }
    }

    console.log('  Database save complete');
  }
}

// =============================================================================
// CLI RUNNER
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const config: ProfileConfig = { ...DEFAULT_CONFIG };

  // Parse CLI args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      config.count = parseInt(args[i + 1]!, 10);
      i++;
    } else if (args[i] === '--seed' && args[i + 1]) {
      config.seed = parseInt(args[i + 1]!, 10);
      i++;
    } else if (args[i] === '--clear') {
      config.clearExisting = true;
    }
  }

  // Check environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!anthropicKey) {
    console.warn('Missing ANTHROPIC_API_KEY - profiles will not be enhanced with Claude');
  }

  console.log(`\n=== Good Hang Demo Profile Generator ===`);
  console.log(`Config: count=${config.count}, seed=${config.seed}, clear=${config.clearExisting}\n`);

  const generator = new ProfileGenerator(
    config.seed,
    supabaseUrl,
    supabaseKey,
    anthropicKey || ''
  );

  // Generate profiles
  const profiles = await generator.generateAllProfiles(config);

  // Enhance with Claude (if API key available)
  if (anthropicKey) {
    await generator.enhanceWithClaude(profiles);
  }

  // Save to database
  await generator.saveToDatabase(profiles);

  // Generate network connections (Phase 1.3)
  console.log('\n=== Profile Generation Complete ===');
  console.log(`Generated ${profiles.length} profiles`);
  console.log(`Clusters: ${CLUSTERS.map(c => `${c.name}(${c.size})`).join(', ')}`);
  console.log(`Bridges: ${profiles.filter(p => p.isBridge).length} cross-cluster connectors`);
}

main().catch(console.error);
