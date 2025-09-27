import { WorkflowConfig } from '../WorkflowConfig';

export const bluebirdMemorialPlanningConfig: WorkflowConfig = {
  customer: {
    name: 'Bluebird Memorial Hospital',
    nextCustomer: 'Medifarm'
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
        value: '$124,500',
        trend: 'flat',
        trendValue: '+1.2%',
      },
      licenseUnitPrice: {
        label: 'Cost Per License',
        value: '$150',
        sublabel: '(88% value)',
        status: 'orange',
        trend: 'Pays comparably less per unit than 88% of customers'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Jan 18, 2026',
        sublabel: '95 days',
        status: 'green'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Joe Devine',
        role: 'CTO'
      },
      riskScore: {
        label: 'Risk Score',
        value: '6.2/10',
        status: 'orange',
        sublabel: 'Stagnant usage in first year; No executive contact in 90+ days'
      },
      growthScore: {
        label: 'Opportunity Score',
        value: '5.8/10',
        status: 'orange',
        sublabel: '24 open roles on LinkedIn; Strong champion engagement'
      },
      yoyGrowth: '{{chart.yoyGrowth.flat}}',
      lastMonth: '{{chart.lastMonth.flat}}'
    }
  },
  analytics: {
    usageTrend: '{{chart.usageTrend.falling}}',
    userLicenses: '{{chart.userLicenses.falling}}',
    renewalInsights: {
      renewalStage: 'Planning',
      confidence: 72,
      recommendedAction: 'Send Flat Renewal; Coordinate executive outreach; Execute Strategic Annual Engagement Plan',
      keyReasons: [
        { category: 'Adoption', detail: 'Stagnant usage in first year' },
        { category: 'Executive Engagement', detail: 'No contact in 90+ days' },
        { category: 'Sentiment', detail: 'Recent support comments suggest product frustration' }
      ]
    }
  },
  chat: {
    placeholder: 'Feel free to ask any questions here...',
    aiGreeting: "Good morning, {{user.first}}! {{customer.name}}'s 90-day autorenewal is next week. Their YoY growth is {{chart.yoyGrowth.flat.trendValue}} and usage trend shows {{chart.usageTrend.falling.chartContextLabel}}. It's time to prepare our strategy and deliver the renewal notification. Shall we get started?",
    conversationSeed: [
      {
        sender: 'ai',
        text: 'Good morning, {{user.first}}! {{customer.name}}\'s 90-day autorenewal is next week. Their YoY growth is {{chart.yoyGrowth.flat.trendValue}} and usage trend shows {{chart.usageTrend.falling.chartContextLabel}}. It\'s time to prepare our strategy and deliver the renewal notification. Shall we get started?',
        type: 'buttons',
        buttons: [
          { label: 'Skip', value: 'skip', 'label-background': '#ef4444', 'label-text': '#ffffff' },
          { label: 'Snooze', value: 'different', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
          { label: 'Let\s Do It!', value: 'proceed', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Let\'s Do It!'
      },
      {
        sender: 'ai',
        text: 'Perfect. Given {{customer.name}}\'s above-average ARR and current risk factors, I recommend a conservative strategy with little to no increase. How shall we proceed?',
        type: 'buttons',
        buttons: [
          { label: 'Other', value: 'no', 'label-background': '#7c7c7c', 'label-text': '#ffffff' },
          { label: 'Conservative', value: 'yes', 'label-background': '#10b981', 'label-text': '#ffffff' }
        ]
      },
      {
        sender: 'user',
        text: 'Conservative'
      },
      {
        sender: 'ai',
        text: 'Great, we\'ll proceed with the conservative strategy.',
      },
      {
        sender: 'ai',
        text: 'Checking contract for business impact...',
      },
      {
        sender: 'ai',
        text: 'The contract has language that does not allow price increases above 2% unless approved in writing. I recommend proceeding with a 2% price increase, as amending the contract increases risk significantly. Would you like to proceed with 2%, or enter a different percentage?',
      },
      {
        sender: 'user',
        text: '2%'
      },
      {
        sender: 'ai',
        text: 'Noted. I\'ve created an editable quote in a new window reflecting the updated pricing. Please review it, make any changes, and let me know when you\'e ready to send.',
      },
      {
        sender: 'user',
        text: 'This looks good. Can you send it to Joe Devine and cc me?'
      },
      {
        sender: 'ai',
        text: 'On it!'
      },
      {
        sender: 'ai',
        text: 'Okay, I\'ve sent it to Joe Devine and cc\'d you using your standard email template. I\'ll check in next week to see how it went and we can set our next steps to reduce risk with this account prior to renewal.',
      },
      {
        sender: 'user',
        text: 'Thank you!'
      },
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
        id: 'renewal-quote',
        title: 'Renewal Quote',
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
                  <p class="text-blue-100 text-sm">Q-2025-0924</p>
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
                    <p class="font-medium">Joe Devine, CTO</p>
                    <p>Bluebird Memorial Hospital</p>
                    <p>1542 Medical Center Drive</p>
                    <p>Portland, OR 97205</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Line Items -->
            <div class="p-6">
              <h3 class="font-semibold text-gray-800 mb-4">Renewal Details</h3>

              <div class="overflow-hidden rounded-lg border border-gray-200">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Rate</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr>
                      <td class="px-4 py-2">
                        <div>
                          <p class="font-medium text-gray-900">Renubu Platform License</p>
                          <p class="text-sm text-gray-500">Healthcare workflow optimization platform</p>
                        </div>
                      </td>
                      <td class="px-4 py-2 text-center text-sm text-gray-900">12 months</td>
                      <td class="px-4 py-2 text-right text-sm text-gray-900">$150.00/license</td>
                      <td class="px-4 py-2 text-right text-sm font-medium text-gray-900">$124,500.00</td>
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
                        <span class="text-gray-600">Current Year Total:</span>
                        <span class="text-gray-900">$124,500.00</span>
                      </div>
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-600">2% Annual Increase:</span>
                        <span class="text-gray-900">$2,490.00</span>
                      </div>
                      <div class="border-t border-gray-300 pt-2">
                        <div class="flex justify-between text-lg font-bold">
                          <span class="text-gray-900">Renewal Total:</span>
                          <span class="text-blue-600">$126,990.00</span>
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
                  <p>• Renewal effective January 18, 2026</p>
                  <p>• 2% annual increase per contract terms (Section 4.2)</p>
                  <p>• Payment due within 30 days of renewal date</p>
                  <p>• This renewal is bound by the existing License Agreement</p>
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
                  Thank you for your continued partnership with Renubu. We look forward to supporting Bluebird Memorial Hospital's continued success.
                </p>
              </div>
            </div>
          </div>
        `
      }
    ]
  }
};