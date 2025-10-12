/**
 * Mock data for Obsidian Black
 * Demo customer for Act 1 - Strategic Planning workflow
 *
 * DATA SPECIFICATION (PM Approved Oct 11, 2025):
 * - ARR: $185,000 (realistic mid-market, NOT $850K)
 * - Health Score: 6.4/10 (moderate risk, NOT 4.2)
 * - Churn Probability: 42% (NOT 68%)
 * - Operation Blackout: $85K loss (NOT $850K)
 */

export const acoCustomerData = {
  // Customer Profile
  customer: {
    id: 'aco-001',
    name: 'Obsidian Black',
    industry: 'Global Strategic Coordination Services',
    operatives: 450,
    facilities: 23,
    arr: 185000,  // CORRECTED: Was $850K, now $185K
    renewalDate: '2026-04-15',
    daysUntilRenewal: 186,  // CORRECTED: Recalculated from today
    healthScore: 6.4,  // CORRECTED: Was 4.2, now 6.4 (moderate risk)
    opportunityScore: 8.7
  },

  // Primary Contact
  primaryContact: {
    id: 'aco-marcus',
    name: 'Marcus Castellan',
    title: 'Chief Operating Officer',
    email: 'marcus.castellan@obsidianblack.ops',
    phone: '+1 (555) 0100',
    engagementLevel: 'high',
    satisfaction: 'low',
    lastContact: '2025-09-12'
  },

  // Secondary Contact
  secondaryContact: {
    id: 'aco-elena',
    name: 'Dr. Elena Voss',
    title: 'VP of Technical Operations',
    email: 'elena.voss@obsidianblack.ops',
    phone: '+1 (555) 0101',
    engagementLevel: 'medium',
    isEvaluatingCompetitors: true,
    initiativeValue: 1700000,
    initiativeName: 'Global Synchronization Initiative'
  },

  // Contract Terms
  contract: {
    id: 'aco-contract-2025',
    startDate: '2023-04-15',  // CORRECTED: Contract started 2023
    endDate: '2026-04-15',
    arr: 185000,  // CORRECTED: Was $850K, now $185K
    autoRenew: false,
    slaUptime: 99.5,
    status: 'active',
    term: '3 years'  // CORRECTED: Was 'Annual', now '3 years'
  },

  // Health Score Breakdown
  healthScoreComponents: {
    overall: 6.4,  // CORRECTED: Was 4.2, now 6.4
    productPerformance: 5.0,  // CORRECTED: Adjusted to match new overall
    relationshipStrength: 4.8,
    strategicAlignment: 7.2,  // CORRECTED: Adjusted upward
    supportQuality: 5.1,  // CORRECTED: Was 3.5, now 5.1
    executiveSponsorship: 7.4  // CORRECTED: Adjusted upward
  },

  // Performance History / Incidents
  incidents: [
    {
      id: 'op-blackout',
      name: 'Operation Blackout',
      date: '2024-10-15',
      status: 'failed',
      failureReason: 'Platform latency caused 47-second delay in critical coordination phase',
      costImpact: 85000,  // CORRECTED: Was $850K, now $85K (~46% of ARR)
      quarter: 'Q4 2024',
      severity: 'high'  // CORRECTED: Was 'critical', now 'high' (scaled with impact)
    },
    {
      id: 'comm-gap',
      name: 'Communication Gap',
      date: '2024-06-01',
      endDate: '2024-09-26',
      duration: '87 days',
      reason: 'CSM transition, no outreach',
      severity: 'high'
    },
    {
      id: 'support-turnover',
      name: 'Support Liaison Turnover',
      date: '2024-02-01',
      endDate: '2024-10-01',
      count: 4,
      duration: '8 months',
      impact: 'ACO had to re-explain requirements multiple times',
      severity: 'medium'
    }
  ],

  // Support Tickets (for Risk Detection workflow)
  supportTickets: [
    {
      id: 'ticket-4728',
      subject: 'Operative Smith cannot access Phase 3 coordination documents',
      category: 'permissions_error',
      priority: 'high',
      status: 'open',
      createdAt: '2025-10-08',
      resolutionTimeHours: null,
      sentiment: 'frustrated'
    },
    {
      id: 'ticket-4729',
      subject: 'Performance degradation during peak operational windows',
      category: 'performance',
      priority: 'critical',
      status: 'open',
      createdAt: '2025-10-09',
      resolutionTimeHours: null,
      sentiment: 'frustrated'
    },
    {
      id: 'ticket-4730',
      subject: 'Multi-timezone scheduling not working as documented',
      category: 'feature_gap',
      priority: 'medium',
      status: 'open',
      createdAt: '2025-10-10',
      resolutionTimeHours: null,
      sentiment: 'neutral'
    }
  ],

  // Strategic Account Plan (90-day)
  strategicPlan: {
    phase1: {
      name: 'Immediate Response',
      days: '1-7',
      tasks: [
        { id: 1, task: 'Respond to Marcus\'s email', dueDate: 'Day 1', status: 'pending' },
        { id: 2, task: 'Intro outreach to Elena', dueDate: 'Day 3', status: 'pending' },
        { id: 3, task: 'Schedule Marcus call', dueDate: 'Day 5', status: 'pending' }
      ]
    },
    phase2: {
      name: 'Trust Rebuilding',
      days: '8-30',
      tasks: [
        { id: 4, task: 'Elena discovery call', dueDate: 'Day 10', status: 'pending' },
        { id: 5, task: 'Deliver "Accountability Report" (what went wrong + fixes)', dueDate: 'Day 15', status: 'pending' },
        { id: 6, task: 'Propose dedicated liaison', dueDate: 'Day 20', status: 'pending' },
        { id: 7, task: 'Schedule Q1 QBR', dueDate: 'Day 25', status: 'pending' }
      ]
    },
    phase3: {
      name: 'Roadmap Positioning',
      days: '31-90',
      tasks: [
        { id: 8, task: 'Demo timezone automation prototype', dueDate: 'Day 40', status: 'pending' },
        { id: 9, task: 'Expansion proposal', dueDate: 'Day 60', status: 'pending' },
        { id: 10, task: 'Q1 QBR execution', dueDate: 'Day 75', status: 'pending' },
        { id: 11, task: 'Renewal negotiation kickoff', dueDate: 'Day 85', status: 'pending' }
      ]
    },
    successProbability: 78,
    currentRenewalProbability: 58  // CORRECTED: Was 32%, now 58%
  },

  // AI Insights
  aiInsights: {
    churnProbability: 42,  // CORRECTED: Was 68%, now 42% (moderate risk)
    renewalProbability: 58,  // CORRECTED: Was 32%, now 58%
    expansionPotential: 1885000, // CORRECTED: Current $185K → Potential $1.885M (with Elena's $1.7M initiative)
    keyRisks: [
      'No auto-renewal clause',
      'Operation Blackout cost $85K and damaged trust',
      'Elena evaluating 3 competitors (ShadowCore, Helix, Phantom)',
      'Primary stakeholder (Marcus) disengaged for 90 days'
    ],
    keyOpportunities: [
      'Elena\'s $1.7M Global Synchronization Initiative',
      'High opportunity score (8.7/10)',
      'Timezone automation is key differentiator',
      'Strong payment history indicates financial stability'
    ]
  }
};

export default acoCustomerData;
