import React from 'react';
import { TaskModeModal } from '../TaskModeAdvanced';
import { WorkflowConfig } from '../config/WorkflowConfig';

// Example: Create a custom config for a specific scenario
const customConfig: WorkflowConfig = {
  customer: {
    name: 'TechFlow Inc',
    nextCustomer: 'DataCorp'
  },
  layout: {
    modalDimensions: { width: 90, height: 85, top: 5, left: 5 },
    dividerPosition: 40,
    chatWidth: 65,
    splitModeDefault: true
  },
  customerOverview: {
    metrics: {
      arr: { label: 'ARR', value: '$750,000', trend: 'up', trendValue: '+35%', status: 'green' },
      licenseUnitPrice: { label: 'Unit Price', value: '$8.50', status: 'green' },
      renewalDate: { label: 'Renewal', value: 'Dec 1, 2024', sublabel: '15 days', status: 'red' },
      primaryContact: { label: 'Contact', value: 'Alex Johnson', role: 'Head of Engineering' },
      riskScore: { label: 'Risk', value: '2.5/10', status: 'green' },
      growthScore: { label: 'Growth', value: '8.5/10', status: 'green' },
      yoyGrowth: { label: 'YoY', value: '+22%', status: 'green', sparkData: [4, 5, 6, 7, 8] },
      lastMonth: { label: 'Last Month', value: '+12%', status: 'green', sparkData: [6, 7, 7, 8, 8] }
    }
  },
  analytics: {
    usageTrend: {
      title: 'API Usage',
      showReferenceLine: true,
      referenceLineLabel: 'Plan Limit',
      data: [10, 12, 15, 18, 22, 25, 30, 35, 40, 45],
      upliftPercentage: 78,
      dataColors: { threshold: 6, belowColor: 'bg-blue-400', aboveColor: 'bg-green-400' }
    },
    userLicenses: {
      title: 'Team Size',
      showReferenceLine: false,
      referenceLineLabel: '',
      data: [20, 22, 25, 28, 30, 32, 35, 38, 40, 42],
      spikePercentage: 110,
      color: 'indigo'
    },
    renewalInsights: {
      renewalStage: 'Ready to Close',
      confidence: 95,
      recommendedAction: 'Immediate Renewal with Upsell',
      keyReasons: [
        { category: 'Urgency', detail: 'Renewal in 15 days' },
        { category: 'Usage', detail: '78% over plan limits' },
        { category: 'Satisfaction', detail: 'Strong engineering team adoption' }
      ]
    }
  },
  chat: {
    placeholder: 'Discuss TechFlow renewal urgency...',
    aiGreeting: "TechFlow's renewal is urgent! They're over limits and need immediate attention.",
    features: { attachments: true, voiceRecording: true, designMode: true, editMode: true, artifactsToggle: true }
  },
  artifacts: {
    sections: [
      {
        id: 'urgent-renewal',
        title: 'Urgent Renewal Analysis',
        type: 'license-analysis',
        visible: true,
        content: {
          currentLicense: { tokens: 75000, unitPrice: 10, total: 750000 },
          anticipatedRenewal: { tokens: 120000, unitPrice: 9.50, total: 1140000 },
          earlyDiscount: { percentage: 5, total: 1083000 },
          multiYearDiscount: { percentage: 20, total: 912000 }
        }
      }
    ]
  }
};

// Custom conversation for this scenario
const urgentRenewalConversation = [
  {
    sender: 'ai' as const,
    text: '🚨 URGENT: TechFlow Inc renewal expires in 15 days! They\'re 78% over their usage limits and showing strong growth signals. This is a perfect upsell opportunity, but we need to act fast. Shall I prepare an immediate outreach?',
    type: 'buttons' as const,
    buttons: [
      { label: 'Schedule Tomorrow', value: 'schedule', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
      { label: 'Call Now', value: 'call', 'label-background': '#dc2626', 'label-text': '#ffffff' },
      { label: 'Send Proposal', value: 'proposal', 'label-background': '#10b981', 'label-text': '#ffffff' }
    ]
  }
];

const SimpleExample = () => {
  return (
    <TaskModeModal
      isOpen={true}
      onClose={() => {}}
      workflowConfig={customConfig}
      workflowConfigName="simple-example"
      conversationSeed={urgentRenewalConversation}
      starting_with="ai"
      showArtifact={false}
      artifact_visible={true}
    />
  );
};

export default SimpleExample;