/**
 * Recommendations Artifact Component
 *
 * Priority 2 artifact for demo
 * Display AI recommendations with "Create Task" action buttons
 *
 * Features:
 * - Display recommendations list
 * - Priority categorization (Urgent/Important/Nice-to-have)
 * - "Create Task" buttons for each recommendation
 * - Static mock data for demo
 */

'use client';

import React, { useState } from 'react';

interface Recommendation {
  id: string;
  text: string;
  priority: 'urgent' | 'important' | 'nice-to-have';
  category: string;
  rationale?: string;
}

interface RecommendationsArtifactProps {
  title: string;
  data?: {
    recommendations: Recommendation[];
  };
  customerContext?: any;
  onCreateTask?: (recommendation: Recommendation) => void;
  onClose?: () => void;
}

export function RecommendationsArtifact({
  title,
  data,
  customerContext,
  onCreateTask,
  onClose
}: RecommendationsArtifactProps) {
  const [convertedTasks, setConvertedTasks] = useState<Set<string>>(new Set());

  // Replace handlebars variables in title
  const processedTitle = title.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = customerContext;
    for (const key of keys) {
      value = value?.[key];
    }
    return value !== undefined ? String(value) : match;
  });

  // Mock recommendations for demo
  const recommendations: Recommendation[] = data?.recommendations || [
    {
      id: '1',
      text: 'Schedule executive review meeting with CTO within next 2 weeks',
      priority: 'urgent',
      category: 'Relationship',
      rationale: 'CTO is key decision maker. Last meeting was 6 months ago.'
    },
    {
      id: '2',
      text: 'Review Q3 usage metrics with customer success team',
      priority: 'important',
      category: 'Health',
      rationale: 'Usage has plateaued. Need to understand blockers and drive adoption.'
    },
    {
      id: '3',
      text: 'Present expansion opportunity for additional seats',
      priority: 'important',
      category: 'Expansion',
      rationale: 'Team has grown 30%. Current license count is under-utilized.'
    },
    {
      id: '4',
      text: 'Address open support tickets before renewal conversation',
      priority: 'urgent',
      category: 'Risk',
      rationale: '2 open tickets could impact renewal sentiment if not resolved.'
    },
    {
      id: '5',
      text: 'Share case study from similar customer in their industry',
      priority: 'nice-to-have',
      category: 'Value',
      rationale: 'Demonstrate ROI and build confidence in renewal decision.'
    }
  ];

  // Priority styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          badge: 'bg-red-100 text-red-800 border-red-200',
          icon: '🔴',
          label: 'Urgent'
        };
      case 'important':
        return {
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: '🟡',
          label: 'Important'
        };
      case 'nice-to-have':
        return {
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '🟢',
          label: 'Nice-to-have'
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '⚪',
          label: 'Standard'
        };
    }
  };

  // Handle create task
  const handleCreateTask = (rec: Recommendation) => {
    if (onCreateTask) {
      onCreateTask(rec);
    } else {
      // Mock task creation for demo
      alert(`Creating task: "${rec.text}"\n\nPriority: ${rec.priority}\nCategory: ${rec.category}`);
    }
    setConvertedTasks(prev => new Set([...prev, rec.id]));
  };

  // Group by priority
  const groupedRecs = {
    urgent: recommendations.filter(r => r.priority === 'urgent'),
    important: recommendations.filter(r => r.priority === 'important'),
    'nice-to-have': recommendations.filter(r => r.priority === 'nice-to-have')
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{processedTitle}</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-generated recommendations for renewal success
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {recommendations.length} recommendations
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">

          {/* Urgent */}
          {groupedRecs.urgent.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">🔴</span>
                Urgent Actions
              </h3>
              <div className="space-y-3">
                {groupedRecs.urgent.map((rec) => {
                  const isConverted = convertedTasks.has(rec.id);
                  const style = getPriorityStyle(rec.priority);

                  return (
                    <div
                      key={rec.id}
                      className={`p-4 rounded-lg border-2 ${
                        isConverted ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${style.badge}`}>
                              {style.label}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{rec.text}</p>
                              {rec.rationale && (
                                <p className="text-xs text-gray-600 mt-1">{rec.rationale}</p>
                              )}
                              <span className="inline-block mt-2 px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200">
                                {rec.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCreateTask(rec)}
                          disabled={isConverted}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isConverted
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isConverted ? '✓ Task Created' : 'Create Task'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Important */}
          {groupedRecs.important.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">🟡</span>
                Important Actions
              </h3>
              <div className="space-y-3">
                {groupedRecs.important.map((rec) => {
                  const isConverted = convertedTasks.has(rec.id);
                  const style = getPriorityStyle(rec.priority);

                  return (
                    <div
                      key={rec.id}
                      className={`p-4 rounded-lg border-2 ${
                        isConverted ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${style.badge}`}>
                              {style.label}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{rec.text}</p>
                              {rec.rationale && (
                                <p className="text-xs text-gray-600 mt-1">{rec.rationale}</p>
                              )}
                              <span className="inline-block mt-2 px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200">
                                {rec.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCreateTask(rec)}
                          disabled={isConverted}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isConverted
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isConverted ? '✓ Task Created' : 'Create Task'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nice-to-have */}
          {groupedRecs['nice-to-have'].length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">🟢</span>
                Nice-to-have Actions
              </h3>
              <div className="space-y-3">
                {groupedRecs['nice-to-have'].map((rec) => {
                  const isConverted = convertedTasks.has(rec.id);
                  const style = getPriorityStyle(rec.priority);

                  return (
                    <div
                      key={rec.id}
                      className={`p-4 rounded-lg border-2 ${
                        isConverted ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${style.badge}`}>
                              {style.label}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{rec.text}</p>
                              {rec.rationale && (
                                <p className="text-xs text-gray-600 mt-1">{rec.rationale}</p>
                              )}
                              <span className="inline-block mt-2 px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200">
                                {rec.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCreateTask(rec)}
                          disabled={isConverted}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isConverted
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isConverted ? '✓ Task Created' : 'Create Task'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {convertedTasks.size} of {recommendations.length} converted to tasks
        </div>
        <button
          onClick={() => setConvertedTasks(new Set())}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          Reset Demo
        </button>
      </div>
    </div>
  );
}
