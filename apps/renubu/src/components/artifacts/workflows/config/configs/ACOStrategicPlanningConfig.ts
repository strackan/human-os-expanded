import { WorkflowConfig } from '../WorkflowConfig';
import acoCustomerData from '../../../../../lib/mockData/acoCustomerData';

/**
 * ACO Strategic Planning Workflow - Act 1 Demo
 * 5-step workflow for creating strategic account plan for at-risk customer
 */
export const acoStrategicPlanningConfig: WorkflowConfig = {
  customer: {
    name: 'Obsidian Black'
  },
  layout: {
    modalDimensions: { width: 90, height: 90, top: 5, left: 5 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: true
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: `$${(acoCustomerData.customer.arr / 1000).toFixed(0)}K`,
        trend: 'down',
        trendValue: '-12%',
        status: 'red'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$4.25',
        sublabel: '(Below market avg)',
        status: 'orange',
        trend: 'Underpriced for value delivered'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Apr 15, 2026',
        sublabel: `${acoCustomerData.customer.daysUntilRenewal} days`,
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: acoCustomerData.primaryContact.name,
        role: acoCustomerData.primaryContact.title
      },
      riskScore: {
        label: 'Risk Score',
        value: `${acoCustomerData.customer.healthScore}/10`,
        status: 'red',
        sublabel: 'High churn risk'
      },
      growthScore: {
        label: 'Opportunity Score',
        value: `${acoCustomerData.customer.opportunityScore}/10`,
        status: 'green',
        sublabel: 'Expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '-8.5%',
        status: 'red',
        sparkData: [12, 11, 10, 9, 8, 7, 6],
        sublabel: 'Declining'
      },
      lastMonth: {
        label: 'Last Month',
        value: '-15.3%',
        status: 'red',
        sparkData: [10, 9, 8, 7, 6, 5, 4],
        sublabel: 'Steep decline'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Monthly Active Users',
      showReferenceLine: true,
      referenceLineLabel: 'Baseline',
      referenceLineHeight: 15,
      data: [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 2, 2, 2, 2, 2],
      chartContextLabel: '↘ Steep usage decline - critical intervention needed',
      chartContextColor: 'text-red-600',
      chartMin: 0,
      chartMax: 20,
      dataColors: { threshold: 10, belowColor: 'bg-red-500', aboveColor: 'bg-yellow-600' }
    },
    userLicenses: {
      title: 'Active Operatives',
      showReferenceLine: true,
      referenceLineLabel: 'License Capacity',
      referenceLineHeight: 100,
      data: [95, 92, 90, 88, 85, 82, 80, 78, 75, 72, 70, 68, 65, 62, 60, 58, 55, 52, 50, 48, 45, 42],
      chartContextLabel: '↘ 55% drop in active users - major concern',
      chartContextColor: 'text-red-600',
      chartMin: 0,
      chartMax: 120,
      dataColors: { threshold: 60, belowColor: 'bg-red-500', aboveColor: 'bg-yellow-600' }
    },
    renewalInsights: {
      renewalStage: 'Crisis Management',
      confidence: 32,
      recommendedAction: 'Immediate strategic intervention required',
      keyReasons: [
        { category: 'Platform Failure', detail: 'Operation Blackout cost ACO $850K' },
        { category: 'Communication Gap', detail: '87-day silence after CSM transition' },
        { category: 'Support Issues', detail: '4 liaison changes in 8 months' },
        { category: 'Competitive Threat', detail: 'Elena evaluating VectorSync and OmniCoord' }
      ]
    }
  },
  chat: {
    placeholder: 'Discuss strategic planning...',
    aiGreeting: "Hello Sarah! I've analyzed Obsidian Black, and we have a critical situation. Their health score is 4.2/10, renewal is in 143 days with no auto-renewal clause, and they're evaluating competitors. However, there's an $850K opportunity if we act quickly. Ready to create a strategic recovery plan?",
    mode: 'preload',
    conversationSeed: [
      {
        sender: 'ai',
        text: "Hello Sarah! I've analyzed Obsidian Black, and we have a critical situation. Their health score is 4.2/10, renewal is in 143 days with no auto-renewal clause, and they're evaluating competitors. However, there's an $850K opportunity if we act quickly. Ready to create a strategic recovery plan?",
        type: 'buttons',
        buttons: [
          { label: 'Skip', value: 'skip', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Snooze', value: 'snooze', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Create Plan', value: 'create', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Create Plan'
      },
      {
        sender: 'ai',
        text: "Let me start by reviewing their contract. ACO's current agreement is $850K annual, ends April 15, 2026, with NO auto-renewal. This means we need Marcus's explicit approval. The contract includes a 99.5% uptime SLA, which we violated during Operation Blackout. Take a look at the Contract Summary to the right."
      },
      {
        sender: 'user',
        text: 'What went wrong with Operation Blackout?'
      },
      {
        sender: 'ai',
        text: "Operation Blackout was ACO's most critical failure in Q4 2024. A 47-second platform latency delay caused the operation to fail, costing them $850K. Combined with an 87-day communication gap after your predecessor left, and 4 different support liaisons in 8 months, trust is severely damaged."
      },
      {
        sender: 'user',
        text: 'Show me the risk breakdown'
      },
      {
        sender: 'ai',
        text: "Here's the detailed risk assessment. Overall health score: 4.2/10. Key weaknesses: Product Performance (3.1/10), Support Quality (3.5/10), and Relationship Strength (4.8/10). AI churn probability: 68%. Without intervention, renewal is unlikely. Check the Risk Assessment artifact for the full breakdown."
      },
      {
        sender: 'user',
        text: "What's my biggest concern?"
      },
      {
        sender: 'ai',
        text: "What's your biggest concern about this account?",
        type: 'buttons',
        buttons: [
          { label: 'Technical issues won\'t be fixed in time', value: 'technical', 'label-background': '#3b82f6', 'label-text': '#ffffff' },
          { label: 'I don\'t know Elena Voss at all', value: 'elena', 'label-background': '#8b5cf6', 'label-text': '#ffffff' },
          { label: '143 days isn\'t enough time', value: 'time', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Marcus has already decided to leave', value: 'marcus', 'label-background': '#ef4444', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'I don\'t know Elena Voss at all'
      },
      {
        sender: 'ai',
        text: "Astute concern. Dr. Elena Voss is VP of Technical Operations (joined 6 months ago) and is launching a $1.7M Global Synchronization Initiative. She's currently evaluating ALL vendors, including VectorSync and OmniCoord. Her key requirement: timezone automation, which is on our roadmap but not yet delivered. Priority: establish relationship within 7 days. This is both a risk AND your biggest opportunity."
      },
      {
        sender: 'user',
        text: 'Create the strategic plan'
      },
      {
        sender: 'ai',
        text: "Perfect. I've created a 90-day strategic recovery plan with 3 phases: (1) Days 1-7: Immediate response - respond to Marcus, reach out to Elena, schedule calls. (2) Days 8-30: Trust rebuilding - deliver accountability report, propose dedicated liaison, schedule Q1 QBR. (3) Days 31-90: Roadmap positioning - demo timezone automation, expansion proposal, renewal kickoff. If executed, renewal probability increases from 32% to 78%. Review the Strategic Account Plan artifact."
      }
    ],
    features: {
      attachments: true,
      voiceRecording: true,
      designMode: true,
      editMode: true,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: [
      {
        id: 'contract-summary',
        title: 'Contract Summary',
        type: 'contract',
        visible: true,
        data: {
          customerName: acoCustomerData.customer.name,
          contractId: acoCustomerData.contract.id,
          startDate: acoCustomerData.contract.startDate,
          endDate: acoCustomerData.contract.endDate,
          term: acoCustomerData.contract.term,
          arr: acoCustomerData.contract.arr,
          autoRenew: acoCustomerData.contract.autoRenew,
          sla: {
            uptime: acoCustomerData.contract.slaUptime,
            support: '24/7 coverage',
            responseTime: '< 4 hours for critical issues'
          },
          keyTerms: [
            'No auto-renewal - requires explicit approval',
            '99.5% uptime SLA during operational windows',
            '30-day termination notice required',
            'Annual payment terms'
          ]
        }
      },
      {
        id: 'contact-strategy',
        title: 'Contact Strategy',
        type: 'contact-strategy',
        visible: true,
        data: {
          customerName: acoCustomerData.customer.name,
          contacts: [
            {
              name: acoCustomerData.primaryContact.name,
              title: acoCustomerData.primaryContact.title,
              email: acoCustomerData.primaryContact.email,
              phone: acoCustomerData.primaryContact.phone,
              role: 'Primary Decision Maker',
              sentiment: 'Frustrated but professional',
              lastContact: acoCustomerData.primaryContact.lastContact,
              engagementLevel: 'High',
              notes: 'Sent "Year Two is your proving ground" email. Calm, strategic, expects accountability.',
              nextSteps: [
                'Respond to proving ground email within 24 hours',
                'Schedule call for Day 5',
                'Deliver accountability report by Day 15'
              ]
            },
            {
              name: acoCustomerData.secondaryContact.name,
              title: acoCustomerData.secondaryContact.title,
              email: acoCustomerData.secondaryContact.email,
              phone: acoCustomerData.secondaryContact.phone,
              role: 'Technical Evaluator & Expansion Owner',
              sentiment: 'Unknown - no relationship established',
              lastContact: 'Never',
              engagementLevel: 'None',
              notes: `Launching ${acoCustomerData.secondaryContact.initiativeName} ($${(acoCustomerData.secondaryContact.initiativeValue / 1000000).toFixed(1)}M). Evaluating competitors (VectorSync, OmniCoord). Key requirement: timezone automation.`,
              nextSteps: [
                'Intro email by Day 3',
                'Discovery call by Day 10',
                'Position timezone automation roadmap'
              ]
            }
          ],
          overallStrategy: 'Dual-track approach: (1) Rebuild trust with Marcus through accountability and execution. (2) Establish relationship with Elena to capture expansion opportunity and neutralize competitive threat.'
        }
      },
      {
        id: 'risk-assessment',
        title: 'Risk Assessment',
        type: 'html',
        visible: true,
        htmlContent: `
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-lg">
              <h2 class="text-2xl font-bold mb-2">Risk Assessment</h2>
              <p class="text-red-100">Obsidian Black - Health Score Analysis</p>
            </div>

            <div class="p-6">
              <div class="mb-6 p-6 bg-red-50 border-2 border-red-200 rounded-lg text-center">
                <div class="text-5xl font-bold text-red-600 mb-2">${acoCustomerData.customer.healthScore}/10</div>
                <div class="text-lg font-semibold text-red-800">Overall Health Score</div>
                <div class="text-sm text-red-700 mt-2">HIGH CHURN RISK</div>
              </div>

              <div class="space-y-4 mb-6">
                <h3 class="font-semibold text-gray-800">Component Breakdown</h3>

                <div class="space-y-3">
                  ${Object.entries(acoCustomerData.healthScoreComponents)
                    .filter(([key]) => key !== 'overall')
                    .map(([key, score]) => {
                      const numScore = score as number;
                      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      const percentage = (numScore / 10) * 100;
                      const colorClass = numScore < 4 ? 'bg-red-500' : numScore < 7 ? 'bg-yellow-500' : 'bg-green-500';
                      const textColor = numScore < 4 ? 'text-red-700' : numScore < 7 ? 'text-yellow-700' : 'text-green-700';
                      return `
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-sm font-medium text-gray-700">${label}</span>
                            <span class="text-sm font-semibold ${textColor}">${numScore}/10</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="${colorClass} h-2.5 rounded-full" style="width: ${percentage}%"></div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                </div>
              </div>

              <div class="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 class="font-semibold text-red-800 mb-2">AI Insight</h4>
                <p class="text-sm text-red-700 mb-2">
                  <strong>CHURN PROBABILITY: ${acoCustomerData.aiInsights.churnProbability}%</strong>
                </p>
                <p class="text-sm text-red-700">
                  Without strategic intervention, renewal is unlikely. Key drivers: Operation Blackout ($850K loss), 87-day communication gap, 4 support liaison changes, and active competitor evaluation.
                </p>
              </div>

              <div class="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 class="font-semibold text-green-800 mb-2">Recovery Opportunity</h4>
                <p class="text-sm text-green-700">
                  Despite high risk, opportunity score is <strong>8.7/10</strong>. Elena's $1.7M initiative represents significant expansion potential. With proper execution of strategic plan, renewal probability can increase to 78%.
                </p>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'strategic-account-plan',
        title: 'Strategic Account Plan',
        type: 'plan-summary',
        visible: true,
        data: {
          customerName: acoCustomerData.customer.name,
          planTitle: '90-Day Strategic Recovery Plan',
          planSummary: 'Three-phase approach to rebuild trust, establish Elena relationship, and secure renewal',
          phases: [
            {
              name: acoCustomerData.strategicPlan.phase1.name,
              duration: acoCustomerData.strategicPlan.phase1.days,
              description: 'Immediate action to demonstrate accountability and responsiveness',
              tasks: acoCustomerData.strategicPlan.phase1.tasks.map(t => ({
                title: t.task,
                description: '',
                dueDate: t.dueDate,
                status: t.status,
                owner: 'Sarah Chen'
              }))
            },
            {
              name: acoCustomerData.strategicPlan.phase2.name,
              duration: acoCustomerData.strategicPlan.phase2.days,
              description: 'Rebuild trust through transparency and dedicated support',
              tasks: acoCustomerData.strategicPlan.phase2.tasks.map(t => ({
                title: t.task,
                description: '',
                dueDate: t.dueDate,
                status: t.status,
                owner: 'Sarah Chen'
              }))
            },
            {
              name: acoCustomerData.strategicPlan.phase3.name,
              duration: acoCustomerData.strategicPlan.phase3.days,
              description: 'Position for renewal and capture expansion opportunity',
              tasks: acoCustomerData.strategicPlan.phase3.tasks.map(t => ({
                title: t.task,
                description: '',
                dueDate: t.dueDate,
                status: t.status,
                owner: 'Sarah Chen'
              }))
            }
          ],
          successMetrics: [
            `Renewal probability: ${acoCustomerData.strategicPlan.currentRenewalProbability}% → ${acoCustomerData.strategicPlan.successProbability}%`,
            'Health score improvement: 4.2/10 → 7.5/10 target',
            'Elena relationship established within 10 days',
            'Expansion opportunity identified: $850K → $2.55M potential'
          ]
        }
      }
    ]
  }
};
