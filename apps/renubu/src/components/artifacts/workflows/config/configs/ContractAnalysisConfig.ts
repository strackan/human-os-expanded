import { WorkflowConfig } from '../WorkflowConfig';

export const contractAnalysisConfig: WorkflowConfig = {
  customer: {
    name: 'Enterprise Dynamics',
    nextCustomer: 'Innovation Labs'
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
        value: '$950,000',
        trend: 'up',
        trendValue: '+18.7%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$11.50',
        sublabel: '(85% value)',
        status: 'green',
        trend: 'Above market average'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Jun 5, 2025',
        sublabel: '165 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Robert Chen',
        role: 'VP Engineering'
      },
      riskScore: {
        label: 'Risk Score',
        value: '2.8/10',
        status: 'green',
        sublabel: 'Very good health'
      },
      growthScore: {
        label: 'Growth Score',
        value: '8.2/10',
        status: 'green',
        sublabel: 'Strong expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+18.7%',
        status: 'green',
        sparkData: [7, 8, 9, 10, 11, 12, 14],
        sublabel: 'Consistent growth'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+2.8%',
        status: 'green',
        sparkData: [12, 13, 13, 14, 14, 15, 16],
        sublabel: 'Steady growth'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Monthly Active Users',
      showReferenceLine: true,
      referenceLineLabel: 'Growth Target',
      referenceLineHeight: 18,
      data: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
      chartContextLabel: 'Strong growth trajectory with consistent usage patterns',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 45,
      dataColors: { threshold: 20, belowColor: 'bg-yellow-600', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'License Utilization',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      referenceLineHeight: 35,
      data: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51],
      chartContextLabel: 'High utilization with room for strategic expansion',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 60,
      dataColors: { threshold: 35, belowColor: 'bg-yellow-600', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Contract Analysis',
      confidence: 78,
      recommendedAction: 'Conduct detailed contract analysis; Identify optimization opportunities',
      keyReasons: [
        { category: 'Performance', detail: 'Strong growth and utilization metrics' },
        { category: 'Contract', detail: 'Complex multi-year agreement with optimization potential' },
        { category: 'Expansion', detail: 'High utilization indicates expansion readiness' }
      ]
    }
  },
  chat: {
    placeholder: 'Analyze contract terms...',
    aiGreeting: "Good afternoon, Angela! Enterprise Dynamics has a complex multi-year contract with strong performance metrics. This is an ideal opportunity for contract analysis and optimization. Shall we dive into their contract details?",
    conversationSeed: [
      {
        sender: 'ai',
        text: 'Good afternoon, Angela! Enterprise Dynamics has a complex multi-year contract with strong performance metrics. This is an ideal opportunity for contract analysis and optimization. Shall we dive into their contract details?',
        type: 'buttons',
        buttons: [
          { label: 'Skip', value: 'skip', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Later', value: 'later', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Analyze Contract', value: 'analyze', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Analyze Contract'
      },
      {
        sender: 'ai',
        text: 'Perfect! I\'ve analyzed their contract and found several optimization opportunities. Their current agreement has a 3-year term with auto-renewal, but there are clauses that could be improved. What would you like to focus on first?',
        type: 'buttons',
        buttons: [
          { label: 'Pricing Terms', value: 'pricing', 'label-background': '#3b82f6', 'label-text': '#ffffff' },
          { label: 'Renewal Clauses', value: 'renewal', 'label-background': '#8b5cf6', 'label-text': '#ffffff' },
          { label: 'Expansion Terms', value: 'expansion', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Pricing Terms'
      },
      {
        sender: 'ai',
        text: 'Great choice! Their current pricing structure has some inefficiencies. They have a tiered pricing model that doesn\'t reflect their actual usage patterns. I recommend restructuring to a volume-based pricing model that better aligns with their growth trajectory. This could increase their ARR by 12-15%.',
      },
      {
        sender: 'user',
        text: 'What about the renewal clauses?'
      },
      {
        sender: 'ai',
        text: 'The renewal clauses are actually quite favorable. They have a 90-day notice period and automatic renewal with 5% annual increases. However, we could negotiate better terms for expansion licenses and add a growth incentive clause that rewards their consistent performance.',
      },
      {
        sender: 'user',
        text: 'Let\'s prepare a contract optimization proposal'
      },
      {
        sender: 'ai',
        text: 'Excellent! I\'ve prepared a comprehensive contract optimization proposal that includes the new pricing structure, improved expansion terms, and growth incentives. This could increase their total contract value by $150,000 annually while strengthening our partnership.'
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
        id: 'contract-analysis-report',
        title: 'Contract Analysis Report',
        type: 'html',
        visible: true,
        htmlContent: `
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-lg">
              <h2 class="text-2xl font-bold mb-2">Contract Analysis Report</h2>
              <p class="text-purple-100">Enterprise Dynamics - Optimization Opportunities</p>
            </div>
            
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="space-y-4">
                  <h3 class="font-semibold text-gray-800 mb-3">Current Contract Status</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm text-gray-600">Contract Term</span>
                      <span class="font-medium">3 years (auto-renewal)</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm text-gray-600">Notice Period</span>
                      <span class="font-medium">90 days</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm text-gray-600">Annual Increase</span>
                      <span class="font-medium">5% fixed</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm text-gray-600">Expansion Terms</span>
                      <span class="font-medium">Standard rates</span>
                    </div>
                  </div>
                </div>
                
                <div class="space-y-4">
                  <h3 class="font-semibold text-gray-800 mb-3">Optimization Opportunities</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span class="text-sm text-gray-600">Pricing Model</span>
                      <span class="font-medium text-green-600">Volume-based</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span class="text-sm text-gray-600">Growth Incentives</span>
                      <span class="font-medium text-green-600">Performance-based</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span class="text-sm text-gray-600">Expansion Terms</span>
                      <span class="font-medium text-green-600">Preferred rates</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span class="text-sm text-gray-600">Support Tier</span>
                      <span class="font-medium text-green-600">Premium included</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="space-y-4">
                <h3 class="font-semibold text-gray-800">Key Findings & Recommendations</h3>
                
                <div class="space-y-3">
                  <div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-blue-800">Pricing Structure Optimization</h4>
                      <p class="text-sm text-blue-700">Current tiered pricing doesn\'t reflect actual usage patterns. Recommend volume-based pricing that rewards their consistent growth.</p>
                      <p class="text-xs text-blue-600 font-medium">Potential Impact: +12-15% ARR increase</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-green-800">Growth Incentive Program</h4>
                      <p class="text-sm text-green-700">Add performance-based incentives that reward their 18.7% YoY growth with better expansion terms and support benefits.</p>
                      <p class="text-xs text-green-600 font-medium">Potential Impact: +$75,000 annual value</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div class="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-purple-800">Expansion Terms Enhancement</h4>
                      <p class="text-sm text-purple-700">Negotiate preferred rates for additional licenses and include premium support tier in base contract.</p>
                      <p class="text-xs text-purple-600 font-medium">Potential Impact: +$50,000 annual value</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-6 p-4 bg-purple-50 rounded-lg">
                <h4 class="font-semibold text-purple-800 mb-2">Total Optimization Potential</h4>
                <p class="text-2xl font-bold text-purple-600">$150,000 - $200,000</p>
                <p class="text-sm text-purple-700">15-20% contract value increase with improved terms</p>
              </div>
              
              <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-2">Next Steps</h4>
                <ul class="text-sm text-gray-700 space-y-1">
                  <li>• Schedule contract review meeting with Robert Chen</li>
                  <li>• Present optimization proposal with ROI analysis</li>
                  <li>• Negotiate new terms for next renewal cycle</li>
                  <li>• Implement growth incentive program</li>
                </ul>
              </div>
            </div>
          </div>
        `
      }
    ]
  }
};
