/**
 * Step Renderer Component
 *
 * Dynamically renders step components based on workflow configuration.
 * Maps step component names to actual React components.
 *
 * Features:
 * - Dynamic component rendering
 * - Step validation
 * - Data passing to child components
 * - Loading and error states
 */

'use client';

import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { WorkflowStep } from './WorkflowExecutor';
import { CustomerAnalysisStep } from './steps/CustomerAnalysisStep';
import { SimpleFormStep } from './steps/SimpleFormStep';
import { ReviewStep } from './steps/ReviewStep';
import { AccountPlanStep } from './steps/AccountPlanStep';
import { ChatStep } from './steps/ChatStep';
import { ArtifactRenderer } from './artifacts/ArtifactRenderer';
import { useTemplateContext } from '@/contexts/WorkflowContext';
import { resolveTemplate } from '@/utils/templateResolver';

// Step components will be registered here
const STEP_COMPONENTS: { [key: string]: React.ComponentType<StepComponentProps> } = {};

// =====================================================
// Types
// =====================================================

export interface StepComponentProps {
  data?: any;
  executionId: string;
  customerId?: string;
  onDataChange: (data: any) => void;
  onArtifactGenerated: (artifact: any) => void;
  onComplete: () => void;
}

export interface StepRendererProps {
  step: WorkflowStep;
  data?: any;
  executionId: string;
  customerId?: string;
  onDataChange: (data: any) => void;
  onArtifactGenerated: (artifact: any) => void;
  onComplete: () => void;
}

// =====================================================
// Component Registration
// =====================================================

export function registerStepComponent(
  componentName: string,
  component: React.ComponentType<StepComponentProps>
) {
  STEP_COMPONENTS[componentName] = component;
  console.log('[StepRenderer] Registered component:', componentName);
}

// =====================================================
// StepRenderer Component
// =====================================================

export const StepRenderer: React.FC<StepRendererProps> = ({
  step,
  data,
  executionId,
  customerId,
  onDataChange,
  onArtifactGenerated,
  onComplete
}) => {
  const StepComponent = STEP_COMPONENTS[step.component];

  // Get workflow context for template rendering
  const templateContext = useTemplateContext();

  // Resolve templates in step content
  const resolvedTitle = templateContext
    ? resolveTemplate(step.title, templateContext)
    : step.title;

  const resolvedDescription = templateContext
    ? resolveTemplate(step.description, templateContext)
    : step.description;

  // Component not found
  if (!StepComponent) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Component Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The step component <code className="px-2 py-1 bg-gray-100 rounded text-sm">{step.component}</code> is not registered.
            </p>
            <p className="text-sm text-gray-500">
              Please ensure the component is imported and registered using <code className="px-2 py-1 bg-gray-100 rounded">registerStepComponent()</code>.
            </p>

            {/* Fallback: Show generic form */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Step Information</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-700">Step Number</dt>
                  <dd className="text-sm text-gray-900">{step.number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-700">Title</dt>
                  <dd className="text-sm text-gray-900">{step.title}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-700">Description</dt>
                  <dd className="text-sm text-gray-900">{step.description}</dd>
                </div>
              </dl>

              <button
                onClick={onComplete}
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Mark as Complete (Fallback)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render step component with inline artifacts
  return (
    <>
      {/* Step Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Step Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">{resolvedTitle}</h2>
          <p className="text-sm text-gray-600 mt-1">{resolvedDescription}</p>
        </div>

        {/* Step Content */}
        <div className="p-6">
          <StepComponent
            data={data}
            executionId={executionId}
            customerId={customerId}
            onDataChange={onDataChange}
            onArtifactGenerated={onArtifactGenerated}
            onComplete={onComplete}
          />
        </div>
      </div>

      {/* Inline Artifacts (appear below step card) */}
      {step.artifacts && step.artifacts.length > 0 && templateContext && (
        <div className="space-y-4">
          {step.artifacts.map((artifact) => (
            <ArtifactRenderer
              key={artifact.id}
              artifact={artifact}
              context={templateContext}
              onAction={(actionId, data) => {
                console.log('[StepRenderer] Artifact action:', actionId, data);
                // Handle artifact actions (e.g., check task, void envelope, etc.)
              }}
              onRefresh={async (artifactId) => {
                console.log('[StepRenderer] Refresh artifact:', artifactId);
                // Implement refresh logic (fetch fresh data from API)
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};

// =====================================================
// Example Step Components
// =====================================================

/**
 * Example: Generic Form Step
 * This can be used as a template for building actual step components
 */
export const GenericFormStep: React.FC<StepComponentProps> = ({
  data = {},
  executionId,
  customerId,
  onDataChange,
  onComplete
}) => {
  const [formData, setFormData] = React.useState(data);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const prevExecutionIdRef = React.useRef(executionId);

  // Reset form data only when switching to a different step (executionId stays same, but we detect step change via data structure)
  // Use JSON stringify to detect actual data changes, not just reference changes
  const dataString = JSON.stringify(data);
  React.useEffect(() => {
    // Only reset if we're loading existing data from a different step
    if (Object.keys(data).length > 0 && JSON.stringify(formData) !== dataString) {
      setFormData(data);
    }
  }, [dataString]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus input on mount only
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []); // Empty array means only on mount

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataChange(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSubmitting) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Example Field
        </label>
        <input
          ref={inputRef}
          type="text"
          value={formData.exampleField || ''}
          onChange={(e) => handleChange('exampleField', e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter value and press Enter to continue..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </>
        ) : (
          'Complete Step'
        )}
      </button>
    </form>
  );
};

/**
 * Example: Loading Step
 * Shows loading state while data is being fetched
 */
export const LoadingStep: React.FC<StepComponentProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
      <p className="text-gray-600">Loading step content...</p>
    </div>
  );
};

// Register example components
registerStepComponent('GenericFormStep', GenericFormStep);
registerStepComponent('LoadingStep', LoadingStep);

// Register test components
registerStepComponent('CustomerAnalysisStep', CustomerAnalysisStep);

// Register Phase 2.4 step components
registerStepComponent('SimpleFormStep', SimpleFormStep);
registerStepComponent('ReviewStep', ReviewStep);

// Register Account Plan components
registerStepComponent('AccountPlanStep', AccountPlanStep);

// Register Phase 3G Chat components
registerStepComponent('ChatStep', ChatStep);
