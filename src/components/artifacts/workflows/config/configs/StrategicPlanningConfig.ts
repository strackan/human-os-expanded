import { WorkflowConfig } from '../WorkflowConfig';

export const strategicPlanningConfig: WorkflowConfig = {
  customer: {
    name: 'Innovation Labs',
    nextCustomer: 'TechFlow Industries'
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
        value: '$650,000',
        trend: 'up',
        trendValue: '+25.3%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$13.50',
        sublabel: '(90% value)',
        status: 'green',
        trend: 'Above market average'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Jul 15, 2025',
        sublabel: '200 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Lisa Thompson',
        role: 'Chief Innovation Officer'
      },
      riskScore: {
        label: 'Risk Score',
        value: '1.9/10',
        status: 'green',
        sublabel: 'Excellent health'
      },
      growthScore: {
        label: 'Growth Score',
        value: '9.3/10',
        status: 'green',
        sublabel: 'Maximum expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+25.3%',
        status: 'green',
        sparkData: [8, 9, 10, 12, 14, 16, 18],
        sublabel: 'Accelerating growth'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+5.2%',
        status: 'green',
        sparkData: [15, 16, 17, 18, 19, 20, 21],
        sublabel: 'Strong momentum'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Monthly Active Users',
      showReferenceLine: true,
      referenceLineLabel: 'Growth Target',
      referenceLineHeight: 22,
      data: [22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64],
      chartContextLabel: 'Exceptional growth trajectory - strategic planning opportunity',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 70,
      dataColors: { threshold: 25, belowColor: 'bg-yellow-600', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'License Utilization',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      referenceLineHeight: 40,
      data: [35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77],
      chartContextLabel: 'High utilization with significant expansion potential',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 80,
      dataColors: { threshold: 40, belowColor: 'bg-yellow-600', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Strategic Planning',
      confidence: 88,
      recommendedAction: 'Develop comprehensive strategic plan; Focus on long-term partnership',
      keyReasons: [
        { category: 'Growth', detail: 'Exceptional 25.3% YoY growth trajectory' },
        { category: 'Innovation', detail: 'Strong focus on innovation and technology adoption' },
        { category: 'Partnership', detail: 'Ideal candidate for strategic partnership' }
      ]
    }
  },
  chat: {
    placeholder: 'Plan strategic initiatives...',
    aiGreeting: "Hello Angela! Innovation Labs is showing exceptional growth with 25.3% YoY increase and strong innovation focus. This is a perfect opportunity for strategic planning and long-term partnership development. Ready to create their strategic roadmap?",
    conversationSeed: [
      {
        sender: 'ai',
        text: 'Hello Angela! Innovation Labs is showing exceptional growth with 25.3% YoY increase and strong innovation focus. This is a perfect opportunity for strategic planning and long-term partnership development. Ready to create their strategic roadmap?',
        type: 'buttons',
        buttons: [
          { label: 'Skip', value: 'skip', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Later', value: 'later', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Create Roadmap', value: 'roadmap', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Create Roadmap'
      },
      {
        sender: 'ai',
        text: 'Excellent! Based on their innovation focus and exceptional growth, I recommend a 3-year strategic partnership plan. This includes product co-development, market expansion, and joint innovation initiatives. What\'s your priority?',
        type: 'buttons',
        buttons: [
          { label: 'Product Co-Development', value: 'product', 'label-background': '#3b82f6', 'label-text': '#ffffff' },
          { label: 'Market Expansion', value: 'market', 'label-background': '#8b5cf6', 'label-text': '#ffffff' },
          { label: 'Innovation Partnership', value: 'innovation', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Innovation Partnership'
      },
      {
        sender: 'ai',
        text: 'Perfect choice! Innovation Labs is ideal for a strategic innovation partnership. I propose establishing a joint innovation lab, co-developing new features, and creating a technology advisory board. This could increase their contract value by 40-50% over 3 years.',
      },
      {
        sender: 'user',
        text: 'What about the financial impact?'
      },
      {
        sender: 'ai',
        text: 'The financial impact is substantial. Year 1: $650K base + $200K innovation partnership = $850K. Year 2: $780K base + $300K co-development = $1.08M. Year 3: $950K base + $400K market expansion = $1.35M. Total 3-year value: $3.28M.',
      },
      {
        sender: 'user',
        text: 'Let\'s schedule a strategic planning session'
      },
      {
        sender: 'ai',
        text: 'Excellent! I\'ve scheduled a strategic planning session with Lisa Thompson for next Friday. I\'ll prepare a comprehensive proposal including the innovation partnership framework, financial projections, and implementation timeline.'
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
        id: 'strategic-planning-roadmap',
        title: 'Strategic Planning Roadmap',
        type: 'html',
        visible: true,
        htmlContent: `
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-t-lg">
              <h2 class="text-2xl font-bold mb-2">Strategic Planning Roadmap</h2>
              <p class="text-indigo-100">Innovation Labs - 3-Year Partnership Vision</p>
            </div>
            
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                  <h3 class="font-semibold text-blue-800 mb-2">Year 1: Foundation</h3>
                  <p class="text-sm text-blue-700">Establish innovation partnership</p>
                  <div class="mt-2 text-xs text-blue-600">
                    <p>• Joint innovation lab setup</p>
                    <p>• Technology advisory board</p>
                    <p>• Co-development framework</p>
                  </div>
                  <p class="text-xs text-blue-600 font-medium mt-2">Target: $850K ARR</p>
                </div>
                
                <div class="bg-purple-50 p-4 rounded-lg">
                  <h3 class="font-semibold text-purple-800 mb-2">Year 2: Expansion</h3>
                  <p class="text-sm text-purple-700">Scale co-development initiatives</p>
                  <div class="mt-2 text-xs text-purple-600">
                    <p>• Advanced feature co-development</p>
                    <p>• Market research collaboration</p>
                    <p>• Customer success programs</p>
                  </div>
                  <p class="text-xs text-purple-600 font-medium mt-2">Target: $1.08M ARR</p>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg">
                  <h3 class="font-semibold text-green-800 mb-2">Year 3: Leadership</h3>
                  <p class="text-sm text-green-700">Market leadership position</p>
                  <div class="mt-2 text-xs text-green-600">
                    <p>• Industry thought leadership</p>
                    <p>• Global market expansion</p>
                    <p>• Strategic acquisitions</p>
                  </div>
                  <p class="text-xs text-green-600 font-medium mt-2">Target: $1.35M ARR</p>
                </div>
              </div>
              
              <div class="space-y-4">
                <h3 class="font-semibold text-gray-800">Strategic Initiatives</h3>
                
                <div class="space-y-3">
                  <div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-blue-800">Joint Innovation Lab</h4>
                      <p class="text-sm text-blue-700">Establish dedicated innovation space for co-developing next-generation features and solutions.</p>
                      <p class="text-xs text-blue-600 font-medium">Investment: $150K annually | ROI: 300%</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div class="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-purple-800">Technology Advisory Board</h4>
                      <p class="text-sm text-purple-700">Create advisory board with Innovation Labs leadership to guide product roadmap and strategic decisions.</p>
                      <p class="text-xs text-purple-600 font-medium">Investment: $75K annually | ROI: 250%</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 class="font-medium text-green-800">Market Expansion Program</h4>
                      <p class="text-sm text-green-700">Leverage Innovation Labs\' network for market expansion and customer acquisition in new verticals.</p>
                      <p class="text-xs text-green-600 font-medium">Investment: $200K annually | ROI: 400%</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-6 p-4 bg-indigo-50 rounded-lg">
                <h4 class="font-semibold text-indigo-800 mb-2">3-Year Financial Projection</h4>
                <div class="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p class="text-2xl font-bold text-indigo-600">$850K</p>
                    <p class="text-xs text-indigo-700">Year 1 ARR</p>
                  </div>
                  <div>
                    <p class="text-2xl font-bold text-indigo-600">$1.08M</p>
                    <p class="text-xs text-indigo-700">Year 2 ARR</p>
                  </div>
                  <div>
                    <p class="text-2xl font-bold text-indigo-600">$1.35M</p>
                    <p class="text-xs text-indigo-700">Year 3 ARR</p>
                  </div>
                </div>
                <p class="text-sm text-indigo-700 text-center mt-2">Total 3-Year Value: $3.28M (107% growth)</p>
              </div>
              
              <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-2">Implementation Timeline</h4>
                <ul class="text-sm text-gray-700 space-y-1">
                  <li>• Month 1-2: Strategic planning session and partnership agreement</li>
                  <li>• Month 3-4: Innovation lab setup and advisory board formation</li>
                  <li>• Month 5-6: First co-development project launch</li>
                  <li>• Month 7-12: Scale initiatives and measure success metrics</li>
                </ul>
              </div>
            </div>
          </div>
        `
      }
    ]
  }
};
