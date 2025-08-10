export interface Customer {
  id: string;
  name: string;
  industry: string;
  tier: string;
  health_score: number;
  renewal_date: string;
  current_arr: number;
  usage: number;
  nps_score: number;
}

export const mockCustomers: Customer[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Acme Corporation',
    industry: 'Technology',
    tier: 'enterprise',
    health_score: 85,
    renewal_date: '2024-08-15',
    current_arr: 450000,
    usage: 92,
    nps_score: 45
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'RiskyCorp',
    industry: 'Manufacturing',
    tier: 'premium',
    health_score: 45,
    renewal_date: '2024-07-30',
    current_arr: 380000,
    usage: 65,
    nps_score: -10
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'TechStart Inc',
    industry: 'SaaS',
    tier: 'standard',
    health_score: 72,
    renewal_date: '2024-09-20',
    current_arr: 120000,
    usage: 70,
    nps_score: 30
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Global Solutions',
    industry: 'Consulting',
    tier: 'enterprise',
    health_score: 92,
    renewal_date: '2024-10-05',
    current_arr: 750000,
    usage: 88,
    nps_score: 60
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'StartupXYZ',
    industry: 'Fintech',
    tier: 'standard',
    health_score: 35,
    renewal_date: '2024-07-15',
    current_arr: 85000,
    usage: 50,
    nps_score: -20
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Nimbus Analytics',
    industry: 'Analytics',
    tier: 'premium',
    health_score: 67,
    renewal_date: '2024-11-12',
    current_arr: 210000,
    usage: 80,
    nps_score: 25
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Venture Partners',
    industry: 'Finance',
    tier: 'enterprise',
    health_score: 78,
    renewal_date: '2024-12-01',
    current_arr: 540000,
    usage: 74,
    nps_score: 15
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Horizon Systems',
    industry: 'Healthcare',
    tier: 'premium',
    health_score: 55,
    renewal_date: '2024-06-25',
    current_arr: 305000,
    usage: 60,
    nps_score: 5
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    name: 'Quantum Soft',
    industry: 'Software',
    tier: 'standard',
    health_score: 82,
    renewal_date: '2024-09-10',
    current_arr: 190000,
    usage: 85,
    nps_score: 40
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'Apex Media',
    industry: 'Media',
    tier: 'standard',
    health_score: 64,
    renewal_date: '2024-08-05',
    current_arr: 150000,
    usage: 77,
    nps_score: 20
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: 'Stellar Networks',
    industry: 'Telecom',
    tier: 'enterprise',
    health_score: 88,
    renewal_date: '2024-10-22',
    current_arr: 620000,
    usage: 91,
    nps_score: 55
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: 'FusionWare',
    industry: 'Technology',
    tier: 'premium',
    health_score: 58,
    renewal_date: '2024-07-08',
    current_arr: 97000,
    usage: 63,
    nps_score: 10
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    name: 'Dynamic Ventures',
    industry: 'Retail',
    tier: 'standard',
    health_score: 49,
    renewal_date: '2024-11-30',
    current_arr: 130000,
    usage: 57,
    nps_score: -5
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    name: 'Prime Holdings',
    industry: 'Logistics',
    tier: 'enterprise',
    health_score: 83,
    renewal_date: '2024-12-15',
    current_arr: 410000,
    usage: 86,
    nps_score: 35
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440015',
    name: 'BetaWorks',
    industry: 'Education',
    tier: 'standard',
    health_score: 61,
    renewal_date: '2024-09-05',
    current_arr: 110000,
    usage: 72,
    nps_score: 18
  }
]; 