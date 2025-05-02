import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  Scale, 
  Activity,
  Info,
  Link,
  DollarSign,
  ChevronRight,
  Shield
} from 'lucide-react';

const ContractAIAnalysis = () => {
  const [expandedSection, setExpandedSection] = useState('terms');
  
  const contractData = {
    name: 'Acme Corporation - Enterprise License Agreement',
    status: 'In Review',
    value: '$450,000',
    renewal: 'August 15, 2024',
    terms: [
      { 
        severity: 'high', 
        title: 'Unlimited Liability', 
        description: 'This contract contains unlimited liability provisions that expose your company to significant financial risk.',
        recommendation: 'Negotiate a liability cap not to exceed 12 months of fees paid.',
        location: 'Section 12.3, Page 14'
      },
      { 
        severity: 'medium', 
        title: 'Early Termination Fee', 
        description: 'Current early termination requires payment of 80% of remaining contract value.',
        recommendation: 'Negotiate a 60% fee with graduated reduction over time.',
        location: 'Section 8.2, Page 9' 
      },
      { 
        severity: 'low', 
        title: 'Auto-Renewal Clause', 
        description: 'Contract auto-renews with 90-day notice period, shorter than your standard 120 days.',
        recommendation: 'Extend notice period to 120 days to align with internal processes.',
        location: 'Section 5.1, Page 6'
      }
    ],
    pricing: [
      {
        title: 'Price Increase Cap',
        description: 'Contract limits annual price increases to 3%, below industry average of 5-7%.',
        impact: '+$15,000 potential revenue',
        recommendation: 'Raise cap to 5% for future years.'
      },
      {
        title: 'Custom Discount',
        description: 'Current 25% discount exceeds authorized tier for customer size.',
        impact: '+$22,500 potential revenue',
        recommendation: 'Gradually reduce to 15% discount over next two renewal cycles.'
      }
    ],
    compliance: [
      {
        title: 'Data Processing Addendum',
        description: 'Using previous version of our DPA.',
        impact: 'Regulatory risk',
        recommendation: 'Update to latest version with GDPR and CCPA provisions.'
      },
      {
        title: 'Security Requirements',
        description: 'Customer requires SOC 2 Type II certification.',
        impact: 'Meets current standards',
        status: 'Compliant'
      }
    ]
  };
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };
  
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'medium':
        return <Clock className="h-5 w-5" />;
      case 'low':
        return <Info className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{contractData.name}</h1>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 mr-3">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {contractData.status}
            </span>
            <span className="mr-3">Value: {contractData.value}</span>
            <span>Renewal: {contractData.renewal}</span>
          </div>
        </div>
        <div className="flex items-center">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            AI Analysis
          </span>
        </div>
      </div>
      
      {/* Analysis Summary */}
      <div className="my-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-medium text-blue-900">AI Contract Analysis</h2>
            <p className="mt-1 text-sm text-blue-700">
              This contract has 3 terms requiring attention and 2 pricing optimization opportunities. 
              Addressing these issues could increase contract value by approximately $37,500.
            </p>
          </div>
        </div>
      </div>
      
      {/* Analysis Sections */}
      <div className="divide-y divide-gray-200">
        {/* Contract Terms Section */}
        <div className="py-4">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setExpandedSection(expandedSection === 'terms' ? '' : 'terms')}
          >
            <div className="flex items-center">
              <Scale className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Contract Terms</h3>
              <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                3 issues
              </span>
            </div>
            <ChevronRight className={`h-5 w-5 text-gray-500 transform ${expandedSection === 'terms' ? 'rotate-90' : ''}`} />
          </button>
          
          {expandedSection === 'terms' && (
            <div className="mt-4 space-y-4">
              {contractData.terms.map((term, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(term.severity)}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {getSeverityIcon(term.severity)}
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium">{term.title}</h4>
                      <p className="mt-1 text-sm text-gray-600">{term.description}</p>
                      <div className="mt-2 text-sm text-gray-500 flex">
                        <Link className="h-4 w-4 mr-1" />
                        {term.location}
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs font-medium text-gray-500">RECOMMENDATION</span>
                        <p className="mt-1 text-sm">{term.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pricing Optimization Section */}
        <div className="py-4">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setExpandedSection(expandedSection === 'pricing' ? '' : 'pricing')}
          >
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Pricing Optimization</h3>
              <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                $37,500 opportunity
              </span>
            </div>
            <ChevronRight className={`h-5 w-5 text-gray-500 transform ${expandedSection === 'pricing' ? 'rotate-90' : ''}`} />
          </button>
          
          {expandedSection === 'pricing' && (
            <div className="mt-4 space-y-4">
              {contractData.pricing.map((item, index) => (
                <div key={index} className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex">
                    <div className="flex-shrink-0 text-green-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium">{item.title}</h4>
                        <span className="text-sm font-medium text-green-700">{item.impact}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs font-medium text-gray-500">RECOMMENDATION</span>
                        <p className="mt-1 text-sm">{item.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Compliance Section */}
        <div className="py-4">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setExpandedSection(expandedSection === 'compliance' ? '' : 'compliance')}
          >
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Compliance</h3>
              <span className="ml-2 inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
                1 issue
              </span>
            </div>
            <ChevronRight className={`h-5 w-5 text-gray-500 transform ${expandedSection === 'compliance' ? 'rotate-90' : ''}`} />
          </button>
          
          {expandedSection === 'compliance' && (
            <div className="mt-4 space-y-4">
              {contractData.compliance.map((item, index) => (
                <div key={index} className={`p-4 rounded-lg border ${item.status === 'Compliant' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {item.status === 'Compliant' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium">{item.title}</h4>
                      <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                      <div className="mt-2 text-sm font-medium">
                        <span className={item.status === 'Compliant' ? 'text-green-600' : 'text-yellow-600'}>
                          Impact: {item.impact || 'None'}
                        </span>
                      </div>
                      {item.recommendation && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-xs font-medium text-gray-500">RECOMMENDATION</span>
                          <p className="mt-1 text-sm">{item.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
          Export Analysis
        </button>
        <button className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700">
          Apply Recommendations
        </button>
      </div>
    </div>
  );
};

export default ContractAIAnalysis;