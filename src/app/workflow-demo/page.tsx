/**
 * Workflow Demo Page
 *
 * Demonstrates the new database-driven workflow config builder.
 *
 * This page shows how workflows are now built:
 * 1. Fetch customer data from database
 * 2. Compose slides from slide library
 * 3. Hydrate templates with customer data
 * 4. Render in TaskMode
 *
 * Compare this to the old obsidian-black page which has hardcoded data.
 */

'use client';

import { useState, useEffect } from 'react';
import type { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import Button from '@/components/ui/Button';

// For demo purposes, we'll use a mock version of the config builder
// In production, this would call the actual API routes
import { executiveContactLostComposition } from '@/lib/workflows/compositions/executiveContactLostComposition';
import { standardRenewalComposition } from '@/lib/workflows/compositions/standardRenewalComposition';
import { composeWorkflow } from '@/lib/workflows/composer';
import { hydrateSlides, buildHydrationContext, type WorkflowCustomerData } from '@/lib/workflows/hydrator';

// Mock customer data (in production this comes from database)
const MOCK_CUSTOMERS: WorkflowCustomerData[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Obsidian Black',
    domain: 'obsidianblack.com',
    industry: 'Technology',
    current_arr: 185000,
    health_score: 72,
    churn_risk_score: 3,
    utilization_percent: 85,
    contract_start_date: '2025-03-15',
    contract_end_date: '2026-03-15',
    renewal_date: '2026-03-15',
    days_until_renewal: 145,
    usage_score: 78,
    nps_score: 8,
    adoption_rate: 82,
    license_count: 100,
    active_users: 85,
    relationship_strength: 'strong',
    primary_contact: {
      id: 'contact-1',
      name: 'Sarah Johnson',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@obsidianblack.com',
      title: 'VP of Engineering',
      is_primary: true,
    },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Acme Corporation',
    domain: 'acme.com',
    industry: 'Manufacturing',
    current_arr: 450000,
    health_score: 88,
    churn_risk_score: 1,
    utilization_percent: 92,
    contract_start_date: '2024-06-01',
    contract_end_date: '2026-06-01',
    renewal_date: '2026-06-01',
    days_until_renewal: 223,
    usage_score: 91,
    nps_score: 9,
    adoption_rate: 94,
    license_count: 250,
    active_users: 230,
    relationship_strength: 'strong',
    primary_contact: {
      id: 'contact-2',
      name: 'Michael Chen',
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'michael.chen@acme.com',
      title: 'CTO',
      is_primary: true,
    },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'TechStart Inc',
    domain: 'techstart.io',
    industry: 'SaaS',
    current_arr: 75000,
    health_score: 45,
    churn_risk_score: 4,
    utilization_percent: 42,
    contract_start_date: '2024-09-01',
    contract_end_date: '2025-09-01',
    renewal_date: '2025-09-01',
    days_until_renewal: -45, // Overdue!
    usage_score: 38,
    nps_score: 5,
    adoption_rate: 35,
    license_count: 50,
    active_users: 21,
    relationship_strength: 'weak',
    primary_contact: {
      id: 'contact-3',
      name: 'Emily Rodriguez',
      first_name: 'Emily',
      last_name: 'Rodriguez',
      email: 'emily@techstart.io',
      title: 'Head of Operations',
      is_primary: true,
    },
  },
];

const WORKFLOWS = [
  { id: 'standard-renewal', name: 'Standard Renewal', composition: standardRenewalComposition },
  { id: 'exec-contact-lost', name: 'Executive Contact Lost', composition: executiveContactLostComposition },
];

export default function WorkflowDemoPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(MOCK_CUSTOMERS[0].id);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(WORKFLOWS[0].id);
  const [config, setConfig] = useState<WorkflowConfig | null>(null);
  const [isTaskModeOpen, setIsTaskModeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedCustomer = MOCK_CUSTOMERS.find(c => c.id === selectedCustomerId);
  const selectedWorkflow = WORKFLOWS.find(w => w.id === selectedWorkflowId);

  // Build config preview
  useEffect(() => {
    if (!selectedCustomer || !selectedWorkflow) return;

    setIsLoading(true);

    try {
      // 1. Compose slides from library
      const slides = composeWorkflow(selectedWorkflow.composition);

      // 2. Build hydration context
      const hydrationContext = buildHydrationContext(selectedCustomer, {
        csm: {
          id: 'csm-1',
          name: 'Jessica Martinez',
          email: 'jessica@company.com',
        },
        // For exec contact lost workflow, add departed contact
        ...(selectedWorkflowId === 'exec-contact-lost' && {
          departed_contact: {
            name: 'John Smith',
            title: 'Former VP of Engineering',
            departure_date: '2025-10-15',
          },
        }),
      });

      // 3. Hydrate slides
      const hydratedSlides = hydrateSlides(slides, hydrationContext);

      // 4. Build complete config
      const builtConfig: WorkflowConfig = {
        customer: {
          name: selectedCustomer.name,
        },
        slides: hydratedSlides,
        layout: selectedWorkflow.composition.settings?.layout,
        chat: selectedWorkflow.composition.settings?.chat,
      } as any;

      setConfig(builtConfig);
    } catch (error) {
      console.error('Error building config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCustomerId, selectedWorkflowId, selectedCustomer, selectedWorkflow]);

  const handleLaunchWorkflow = () => {
    setIsTaskModeOpen(true);
  };

  const handleWorkflowComplete = (completed?: boolean) => {
    setIsTaskModeOpen(false);
    if (completed) {
      console.log('✅ Workflow completed!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            🚀 Database-Driven Workflow Demo
          </h1>
          <p className="text-slate-600 text-lg">
            See the new slide library + composition system in action
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configure Workflow</h2>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MOCK_CUSTOMERS.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - ARR: ${(customer.current_arr / 1000).toFixed(0)}K
                  </option>
                ))}
              </select>
            </div>

            {/* Workflow Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Workflow
              </label>
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WORKFLOWS.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Info */}
          {selectedCustomer && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Customer Details</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Name:</span>{' '}
                  <span className="font-medium">{selectedCustomer.name}</span>
                </div>
                <div>
                  <span className="text-slate-600">ARR:</span>{' '}
                  <span className="font-medium">
                    ${(selectedCustomer.current_arr / 1000).toFixed(0)}K
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Health Score:</span>{' '}
                  <span className="font-medium">{selectedCustomer.health_score}</span>
                </div>
                <div>
                  <span className="text-slate-600">Primary Contact:</span>{' '}
                  <span className="font-medium">{selectedCustomer.primary_contact?.name}</span>
                </div>
                <div>
                  <span className="text-slate-600">Utilization:</span>{' '}
                  <span className="font-medium">{selectedCustomer.utilization_percent}%</span>
                </div>
                <div>
                  <span className="text-slate-600">Days to Renewal:</span>{' '}
                  <span className="font-medium">{selectedCustomer.days_until_renewal}</span>
                </div>
              </div>
            </div>
          )}

          {/* Launch Button */}
          <Button
            onClick={handleLaunchWorkflow}
            disabled={!config || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Building Config...' : 'Launch Workflow'}
          </Button>
        </div>

        {/* Config Preview */}
        {config && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Config Preview</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Workflow Info</h3>
                <div className="bg-slate-50 rounded p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-600">Customer:</span>{' '}
                      <span className="font-medium">{config.customer.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Total Slides:</span>{' '}
                      <span className="font-medium">{config.slides?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Slide Sequence</h3>
                <div className="bg-slate-50 rounded p-3">
                  <ol className="space-y-2 text-sm">
                    {config.slides?.map((slide: any, index) => (
                      <li key={index} className="flex items-start">
                        <span className="font-medium text-slate-600 mr-2">{index + 1}.</span>
                        <div className="flex-1">
                          <div className="font-medium">
                            {slide.layout === 'side-by-side' ? '📊' : '💬'}{' '}
                            {slide.artifactPanel?.title || 'Chat Slide'}
                          </div>
                          {slide.artifactPanel?.content?.[0]?.type === 'intro' && (
                            <div className="text-slate-600 text-xs mt-1 line-clamp-1">
                              {slide.artifactPanel.content[0].content}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Template Hydration Examples</h3>
                <div className="bg-slate-50 rounded p-3 text-sm space-y-2">
                  <div>
                    <code className="text-blue-600">{'{{customer.name}}'}</code> →{' '}
                    <span className="font-medium">{selectedCustomer?.name}</span>
                  </div>
                  <div>
                    <code className="text-blue-600">{'{{customer.current_arr}}'}</code> →{' '}
                    <span className="font-medium">
                      ${(selectedCustomer!.current_arr / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div>
                    <code className="text-blue-600">{'{{primary_contact.email}}'}</code> →{' '}
                    <span className="font-medium">{selectedCustomer?.primary_contact?.email}</span>
                  </div>
                  <div>
                    <code className="text-blue-600">{'{{customer.utilization_percent}}'}</code> →{' '}
                    <span className="font-medium">{selectedCustomer?.utilization_percent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">🎓 How This Works</h2>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>
                <strong>Slide Composition:</strong> Loads slides from the slide library (11 reusable slides)
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>
                <strong>Data Fetching:</strong> Fetches customer data (in demo: from mock data, in prod: from database)
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>
                <strong>Template Hydration:</strong> Replaces all {'{{placeholders}}'} with actual customer data
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>
                <strong>Config Generation:</strong> Returns complete WorkflowConfig ready for TaskMode
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Key Benefit:</strong> Same 11 slides are reused across different workflows!
              Executive Contact Lost and Standard Renewal workflows both use 7 of the same slides (78% reuse).
            </p>
          </div>
        </div>
      </div>

      {/* TaskMode Modal - Disabled for now, showing config preview instead */}
      {isTaskModeOpen && config && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Workflow Config Preview</h2>
              <button
                onClick={() => handleWorkflowComplete(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Customer</h3>
                <div className="bg-slate-50 rounded p-3">
                  <p>{config.customer.name}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Slides ({config.slides?.length || 0})</h3>
                <div className="bg-slate-50 rounded p-3 space-y-2">
                  {config.slides?.map((slide: any, index) => (
                    <div key={index} className="border-b border-slate-200 last:border-0 pb-2">
                      <div className="font-medium text-sm">
                        {index + 1}. {slide.artifactPanel?.title || 'Chat Slide'}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Layout: {slide.layout}
                      </div>
                      {slide.artifactPanel?.content?.[0]?.type === 'intro' && (
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {(slide.artifactPanel.content[0] as any).content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Config Successfully Generated!</h3>
                <p className="text-sm text-green-800">
                  This WorkflowConfig is ready to be used in TaskMode. In production, this would be passed directly to the TaskModeFullscreen component.
                </p>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={() => handleWorkflowComplete(true)}
                  className="w-full"
                  size="lg"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
