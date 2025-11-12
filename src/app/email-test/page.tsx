'use client';

/**
 * Email Orchestration Test Page
 *
 * Simple test harness for AI email generation.
 * Access at: http://localhost:3000/email-test
 */

import React, { useState } from 'react';
import EmailArtifact from '@/components/artifacts/EmailArtifact';

// Demo customer IDs (Obsidian Black and others from seed data)
const DEMO_CUSTOMERS = [
  { id: 'obsidian-black-demo-id', name: 'Obsidian Black' },
  { id: 'test-customer-1', name: 'Test Customer 1' },
  { id: 'test-customer-2', name: 'Test Customer 2' },
];

export default function EmailTestPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState(DEMO_CUSTOMERS[0].id);
  const [showEmail, setShowEmail] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email Orchestration Test Page
          </h1>
          <p className="text-gray-600">
            Test AI-powered email generation with Claude Haiku 4.5
          </p>
        </div>

        {/* Controls */}
        {!showEmail && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Test Customer
            </h2>

            <div className="space-y-3 mb-6">
              {DEMO_CUSTOMERS.map((customer) => (
                <label
                  key={customer.id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="customer"
                    value={customer.id}
                    checked={selectedCustomerId === customer.id}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-gray-900 font-medium">
                    {customer.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({customer.id})
                  </span>
                </label>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                💡 Testing Instructions
              </h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Select a customer above</li>
                <li>Click "Launch Email Composer" below</li>
                <li>Click the "Generate with AI" button</li>
                <li>Select an email type (e.g., Renewal Kickoff)</li>
                <li>Optionally add custom instructions</li>
                <li>Click "Generate Email"</li>
                <li>Watch the AI-generated email appear!</li>
              </ol>
            </div>

            <button
              onClick={() => setShowEmail(true)}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Launch Email Composer
            </button>
          </div>
        )}

        {/* Email Artifact */}
        {showEmail && (
          <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: '800px' }}>
            <EmailArtifact
              to="customer@example.com"
              subject=""
              body=""
              customerId={selectedCustomerId}
              enableAIGeneration={true}
              onCompose={() => {
                setShowEmail(false);
                alert('Email composed! (Demo mode)');
              }}
              onBack={() => setShowEmail(false)}
            />
          </div>
        )}

        {/* Debug Info */}
        {showEmail && (
          <div className="mt-6 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              🔧 Debug Info
            </h3>
            <div className="text-xs text-gray-600 space-y-1 font-mono">
              <div>Customer ID: {selectedCustomerId}</div>
              <div>AI Generation: Enabled</div>
              <div>API Endpoint: /api/workflows/email/generate</div>
              <div>Model: Claude Haiku 4.5 (claude-haiku-4-5-20251001)</div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!showEmail && (
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              📋 What This Tests
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>AnthropicService</strong> - Claude API integration</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>EmailOrchestrationService</strong> - Customer context fetching</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Email Prompt Templates</strong> - 5 type-specific prompts</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Email Generation API</strong> - /api/workflows/email/generate</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>EmailTypeSelector UI</strong> - Modal component</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span><strong>Enhanced EmailArtifact</strong> - AI button integration</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
