'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, Calendar, CheckCircle, AlertTriangle, Target } from 'lucide-react';

interface Scenario {
  id: 'conservative' | 'balanced' | 'aggressive';
  name: string;
  recommended?: boolean;
  seatsChange: { from: number; to: number; percent: number };
  priceChange: { from: number; to: number; percent: number };
  arrChange: { from: number; to: number; percent: number };
  term: string;
  positioning: string;
  riskLevel: 'low' | 'medium' | 'high';
  justification: string[];
}

interface ExpansionProposalArtifactProps {
  customerName: string;
  scenarios: Scenario[];
  currentARR: number;
  currentSeats: number;
  currentPrice: number;
  onScenarioSelect?: (scenarioId: string) => void;
  onContinue?: () => void;
  onBack?: () => void;
}

export default function ExpansionProposalArtifact({
  customerName,
  scenarios,
  onScenarioSelect,
  onContinue,
  onBack
}: ExpansionProposalArtifactProps) {
  const [expandedScenarios, setExpandedScenarios] = useState<string[]>(['balanced']);
  const [selectedScenario, setSelectedScenario] = useState<string>('balanced');

  const toggleScenario = (id: string) => {
    setExpandedScenarios(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const handleSelect = (id: string) => {
    setSelectedScenario(id);
    onScenarioSelect?.(id);
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'high': return 'text-red-600 bg-red-50';
    }
  };

  const getScenarioColor = (id: string, recommended?: boolean) => {
    if (selectedScenario === id) {
      return 'border-blue-300 bg-blue-50/30';
    }
    if (recommended) {
      return 'border-blue-200 bg-blue-50/10';
    }
    return 'border-gray-200 bg-white';
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-medium text-gray-900">Expansion Proposal</h2>
        </div>
        <p className="text-sm text-gray-500">
          Three scenarios for {customerName}&apos;s capacity and pricing optimization
        </p>
      </div>

      {/* Scenarios */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl space-y-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`border-2 rounded-lg transition-all ${getScenarioColor(scenario.id, scenario.recommended)}`}
            >
              {/* Scenario Header */}
              <button
                onClick={() => toggleScenario(scenario.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Selection Radio */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(scenario.id);
                    }}
                    className="flex-shrink-0"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedScenario === scenario.id
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {selectedScenario === scenario.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </button>

                  {/* Scenario Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        Scenario {scenario.id === 'conservative' ? 'A' : scenario.id === 'balanced' ? 'B' : 'C'}: {scenario.name}
                      </h3>
                      {scenario.recommended && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Recommended
                        </span>
                      )}
                    </div>
                    {!expandedScenarios.includes(scenario.id) && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{scenario.positioning}</p>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-6 text-xs">
                    <div className="text-right">
                      <p className="text-gray-500">ARR</p>
                      <p className="font-medium text-gray-900">+{scenario.arrChange.percent}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Seats</p>
                      <p className="font-medium text-gray-900">+{scenario.seatsChange.percent}%</p>
                    </div>
                  </div>
                </div>

                {/* Expand Icon */}
                {expandedScenarios.includes(scenario.id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                )}
              </button>

              {/* Expanded Content */}
              {expandedScenarios.includes(scenario.id) && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-gray-50/30 space-y-4">
                  {/* Positioning Statement */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Positioning</p>
                    <p className="text-sm text-gray-900">{scenario.positioning}</p>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-700 mb-3">Financial Impact</p>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {/* Seats */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Seats</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-gray-900">{scenario.seatsChange.to}</span>
                          <span className="text-xs text-gray-500">from {scenario.seatsChange.from}</span>
                        </div>
                        <p className="text-xs text-green-600 font-medium mt-0.5">+{scenario.seatsChange.percent}%</p>
                      </div>

                      {/* Price per Seat */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Price/Seat</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-gray-900">${scenario.priceChange.to}</span>
                          <span className="text-xs text-gray-500">from ${scenario.priceChange.from}</span>
                        </div>
                        <p className="text-xs text-blue-600 font-medium mt-0.5">+{scenario.priceChange.percent}%</p>
                      </div>

                      {/* Annual ARR */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Annual ARR</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-gray-900">${(scenario.arrChange.to / 1000).toFixed(0)}K</span>
                          <span className="text-xs text-gray-500">from ${(scenario.arrChange.from / 1000).toFixed(0)}K</span>
                        </div>
                        <p className="text-xs text-green-600 font-medium mt-0.5">+{scenario.arrChange.percent}%</p>
                      </div>
                    </div>

                    {/* Term & Risk */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">Term:</span>
                        <span className="font-medium text-gray-900">{scenario.term}</span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(scenario.riskLevel)}`}>
                        {scenario.riskLevel.toUpperCase()} RISK
                      </div>
                    </div>
                  </div>

                  {/* ROI Justification */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-gray-400" />
                      Value Justification
                    </p>
                    <ul className="space-y-2">
                      {scenario.justification.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risk Considerations */}
                  {scenario.riskLevel !== 'low' && (
                    <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-amber-900 mb-1">Risk Considerations</p>
                          <p className="text-xs text-amber-700">
                            {scenario.riskLevel === 'high'
                              ? 'Significant price increase may trigger competitive evaluation. Ensure strong value narrative and executive alignment.'
                              : 'Moderate price adjustment requires clear value justification and ROI demonstration.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selection Note */}
        <div className="max-w-4xl mt-6 bg-blue-50/50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">Choose Your Approach</p>
              <p className="text-xs text-gray-700">
                Review each scenario and select the one that best aligns with your relationship,
                their growth trajectory, and competitive positioning. The recommended scenario
                balances revenue optimization with relationship preservation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
          >
            Back
          </button>
        )}

        <div className="flex-1"></div>

        {onContinue && (
          <button
            onClick={onContinue}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
          >
            Continue
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
