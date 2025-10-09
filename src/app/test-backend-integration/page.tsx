"use client";

/**
 * Backend Integration Test Page
 *
 * Tests end-to-end integration of:
 * - Context API (GET /api/workflows/context/[customerId])
 * - Metrics API (GET /api/workflows/executions/[id]/metrics)
 * - Template resolution with Handlebars
 * - WorkflowExecutor with real data
 */

import React, { useState, useEffect } from 'react';
import { WorkflowExecutor, WorkflowDefinition } from '@/components/workflows/WorkflowExecutor';
import { WorkflowContextProvider } from '@/contexts/WorkflowContext';
import { resolveTemplate } from '@/utils/templateResolver';

// =====================================================
// Test Customer IDs (from backend integration doc)
// =====================================================

const TEST_CUSTOMERS = {
  healthy: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Acme Corp',
    description: 'Real customer from database'
  },
  atRisk: {
    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    name: 'TechStart Inc',
    description: 'At-Risk Mid-Market (placeholder - update with real ID)'
  },
  critical: {
    id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    name: 'Global Enterprises',
    description: 'Critical Overdue Enterprise (placeholder - update with real ID)'
  }
};

// =====================================================
// Mock Workflow Definition (until workflow API is ready)
// =====================================================

const MOCK_WORKFLOW: WorkflowDefinition = {
  id: 'test-backend-integration',
  name: 'Backend Integration Test',
  description: 'Testing context API, metrics API, and template resolution',
  steps: [
    {
      id: 'context-test',
      number: 1,
      title: 'Context API Test - {{customer.name}}',
      description: 'Customer: {{customer.name}} | ARR: {{formatCurrency customer.arr}} | Days Until Renewal: {{workflow.daysUntilRenewal}}',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'customer-summary',
          type: 'status_grid',
          title: 'Customer Summary',
          config: {
            columns: 4,
            items: [
              {
                label: 'Customer Name',
                value: '{{customer.name}}',
                status: 'neutral'
              },
              {
                label: 'ARR',
                value: '{{formatCurrency customer.arr}}',
                sublabel: 'Annual Recurring Revenue',
                status: 'green'
              },
              {
                label: 'Renewal Date',
                value: '{{formatDate customer.renewalDate}}',
                sublabel: '{{workflow.daysUntilRenewal}} days',
                status: 'yellow'
              },
              {
                label: 'CSM',
                value: '{{csm.name}}',
                sublabel: '{{csm.email}}',
                status: 'neutral'
              }
            ]
          }
        }
      ]
    },
    {
      id: 'template-test',
      number: 2,
      title: 'Template Resolution Test',
      description: 'Testing Handlebars helpers and conditional logic',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'template-examples',
          type: 'markdown',
          title: 'Template Examples',
          config: {
            content: `
## Template Resolution Test

### Basic Variables
- Customer: **{{customer.name}}**
- ARR: **{{formatCurrency customer.arr}}**
- Contract Term: **{{customer.contractTerm}} months**
- Industry: **{{customer.industry}}**

### Calculations
- Days until renewal: **{{workflow.daysUntilRenewal}}**
- Absolute value: **{{abs workflow.daysUntilRenewal}}**

### Conditionals
{{#if (gte workflow.daysUntilRenewal 0)}}
✅ Renewal is upcoming
{{else}}
⚠️ Renewal is overdue by {{abs workflow.daysUntilRenewal}} days
{{/if}}

### Team Information
- CSM: {{csm.name}} ({{csm.email}})
- Manager: {{csm.managerName}} ({{csm.manager}})
- VP CS: {{company.vpCustomerSuccessName}}
            `
          }
        }
      ]
    },
    {
      id: 'metrics-test',
      number: 3,
      title: 'Metrics API Test',
      description: 'Open the metrics panel (📊 Metrics button) to test the metrics API',
      component: 'GenericFormStep'
    }
  ]
};

// =====================================================
// Test Page Component
// =====================================================

export default function TestBackendIntegrationPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<string>(TEST_CUSTOMERS.healthy.id);
  const [testingContext, setTestingContext] = useState(false);
  const [contextData, setContextData] = useState<any>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [showWorkflow, setShowWorkflow] = useState(false);

  // Test context API directly
  const testContextAPI = async () => {
    setTestingContext(true);
    setContextError(null);
    setContextData(null);

    try {
      console.log('[Test] Fetching context for customer:', selectedCustomer);
      const response = await fetch(`/api/workflows/context/${selectedCustomer}`);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If JSON parsing fails, use the default HTTP error message
          console.warn('[Test] Could not parse error response:', parseError);
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('[Test] Context API response:', responseData);

      // Extract context from wrapper (API returns {success: true, context: {...}})
      const data = responseData.context || responseData;
      setContextData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch context';
      console.error('[Test] Context API error:', error);
      setContextError(errorMessage);
    } finally {
      setTestingContext(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🧪 Backend Integration Test
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Testing Context API, Metrics API, and Template Resolution
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showWorkflow ? (
          <>
            {/* Test Controls */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                1. Select Test Customer
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(TEST_CUSTOMERS).map(([key, customer]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCustomer(customer.id)}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${selectedCustomer === customer.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="font-semibold text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{customer.description}</div>
                    <div className="text-xs text-gray-400 mt-2 font-mono">{customer.id}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={testContextAPI}
                  disabled={testingContext}
                  className="
                    px-6 py-3 bg-blue-500 text-white rounded-lg font-medium
                    hover:bg-blue-600 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {testingContext ? 'Testing...' : '2. Test Context API'}
                </button>

                <button
                  onClick={() => setShowWorkflow(true)}
                  disabled={!contextData}
                  className="
                    px-6 py-3 bg-green-500 text-white rounded-lg font-medium
                    hover:bg-green-600 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  3. Launch Workflow
                </button>
              </div>
            </div>

            {/* Context API Response */}
            {contextError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-red-900 mb-2">❌ Context API Error</h3>
                <p className="text-red-700">{contextError}</p>
              </div>
            )}

            {contextData && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-green-900 mb-4">✅ Context API Success</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-600 mb-1">Customer</div>
                    <div className="font-semibold">{contextData.customer?.name}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-600 mb-1">ARR</div>
                    <div className="font-semibold">{contextData.customer?.arr ? `$${contextData.customer.arr.toLocaleString()}` : 'N/A'}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-600 mb-1">CSM</div>
                    <div className="font-semibold">{contextData.csm?.name || 'N/A'}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-600 mb-1">Days Until Renewal</div>
                    <div className="font-semibold">{contextData.workflow?.daysUntilRenewal ?? 'N/A'}</div>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-green-700 hover:text-green-800">
                    View Full Response
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(contextData, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-blue-900 mb-3">📋 Testing Checklist</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Select a test customer (Acme Corp, TechStart Inc, or Global Enterprises)</li>
                <li>Click "Test Context API" to fetch customer context</li>
                <li>Verify the API response shows customer data, CSM info, and workflow context</li>
                <li>Click "Launch Workflow" to test template resolution in workflow UI</li>
                <li>In the workflow, verify:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>Step titles show resolved customer names</li>
                    <li>Artifact cards display real customer data</li>
                    <li>Click "📊 Metrics" button to test metrics API</li>
                    <li>Verify metrics show calculated health scores, ARR trends, etc.</li>
                  </ul>
                </li>
              </ol>
            </div>

            {/* Important Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important: Using Real Customer IDs</h4>
              <p className="text-sm text-yellow-800 mb-2">
                The customer IDs shown above are examples. If you get "Customer not found" errors, you need to:
              </p>
              <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1 ml-2">
                <li>Check your database for existing customer IDs</li>
                <li>Update the TEST_CUSTOMERS object in this file with real IDs</li>
                <li>Or manually enter a customer ID from your database</li>
              </ol>
              <p className="text-xs text-yellow-700 mt-2">
                <strong>Quick fix:</strong> Query your database: <code className="bg-yellow-100 px-1 rounded">SELECT id, name FROM customers LIMIT 3;</code>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Workflow Executor */}
            <div className="mb-4">
              <button
                onClick={() => setShowWorkflow(false)}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Test Controls
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The 📊 Metrics button requires a workflow execution to be created first.
                The metrics will be available once you complete a step or the workflow creates an execution in the database.
              </p>
            </div>

            <WorkflowExecutor
              workflowDefinition={MOCK_WORKFLOW}
              customerId={selectedCustomer}
              onExit={() => setShowWorkflow(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}
