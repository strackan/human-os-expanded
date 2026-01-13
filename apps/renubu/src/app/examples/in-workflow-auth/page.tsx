'use client';

/**
 * In-Workflow Authentication Demo
 *
 * This page demonstrates how to use the InWorkflowAuth component
 * in different scenarios.
 */

import { useState } from 'react';
import { InWorkflowAuth, useInWorkflowAuth } from '@/components/auth';

export default function InWorkflowAuthDemo() {
  const { user, isAuthenticated, isLoading } = useInWorkflowAuth();
  const [scenario, setScenario] = useState<'modal' | 'sidebar' | 'step' | 'simple'>('simple');
  const [showAuth, setShowAuth] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [forceShowAuth, setForceShowAuth] = useState(false); // Demo mode: force show auth

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Simple scenario
  if (scenario === 'simple' && (!isAuthenticated || forceShowAuth)) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          {forceShowAuth && isAuthenticated && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Demo Mode:</strong> You're actually already signed in as <strong>{user?.email}</strong>,
                but showing the auth form for demo purposes.
              </p>
            </div>
          )}

          <InWorkflowAuth
            title="Welcome to Renubu"
            description="Sign in to access workflow demos and examples"
            onAuthSuccess={(user) => {
              console.log('✅ User authenticated:', user.email);
              setForceShowAuth(false); // Exit demo mode after auth
            }}
          />
          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => setScenario('modal')}
              className="block w-full text-sm text-indigo-600 hover:text-indigo-500"
            >
              Try other scenarios →
            </button>
            {isAuthenticated && !forceShowAuth && (
              <button
                onClick={() => setForceShowAuth(false)}
                className="block w-full text-sm text-gray-600 hover:text-gray-700"
              >
                Exit demo mode
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modal scenario
  if (scenario === 'modal') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Modal Scenario</h1>

          <button
            onClick={() => setShowAuth(!showAuth)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
          >
            {showAuth ? 'Close Modal' : 'Open Workflow Modal'}
          </button>

          {showAuth && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex">
                  {/* Left: Workflow */}
                  <div className="flex-1 p-6 border-r">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Contract Review Workflow
                    </h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Step 1: Upload Contract</h3>
                        <p className="text-sm text-gray-600">Upload your contract document...</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Step 2: AI Analysis</h3>
                        <p className="text-sm text-gray-600">Our AI will analyze key terms...</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Step 3: Review Results</h3>
                        <p className="text-sm text-gray-600">See insights and recommendations...</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Auth */}
                  {!isAuthenticated ? (
                    <div className="w-96 p-6 bg-gray-50">
                      <InWorkflowAuth
                        title="Sign in to continue"
                        description="Save your analysis and access advanced features"
                        onAuthSuccess={() => setShowAuth(false)}
                      />
                    </div>
                  ) : (
                    <div className="w-96 p-6 bg-green-50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl mb-4">✓</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          You're signed in!
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Welcome, {user?.email}
                        </p>
                        <button
                          onClick={() => setShowAuth(false)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
                        >
                          Continue Workflow
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t p-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowAuth(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={() => setScenario('sidebar')}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Try sidebar scenario →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar scenario
  if (scenario === 'sidebar') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Main content */}
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Sidebar Scenario</h1>
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold mb-4">Your Workflow Dashboard</h2>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 bg-white rounded-lg shadow">
                  <h3 className="font-semibold">Workflow {i}</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Sample workflow content...
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => setScenario('step')}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Try multi-step scenario →
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        {!isAuthenticated && (
          <div className="w-96 bg-white border-l p-6 shadow-lg">
            <InWorkflowAuth
              title="Sign in for full access"
              description="Create an account to save and manage your workflows"
              onAuthSuccess={() => {}}
            />
          </div>
        )}

        {isAuthenticated && (
          <div className="w-96 bg-white border-l p-6 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Welcome back!
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {user?.email}
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg text-left">
                  <div className="text-xs text-gray-500">Workflows completed</div>
                  <div className="text-lg font-semibold">12</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-left">
                  <div className="text-xs text-gray-500">Active workflows</div>
                  <div className="text-lg font-semibold">3</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Multi-step scenario
  if (scenario === 'step') {
    const steps = ['Info', 'Details', 'Review', 'Sign In', 'Complete'];

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Multi-Step Scenario</h1>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {steps.map((step, i) => (
                <div key={i} className="text-center">
                  <div
                    className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      i + 1 === currentStep
                        ? 'bg-indigo-600 text-white'
                        : i + 1 < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {i + 1 < currentStep ? '✓' : i + 1}
                  </div>
                  <div className="text-xs">{step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="bg-white rounded-lg shadow p-8">
            {currentStep < 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Step {currentStep}</h2>
                <p className="text-gray-600 mb-6">
                  This is step {currentStep} of the workflow. You can fill out forms, upload files, etc.
                </p>
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
                >
                  Continue
                </button>
              </div>
            )}

            {currentStep === 4 && !isAuthenticated && (
              <InWorkflowAuth
                title="Almost done! Sign in to complete"
                description="Create an account to save your work and complete the workflow"
                onAuthSuccess={() => setCurrentStep(5)}
              />
            )}

            {currentStep === 5 && (
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Workflow Complete!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your work has been saved to your account.
                </p>
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setScenario('simple');
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setCurrentStep(1);
                setScenario('simple');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              ← Back to simple scenario
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated state
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              You're Signed In!
            </h1>
            <p className="text-gray-600">
              Welcome, {user?.email}
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Try Different Scenarios:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setScenario('modal')}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left"
              >
                <h3 className="font-semibold mb-1">Modal</h3>
                <p className="text-sm text-gray-600">
                  Auth in a modal workflow
                </p>
              </button>
              <button
                onClick={() => setScenario('sidebar')}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left"
              >
                <h3 className="font-semibold mb-1">Sidebar</h3>
                <p className="text-sm text-gray-600">
                  Auth in a sidebar panel
                </p>
              </button>
              <button
                onClick={() => {
                  setScenario('step');
                  setCurrentStep(1);
                }}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left"
              >
                <h3 className="font-semibold mb-1">Multi-Step</h3>
                <p className="text-sm text-gray-600">
                  Auth as a workflow step
                </p>
              </button>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Demo Controls:</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setForceShowAuth(true);
                    setScenario('simple');
                  }}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm"
                >
                  Show Auth Form (Demo Mode)
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-sm"
                >
                  Sign Out
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use "Show Auth Form" to test the authentication UI while logged in
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
