'use client';

import { useState, useEffect } from 'react';
import { PricingRecommendation } from '@/components/workflows/library/composite/PricingRecommendation';
import { HealthDashboard } from '@/components/workflows/library/composite/HealthDashboard';
import { StakeholderMap } from '@/components/workflows/library/composite/StakeholderMap';

export default function TestPricingPage() {
  // TODO: Replace with your test customer ID after creating test customer in database
  const [customerId] = useState('REPLACE_WITH_YOUR_CUSTOMER_ID');
  const [pricingData, setPricingData] = useState<any>(null);
  const [selectedScenario, setSelectedScenario] = useState<'Conservative' | 'Recommended' | 'Aggressive' | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPricing() {
      // Skip if customer ID not set
      if (customerId === 'REPLACE_WITH_YOUR_CUSTOMER_ID') {
        setError('Please replace customerId with your test customer ID from database');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/workflows/pricing/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            csmInputs: {
              risk_tolerance: 'moderate'
            },
            storeRecommendation: false // Don't store during testing
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'API returned unsuccessful response');
        }

        setPricingData(data.recommendation);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to fetch pricing:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPricing();
  }, [customerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing recommendation...</p>
          <p className="text-sm text-gray-500 mt-2">This may take up to 5 seconds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-2xl">
          <h2 className="text-red-800 font-bold text-xl mb-3">⚠️ Error Loading Pricing Data</h2>
          <div className="bg-white rounded p-4 mb-4">
            <p className="text-red-600 font-mono text-sm">{error}</p>
          </div>

          <div className="space-y-4 text-sm text-gray-700">
            <p className="font-semibold">Troubleshooting Checklist:</p>
            <ol className="list-decimal ml-5 space-y-2">
              <li>
                <strong>Database Migration Applied?</strong>
                <p className="text-gray-600 mt-1">
                  Go to Supabase Dashboard → SQL Editor<br/>
                  Run: <code className="bg-gray-100 px-2 py-1 rounded">supabase/migrations/20250128000001_pricing_optimization_engine.sql</code>
                </p>
              </li>
              <li>
                <strong>Test Customer Created?</strong>
                <p className="text-gray-600 mt-1">
                  See docs/testing/UI_TESTING_CHECKPOINT_1.md for SQL to create test customer
                </p>
              </li>
              <li>
                <strong>Customer ID Set?</strong>
                <p className="text-gray-600 mt-1">
                  Update line 9 of this file with your customer UUID
                </p>
              </li>
              <li>
                <strong>API Endpoint Working?</strong>
                <p className="text-gray-600 mt-1">
                  Check: <code className="bg-gray-100 px-2 py-1 rounded">src/app/api/workflows/pricing/recommend/route.ts</code> exists
                </p>
              </li>
              <li>
                <strong>Supabase Connection?</strong>
                <p className="text-gray-600 mt-1">
                  Verify .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
                </p>
              </li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <strong>📖 Full Testing Guide:</strong> See <code>docs/testing/UI_TESTING_CHECKPOINT_1.md</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!pricingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No pricing data available</p>
          <p className="text-sm text-gray-500 mt-2">Recommendation may have returned empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                🧪 Pricing Optimization - UI Test
              </h1>
              <p className="text-blue-100">
                Testing composite components with live pricing engine data
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Checkpoint 1</div>
              <div className="text-2xl font-bold">50% Complete</div>
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-semibold mb-2">
            📋 Follow the testing checklist in <code className="bg-yellow-100 px-2 py-1 rounded">docs/testing/UI_TESTING_CHECKPOINT_1.md</code>
          </p>
          <p className="text-sm text-yellow-700">
            Check off each item as you test. Document any issues you find.
          </p>
        </div>

        {/* Component 1: PricingRecommendation */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Test 1: PricingRecommendation Component
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Core value proposition - pricing optimization recommendations
            </p>
          </div>

          <PricingRecommendation
            recommendation={pricingData}
            currentARR={100000}
            customerName="Acme Corp (Test)"
            selectedScenario={selectedScenario}
            onSelectScenario={setSelectedScenario}
            showFactors
            showDataQuality
          />
        </div>

        {/* Selection Feedback */}
        {selectedScenario && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <h3 className="text-lg font-bold text-green-900">
                  Scenario Selection Working!
                </h3>
                <p className="text-green-700 mt-1">
                  Selected: <span className="font-bold">{selectedScenario}</span>
                </p>
                <p className="text-sm text-green-600 mt-2">
                  In a real workflow, this selection would be saved to the execution context
                  and used to generate the final renewal proposal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Component 2: HealthDashboard */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Test 2: HealthDashboard Component
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Customer health overview with risk factors
            </p>
          </div>

          <HealthDashboard
            customerName="Acme Corp (Test)"
            overallHealth={75}
            metrics={{
              usageGrowth: 12.5,
              featureAdoption: 75,
              userAdoption: { active: 85, total: 100 },
              supportTickets: { current: 3, trend: 'decreasing' },
              sentimentScore: 78,
              engagementTrend: 'up'
            }}
            riskFactors={{
              churnRiskScore: 30,
              budgetPressure: 'low',
              competitiveThreat: 'loyal',
              contractDaysRemaining: 60
            }}
            usage={{
              lastLoginDays: 2,
              activeFeatures: 18,
              totalFeatures: 25
            }}
          />
        </div>

        {/* Component 3: StakeholderMap */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Test 3: StakeholderMap Component
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Relationship mapping and stakeholder analysis
            </p>
          </div>

          <StakeholderMap
            stakeholders={[
              {
                name: 'Sarah Johnson',
                title: 'VP of Operations',
                role: 'champion',
                influence: 9,
                sentiment: 'positive',
                engagement: 'high',
                department: 'Operations',
                notes: 'Strong advocate for our platform. Led the initial implementation.'
              },
              {
                name: 'Michael Chen',
                title: 'CFO',
                role: 'decision_maker',
                influence: 10,
                sentiment: 'neutral',
                engagement: 'medium',
                department: 'Finance',
                notes: 'Budget holder. Focused on ROI and cost justification.'
              },
              {
                name: 'Emily Rodriguez',
                title: 'Head of IT',
                role: 'influencer',
                influence: 7,
                sentiment: 'positive',
                engagement: 'high',
                department: 'IT',
                notes: 'Technical decision maker. Appreciates our integration capabilities.'
              },
              {
                name: 'David Kim',
                title: 'Operations Manager',
                role: 'user',
                influence: 5,
                sentiment: 'positive',
                engagement: 'high',
                department: 'Operations',
                notes: 'Power user. Provides excellent feedback.'
              },
              {
                name: 'Lisa Martinez',
                title: 'Senior Analyst',
                role: 'user',
                influence: 4,
                sentiment: 'neutral',
                engagement: 'medium',
                department: 'Operations'
              }
            ]}
            customerName="Acme Corp (Test)"
            relationshipStrength={8}
            onStakeholderClick={(stakeholder) => {
              console.log('Stakeholder clicked:', stakeholder);
              alert(`Clicked: ${stakeholder.name} (${stakeholder.role})`);
            }}
          />
        </div>

        {/* Test Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🎯 Test Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-semibold text-gray-600">Components Tested</div>
              <div className="text-2xl font-bold text-gray-900">3 / 3</div>
            </div>
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <div className="text-3xl mb-2">🧱</div>
              <div className="text-sm font-semibold text-gray-600">Atomic Components Used</div>
              <div className="text-2xl font-bold text-gray-900">27</div>
            </div>
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <div className="text-3xl mb-2">♻️</div>
              <div className="text-sm font-semibold text-gray-600">Reusability</div>
              <div className="text-2xl font-bold text-gray-900">88%</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
            <ol className="list-decimal ml-5 space-y-1 text-sm text-blue-800">
              <li>Complete all tests in UI_TESTING_CHECKPOINT_1.md</li>
              <li>Test responsive design (resize browser)</li>
              <li>Test with different customer data profiles</li>
              <li>Document any issues found</li>
              <li>Once tests pass, proceed to Week 4-5 (Step Templates)</li>
            </ol>
          </div>
        </div>

        {/* Debug Info */}
        <details className="bg-gray-100 rounded-lg p-4">
          <summary className="cursor-pointer font-semibold text-gray-700">
            🐛 Debug Information (Click to expand)
          </summary>
          <div className="mt-4 space-y-2 text-sm">
            <div className="bg-white p-3 rounded">
              <strong>Customer ID:</strong> <code>{customerId}</code>
            </div>
            <div className="bg-white p-3 rounded">
              <strong>Recommendation Data:</strong>
              <pre className="mt-2 text-xs overflow-x-auto">
                {JSON.stringify(pricingData, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
