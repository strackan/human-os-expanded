"use client";

import React, { useState } from 'react';

interface ScenarioDefinitionProps {
  scenarioName: string;
  setScenarioName: (name: string) => void;
}

interface CustomerSegmentationProps {
  selectedSegments: string[];
  setSelectedSegments: (segments: string[]) => void;
}

interface PriceActionDesignerProps {
  selectedSegments: string[];
}

const PriceIncreaseScenarioBuilder = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [scenarioName, setScenarioName] = useState('Q2 2025 Price Increase Strategy');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);

  const handleNextStep = () => {
    if (activeStep < 4) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return <ScenarioDefinition scenarioName={scenarioName} setScenarioName={setScenarioName} />;
      case 2:
        return <CustomerSegmentation selectedSegments={selectedSegments} setSelectedSegments={setSelectedSegments} />;
      case 3:
        return <PriceActionDesigner selectedSegments={selectedSegments} />;
      case 4:
        return <ImpactVisualization />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Scenario Builder</h1>
          
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                      ${activeStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {step}
                  </div>
                  <div className="text-xs mt-2 text-gray-600">
                    {step === 1 && 'Define Scenario'}
                    {step === 2 && 'Select Segments'}
                    {step === 3 && 'Set Price Actions'}
                    {step === 4 && 'Review Impact'}
                  </div>
                </div>
              ))}
            </div>
            <div className="relative mt-2">
              <div className="absolute h-1 w-full bg-gray-200 rounded"></div>
              <div 
                className="absolute h-1 bg-blue-600 rounded progress-bar"
                style={{ width: `${(activeStep - 1) * 33.33}%` }}
              ></div>
            </div>
          </div>
          
          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <button 
              onClick={handlePrevStep}
              disabled={activeStep === 1}
              className={`px-4 py-2 rounded ${activeStep === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Previous
            </button>
            <button 
              onClick={handleNextStep}
              className={`px-4 py-2 rounded ${activeStep === 4 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {activeStep === 4 ? 'Finalize Scenario' : 'Next Step'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScenarioDefinition: React.FC<ScenarioDefinitionProps> = ({ scenarioName, setScenarioName }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Define Your Scenario</h2>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scenario Name</label>
          <input 
            type="text" 
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-label="Scenario Name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500">Start Date</label>
              <input 
                type="date" 
                defaultValue="2025-06-01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                aria-label="Start Date"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500">End Date</label>
              <input 
                type="date" 
                defaultValue="2025-09-30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                aria-label="End Date"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Baseline Comparison</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-label="Baseline Comparison"
          >
            <option>Current pricing (as of May 2025)</option>
            <option>Previous quarter (Q1 2025)</option>
            <option>Previous year (Q2 2024)</option>
            <option>Custom baseline...</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Describe the goals and context of this scenario..."
            aria-label="Scenario Description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Builder Mode</label>
          <div className="flex space-x-4">
            <div className="flex-1 border border-blue-500 rounded-md p-4 bg-blue-50">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-blue-600 mr-2"></div>
                <span className="font-medium text-blue-800">Guided Wizard</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Step-by-step guidance with recommended settings</p>
            </div>
            <div className="flex-1 border border-gray-300 rounded-md p-4">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full border border-gray-400 mr-2"></div>
                <span className="font-medium text-gray-800">Advanced Builder</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Full control with custom parameters and conditions</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start">
        <div className="text-blue-500 mr-3">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-blue-800">AI Suggestion</h3>
          <p className="text-sm text-blue-700 mt-1">Based on your renewal patterns, we recommend focusing on Enterprise and Mid-Market segments for this quarter&apos;s price increase strategy.</p>
        </div>
      </div>
    </div>
  );
};

const CustomerSegmentation: React.FC<CustomerSegmentationProps> = ({ selectedSegments, setSelectedSegments }) => {
  const handleSegmentToggle = (segment: string) => {
    if (selectedSegments.includes(segment)) {
      setSelectedSegments(selectedSegments.filter((s: string) => s !== segment));
    } else {
      setSelectedSegments([...selectedSegments, segment]);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Customer Segments</h2>
      
      <div className="flex mb-6">
        <div className="w-2/3 pr-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div 
              className={`border p-4 rounded-md cursor-pointer ${selectedSegments.includes('Enterprise') ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onClick={() => handleSegmentToggle('Enterprise')}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Enterprise</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">62 customers</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Contract value: $100K+</li>
                <li>• Multi-year agreements</li>
                <li>• Full product suite</li>
              </ul>
            </div>
            
            <div 
              className={`border p-4 rounded-md cursor-pointer ${selectedSegments.includes('Mid-Market') ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onClick={() => handleSegmentToggle('Mid-Market')}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Mid-Market</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">147 customers</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Contract value: $25K-$100K</li>
                <li>• Annual agreements</li>
                <li>• Core + add-ons</li>
              </ul>
            </div>
            
            <div 
              className={`border p-4 rounded-md cursor-pointer ${selectedSegments.includes('SMB') ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onClick={() => handleSegmentToggle('SMB')}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">SMB</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">215 customers</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Contract value: $5K-$25K</li>
                <li>• Annual/monthly agreements</li>
                <li>• Core features only</li>
              </ul>
            </div>
            
            <div 
              className={`border p-4 rounded-md cursor-pointer ${selectedSegments.includes('New Customers') ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onClick={() => handleSegmentToggle('New Customers')}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">New Customers (&lt; 1 year)</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">83 customers</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Onboarded in past 12 months</li>
                <li>• First renewal upcoming</li>
                <li>• Across all segments</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="font-medium text-gray-800 mb-2">Create Custom Segment</h3>
            <div className="flex space-x-2">
              <button className="flex items-center text-sm text-blue-600 border border-blue-300 rounded px-3 py-1 hover:bg-blue-50">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Condition
              </button>
              <button className="flex items-center text-sm text-gray-600 border border-gray-300 rounded px-3 py-1 hover:bg-gray-100">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Advanced Filters
              </button>
            </div>
          </div>
        </div>
        
        <div className="w-1/3 bg-gray-50 border border-gray-200 rounded-md p-4">
          <h3 className="font-medium text-gray-800 mb-3">Selected Segments</h3>
          
          {selectedSegments.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No segments selected</p>
          ) : (
            <div className="space-y-2">
              {selectedSegments.map(segment => (
                <div key={segment} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                  <span>{segment}</span>
                  <button 
                    onClick={() => handleSegmentToggle(segment)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label={`Remove ${segment} segment`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Segment Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Customers:</span>
                <span className="font-medium">209</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total ARR:</span>
                <span className="font-medium">$12.4M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg. Contract Value:</span>
                <span className="font-medium">$59.3K</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Renewals Due (Q2):</span>
                <span className="font-medium">78</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start">
        <div className="text-blue-500 mr-3">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-blue-800">AI Suggestion</h3>
          <p className="text-sm text-blue-700 mt-1">Your Mid-Market segment has shown high feature adoption rates (92% of available features), indicating potential for higher price tolerance.</p>
        </div>
      </div>
    </div>
  );
};

const PriceActionDesigner: React.FC<PriceActionDesignerProps> = ({ selectedSegments }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Set Price Actions</h2>
      
      <div className="space-y-6">
        {selectedSegments.includes('Enterprise') && (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Enterprise Segment</h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">62 customers • $8.7M ARR</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Action Type</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Price Action Type"
                  >
                    <option>Percentage Increase</option>
                    <option>Flat Fee Increase</option>
                    <option>Tier Migration</option>
                    <option>Custom Formula</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Increase Percentage</label>
                  <div className="flex items-center">
                    <input 
                      type="number" 
                      defaultValue="7"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      aria-label="Increase Percentage"
                    />
                    <span className="ml-2 text-gray-700">%</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditional Rules (Optional)</label>
                <div className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center mb-2">
                    <select 
                      className="w-40 text-sm border border-gray-300 rounded-md mr-2"
                      aria-label="Condition Type"
                    >
                      <option>If Usage Rate is</option>
                      <option>If Health Score is</option>
                      <option>If Customer Age is</option>
                    </select>
                    <select 
                      className="w-32 text-sm border border-gray-300 rounded-md mr-2"
                      aria-label="Condition Operator"
                    >
                      <option>greater than</option>
                      <option>less than</option>
                      <option>equal to</option>
                    </select>
                    <input 
                      type="text" 
                      className="w-20 text-sm border border-gray-300 rounded-md mr-2" 
                      defaultValue="90"
                      aria-label="Condition Value" 
                    />
                    <span className="text-sm text-gray-600 mr-2">%, then</span>
                    <select 
                      className="w-40 text-sm border border-gray-300 rounded-md"
                      aria-label="Price Increase Action"
                    >
                      <option>use 9% increase</option>
                      <option>use 8% increase</option>
                      <option>use 7% increase</option>
                    </select>
                  </div>
                  <button className="text-blue-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Another Rule
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div>
                  <span className="block text-sm font-medium text-gray-700">Estimated Impact</span>
                  <span className="text-sm text-gray-600">Based on historical patterns</span>
                </div>
                <div className="flex space-x-6">
                  <div className="text-center">
                    <span className="text-sm text-gray-600">Revenue Gain</span>
                    <span className="text-green-600 font-medium">+ $609K</span>
                  </div>
                  <div className="text-center">
                    <span className="text-sm text-gray-600">Estimated Churn</span>
                    <span className="text-red-600 font-medium">- 1.2%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-sm text-gray-600">Net Impact</span>
                    <span className="text-green-600 font-medium">+ $602K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedSegments.includes('Mid-Market') && (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Mid-Market Segment</h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">147 customers • $3.2M ARR</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Action Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option>Percentage Increase</option>
                    <option>Flat Fee Increase</option>
                    <option>Tier Migration</option>
                    <option>Custom Formula</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Increase Percentage</label>
                  <div className="flex items-center">
                    <input 
                      type="number" 
                      defaultValue="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="ml-2 text-gray-700">%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div>
                  <span className="block text-sm font-medium text-gray-700">Estimated Impact</span>
                  <span className="text-sm text-gray-600">Based on historical patterns</span>
                </div>
                <div className="flex space-x-6">
                  <div className="text-center">
                    <span className="block text-sm text-gray-600">Revenue Gain</span>
                    <span className="text-green-600 font-medium">+ $185K</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-sm text-gray-600">Estimated Churn</span>
                    <span className="text-red-600 font-medium">- 2.4%</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-sm text-gray-600">Net Impact</span>
                    <span className="text-green-600 font-medium">+ $167K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start">
          <div className="text-blue-500 mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">AI Pricing Recommendation</h3>
            <p className="text-sm text-blue-700 mt-1">For Enterprise customers with 90%+ usage, our models suggest you could safely use a 9% increase with minimal churn risk (estimated 0.8%).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImpactVisualization: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Review Impact</h2>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="bg-gray-50 px-4 py-3">
            <h3 className="font-medium text-gray-800">Revenue Impact</h3>
          </div>
          <div className="p-4 flex justify-center items-center h-64">
            <div className="w-full max-w-xs">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Current ARR</span>
                  <span className="font-medium">$12.4M</span>
                </div>
                <div className="progress-bar-track bg-gray-200">
                  <div className="progress-bar-fill bg-blue-600 progress-bar" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">After Price Increase</span>
                  <span className="font-medium">$13.2M</span>
                </div>
                <div className="progress-bar-track bg-gray-200">
                  <div className="progress-bar-fill bg-green-600 progress-bar" style={{ width: '106%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceIncreaseScenarioBuilder; 