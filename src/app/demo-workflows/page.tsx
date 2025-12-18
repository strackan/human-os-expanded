'use client';

/**
 * Demo Workflows Page
 *
 * Side-by-side comparison of V1 (slides-based) vs V2 (LLM-driven) workflows.
 * Both use the same database-driven slide architecture (composeFromDatabase).
 *
 * V1: Standard workflow with predetermined step progression
 * V2: LLM-enhanced workflow with intelligent orchestration (when USE_LLM_WORKFLOW_V2 enabled)
 */

import { useState, useCallback } from 'react';
import { Play, Bot, Database, Sparkles, Loader2 } from 'lucide-react';
import TaskModeFullscreen from '@/components/workflows/TaskMode';
import { composeFromDatabase } from '@/lib/workflows/db-composer';
import { registerWorkflowConfig } from '@/config/workflows/index';
import { useAuth } from '@/components/auth/AuthProvider';
import type { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';

// GrowthStack demo customer (exists in database)
const DEMO_CUSTOMER_ID = 'aab1ac14-a621-4e5f-ba25-d391115ac793';

// Demo customer context for workflow hydration
const DEMO_CUSTOMER = {
  id: DEMO_CUSTOMER_ID,
  name: 'GrowthStack',
  current_arr: 180000,
  health_score: 92,
  risk_score: 15,
  growth_score: 90,
  renewal_date: '2026-02-15',
  days_to_renewal: 59,
  primary_contact_name: 'Sarah Johnson',
  primary_contact_title: 'VP of People',
  primary_contact_email: 'sarah.johnson@growthstack.com',
  tier: 'Enterprise',
  industry: 'Marketing',
};

// Database workflow IDs
const V1_WORKFLOW_ID = 'inhersight-90day-renewal';
const V2_WORKFLOW_ID = 'inhersight-90day-renewal'; // Same workflow, LLM mode enabled via flag

interface WorkflowCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: 'v1' | 'v2';
  onLaunch: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function WorkflowCard({ title, description, icon, variant, onLaunch, disabled, loading }: WorkflowCardProps) {
  const bgColor = variant === 'v1' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200';
  const iconColor = variant === 'v1' ? 'text-blue-600' : 'text-purple-600';
  const buttonColor = variant === 'v1'
    ? 'bg-blue-600 hover:bg-blue-700'
    : 'bg-purple-600 hover:bg-purple-700';

  return (
    <div className={`rounded-xl border-2 ${bgColor} p-6 flex flex-col`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-lg bg-white shadow-sm ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${variant === 'v1' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
            {variant === 'v1' ? 'Slides-Based (Standard)' : 'LLM-Driven (V2)'}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-6 flex-grow">{description}</p>

      <button
        onClick={onLaunch}
        disabled={disabled || loading}
        className={`w-full ${buttonColor} text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Launch Workflow
          </>
        )}
      </button>
    </div>
  );
}

export default function DemoWorkflowsPage() {
  const { user } = useAuth();
  const [taskModeOpen, setTaskModeOpen] = useState(false);
  const [loadingV1, setLoadingV1] = useState(false);
  const [loadingV2, setLoadingV2] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<{
    workflowId: string;
    title: string;
    customerId: string;
    customerName: string;
  } | null>(null);

  const handleLaunchV1 = useCallback(async () => {
    setLoadingV1(true);
    try {
      // Compose workflow from database using slide library
      const workflowConfig = await composeFromDatabase(
        V1_WORKFLOW_ID,
        null, // company_id (null = stock workflow)
        DEMO_CUSTOMER // Customer context for hydration
      );

      if (!workflowConfig) {
        console.error('V1 workflow not found in database:', V1_WORKFLOW_ID);
        return;
      }

      // Force V1 (standard) mode for comparison demo
      // In production, this would be controlled by use_llm_mode column in database
      const v1Config = {
        ...workflowConfig,
        _llmMode: false, // Force standard slide progression
      } as WorkflowConfig;

      // Register config so TaskMode can retrieve it
      const registryId = 'demo-v1-growthstack';
      registerWorkflowConfig(registryId, v1Config);

      setActiveWorkflow({
        workflowId: registryId,
        title: 'GrowthStack 90-Day Renewal (V1)',
        customerId: DEMO_CUSTOMER.id,
        customerName: DEMO_CUSTOMER.name,
      });
      setTaskModeOpen(true);
    } catch (error) {
      console.error('Error launching V1 workflow:', error);
    } finally {
      setLoadingV1(false);
    }
  }, []);

  const handleLaunchV2 = useCallback(async () => {
    setLoadingV2(true);
    try {
      // Compose workflow from database using slide library
      // V2 uses the same workflow structure, but LLM orchestration is enabled via feature flag
      const workflowConfig = await composeFromDatabase(
        V2_WORKFLOW_ID,
        null, // company_id (null = stock workflow)
        DEMO_CUSTOMER // Customer context for hydration
      );

      if (!workflowConfig) {
        console.error('V2 workflow not found in database:', V2_WORKFLOW_ID);
        return;
      }

      // V2 uses LLM mode - this comes from database (use_llm_mode column)
      // For demo, we ensure it's true to demonstrate LLM orchestration
      // In production, this is controlled per-workflow via the database
      const llmConfig = {
        ...workflowConfig,
        _llmMode: true, // LLM orchestration enabled
      } as WorkflowConfig;

      // Register config so TaskMode can retrieve it
      const registryId = 'demo-v2-growthstack-llm';
      registerWorkflowConfig(registryId, llmConfig);

      setActiveWorkflow({
        workflowId: registryId,
        title: 'GrowthStack 90-Day Renewal (V2 - LLM)',
        customerId: DEMO_CUSTOMER.id,
        customerName: DEMO_CUSTOMER.name,
      });
      setTaskModeOpen(true);
    } catch (error) {
      console.error('Error launching V2 workflow:', error);
    } finally {
      setLoadingV2(false);
    }
  }, []);

  const handleCloseTaskMode = () => {
    setTaskModeOpen(false);
    setActiveWorkflow(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Workflow Comparison</h1>
          </div>
          <p className="text-gray-600">
            Compare the standard slides-based workflow with the LLM-driven approach.
            Both use the same database-driven architecture (composeFromDatabase).
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Customer Context */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Customer: {DEMO_CUSTOMER.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">ARR</span>
              <p className="text-lg font-semibold text-gray-900">${DEMO_CUSTOMER.current_arr.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Health Score</span>
              <p className="text-lg font-semibold text-green-600">{DEMO_CUSTOMER.health_score}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Days to Renewal</span>
              <p className="text-lg font-semibold text-gray-900">{DEMO_CUSTOMER.days_to_renewal}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Primary Contact</span>
              <p className="text-lg font-semibold text-gray-900">{DEMO_CUSTOMER.primary_contact_name}</p>
            </div>
          </div>
        </div>

        {/* Architecture Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-800">
            <strong>Architecture:</strong> Both workflows use <code className="bg-blue-100 px-1 rounded">composeFromDatabase()</code> with
            the slide library. V2 adds LLM orchestration when the <code className="bg-blue-100 px-1 rounded">USE_LLM_WORKFLOW_V2</code> flag is enabled.
          </p>
        </div>

        {/* Workflow Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <WorkflowCard
            title="GrowthStack 90-Day Renewal"
            description="Standard slides-based workflow using database composition. Steps follow the slide_sequence defined in workflow_definitions."
            icon={<Database className="w-6 h-6" />}
            variant="v1"
            onLaunch={handleLaunchV1}
            loading={loadingV1}
            disabled={loadingV2}
          />

          <WorkflowCard
            title="GrowthStack 90-Day Renewal (LLM)"
            description="Same slide architecture with LLM orchestration. Claude can suggest next steps, generate artifacts dynamically, and provide intelligent guidance."
            icon={<Bot className="w-6 h-6" />}
            variant="v2"
            onLaunch={handleLaunchV2}
            loading={loadingV2}
            disabled={loadingV1}
          />
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Feature Comparison</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider">V1 (Standard)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-purple-600 uppercase tracking-wider">V2 (LLM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Architecture</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">composeFromDatabase + Slides</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">composeFromDatabase + Slides + LLM</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Step Progression</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Predetermined sequence</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">AI-suggested (hybrid control)</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Artifact Generation</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Template-based</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">LLM-generated</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Decision Points</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">All manual</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Key decisions require confirmation</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">External Enrichment</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Not integrated</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Human-OS integration</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Mode Modal */}
      {taskModeOpen && activeWorkflow && (
        <TaskModeFullscreen
          workflowId={activeWorkflow.workflowId}
          workflowTitle={activeWorkflow.title}
          customerId={activeWorkflow.customerId}
          customerName={activeWorkflow.customerName}
          userId={user?.id}
          onClose={(completed) => {
            console.log('Workflow closed, completed:', completed);
            handleCloseTaskMode();
          }}
        />
      )}
    </div>
  );
}
