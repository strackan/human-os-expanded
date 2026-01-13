import { WorkflowConfig } from '../WorkflowConfig';

export const quoteArtifactConfig: WorkflowConfig = {
  customer: {
    name: 'Global Solutions Corp',
    nextCustomer: 'Enterprise Dynamics'
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
        value: '$1,200,000',
        trend: 'up',
        trendValue: '+22.5%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$15.00',
        sublabel: '(top 5% value)',
        status: 'green',
        trend: 'Premium enterprise customer'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'May 10, 2025',
        sublabel: '140 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Amanda Foster',
        role: 'Chief Technology Officer'
      },
      riskScore: {
        label: 'Risk Score',
        value: '1.5/10',
        status: 'green',
        sublabel: 'Exceptional health'
      },
      growthScore: {
        label: 'Growth Score',
        value: '9.1/10',
        status: 'green',
        sublabel: 'Maximum expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+22.5%',
        status: 'green',
        sparkData: [6, 7, 8, 9, 10, 12, 14],
        sublabel: 'Accelerating'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+4.8%',
        status: 'green',
        sparkData: [10, 11, 12, 13, 14, 15, 16],
        sublabel: 'Strong momentum'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Monthly Active Users',
      showReferenceLine: true,
      referenceLineLabel: 'Growth Target',
      referenceLineHeight: 25,
      data: [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62],
      chartContextLabel: 'Exceptional growth trajectory - premium customer',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 70,
      dataColors: { threshold: 30, belowColor: 'bg-yellow-600', aboveColor: 'bg-green-500' }
    },
    userLicenses: {
      title: 'License Utilization',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      referenceLineHeight: 50,
      data: [35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77],
      chartContextLabel: 'High utilization with significant expansion room',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 80,
      dataColors: { threshold: 40, belowColor: 'bg-yellow-600', aboveColor: 'bg-green-500' }
    },
    renewalInsights: {
      renewalStage: 'Quote Generation',
      confidence: 92,
      recommendedAction: 'Generate comprehensive renewal quote with expansion options',
      keyReasons: [
        { category: 'Performance', detail: 'Exceptional growth and utilization' },
        { category: 'Relationship', detail: 'Strong executive engagement' },
        { category: 'Expansion', detail: 'Maximum expansion potential identified' }
      ]
    }
  },
  chat: {
    placeholder: 'Generate renewal quote...',
    aiGreeting: "Hello Angela! Global Solutions Corp is our top-performing customer with exceptional growth and strong executive relationship. They're ready for a comprehensive renewal quote with expansion options. Shall we create their renewal proposal?",
    conversationSeed: [
      {
        sender: 'ai',
        text: 'Hello Angela! Global Solutions Corp is our top-performing customer with exceptional growth and strong executive relationship. They\'re ready for a comprehensive renewal quote with expansion options. Shall we create their renewal proposal?',
        type: 'buttons',
        buttons: [
          { label: 'Skip', value: 'skip', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Later', value: 'later', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Create Quote', value: 'quote', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Create Quote'
      },
      {
        sender: 'ai',
        text: 'Perfect! Based on their exceptional performance, I recommend a 8% renewal increase plus expansion options. This includes their current 80 licenses plus 20 additional licenses and premium support. Total value: $1,620,000. Should I generate the quote?',
        type: 'buttons',
        buttons: [
          { label: 'Adjust Pricing', value: 'adjust', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Generate Quote', value: 'generate', 'label-background': '#10b981', 'label-text': '#ffffff' },
          { label: 'Review Options', value: 'review', 'label-background': '#3b82f6', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Generate Quote'
      },
      {
        sender: 'ai',
        text: 'Excellent! I\'ve generated a comprehensive renewal quote with expansion options. The quote includes their base renewal at $1,296,000 (8% increase) plus expansion options totaling $324,000. Should I send this to Amanda Foster?',
      },
      {
        sender: 'user',
        text: 'Yes, send it with a personalized message'
      },
      {
        sender: 'ai',
        text: 'Perfect! I\'ve sent the comprehensive renewal quote to Amanda Foster with a personalized message highlighting their exceptional performance and the value of our continued partnership. The quote includes all expansion options and premium support benefits.'
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
        id: 'comprehensive-quote',
        title: 'Comprehensive Renewal Quote',
        type: 'html',
        visible: true,
        htmlContent: `
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
            <!-- Quote Header -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
              <div class="flex justify-between items-start">
                <div>
                  <div class="flex items-center space-x-3 mb-2">
                    <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <span class="text-blue-600 font-bold text-lg">R</span>
                    </div>
                    <span class="text-2xl font-bold">Renubu</span>
                  </div>
                  <p class="text-blue-100 text-sm">Enterprise Software Solutions</p>
                </div>
                <div class="text-right">
                  <h1 class="text-3xl font-bold mb-1">RENEWAL QUOTE</h1>
                  <p class="text-blue-100 text-sm">Q-2025-0925</p>
                  <p class="text-blue-100 text-xs mt-1">September 17, 2025</p>
                </div>
              </div>
            </div>

            <!-- Company and Customer Details -->
            <div class="p-6 border-b border-gray-100">
              <div class="grid grid-cols-2 gap-8">
                <!-- From Section -->
                <div>
                  <h3 class="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">From</h3>
                  <div class="space-y-1 text-sm">
                    <p class="font-medium">Renubu Technologies Inc.</p>
                    <p>1247 Innovation Drive, Suite 400</p>
                    <p>San Francisco, CA 94105</p>
                    <p>Email: renewals@renubu.com</p>
                  </div>
                </div>

                <!-- To Section -->
                <div>
                  <h3 class="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">To</h3>
                  <div class="space-y-1 text-sm">
                    <p class="font-medium">Amanda Foster, CTO</p>
                    <p>Global Solutions Corp</p>
                    <p>2500 Corporate Plaza Drive</p>
                    <p>Austin, TX 78746</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Line Items -->
            <div class="p-6">
              <h3 class="font-semibold text-gray-800 mb-4">Renewal & Expansion Details</h3>

              <div class="overflow-hidden rounded-lg border border-gray-200">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr>
                      <td class="px-4 py-2">
                        <div>
                          <p class="font-medium text-gray-900">Renubu Platform License (Renewal)</p>
                          <p class="text-sm text-gray-500">Enterprise workflow optimization platform</p>
                        </div>
                      </td>
                      <td class="px-4 py-2 text-center text-sm text-gray-900">80 licenses</td>
                      <td class="px-4 py-2 text-right text-sm text-gray-900">$16.20/license</td>
                      <td class="px-4 py-2 text-right text-sm font-medium text-gray-900">$1,296,000.00</td>
                    </tr>
                    <tr class="bg-green-50">
                      <td class="px-4 py-2">
                        <div>
                          <p class="font-medium text-gray-900">Renubu Platform License (Expansion)</p>
                          <p class="text-sm text-gray-500">Additional licenses for growing team</p>
                        </div>
                      </td>
                      <td class="px-4 py-2 text-center text-sm text-gray-900">20 licenses</td>
                      <td class="px-4 py-2 text-right text-sm text-gray-900">$15.00/license</td>
                      <td class="px-4 py-2 text-right text-sm font-medium text-gray-900">$300,000.00</td>
                    </tr>
                    <tr class="bg-blue-50">
                      <td class="px-4 py-2">
                        <div>
                          <p class="font-medium text-gray-900">Premium Support Tier</p>
                          <p class="text-sm text-gray-500">Dedicated support with 1-hour response time</p>
                        </div>
                      </td>
                      <td class="px-4 py-2 text-center text-sm text-gray-900">1 year</td>
                      <td class="px-4 py-2 text-right text-sm text-gray-900">$24,000.00</td>
                      <td class="px-4 py-2 text-right text-sm font-medium text-gray-900">$24,000.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Totals -->
              <div class="mt-6 flex justify-end">
                <div class="w-80">
                  <div class="border border-gray-200 rounded-lg bg-gray-50 p-4">
                    <div class="space-y-2">
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Base Renewal (8% increase):</span>
                        <span class="text-gray-900">$1,296,000.00</span>
                      </div>
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Expansion Licenses:</span>
                        <span class="text-gray-900">$300,000.00</span>
                      </div>
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Premium Support:</span>
                        <span class="text-gray-900">$24,000.00</span>
                      </div>
                      <div class="border-t border-gray-300 pt-2">
                        <div class="flex justify-between text-lg font-bold">
                          <span class="text-gray-900">Total Investment:</span>
                          <span class="text-blue-600">$1,620,000.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Terms -->
            <div class="px-6 pb-6">
              <div>
                <h4 class="font-semibold text-gray-800 mb-3">Terms & Conditions</h4>
                <div class="text-sm text-gray-600 space-y-1">
                  <p>• Renewal effective May 10, 2025</p>
                  <p>• 8% annual increase per contract terms (Section 4.2)</p>
                  <p>• Expansion licenses available immediately upon renewal</p>
                  <p>• Premium support includes dedicated account manager</p>
                  <p>• Payment due within 30 days of renewal date</p>
                </div>
              </div>
            </div>

            <!-- Signature Section -->
            <div class="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
              <div class="grid grid-cols-2 gap-8">
                <div>
                  <p class="text-sm text-gray-600 mb-4">Please sign and return this quote to proceed:</p>
                  <div class="border-b border-gray-400 w-64 mb-2"></div>
                  <p class="text-xs text-gray-500">Customer Signature</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 mb-4">Date:</p>
                  <div class="border-b border-gray-400 w-32 mb-2"></div>
                  <p class="text-xs text-gray-500">Date</p>
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-gray-200">
                <p class="text-xs text-gray-500 text-center">
                  Thank you for your continued partnership with Renubu. We look forward to supporting Global Solutions Corp's continued success and growth.
                </p>
              </div>
            </div>
          </div>
        `
      }
    ]
  }
};
