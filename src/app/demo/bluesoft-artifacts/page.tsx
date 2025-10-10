/**
 * Bluesoft Artifacts Demo Page
 *
 * Demo page for testing the complete artifact system with Bluesoft customer data
 *
 * Features:
 * - Loads Bluesoft Corporation showcase customer
 * - Displays workflow executions
 * - Shows all 6 artifacts (contract analysis, meeting notes, action plans, assessment)
 * - Tests ArtifactRenderer with real database data
 * - Customer context integration for handlebars variables
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TaskArtifactsDisplay } from '@/components/artifacts/workflows/TaskArtifactsDisplay';
import { createClient } from '@/lib/supabase';

// Bluesoft showcase customer ID
const BLUESOFT_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  metadata: any;
}

interface Customer {
  id: string;
  name: string;
  domain: string;
  industry: string;
  arr: number;
  renewal_date: string;
}

export default function BluesoftArtifactsDemo() {
  const supabase = createClient();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', BLUESOFT_CUSTOMER_ID)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch workflow executions
      const { data: executionsData, error: executionsError } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('customer_id', BLUESOFT_CUSTOMER_ID)
        .order('started_at', { ascending: false });

      if (executionsError) throw executionsError;
      setExecutions(executionsData || []);

      // Auto-select first execution
      if (executionsData && executionsData.length > 0) {
        setSelectedExecutionId(executionsData[0].id);
      }
    } catch (err) {
      console.error('[BluesoftDemo] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-700">Loading Bluesoft demo data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Demo Data Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Bluesoft Corporation customer not found in database.'}
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Run <code className="bg-blue-100 px-1 rounded">BLUESOFT_DEMO_MIGRATION.sql</code></li>
              <li>Run <code className="bg-blue-100 px-1 rounded">BLUESOFT_DEMO_SEED.sql</code></li>
              <li>Run <code className="bg-blue-100 px-1 rounded">BLUESOFT_WORKFLOWS_SEED.sql</code></li>
            </ol>
            <p className="text-xs text-blue-700 mt-2">
              See <code>automation/BLUESOFT_DEMO_INSTRUCTIONS.md</code> for details.
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No executions
  if (executions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-yellow-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Workflow Executions</h2>
          <p className="text-gray-600 mb-4">
            Customer found: <strong>{customer.name}</strong>
          </p>
          <p className="text-gray-600 mb-6">
            But no workflow executions exist yet.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Run this SQL:</h3>
            <p className="text-xs text-blue-800">
              <code className="bg-blue-100 px-1 rounded">BLUESOFT_WORKFLOWS_SEED.sql</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bluesoft Corporation - Artifacts Demo
              </h1>
              <p className="text-gray-600">
                Showcase customer demonstrating complete 120-day renewal journey
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Customer ID</p>
              <p className="text-xs font-mono text-gray-500">{BLUESOFT_CUSTOMER_ID}</p>
            </div>
          </div>

          {/* Customer Metrics */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-1">Company</p>
              <p className="text-lg font-semibold text-blue-900">{customer.name}</p>
              <p className="text-xs text-blue-600">{customer.domain}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-xs text-green-700 font-medium mb-1">ARR</p>
              <p className="text-lg font-semibold text-green-900">{formatCurrency(customer.arr)}</p>
              <p className="text-xs text-green-600">{customer.industry}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-xs text-purple-700 font-medium mb-1">Renewal Date</p>
              <p className="text-lg font-semibold text-purple-900">{formatDate(customer.renewal_date)}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-xs text-orange-700 font-medium mb-1">Workflow Executions</p>
              <p className="text-lg font-semibold text-orange-900">{executions.length}</p>
              <p className="text-xs text-orange-600">Critical + Emergency</p>
            </div>
          </div>

          {/* Workflow Execution Selector */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Workflow Execution
            </label>
            <div className="grid grid-cols-2 gap-3">
              {executions.map((execution) => (
                <button
                  key={execution.id}
                  onClick={() => setSelectedExecutionId(execution.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedExecutionId === execution.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {execution.workflow_name || execution.workflow_id}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{formatDate(execution.started_at)}</span>
                        {execution.completed_at && (
                          <span className="text-green-600">• Completed</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      execution.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : execution.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {execution.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Artifacts Display */}
      <div className="flex-1 overflow-hidden">
        {selectedExecutionId ? (
          <TaskArtifactsDisplay
            workflowExecutionId={selectedExecutionId}
            customerId={BLUESOFT_CUSTOMER_ID}
            onClose={() => {}}
            isExpanded={false}
            onToggleExpand={() => {}}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Select a workflow execution to view artifacts</p>
          </div>
        )}
      </div>
    </div>
  );
}
