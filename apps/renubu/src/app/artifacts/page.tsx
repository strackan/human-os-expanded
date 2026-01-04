'use client';

import React, { useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  CodeBracketIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

// Import all available configs individually to avoid problematic ones
import { acmeCorpConfig } from '@/components/artifacts/workflows/config/configs/AcmeCorpConfig';
import { intrasoftConfig } from '@/components/artifacts/workflows/config/configs/IntrasoftConfig';
import { bluebirdMemorialPlanningConfig } from '@/components/artifacts/workflows/config/configs/BluebirdMemorialConfig-Planning';
import { simpleDynamicConfig } from '@/components/artifacts/workflows/config/configs/SimpleDynamicConfig';
import { dynamicChatAI, dynamicChatUser } from '@/components/artifacts/workflows/config/configs/DynamicChatFixed';
import { dynamicChatExampleConfig } from '@/components/artifacts/workflows/config/configs/DynamicChatExampleConfig';
import { dynamicClone } from '@/components/artifacts/workflows/config/configs/DynamicClone';
import { priceIncreaseFlatConfig } from '@/components/artifacts/workflows/config/configs/PriceIncreaseFlatConfig';
import { strategicEngagementConfig } from '@/components/artifacts/workflows/config/configs/StrategicEngagementConfig';
import { quoteArtifactConfig } from '@/components/artifacts/workflows/config/configs/QuoteArtifactConfig';
import { contractAnalysisConfig } from '@/components/artifacts/workflows/config/configs/ContractAnalysisConfig';
import { strategicPlanningConfig } from '@/components/artifacts/workflows/config/configs/StrategicPlanningConfig';
import { priceOptimizationConfig } from '@/components/artifacts/workflows/config/configs/PriceOptimizationConfig';
import { contactStrategyConfig } from '@/components/artifacts/workflows/config/configs/ContactStrategyConfig';
import { planningChecklistDemoConfig } from '@/components/artifacts/workflows/config/configs/PlanningChecklistDemoConfig';
import { planningChecklistWorkingDemo } from '@/components/artifacts/workflows/config/configs/PlanningChecklistWorkingDemo';
import { contractDemoConfig } from '@/components/artifacts/workflows/config/configs/ContractDemoConfig';
import { allArtifactsMasterDemo } from '@/components/artifacts/workflows/config/configs/AllArtifactsMasterDemo';
// Note: contactStrategyDemoConfig, planSummaryDemoConfig, pricingAnalysisDemoConfig have syntax errors and are excluded

interface ArtifactConfig {
  id: string;
  name: string;
  description: string;
  configObject: any;
  category: string;
  dashboardTemplate?: string;
}

// Define the artifacts with their metadata - ALL available working configs
const artifacts: ArtifactConfig[] = [
  // Demo Showcase Configs
  {
    id: 'planning-checklist-demo',
    name: 'Planning Checklist Demo',
    description: 'Interactive checklist for customer success planning with task management and progress tracking.',
    configObject: planningChecklistDemoConfig,
    category: 'Demo Showcase',
    dashboardTemplate: 'planning-checklist-demo'
  },
  {
    id: 'planning-checklist-working-demo',
    name: 'Planning Checklist Working Demo',
    description: 'Working version of the planning checklist with enhanced functionality.',
    configObject: planningChecklistWorkingDemo,
    category: 'Demo Showcase'
  },
  {
    id: 'contract-demo',
    name: 'Contract Analysis Demo',
    description: 'Enterprise contract overview with business terms categorization and risk assessment.',
    configObject: contractDemoConfig,
    category: 'Demo Showcase',
    dashboardTemplate: 'contract-demo'
  },
  {
    id: 'all-artifacts-master-demo',
    name: 'All Artifacts Master Demo',
    description: 'Comprehensive demonstration showcasing all available artifact types and capabilities.',
    configObject: allArtifactsMasterDemo,
    category: 'Demo Showcase',
    dashboardTemplate: 'all-artifacts-master-demo'
  },

  // Customer Configs
  {
    id: 'acme-corp',
    name: 'AcmeCorp Configuration',
    description: 'Customer success workflow for AcmeCorp with specific metrics and renewal strategy.',
    configObject: acmeCorpConfig,
    category: 'Customer Configs'
  },
  {
    id: 'intrasoft',
    name: 'Intrasoft Configuration',
    description: 'Tailored workflow configuration for Intrasoft customer management.',
    configObject: intrasoftConfig,
    category: 'Customer Configs'
  },
  {
    id: 'bluebird-memorial',
    name: 'Bluebird Memorial Planning',
    description: 'Healthcare sector customer planning workflow with specialized requirements.',
    configObject: bluebirdMemorialPlanningConfig,
    category: 'Customer Configs'
  },

  // Dynamic Chat Examples
  {
    id: 'simple-dynamic',
    name: 'Simple Dynamic Chat',
    description: 'Basic dynamic chat configuration for testing conversational flows.',
    configObject: simpleDynamicConfig,
    category: 'Dynamic Chat Examples'
  },
  {
    id: 'dynamic-chat-ai',
    name: 'Dynamic Chat (AI Start)',
    description: 'Dynamic chat configuration that begins with AI message.',
    configObject: dynamicChatAI,
    category: 'Dynamic Chat Examples'
  },
  {
    id: 'dynamic-chat-user',
    name: 'Dynamic Chat (User Start)',
    description: 'Dynamic chat configuration that begins with user message.',
    configObject: dynamicChatUser,
    category: 'Dynamic Chat Examples'
  },
  {
    id: 'dynamic-chat-example',
    name: 'Dynamic Chat Example',
    description: 'Example implementation of dynamic chat with branching conversations.',
    configObject: dynamicChatExampleConfig,
    category: 'Dynamic Chat Examples'
  },
  {
    id: 'dynamic-clone',
    name: 'Dynamic Clone',
    description: 'Cloned version of dynamic chat for testing and experimentation.',
    configObject: dynamicClone,
    category: 'Dynamic Chat Examples'
  },

  // Strategic Workflow Configs
  {
    id: 'price-increase-flat',
    name: 'Price Increase (Flat Growth)',
    description: 'Workflow for managing price increases with customers showing flat growth patterns.',
    configObject: priceIncreaseFlatConfig,
    category: 'Strategic Workflows'
  },
  {
    id: 'strategic-engagement',
    name: 'Strategic Engagement',
    description: 'High-level strategic engagement workflow for enterprise customer relationships.',
    configObject: strategicEngagementConfig,
    category: 'Strategic Workflows'
  },
  {
    id: 'quote-artifact',
    name: 'Quote Management',
    description: 'Quote generation and management workflow with pricing calculations.',
    configObject: quoteArtifactConfig,
    category: 'Strategic Workflows'
  },
  {
    id: 'contract-analysis',
    name: 'Contract Analysis',
    description: 'Detailed contract analysis workflow for complex enterprise agreements.',
    configObject: contractAnalysisConfig,
    category: 'Strategic Workflows'
  },
  {
    id: 'strategic-planning',
    name: 'Strategic Planning',
    description: 'Long-term strategic planning workflow for customer success initiatives.',
    configObject: strategicPlanningConfig,
    category: 'Strategic Workflows'
  },
  {
    id: 'price-optimization',
    name: 'Price Optimization',
    description: 'Data-driven price optimization workflow with market analysis.',
    configObject: priceOptimizationConfig,
    category: 'Strategic Workflows'
  },
  {
    id: 'contact-strategy',
    name: 'Contact Strategy',
    description: 'Contact relationship strategy workflow for stakeholder management.',
    configObject: contactStrategyConfig,
    category: 'Strategic Workflows'
  }
];

// Group artifacts by category
const groupedArtifacts = artifacts.reduce((acc, artifact) => {
  if (!acc[artifact.category]) {
    acc[artifact.category] = [];
  }
  acc[artifact.category].push(artifact);
  return acc;
}, {} as Record<string, ArtifactConfig[]>);

export default function ArtifactsPage() {
  const [configViewerOpen, setConfigViewerOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ArtifactConfig | null>(null);
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);

  const openDashboard = (templateName?: string) => {
    if (templateName) {
      window.open(`/dashboard?template=${templateName}`, '_blank');
    }
  };

  const viewConfig = (artifact: ArtifactConfig) => {
    setSelectedConfig(artifact);
    setConfigViewerOpen(true);
  };

  const copyConfig = async (configText: string, artifactId: string) => {
    try {
      await navigator.clipboard.writeText(configText);
      setCopiedConfig(artifactId);
      setTimeout(() => setCopiedConfig(null), 2000);
    } catch (err) {
      console.error('Failed to copy config:', err);
    }
  };

  const closeConfigViewer = () => {
    setConfigViewerOpen(false);
    setSelectedConfig(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Artifacts Library</h1>
          <p className="text-lg text-gray-600">
            Explore all available workflow configurations and artifacts. Test them live or examine their code.
          </p>
        </div>

        {/* Categories */}
        {Object.entries(groupedArtifacts).map(([category, categoryArtifacts]) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-2">
              {category}
            </h2>

            <div className="space-y-3">
              {categoryArtifacts.map((artifact) => (
                <div key={artifact.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {artifact.name}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {artifact.description}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 ml-6 flex-shrink-0">
                        {/* Dashboard Link */}
                        {artifact.dashboardTemplate && (
                          <button
                            onClick={() => openDashboard(artifact.dashboardTemplate)}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors duration-200 text-sm"
                            title="Open in Dashboard"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                          </button>
                        )}

                        {/* View Config Link */}
                        <button
                          onClick={() => viewConfig(artifact)}
                          className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md transition-colors duration-200 text-sm"
                          title="View Configuration"
                        >
                          <CodeBracketIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Config</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Config Viewer Modal */}
      {configViewerOpen && selectedConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedConfig.name} - Configuration
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyConfig(JSON.stringify(selectedConfig.configObject, null, 2), selectedConfig.id)}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
                >
                  {copiedConfig === selectedConfig.id ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-4 w-4" />
                      <span>Copy Config</span>
                    </>
                  )}
                </button>
                <button
                  onClick={closeConfigViewer}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="h-full overflow-auto">
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap">
                  <code>{JSON.stringify(selectedConfig.configObject, null, 2)}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}