'use client';

import React, { useState } from 'react';

const MonteCarloSimulation = () => {
  const [activeTab, setActiveTab] = useState('parameters');
  
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Monte Carlo Simulation</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Scenario: Q2 2025 Price Increase</span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">Save Analysis</button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('parameters')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'parameters'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Simulation Parameters
              </button>
              <button
                onClick={() => setActiveTab('distributions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'distributions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Probability Distributions
              </button>
              <button
                onClick={() => setActiveTab('constraints')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'constraints'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Constraints
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Simulation Results
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'parameters' && <ParametersTab />}
            {activeTab === 'distributions' && <DistributionsTab />}
            {activeTab === 'constraints' && <ConstraintsTab />}
            {activeTab === 'results' && <ResultsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

const ParametersTab = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Simulation Parameters</h2>
        <button className="flex items-center text-blue-600 text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Load Template
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Simulations</label>
            <div className="flex items-center">
              <input
                type="number"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                defaultValue="10000"
                aria-label="Number of Simulations"
              />
              <div className="ml-2 bg-blue-50 px-3 py-2 rounded-md">
                <span className="text-sm text-blue-700">Higher = More Accurate</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Recommended: 10,000 for accurate results</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Level</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              aria-label="Confidence Level"
            >
              <option>90% Confidence</option>
              <option selected>95% Confidence</option>
              <option>99% Confidence</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Determines range width in results</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Horizon</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              aria-label="Time Horizon"
            >
              <option>Next 3 months</option>
              <option selected>Next 6 months</option>
              <option>Next 12 months</option>
              <option>Custom time period...</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Segments Included</label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <div className="flex flex-wrap gap-2">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                  Enterprise
                  <button 
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    aria-label="Remove Enterprise segment"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                  Mid-Market
                  <button 
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    aria-label="Remove Mid-Market segment"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <button 
                  className="border border-blue-300 text-blue-600 px-3 py-1 rounded-full text-sm hover:bg-blue-50"
                  aria-label="Add new segment"
                >
                  + Add Segment
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="border border-gray-200 rounded-md">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-medium text-gray-800">Variables to Model</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-600 rounded-sm mr-2"></div>
                    <span className="font-medium">Price Increase Percentage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Range: 3% - 12%</span>
                    <button 
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Edit Price Increase Percentage"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-sm mr-2"></div>
                    <span className="font-medium">Churn Rate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Range: 0.5% - 5%</span>
                    <button 
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Edit Churn Rate"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-sm mr-2"></div>
                    <span className="font-medium">Expansion Revenue</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Range: 2% - 8%</span>
                    <button className="text-gray-500 hover:text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <button className="w-full flex items-center justify-center py-2 text-blue-600 hover:bg-blue-50 rounded">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Variable
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <div className="text-blue-500 mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">AI Parameter Suggestion</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Based on your historical data, we recommend adding &quot;Feature Usage Rate&quot; as a variable, as it has strong correlation with churn risk during price increases.
                </p>
                <button className="mt-2 text-sm text-blue-800 font-medium hover:text-blue-900">Add Suggested Variable</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Continue to Distributions
        </button>
      </div>
    </div>
  );
};

const DistributionsTab = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Probability Distributions</h2>
      {/* Add distribution configuration UI here */}
      <div className="text-gray-600">Distribution configuration coming soon...</div>
    </div>
  );
};

const ConstraintsTab = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Simulation Constraints</h2>
      {/* Add constraints configuration UI here */}
      <div className="text-gray-600">Constraints configuration coming soon...</div>
      </div>
  );
};

const ResultsTab = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Simulation Results</h2>
      {/* Add results visualization UI here */}
      <div className="text-gray-600">Results visualization coming soon...</div>
            </div>
  );
};

export default MonteCarloSimulation;