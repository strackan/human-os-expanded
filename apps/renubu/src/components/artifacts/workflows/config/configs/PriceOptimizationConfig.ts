import { WorkflowConfig } from '../WorkflowConfig';

export const priceOptimizationConfig: WorkflowConfig = {
  customer: {
    name: 'TechFlow Industries',
    nextCustomer: 'Strategic Partners Inc'
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
      chartContextLabel: 'Usage declining over past 6 months - pricing optimization needed',
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
      chartContextLabel: 'Low license utilization - opportunity for pricing optimization',
      chartContextColor: 'text-yellow-600',
      chartMin: 0,
      chartMax: 30,
      dataColors: { threshold: 15, belowColor: 'bg-yellow-600', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Price Optimization',
      confidence: 70,
      recommendedAction: 'Implement dynamic pricing strategy; Focus on value-based pricing model',
      keyReasons: [
        { category: 'Pricing', detail: 'Current pricing 25% below market rate' },
        { category: 'Usage', detail: 'Declining usage indicates pricing misalignment' },
        { category: 'Value', detail: 'Need to demonstrate value proposition' }
      ]
    }
  },
  chat: {
    placeholder: 'Optimize pricing strategy...',
    aiGreeting: "Hi Angela! TechFlow Industries is showing declining usage and their pricing is 25% below market rate. This is a critical opportunity for price optimization to align pricing with value delivered. Ready to analyze their pricing strategy?",
    conversationSeed: [
      {
        sender: 'ai',
        text: 'Hi Angela! TechFlow Industries is showing declining usage and their pricing is 25% below market rate. This is a critical opportunity for price optimization to align pricing with value delivered. Ready to analyze their pricing strategy?',
        type: 'buttons',
        buttons: [
          { label: 'Skip', value: 'skip', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Later', value: 'later', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Analyze Pricing', value: 'analyze', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Analyze Pricing'
      },
      {
        sender: 'ai',
        text: 'Perfect! I\'ve analyzed their pricing structure and identified several optimization opportunities. Their current $8.50 rate is significantly below the $11.20 market average. I recommend a value-based pricing model that aligns with their actual usage patterns. What approach should we take?',
        type: 'buttons',
        buttons: [
          { label: 'Gradual Increase', value: 'gradual', 'label-background': '#3b82f6', 'label-text': '#ffffff' },
          { label: 'Value-Based Pricing', value: 'value', 'label-background': '#8b5cf6', 'label-text': '#ffffff' },
          { label: 'Usage-Based Model', value: 'usage', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Value-Based Pricing'
      },
      {
        sender: 'ai',
        text: 'Excellent choice! Value-based pricing will help align their costs with the value they receive. I propose a tiered structure: $10.50 for basic usage, $12.50 for standard usage, and $15.00 for premium usage. This could increase their ARR by 35-40% while providing better value alignment.',
      },
      {
        sender: 'user',
        text: 'What about the usage decline?'
      },
      {
        sender: 'ai',
        text: 'The usage decline is actually a key indicator that their current pricing doesn\'t reflect the value they\'re getting. With value-based pricing, we can provide better support and features that justify the higher rates, potentially reversing the usage decline.',
      },
      {
        sender: 'user',
        text: 'Let\'s create a pricing optimization proposal'
      },
      {
        sender: 'ai',
        text: 'Perfect! I\'ve created a comprehensive pricing optimization proposal that includes the new value-based pricing structure, usage analytics, and value demonstration plan. This could increase their contract value by $100,000 annually while improving their ROI.'
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
        id: 'pricing-optimization-analysis',
        title: 'Pricing Optimization Analysis',
        type: 'html',
        visible: true,
        htmlContent: `
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-lg">
              <h2 class="text-2xl font-bold mb-2">Pricing Optimization Analysis</h2>
              <p class="text-orange-100">TechFlow Industries - Value-Based Pricing Strategy</p>
            </div>
            
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="space-y-4">
                  <h3 class="font-semibold text-gray-800 mb-3">Current Pricing Analysis</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm text-gray-600">Current Rate</span>
                      <span class="font-medium">$8.50/license</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm text-gray-600">Market Average</span>
                      <span class="font-medium">$11.20/license</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm text-gray-600">Price Gap</span>
                      <span class="font-medium text-orange-600">-24%</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm text-gray-600">Usage Trend</span>
                      <span class="font-medium text-red-600">Declining</span>
                    </div>
                  </div>
                </div>
                
                <div class="space-y-4">
                  <h3 class="font-semibold text-gray-800 mb-3">Optimized Pricing Structure</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span class="text-sm text-gray-600">Basic Tier</span>
                      <span class="font-medium text-green-600">$10.50/license</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span class="text-sm text-gray-600">Standard Tier</span>
                      <span class="font-medium text-blue-600">$12.50/license</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span class="text-sm text-gray-600">Premium Tier</span>
                      <span class="font-medium text-purple-600">$15.00/license</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span class="text-sm text-gray-600">Expected ARR</span>
                      <span class="font-medium text-green-600">$385,000</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="space-y-4">
                <h3 class="font-semibold text-gray-800">Pricing Optimization Strategy</h3>
                
                <div class="space-y-3">
                  <div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-blue-800">Value-Based Pricing Model</h4>
                      <p class="text-sm text-blue-700">Align pricing with actual value delivered through tiered structure based on usage patterns and feature requirements.</p>
                      <p class="text-xs text-blue-600 font-medium">Impact: +35% ARR increase</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-green-800">Usage Analytics Integration</h4>
                      <p class="text-sm text-green-700">Implement usage tracking to demonstrate value and optimize pricing based on actual consumption patterns.</p>
                      <p class="text-xs text-green-600 font-medium">Impact: +15% usage improvement</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div class="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-purple-800">Value Demonstration Program</h4>
                      <p class="text-sm text-purple-700">Create comprehensive value demonstration program to justify pricing increases and improve customer satisfaction.</p>
                      <p class="text-xs text-purple-600 font-medium">Impact: +25% customer satisfaction</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-6 p-4 bg-orange-50 rounded-lg">
                <h4 class="font-semibold text-orange-800 mb-2">Financial Impact Projection</h4>
                <div class="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p class="text-2xl font-bold text-orange-600">$285K</p>
                    <p class="text-xs text-orange-700">Current ARR</p>
                  </div>
                  <div>
                    <p class="text-2xl font-bold text-orange-600">$385K</p>
                    <p class="text-xs text-orange-700">Optimized ARR</p>
                  </div>
                </div>
                <p class="text-sm text-orange-700 text-center mt-2">Total Increase: $100K (35% growth)</p>
              </div>
              
              <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-2">Implementation Plan</h4>
                <ul class="text-sm text-gray-700 space-y-1">
                  <li>• Month 1: Present pricing optimization proposal to Jennifer Martinez</li>
                  <li>• Month 2: Implement usage analytics and value tracking</li>
                  <li>• Month 3: Launch value demonstration program</li>
                  <li>• Month 4: Execute pricing transition with customer support</li>
                </ul>
              </div>
            </div>
          </div>
        `
      }
    ]
  }
};
