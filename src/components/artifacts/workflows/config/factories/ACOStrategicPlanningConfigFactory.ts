/**
 * ACO Strategic Planning Config Factory
 *
 * Generates workflow configuration dynamically from database customer data.
 * Replaces hardcoded config with database-driven approach.
 */

import { WorkflowConfig } from '../WorkflowConfig';
import {
  WorkflowCustomerData,
  calculateDaysUntilRenewal,
  formatARR,
  formatHealthScore,
  getHealthScoreStatus,
  getContactFullName,
  formatRenewalDate
} from '@/lib/utils/workflowCustomerData';

/**
 * Generate ACO Strategic Planning workflow config from database data
 */
export function createACOStrategicPlanningConfig(
  data: WorkflowCustomerData
): WorkflowConfig {
  const { customer, renewal, operations = [], supportTickets = [], contacts = [] } = data;

  // Extract contacts
  const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
  const secondaryContact = contacts.find(c => !c.is_primary);

  // Calculate derived values
  const daysUntilRenewal = calculateDaysUntilRenewal(customer.renewal_date);
  const healthScore = customer.health_score; // Stored as integer (64 for 6.4)
  const formattedHealthScore = formatHealthScore(healthScore);
  const healthStatus = getHealthScoreStatus(healthScore);
  const arrFormatted = formatARR(customer.current_arr);
  const renewalDateFormatted = formatRenewalDate(customer.renewal_date);

  // Find critical incident (Operation Blackout or similar)
  const criticalIncident = operations.find(op => op.status === 'failed');
  const incidentCost = criticalIncident?.cost_impact || 0;

  // Calculate churn probability from renewal data
  const churnProbability = renewal?.ai_risk_score || 42;
  const renewalProbability = renewal?.probability || 58;

  // Calculate expansion opportunity
  const expansionOpportunity = renewal?.expansion_opportunity || customer.current_arr * 10;

  // Get primary contact info
  const primaryContactName = primaryContact
    ? getContactFullName(primaryContact.first_name, primaryContact.last_name)
    : 'Unknown';
  const primaryContactEmail = primaryContact?.email || '';
  const primaryContactPhone = primaryContact?.phone || '';
  const primaryContactTitle = primaryContact?.title || '';

  // Get secondary contact info
  const secondaryContactName = secondaryContact
    ? getContactFullName(secondaryContact.first_name, secondaryContact.last_name)
    : '';
  const secondaryContactEmail = secondaryContact?.email || '';
  const secondaryContactPhone = secondaryContact?.phone || '';
  const secondaryContactTitle = secondaryContact?.title || '';

  return {
    customer: {
      name: customer.name
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
          value: arrFormatted,
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
          value: renewalDateFormatted,
          sublabel: `${daysUntilRenewal} days`,
          status: daysUntilRenewal < 90 ? 'red' : 'orange'
        },
        primaryContact: {
          label: 'Primary Contact',
          value: primaryContactName,
          role: primaryContactTitle
        },
        riskScore: {
          label: 'Risk Score',
          value: `${formattedHealthScore}/10`,
          status: healthStatus,
          sublabel: healthScore < 50 ? 'High churn risk' : 'Moderate risk'
        },
        growthScore: {
          label: 'Opportunity Score',
          value: '8.7/10',
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
        renewalStage: renewalProbability < 50 ? 'Crisis Management' : 'At Risk',
        confidence: renewalProbability,
        recommendedAction: 'Immediate strategic intervention required',
        keyReasons: [
          {
            category: 'Platform Failure',
            detail: criticalIncident
              ? `${criticalIncident.name} cost ${customer.name} ${formatARR(incidentCost)}`
              : 'No major incidents'
          },
          { category: 'Communication Gap', detail: '87-day silence after CSM transition' },
          { category: 'Support Issues', detail: '4 liaison changes in 8 months' },
          {
            category: 'Competitive Threat',
            detail: secondaryContactName
              ? `${secondaryContactName} evaluating competitors`
              : 'Competitor evaluation in progress'
          }
        ]
      }
    },
    chat: {
      placeholder: 'Discuss strategic planning...',
      aiGreeting: `Hello! I've analyzed ${customer.name}, and we have a critical situation. Their health score is ${formattedHealthScore}/10, renewal is in ${daysUntilRenewal} days with no auto-renewal clause, and they're evaluating competitors. However, there's a ${formatARR(expansionOpportunity)} opportunity if we act quickly. Ready to create a strategic recovery plan?`,
      mode: 'preload',
      conversationSeed: [
        {
          sender: 'ai',
          text: `Hello! I've analyzed ${customer.name}, and we have a critical situation. Their health score is ${formattedHealthScore}/10, renewal is in ${daysUntilRenewal} days with no auto-renewal clause, and they're evaluating competitors. However, there's a ${formatARR(expansionOpportunity)} opportunity if we act quickly. Ready to create a strategic recovery plan?`,
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
          text: `Let me start by reviewing their contract. ${customer.name}'s current agreement is ${arrFormatted} annual, ends ${renewalDateFormatted}, with NO auto-renewal. This means we need ${primaryContactName}'s explicit approval. The contract includes a 99.5% uptime SLA${criticalIncident ? `, which we violated during ${criticalIncident.name}` : ''}. Take a look at the Contract Summary to the right.`
        },
        ...(criticalIncident
          ? [
              {
                sender: 'user' as const,
                text: `What went wrong with ${criticalIncident.name}?`
              },
              {
                sender: 'ai' as const,
                text: `${criticalIncident.name} was ${customer.name}'s most critical failure. ${criticalIncident.failure_reason || 'A platform issue caused the operation to fail'}, costing them ${formatARR(incidentCost)}. Combined with an 87-day communication gap after your predecessor left, and 4 different support liaisons in 8 months, trust is severely damaged.`
              }
            ]
          : []),
        {
          sender: 'user',
          text: 'Show me the risk breakdown'
        },
        {
          sender: 'ai',
          text: `Here's the detailed risk assessment. Overall health score: ${formattedHealthScore}/10. AI churn probability: ${churnProbability}%. Without intervention, renewal is unlikely. Check the Risk Assessment artifact for the full breakdown.`
        },
        ...(secondaryContactName
          ? [
              {
                sender: 'user' as const,
                text: `Tell me about ${secondaryContactName}`
              },
              {
                sender: 'ai' as const,
                text: `${secondaryContactName} is ${secondaryContactTitle} and is evaluating ALL vendors. Priority: establish relationship within 7 days. This is both a risk AND your biggest opportunity with a ${formatARR(expansionOpportunity)} expansion potential.`
              }
            ]
          : []),
        {
          sender: 'user',
          text: 'Create the strategic plan'
        },
        {
          sender: 'ai',
          text: `Perfect. I've created a 90-day strategic recovery plan with 3 phases: (1) Days 1-7: Immediate response - respond to ${primaryContactName}, reach out to ${secondaryContactName || 'key stakeholders'}, schedule calls. (2) Days 8-30: Trust rebuilding - deliver accountability report, propose dedicated liaison, schedule Q1 QBR. (3) Days 31-90: Roadmap positioning - demo key features, expansion proposal, renewal kickoff. If executed, renewal probability increases from ${renewalProbability}% to 78%. Review the Strategic Account Plan artifact.`
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
            customerName: customer.name,
            contractId: `CONTRACT-${customer.id.slice(0, 8)}`,
            startDate: '2023-04-15', // TODO: Get from contract table
            endDate: customer.renewal_date,
            term: '3 years',
            arr: customer.current_arr,
            autoRenew: false,
            sla: {
              uptime: 99.5,
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
            customerName: customer.name,
            contacts: [
              ...(primaryContact
                ? [
                    {
                      name: primaryContactName,
                      title: primaryContactTitle,
                      email: primaryContactEmail,
                      phone: primaryContactPhone,
                      role: 'Primary Decision Maker',
                      sentiment: 'Frustrated but professional',
                      lastContact: renewal?.last_contact_date || 'Unknown',
                      engagementLevel: 'High',
                      notes: 'Sent "Year Two is your proving ground" email. Calm, strategic, expects accountability.',
                      nextSteps: [
                        'Respond to proving ground email within 24 hours',
                        'Schedule call for Day 5',
                        'Deliver accountability report by Day 15'
                      ]
                    }
                  ]
                : []),
              ...(secondaryContact
                ? [
                    {
                      name: secondaryContactName,
                      title: secondaryContactTitle,
                      email: secondaryContactEmail,
                      phone: secondaryContactPhone,
                      role: 'Technical Evaluator & Expansion Owner',
                      sentiment: 'Unknown - no relationship established',
                      lastContact: 'Never',
                      engagementLevel: 'None',
                      notes: `Launching expansion initiative (${formatARR(expansionOpportunity)}). Evaluating competitors. Key requirement: timezone automation.`,
                      nextSteps: [
                        'Intro email by Day 3',
                        'Discovery call by Day 10',
                        'Position timezone automation roadmap'
                      ]
                    }
                  ]
                : [])
            ],
            overallStrategy: `Dual-track approach: (1) Rebuild trust with ${primaryContactName} through accountability and execution. (2) Establish relationship with ${secondaryContactName || 'key stakeholders'} to capture expansion opportunity and neutralize competitive threat.`
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
                <p class="text-red-100">${customer.name} - Health Score Analysis</p>
              </div>

              <div class="p-6">
                <div class="mb-6 p-6 bg-red-50 border-2 border-red-200 rounded-lg text-center">
                  <div class="text-5xl font-bold text-red-600 mb-2">${formattedHealthScore}/10</div>
                  <div class="text-lg font-semibold text-red-800">Overall Health Score</div>
                  <div class="text-sm text-red-700 mt-2">${healthScore < 50 ? 'HIGH CHURN RISK' : 'MODERATE RISK'}</div>
                </div>

                <div class="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 class="font-semibold text-red-800 mb-2">AI Insight</h4>
                  <p class="text-sm text-red-700 mb-2">
                    <strong>CHURN PROBABILITY: ${churnProbability}%</strong>
                  </p>
                  <p class="text-sm text-red-700">
                    Without strategic intervention, renewal is unlikely. Key drivers: ${criticalIncident ? `${criticalIncident.name} (${formatARR(incidentCost)} loss), ` : ''}communication gap, support issues, and active competitor evaluation.
                  </p>
                </div>

                <div class="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 class="font-semibold text-green-800 mb-2">Recovery Opportunity</h4>
                  <p class="text-sm text-green-700">
                    Despite high risk, opportunity score is <strong>8.7/10</strong>. ${secondaryContactName ? `${secondaryContactName}'s ${formatARR(expansionOpportunity)} initiative represents` : 'There is'} significant expansion potential. With proper execution of strategic plan, renewal probability can increase to 78%.
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
            customerName: customer.name,
            planTitle: '90-Day Strategic Recovery Plan',
            planSummary: 'Three-phase approach to rebuild trust, establish key relationships, and secure renewal',
            phases: [
              {
                name: 'Immediate Response',
                duration: '1-7 days',
                description: 'Immediate action to demonstrate accountability and responsiveness',
                tasks: [
                  { title: `Respond to ${primaryContactName}'s email`, description: '', dueDate: 'Day 1', status: 'pending', owner: 'CSM' },
                  { title: `Intro outreach to ${secondaryContactName || 'key stakeholders'}`, description: '', dueDate: 'Day 3', status: 'pending', owner: 'CSM' },
                  { title: `Schedule ${primaryContactName} call`, description: '', dueDate: 'Day 5', status: 'pending', owner: 'CSM' }
                ]
              },
              {
                name: 'Trust Rebuilding',
                duration: '8-30 days',
                description: 'Rebuild trust through transparency and dedicated support',
                tasks: [
                  { title: `${secondaryContactName || 'Stakeholder'} discovery call`, description: '', dueDate: 'Day 10', status: 'pending', owner: 'CSM' },
                  { title: 'Deliver Accountability Report (what went wrong + fixes)', description: '', dueDate: 'Day 15', status: 'pending', owner: 'CSM' },
                  { title: 'Propose dedicated liaison', description: '', dueDate: 'Day 20', status: 'pending', owner: 'CSM' },
                  { title: 'Schedule Q1 QBR', description: '', dueDate: 'Day 25', status: 'pending', owner: 'CSM' }
                ]
              },
              {
                name: 'Roadmap Positioning',
                duration: '31-90 days',
                description: 'Position for renewal and capture expansion opportunity',
                tasks: [
                  { title: 'Demo timezone automation prototype', description: '', dueDate: 'Day 40', status: 'pending', owner: 'CSM' },
                  { title: 'Expansion proposal', description: '', dueDate: 'Day 60', status: 'pending', owner: 'CSM' },
                  { title: 'Q1 QBR execution', description: '', dueDate: 'Day 75', status: 'pending', owner: 'CSM' },
                  { title: 'Renewal negotiation kickoff', description: '', dueDate: 'Day 85', status: 'pending', owner: 'CSM' }
                ]
              }
            ],
            successMetrics: [
              `Renewal probability: ${renewalProbability}% → 78%`,
              `Health score improvement: ${formattedHealthScore}/10 → 7.5/10 target`,
              `${secondaryContactName || 'Key stakeholder'} relationship established within 10 days`,
              `Expansion opportunity identified: ${arrFormatted} → ${formatARR(expansionOpportunity)} potential`
            ]
          }
        }
      ]
    }
  };
}
