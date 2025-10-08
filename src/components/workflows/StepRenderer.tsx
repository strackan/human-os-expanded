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

// Step components will be registered here
const STEP_COMPONENTS: { [key: string]: React.ComponentType<StepComponentProps> } = {};

// =====================================================
// Types
// =====================================================

export interface StepComponentProps {
  data?: any;
  executionId: string;
  onDataChange: (data: any) => void;
  onArtifactGenerated: (artifact: any) => void;
  onComplete: () => void;
}

export interface StepRendererProps {
  step: WorkflowStep;
  data?: any;
  executionId: string;
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
  onDataChange,
  onArtifactGenerated,
  onComplete
}) => {
  const StepComponent = STEP_COMPONENTS[step.component];

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

  // Render step component
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Step Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">{step.title}</h2>
        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
      </div>

      {/* Step Content */}
      <div className="p-6">
        <StepComponent
          data={data}
          executionId={executionId}
          onDataChange={onDataChange}
          onArtifactGenerated={onArtifactGenerated}
          onComplete={onComplete}
        />
      </div>
    </div>
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
  onDataChange,
  onComplete
}) => {
  const [formData, setFormData] = React.useState(data);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Reset form data when prop data changes (new step loaded)
  React.useEffect(() => {
    setFormData(data);
  }, [data]);

  // Auto-focus input on mount and when form resets
  React.useEffect(() => {
    inputRef.current?.focus();
  }, [data]);

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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
