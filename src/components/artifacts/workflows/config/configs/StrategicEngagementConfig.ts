import { WorkflowConfig } from '../WorkflowConfig';

export const strategicEngagementConfig: WorkflowConfig = {
  customer: {
    name: 'Strategic Partners Inc',
    nextCustomer: 'Global Solutions Corp'
  },
  layout: {
    modalDimensions: { width: 85, height: 75, top: 15, left: 5 },
    dividerPosition: 45,
    chatWidth: 60,
    splitModeDefault: false
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$750,000',
        trend: 'up',
        trendValue: '+15.2%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$12.80',
        sublabel: '(top 10% value)',
        status: 'green',
        trend: 'Premium customer'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Apr 20, 2025',
        sublabel: '120 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'David Kim',
        role: 'VP Technology'
      },
      riskScore: {
        label: 'Risk Score',
        value: '2.1/10',
        status: 'green',
        sublabel: 'Excellent health'
      },
      growthScore: {
        label: 'Growth Score',
        value: '8.7/10',
        status: 'green',
        sublabel: 'High expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+15.2%',
        status: 'green',
        sparkData: [5, 6, 7, 8, 9, 10, 12],
        sublabel: 'Strong growth'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+3.2%',
        status: 'green',
        sparkData: [8, 8, 9, 9, 10, 10, 11],
        sublabel: 'Consistent growth'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Monthly Active Users',
      showReferenceLine: true,
      referenceLineLabel: 'Growth Target',
      referenceLineHeight: 20,
      data: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
      chartContextLabel: 'Consistent growth trajectory - ideal for strategic engagement',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 40,
      dataColors: { threshold: 20, belowColor: 'bg-yellow-600', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'License Utilization',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      referenceLineHeight: 40,
      data: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
      chartContextLabel: 'High utilization with room for expansion',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 50,
      dataColors: { threshold: 30, belowColor: 'bg-yellow-600', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Strategic Engagement',
      confidence: 85,
      recommendedAction: 'Execute strategic engagement plan; Focus on expansion opportunities',
      keyReasons: [
        { category: 'Growth', detail: 'Consistent 15%+ growth trajectory' },
        { category: 'Engagement', detail: 'Strong executive relationship' },
        { category: 'Expansion', detail: 'High utilization with expansion potential' }
      ]
    }
  },
  chat: {
    placeholder: 'Discuss strategic opportunities...',
    aiGreeting: "Good morning, Angela! Strategic Partners Inc is our star customer with excellent growth and strong executive engagement. This is a perfect opportunity for strategic engagement and expansion. Shall we plan our approach?",
    conversationSeed: [
      {
        sender: 'ai',
        text: 'Good morning, Angela! Strategic Partners Inc is our star customer with excellent growth and strong executive engagement. This is a perfect opportunity for strategic engagement and expansion. Shall we plan our approach?',
        type: 'buttons',
        buttons: [
          { label: 'Skip', value: 'skip', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Later', value: 'later', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Let\'s Plan', value: 'plan', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Let\'s Plan'
      },
      {
        sender: 'ai',
        text: 'Perfect! With their 15% growth and high utilization, I recommend a strategic engagement approach. We should schedule an executive business review with David Kim to discuss expansion opportunities. What\'s your preference?',
        type: 'buttons',
        buttons: [
          { label: 'Executive Review', value: 'review', 'label-background': '#10b981', 'label-text': '#ffffff' },
          { label: 'Product Demo', value: 'demo', 'label-background': '#3b82f6', 'label-text': '#ffffff' },
          { label: 'Both', value: 'both', 'label-background': '#8b5cf6', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Both'
      },
      {
        sender: 'ai',
        text: 'Excellent choice! I\'ve prepared a strategic engagement plan that includes both an executive business review and a product demo session. The plan focuses on their expansion potential and showcases new features that align with their growth trajectory.',
      },
      {
        sender: 'user',
        text: 'What expansion opportunities do we have?'
      },
      {
        sender: 'ai',
        text: 'Based on their usage patterns, I see three key expansion opportunities: 1) Additional licenses for their growing team, 2) Premium support tier for their critical operations, and 3) Advanced analytics module that aligns with their data-driven approach. Should I schedule the executive review?'
      },
      {
        sender: 'user',
        text: 'Yes, schedule it for next week'
      },
      {
        sender: 'ai',
        text: 'Perfect! I\'ve scheduled the executive business review with David Kim for next Tuesday at 2 PM. I\'ll also prepare a customized expansion proposal highlighting the three opportunities we discussed.'
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
        id: 'strategic-engagement-plan',
        title: 'Strategic Engagement Plan',
        type: 'html',
        visible: true,
        htmlContent: `
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-lg">
              <h2 class="text-2xl font-bold mb-2">Strategic Engagement Plan</h2>
              <p class="text-green-100">Strategic Partners Inc - Expansion Focus</p>
            </div>
            
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                  <h3 class="font-semibold text-blue-800 mb-2">Executive Review</h3>
                  <p class="text-sm text-blue-700">Scheduled for next Tuesday at 2 PM with David Kim</p>
                  <div class="mt-2 text-xs text-blue-600">
                    <p>• Business performance review</p>
                    <p>• Growth trajectory analysis</p>
                    <p>• Strategic roadmap alignment</p>
                  </div>
                </div>
                
                <div class="bg-purple-50 p-4 rounded-lg">
                  <h3 class="font-semibold text-purple-800 mb-2">Product Demo</h3>
                  <p class="text-sm text-purple-700">Advanced features showcase</p>
                  <div class="mt-2 text-xs text-purple-600">
                    <p>• New analytics module</p>
                    <p>• Premium support features</p>
                    <p>• Integration capabilities</p>
                  </div>
                </div>
                
                <div class="bg-orange-50 p-4 rounded-lg">
                  <h3 class="font-semibold text-orange-800 mb-2">Expansion Proposal</h3>
                  <p class="text-sm text-orange-700">Customized growth opportunities</p>
                  <div class="mt-2 text-xs text-orange-600">
                    <p>• Additional licenses</p>
                    <p>• Premium support tier</p>
                    <p>• Advanced analytics</p>
                  </div>
                </div>
              </div>
              
              <div class="space-y-4">
                <h3 class="font-semibold text-gray-800">Expansion Opportunities</h3>
                
                <div class="space-y-3">
                  <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-gray-800">Additional Licenses</h4>
                      <p class="text-sm text-gray-600">Based on their 15% growth rate, they could benefit from 15-20 additional licenses</p>
                      <p class="text-xs text-green-600 font-medium">Potential Value: $192,000 - $256,000</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-gray-800">Premium Support Tier</h4>
                      <p class="text-sm text-gray-600">Their critical operations would benefit from dedicated support and faster response times</p>
                      <p class="text-xs text-blue-600 font-medium">Potential Value: $75,000 annually</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div class="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-gray-800">Advanced Analytics Module</h4>
                      <p class="text-sm text-gray-600">Aligns with their data-driven approach and provides deeper insights</p>
                      <p class="text-xs text-purple-600 font-medium">Potential Value: $45,000 annually</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 class="font-semibold text-green-800 mb-2">Total Expansion Potential</h4>
                <p class="text-2xl font-bold text-green-600">$312,000 - $376,000</p>
                <p class="text-sm text-green-700">41-50% ARR increase opportunity</p>
              </div>
            </div>
          </div>
        `
      }
    ]
  }
};
