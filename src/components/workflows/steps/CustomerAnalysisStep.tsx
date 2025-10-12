/**
 * Customer Analysis Step
 *
 * Demo step that generates a dashboard artifact with metrics and charts.
 * Shows how to create embeddable dashboard artifacts in workflows.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Loader2, BarChart3 } from 'lucide-react';
import { generateDashboardArtifact, DashboardMetric, DashboardChart } from '../artifacts/DashboardArtifact';

import { StepComponentProps } from '../StepRenderer';

export const CustomerAnalysisStep: React.FC<StepComponentProps> = ({
  data = {},
  executionId,
  customerId,
  onDataChange,
  onComplete,
  onArtifactGenerated
}) => {
  const [customerName, setCustomerName] = useState(data.customerName || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount only
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset form when data.customerName actually changes (not just reference)
  useEffect(() => {
    if (data.customerName !== undefined && data.customerName !== customerName) {
      setCustomerName(data.customerName);
    }
  }, [data.customerName]); // Only depend on the specific field, not entire data object

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnalyzing || !customerName.trim()) return;

    setIsAnalyzing(true);

    try {
      // Save step data
      const stepData = { customerName: customerName.trim() };
      onDataChange(stepData);

      // Simulate analysis delay (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate dashboard artifact with metrics and charts
      const metrics: DashboardMetric[] = [
        {
          label: 'ARR',
          value: '$725,000',
          sublabel: '+12% YoY',
          status: 'green',
          trend: 'up'
        },
        {
          label: 'Health Score',
          value: '85%',
          sublabel: 'Healthy',
          status: 'green'
        },
        {
          label: 'Renewal Date',
          value: '120 days',
          sublabel: 'Feb 28, 2026',
          status: 'yellow'
        },
        {
          label: 'Risk Score',
          value: '3.2/10',
          sublabel: 'Low Risk',
          status: 'green'
        },
        {
          label: 'NPS Score',
          value: '45',
          sublabel: 'Promoter',
          status: 'green'
        },
        {
          label: 'Usage Rate',
          value: '78%',
          sublabel: 'High Engagement',
          status: 'green'
        },
        {
          label: 'Support Tickets',
          value: '3 open',
          sublabel: '1 critical',
          status: 'yellow'
        },
        {
          label: 'Last Contact',
          value: '5 days ago',
          sublabel: 'Email',
          status: 'neutral'
        }
      ];

      const charts: DashboardChart[] = [
        {
          type: 'line',
          title: 'ARR Trend (Last 6 Months)',
          data: [650000, 670000, 685000, 700000, 710000, 725000],
          labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
          threshold: 700000,
          color: 'stroke-blue-500'
        },
        {
          type: 'bar',
          title: 'Quarterly Usage (Hours)',
          data: [450, 520, 480, 580],
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          threshold: 500,
          color: 'bg-purple-500'
        },
        {
          type: 'progress',
          title: 'Feature Adoption Progress',
          data: [7, 10], // 7 out of 10 features adopted
          color: 'bg-green-500'
        },
        {
          type: 'bar',
          title: 'Support Response Times (Hours)',
          data: [2, 4, 1, 3, 2],
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          threshold: 4,
          color: 'bg-orange-500'
        }
      ];

      const dashboardContent = generateDashboardArtifact(
        metrics,
        charts,
        `${customerName} - Customer Analysis Dashboard`
      );

      // Generate the artifact
      if (onArtifactGenerated) {
        onArtifactGenerated({
          id: `dashboard-${Date.now()}`,
          title: `${customerName} Analysis Dashboard`,
          content: dashboardContent,
          type: 'dashboard'
        });
      }

      // Complete the step
      await onComplete();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isAnalyzing && customerName.trim()) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Customer Analysis</h3>
            <p className="text-sm text-gray-600">Generate comprehensive dashboard with metrics and charts</p>
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-2">
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
            Customer Name
          </label>
          <input
            ref={inputRef}
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAnalyzing}
            placeholder="Enter customer name (e.g., Acme Corp)"
            className="
              w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
          />
          <p className="text-xs text-gray-500">
            Press Enter or click the button below to analyze
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">What happens next:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Generate comprehensive customer metrics</li>
            <li>• Create interactive charts (ARR trend, usage, adoption, support)</li>
            <li>• Display dashboard artifact in the artifacts panel</li>
            <li>• View full-screen metrics with expand button</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isAnalyzing || !customerName.trim()}
          className="
            w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors duration-200
            flex items-center justify-center space-x-2
          "
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Customer...</span>
            </>
          ) : (
            <>
              <BarChart3 className="w-5 h-5" />
              <span>Generate Dashboard</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
