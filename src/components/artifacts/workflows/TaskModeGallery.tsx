import React, { useState } from 'react';
import WorkflowWrapper from './WorkflowWrapper';
import { acmeCorpConfig, intrasoftConfig } from './config/configs';

type WorkflowVariant = 'acme' | 'intrasoft' | null;

const TaskModeGallery = () => {
  const [selectedVariant, setSelectedVariant] = useState<WorkflowVariant>(null);

  const variants = [
    {
      id: 'acme' as const,
      name: 'Acme Corp',
      description: 'Early renewal outreach for growing customer',
      config: acmeCorpConfig,
      color: 'blue',
      conversationSeed: [
        {
          sender: 'ai' as const,
          text: 'Hi, Justin! It appears AcmeCorp\'s usage has increased significantly over the past 4 weeks. Reaching out proactively to engaged customers can increase renewal rates and likelihood of multi-year extensions. Because their renewal is over 120 days away, I recommend an Early Outreach strategy. Shall we proceed, snooze for now, or skip?',
          type: 'buttons' as const,
          buttons: [
            { label: 'Skip', value: 'skip', 'label-background': '#ef4444', 'label-text': '#ffffff' },
            { label: 'Snooze', value: 'snooze', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
            { label: 'Proceed', value: 'proceed', 'label-background': '#10b981', 'label-text': '#ffffff' }
          ]
        }
      ],
      metrics: {
        arr: '$485K',
        growth: '+18.2%',
        risk: 'Low',
        stage: 'Planning'
      }
    },
    {
      id: 'intrasoft' as const,
      name: 'Intrasoft Solutions',
      description: 'Enterprise upsell for high-performing account',
      config: intrasoftConfig,
      color: 'green',
      conversationSeed: [
        {
          sender: 'ai' as const,
          text: 'Excellent news! Intrasoft Solutions has exceeded their usage limits by 67% and added 15 developers this quarter. Their NPS score is 9.2/10. With renewal coming up in 45 days, this is the perfect time for a multi-year enterprise upsell. Shall we prepare the proposal?',
          type: 'buttons' as const,
          buttons: [
            { label: 'Not Yet', value: 'wait', 'label-background': '#f59e0b', 'label-text': '#ffffff' },
            { label: 'Yes, Prepare Proposal', value: 'prepare', 'label-background': '#10b981', 'label-text': '#ffffff' }
          ]
        }
      ],
      metrics: {
        arr: '$1.25M',
        growth: '+42.7%',
        risk: 'Very Low',
        stage: 'Negotiation'
      }
    }
  ];

  if (selectedVariant) {
    const variant = variants.find(v => v.id === selectedVariant);
    if (variant) {
      return (
        <div className="relative">
          <button
            onClick={() => setSelectedVariant(null)}
            className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-gray-50"
          >
            ← Back to Gallery
          </button>
          <WorkflowWrapper
            config={variant.config}
            conversationSeed={variant.conversationSeed}
            startingWith="ai"
            artifactVisible={true}
          />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Task Mode Gallery</h1>
          <p className="text-xl text-gray-600">
            Interactive demos showcasing different customer scenarios and workflows
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
              onClick={() => setSelectedVariant(variant.id)}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${
                variant.color === 'blue'
                  ? 'from-blue-500 to-blue-600'
                  : 'from-green-500 to-green-600'
              } p-6 text-white`}>
                <h3 className="text-2xl font-bold mb-2">{variant.name}</h3>
                <p className="text-blue-100 opacity-90">{variant.description}</p>
              </div>

              {/* Metrics Grid */}
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{variant.metrics.arr}</div>
                  <div className="text-sm text-gray-500">ARR</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{variant.metrics.growth}</div>
                  <div className="text-sm text-gray-500">YoY Growth</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-700">{variant.metrics.risk}</div>
                  <div className="text-sm text-gray-500">Risk Level</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-700">{variant.metrics.stage}</div>
                  <div className="text-sm text-gray-500">Stage</div>
                </div>
              </div>

              {/* Preview Features */}
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Features:</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Customer Metrics
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Analytics Dashboard
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      AI Chat
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      Smart Artifacts
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    variant.color === 'blue'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  } group-hover:shadow-md`}>
                    Launch Demo →
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = `/standalone-viewer?config=${variant.id}`;
                      window.open(url, '_blank', 'width=1400,height=900');
                    }}
                    className="w-full py-2 px-4 rounded-lg font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                  >
                    Open in New Tab ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How to Create New Iterations */}
        <div className="mt-16 bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Creating New Iterations</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-gray-700">1. Create Config</div>
              <code className="block bg-gray-100 p-2 rounded text-xs">
                /config/configs/NewCustomerConfig.ts
              </code>
              <p className="text-gray-600">Define customer data, metrics, and content</p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-gray-700">2. Create Component</div>
              <code className="block bg-gray-100 p-2 rounded text-xs">
                TaskModeNewCustomer.tsx
              </code>
              <p className="text-gray-600">Import config and customize conversation</p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-gray-700">3. Add to Gallery</div>
              <code className="block bg-gray-100 p-2 rounded text-xs">
                variants array
              </code>
              <p className="text-gray-600">Register in gallery for easy access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModeGallery;