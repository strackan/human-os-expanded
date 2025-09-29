import { WorkflowConfig } from '../WorkflowConfig';

export const priceIncreaseFlatConfig: WorkflowConfig = {
  customer: {
    name: 'TechFlow Industries',
    nextCustomer: 'Strategic Partners Inc'
  },
  layout: {
    modalDimensions: { width: 80, height: 80, top: 10, left: 10 },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: true
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$285,000',
        trend: 'flat',
        trendValue: '+0.8%',
        status: 'orange'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$8.50',
        sublabel: '(75% value)',
        status: 'orange',
        trend: 'Below market rate'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Feb 15, 2025',
        sublabel: '75 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Jennifer Martinez',
        role: 'IT Director'
      },
      riskScore: {
        label: 'Risk Score',
        value: '4.5/10',
        status: 'orange',
        sublabel: 'Moderate usage decline'
      },
      growthScore: {
        label: 'Growth Score',
        value: '6.2/10',
        status: 'orange',
        sublabel: 'Limited expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+0.8%',
        status: 'orange',
        sparkData: [4, 4, 3, 4, 3, 4, 4],
        sublabel: 'Stagnant'
      },
      lastMonth: {
        label: 'Last Month',
        value: '-2.1%',
        status: 'red',
        sparkData: [4, 3, 3, 2, 3, 2, 2],
        sublabel: 'Declining'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Monthly Active Users',
      showReferenceLine: true,
      referenceLineLabel: 'Target Usage',
      referenceLineHeight: 15,
      data: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      chartContextLabel: 'Usage declining over past 6 months - needs attention',
      chartContextColor: 'text-orange-600',
      chartMin: 0,
      chartMax: 20,
      dataColors: { threshold: 10, belowColor: 'bg-orange-600', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'License Utilization',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      referenceLineHeight: 25,
      data: [8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      chartContextLabel: 'Low license utilization - opportunity for optimization',
      chartContextColor: 'text-yellow-600',
      chartMin: 0,
      chartMax: 30,
      dataColors: { threshold: 15, belowColor: 'bg-yellow-600', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Price Increase',
      confidence: 65,
      recommendedAction: 'Implement flat price increase strategy; Focus on value demonstration',
      keyReasons: [
        { category: 'Usage', detail: 'Declining usage over 6 months' },
        { category: 'Pricing', detail: 'Below market rate pricing' },
        { category: 'Engagement', detail: 'Limited executive engagement' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask about pricing strategy...',
    aiGreeting: "Hi Angela! TechFlow Industries is approaching renewal with declining usage and below-market pricing. We need to implement a price increase strategy while maintaining the relationship. Ready to discuss our approach?",
    conversationSeed: [
      {
        sender: 'ai',
        text: 'Hi Angela! TechFlow Industries is approaching renewal with declining usage and below-market pricing. We need to implement a price increase strategy while maintaining the relationship. Ready to discuss our approach?',
        type: 'buttons',
        buttons: [
          { label: 'Skip', value: 'skip', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Later', value: 'later', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Let\'s Review', value: 'review', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Let\'s Review'
      },
      {
        sender: 'ai',
        text: 'Based on their usage decline and below-market pricing, I recommend a conservative 5% price increase. This brings them closer to market rate while being respectful of their current challenges. What do you think?',
        type: 'buttons',
        buttons: [
          { label: 'Too High', value: 'high', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Perfect', value: 'perfect', 'label-background': '#10b981', 'label-text': '#ffffff' },
          { label: 'Too Low', value: 'low', 'label-background': '#f59e0b', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Perfect'
      },
      {
        sender: 'ai',
        text: 'Great! I\'ve prepared a renewal quote with the 5% increase. The new rate will be $8.93 per license, bringing their total to $299,250. Should I send this to Jennifer Martinez?',
      },
      {
        sender: 'user',
        text: 'Yes, send it with a note about the value we\'re providing'
      },
      {
        sender: 'ai',
        text: 'Perfect! I\'ve sent the quote with a personalized message highlighting our continued support and the value we provide. I\'ll follow up in a week to discuss their feedback.'
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
        id: 'price-increase-analysis',
        title: 'Price Increase Analysis',
        type: 'html',
        visible: true,
        htmlContent: `
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-lg">
              <h2 class="text-2xl font-bold mb-2">Price Increase Strategy</h2>
              <p class="text-orange-100">TechFlow Industries - Conservative Approach</p>
            </div>
            
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <h3 class="font-semibold text-gray-800 mb-3">Current Situation</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm text-gray-600">Current Rate</span>
                      <span class="font-medium">$8.50/license</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm text-gray-600">Market Rate</span>
                      <span class="font-medium">$11.20/license</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm text-gray-600">Usage Trend</span>
                      <span class="font-medium text-orange-600">Declining</span>
                    </div>
                  </div>
                </div>
                
                <div class="space-y-4">
                  <h3 class="font-semibold text-gray-800 mb-3">Proposed Changes</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span class="text-sm text-gray-600">New Rate</span>
                      <span class="font-medium text-green-600">$8.93/license</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span class="text-sm text-gray-600">Increase</span>
                      <span class="font-medium text-green-600">+5%</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span class="text-sm text-gray-600">New Total</span>
                      <span class="font-medium text-green-600">$299,250</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 class="font-semibold text-blue-800 mb-2">Strategy Rationale</h4>
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>• Conservative 5% increase respects current challenges</li>
                  <li>• Still 20% below market rate, maintaining value proposition</li>
                  <li>• Focus on relationship preservation over aggressive pricing</li>
                  <li>• Opportunity for future increases as usage improves</li>
                </ul>
              </div>
            </div>
          </div>
        `
      }
    ]
  }
};
