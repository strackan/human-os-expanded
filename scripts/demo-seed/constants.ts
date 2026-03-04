/**
 * Stable UUIDs and constants for demo seed data.
 * These IDs are hardcoded so cross-product linking is deterministic
 * and upserts reset to baseline without cascading deletes.
 */

// ─── Demo User ───────────────────────────────────────────────────────
export const DEMO_USER_ID = 'd152cc6c-8d71-4816-9b96-eccf249ed0ac';
export const DEMO_USER_EMAIL = 'justin@demo.humanos.ai';
export const DEMO_USER_NAME = 'Justin Trask';

// ─── Companies (8 total: 2 declining, 2 at-risk, 2 healthy, 2 champions) ──
export const COMPANIES = {
  // Champions (ARI 80+)
  acmeCorp: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Acme Corporation',
    domain: 'acmecorp.com',
    industry: 'Technology',
    ariTier: 'champion' as const,
  },
  globalSolutions: {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Global Solutions',
    domain: 'globalsolutions.com',
    industry: 'Consulting',
    ariTier: 'champion' as const,
  },
  // Healthy (ARI 60-79)
  stellarNetworks: {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: 'Stellar Networks',
    domain: 'stellarnetworks.com',
    industry: 'Telecom',
    ariTier: 'healthy' as const,
  },
  quantumSoft: {
    id: '550e8400-e29b-41d4-a716-446655440009',
    name: 'Quantum Soft',
    domain: 'quantumsoft.com',
    industry: 'Software',
    ariTier: 'healthy' as const,
  },
  // At-risk (ARI 40-59)
  horizonSystems: {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Horizon Systems',
    domain: 'horizonsystems.com',
    industry: 'Healthcare',
    ariTier: 'at-risk' as const,
  },
  fusionWare: {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: 'FusionWare',
    domain: 'fusionware.com',
    industry: 'Technology',
    ariTier: 'at-risk' as const,
  },
  // Declining (ARI <40)
  riskyCorp: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'RiskyCorp',
    domain: 'riskycorp.com',
    industry: 'Manufacturing',
    ariTier: 'declining' as const,
  },
  startupXYZ: {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'StartupXYZ',
    domain: 'startupxyz.com',
    industry: 'Fintech',
    ariTier: 'declining' as const,
  },
} as const;

// ─── Contacts (15 total, 5 also appear in GoodHang) ──────────────────
export const CONTACTS = {
  johnSmith: {
    id: '550e8400-e29b-41d4-a716-446655440101',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@acmecorp.com',
    title: 'CTO',
    companyKey: 'acmeCorp' as const,
    inGoodHang: true,
  },
  sarahJohnson: {
    id: '550e8400-e29b-41d4-a716-446655440102',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@riskycorp.com',
    title: 'VP Operations',
    companyKey: 'riskyCorp' as const,
    inGoodHang: false,
  },
  emilyDavis: {
    id: '550e8400-e29b-41d4-a716-446655440104',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@globalsolutions.com',
    title: 'CEO',
    companyKey: 'globalSolutions' as const,
    inGoodHang: true,
  },
  davidWilson: {
    id: '550e8400-e29b-41d4-a716-446655440105',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@startupxyz.com',
    title: 'CTO',
    companyKey: 'startupXYZ' as const,
    inGoodHang: false,
  },
  lisaRodriguez: {
    id: '550e8400-e29b-41d4-a716-446655440106',
    firstName: 'Lisa',
    lastName: 'Rodriguez',
    email: 'lisa.rodriguez@nimbusanalytics.com',
    title: 'Head of Analytics',
    companyKey: 'stellarNetworks' as const, // reassigned for demo coherence
    inGoodHang: true,
  },
  robertTaylor: {
    id: '550e8400-e29b-41d4-a716-446655440107',
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@venturepartners.com',
    title: 'Managing Partner',
    companyKey: 'quantumSoft' as const,
    inGoodHang: false,
  },
  jenniferBrown: {
    id: '550e8400-e29b-41d4-a716-446655440108',
    firstName: 'Jennifer',
    lastName: 'Brown',
    email: 'jennifer.brown@horizonsystems.com',
    title: 'VP Technology',
    companyKey: 'horizonSystems' as const,
    inGoodHang: true,
  },
  markAnderson: {
    id: '550e8400-e29b-41d4-a716-446655440109',
    firstName: 'Mark',
    lastName: 'Anderson',
    email: 'mark.anderson@quantumsoft.com',
    title: 'Lead Developer',
    companyKey: 'quantumSoft' as const,
    inGoodHang: false,
  },
  amandaWhite: {
    id: '550e8400-e29b-41d4-a716-446655440110',
    firstName: 'Amanda',
    lastName: 'White',
    email: 'amanda.white@apexmedia.com',
    title: 'Creative Director',
    companyKey: 'acmeCorp' as const,
    inGoodHang: false,
  },
  chrisMartinez: {
    id: '550e8400-e29b-41d4-a716-446655440111',
    firstName: 'Chris',
    lastName: 'Martinez',
    email: 'chris.martinez@stellarnetworks.com',
    title: 'Network Engineer',
    companyKey: 'stellarNetworks' as const,
    inGoodHang: true,
  },
  nicoleGarcia: {
    id: '550e8400-e29b-41d4-a716-446655440112',
    firstName: 'Nicole',
    lastName: 'Garcia',
    email: 'nicole.garcia@fusionware.com',
    title: 'Product Owner',
    companyKey: 'fusionWare' as const,
    inGoodHang: false,
  },
  kevinLee: {
    id: '550e8400-e29b-41d4-a716-446655440113',
    firstName: 'Kevin',
    lastName: 'Lee',
    email: 'kevin.lee@dynamicventures.com',
    title: 'VP Sales',
    companyKey: 'horizonSystems' as const,
    inGoodHang: false,
  },
  rachelKim: {
    id: '550e8400-e29b-41d4-a716-446655440114',
    firstName: 'Rachel',
    lastName: 'Kim',
    email: 'rachel.kim@primeholdings.com',
    title: 'Operations Director',
    companyKey: 'fusionWare' as const,
    inGoodHang: false,
  },
  thomasJackson: {
    id: '550e8400-e29b-41d4-a716-446655440115',
    firstName: 'Thomas',
    lastName: 'Jackson',
    email: 'thomas.jackson@betaworks.com',
    title: 'Education Lead',
    companyKey: 'startupXYZ' as const,
    inGoodHang: false,
  },
  michaelChen: {
    id: '550e8400-e29b-41d4-a716-446655440103',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@techstart.com',
    title: 'Product Manager',
    companyKey: 'riskyCorp' as const,
    inGoodHang: false,
  },
} as const;

// ─── Entity spine IDs (for human_os.entities / global.entities) ──────
export const ENTITY_IDS = {
  // Companies map to same IDs as COMPANIES above
  ...Object.fromEntries(
    Object.entries(COMPANIES).map(([key, c]) => [key, c.id])
  ),
  // People entity IDs (separate from contact IDs)
  person_johnSmith: 'e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b51',
  person_emilyDavis: 'e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b52',
  person_jenniferBrown: 'e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b53',
  person_chrisMartinez: 'e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b54',
  person_lisaRodriguez: 'e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b55',
} as const;

// ─── ARI Score Tiers ─────────────────────────────────────────────────
export const ARI_SCORES: Record<string, { current: number; history: [number, number, number] }> = {
  // [90 days ago, 45 days ago, today]
  [COMPANIES.acmeCorp.id]:        { current: 87, history: [82, 85, 87] },
  [COMPANIES.globalSolutions.id]: { current: 91, history: [88, 89, 91] },
  [COMPANIES.stellarNetworks.id]: { current: 72, history: [68, 70, 72] },
  [COMPANIES.quantumSoft.id]:     { current: 65, history: [60, 63, 65] },
  [COMPANIES.horizonSystems.id]:  { current: 48, history: [55, 52, 48] },
  [COMPANIES.fusionWare.id]:      { current: 42, history: [50, 46, 42] },
  [COMPANIES.riskyCorp.id]:       { current: 28, history: [45, 35, 28] },
  [COMPANIES.startupXYZ.id]:      { current: 19, history: [38, 28, 19] },
};

// ─── Renubu Renewal/Task IDs ─────────────────────────────────────────
export const RENEWAL_IDS = {
  acmeCorp: '550e8400-e29b-41d4-a716-446655440020',
  riskyCorp: '550e8400-e29b-41d4-a716-446655440021',
  horizonSystems: '550e8400-e29b-41d4-a716-446655440022',
  fusionWare: '550e8400-e29b-41d4-a716-446655440023',
  stellarNetworks: '550e8400-e29b-41d4-a716-446655440024',
} as const;

// ─── FounderOS Journal Entry IDs ─────────────────────────────────────
export const JOURNAL_IDS = [
  'f0a1b2c3-0001-4f6a-8b9c-0d1e2f3a4b01',
  'f0a1b2c3-0001-4f6a-8b9c-0d1e2f3a4b02',
  'f0a1b2c3-0001-4f6a-8b9c-0d1e2f3a4b03',
  'f0a1b2c3-0001-4f6a-8b9c-0d1e2f3a4b04',
  'f0a1b2c3-0001-4f6a-8b9c-0d1e2f3a4b05',
  'f0a1b2c3-0001-4f6a-8b9c-0d1e2f3a4b06',
  'f0a1b2c3-0001-4f6a-8b9c-0d1e2f3a4b07',
  'f0a1b2c3-0001-4f6a-8b9c-0d1e2f3a4b08',
  'f0a1b2c3-0001-4f6a-8b9c-0d1e2f3a4b09',
  'f0a1b2c3-0001-4f6a-8b9c-0d1e2f3a4b10',
] as const;
