"use client";
import React, { useRef, useState, useEffect } from "react";
import { CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, HandRaisedIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkflowEngine, Customer, Workflow } from '../../../lib/workflowEngine';

// Component for displaying customer information
const CustomerCard = ({ customer }: { customer: Customer | null }) => {
  // Don't render if customer is not available
  if (!customer) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{customer.name || 'Unknown Customer'}</h2>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
          {customer.tier || 'standard'}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Industry:</span>
          <span className="font-medium">{customer.industry || 'Not specified'}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Health Score:</span>
          <span className={`font-medium ${getHealthColor(customer.health_score || 0)}`}>
            {customer.health_score || 0}/100
          </span>
        </div>
        
        {customer.renewal_date && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Renewal Date:</span>
            <span className="font-medium">
              {new Date(customer.renewal_date).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {customer.current_arr && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Current ARR:</span>
            <span className="font-medium">${customer.current_arr.toLocaleString()}</span>
          </div>
        )}
        
        {customer.risk_level && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Risk Level:</span>
            <span className={`font-medium ${getRiskColor(customer.risk_level)}`}>
              {customer.risk_level.charAt(0).toUpperCase() + customer.risk_level.slice(1)}
            </span>
          </div>
        )}
        
        {customer.primary_contact_name && (
          <div className="text-sm text-gray-500">
            Contact: {customer.primary_contact_name}
          </div>
        )}
      </div>
    </div>
  );
};

// Component for displaying workflow steps
const WorkflowSteps = ({ workflow, onStepComplete }: { workflow: Workflow | null; onStepComplete: (stepId: string) => void }) => {
  // Don't render if workflow is not available
  if (!workflow) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication': return '💬';
      case 'analysis': return '📊';
      case 'action': return '⚡';
      case 'follow_up': return '📋';
      default: return '📝';
    }
  };

  // Ensure we have default values for potentially undefined properties
  const riskFactors = workflow.risk_factors || [];
  const recommendations = workflow.recommendations || [];
  const steps = workflow.steps || [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{workflow.title || 'Workflow'}</h2>
        <p className="text-gray-600 mb-4">{workflow.description || 'No description available'}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>Priority Score: <span className="font-medium text-gray-900">{workflow.priority_score || 0}/100</span></span>
          <span>Est. Time: <span className="font-medium text-gray-900">{workflow.estimated_completion_time || 0} min</span></span>
        </div>
      </div>

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            Risk Factors
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            {riskFactors.map((risk, index) => (
              <li key={index}>• {risk}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Recommendations</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Workflow Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Workflow Steps</h3>
        {steps.length > 0 ? (
          steps.map((step) => (
            <div key={step.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <button
                    onClick={() => onStepComplete(step.id)}
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      step.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {step.completed && <CheckCircleIcon className="h-3 w-3" />}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm">{getCategoryIcon(step.category || 'action')}</span>
                      <h4 className={`font-medium ${step.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {step.title || 'Untitled Step'}
                      </h4>
                      <span className={`text-xs font-medium ${getPriorityColor(step.priority || 'medium')}`}>
                        {step.priority || 'medium'}
                      </span>
                      {step.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${step.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                      {step.description || 'No description available'}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      Estimated time: {step.estimated_time || 0} minutes
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No workflow steps available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TaskManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTask, setCurrentTask] = useState<{ customer: Customer; workflow: Workflow } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [panelWidth, setPanelWidth] = useState(50);
  const isDragging = useRef(false);

  // Check if we're launching a specific customer workflow
  const customerId = searchParams.get('customer');
  const isLaunchMode = searchParams.get('launch') === 'true';

  useEffect(() => {
    if (isLaunchMode && customerId) {
      loadCustomerWorkflow(customerId);
    } else {
      loadNextTask();
    }
  }, [customerId, isLaunchMode]);

  const loadCustomerWorkflow = async (customerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch customer data
      const customerResponse = await fetch('/api/customers');
      if (!customerResponse.ok) {
        throw new Error('Failed to fetch customer data');
      }
      
      const customerData = await customerResponse.json();
      const customer = customerData.customers.find((c: Customer) => c.id === customerId);
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate workflow for this customer
      const workflow = WorkflowEngine.generateWorkflow(customer);
      
      setCurrentTask({ customer, workflow });
    } catch (err) {
      setError('Failed to load customer workflow');
      console.error('Error loading customer workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNextTask = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tasks/next');
      if (!response.ok) {
        throw new Error('Failed to fetch next task');
      }
      
      const data = await response.json();
      setCurrentTask(data.task);
    } catch (err) {
      setError('Failed to load next task');
      console.error('Error fetching task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!currentTask) return;
    
    setCompleting(true);
    try {
      const response = await fetch(`/api/tasks/${currentTask.workflow.id}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        // If we're in launch mode, go back to customer management
        if (isLaunchMode) {
          router.push('/customers/manage');
        } else {
          // Load the next task
          loadNextTask();
        }
      }
    } catch (err) {
      console.error('Error completing task:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleStepComplete = (stepId: string) => {
    if (!currentTask) return;
    
    const updatedWorkflow = {
      ...currentTask.workflow,
      steps: currentTask.workflow.steps.map(step =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )
    };
    
    setCurrentTask({ ...currentTask, workflow: updatedWorkflow });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    
    const container = document.getElementById('task-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    setPanelWidth(Math.max(20, Math.min(80, newWidth)));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = "default";
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HandRaisedIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => isLaunchMode ? router.push('/customers/manage') : loadNextTask()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {isLaunchMode ? 'Back to Customers' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Available</h2>
          <p className="text-gray-600 mb-4">All tasks have been completed!</p>
          <button
            onClick={() => router.push('/customers/manage')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
              <p className="text-gray-600">Complete your highest priority customer tasks</p>
            </div>
            <div className="flex items-center space-x-4">
              {isLaunchMode && (
                <button
                  onClick={() => router.push('/customers/manage')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back to Customers
                </button>
              )}
              <button
                onClick={handleCompleteTask}
                disabled={completing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {completing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Complete Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="task-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex h-[calc(100vh-200px)]">
          {/* Customer Panel */}
          <div style={{ width: `${panelWidth}%` }} className="pr-4">
            <CustomerCard customer={currentTask?.customer || null} />
          </div>

          {/* Resizable Divider */}
          <div
            className="relative w-6 h-[calc(100vh-200px)] flex items-center justify-center bg-transparent cursor-col-resize group pointer-events-auto transition-colors duration-150"
            style={{ marginLeft: '-1px', marginRight: '-1px' }}
            onMouseDown={handleMouseDown}
            tabIndex={0}
            aria-label="Resize panel"
            role="separator"
          >
            <div className="h-6 w-2 relative rounded-full border border-gray-300 bg-gray-100 shadow transition duration-200 group-hover:delay-75 group-hover:border-orange-700 group-hover:bg-orange-700 cursor-col-resize"></div>
          </div>

          {/* Workflow Panel */}
          <div style={{ width: `${100 - panelWidth}%` }} className="pl-4">
            <WorkflowSteps 
              workflow={currentTask?.workflow || null}
              onStepComplete={handleStepComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 