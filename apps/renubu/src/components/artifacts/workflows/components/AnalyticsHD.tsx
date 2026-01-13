import React from 'react';
import { AnalyticsConfig } from '../config/WorkflowConfig';

interface AnalyticsHDProps {
  config: AnalyticsConfig;
  className?: string;
}

const SparkChartHD = ({
  data,
  threshold,
  belowColor,
  aboveColor,
  referenceLineHeight,
  referenceLabel,
  showReference,
  height = 15,
  multiplier = 2,
  chartMin,
  chartMax
}: {
  data: number[];
  threshold?: number;
  belowColor: string;
  aboveColor: string;
  referenceLineHeight?: number;
  referenceLabel?: string;
  showReference?: boolean;
  height?: number;
  multiplier?: number;
  chartMin?: number;
  chartMax?: number;
}) => {
  // Calculate chart scale
  const minValue = chartMin ?? 0;
  const maxValue = chartMax ?? Math.max(...data);
  const range = maxValue - minValue;

  // Calculate actual chart height in pixels
  const chartHeightPx = height * 4; // Since h-15 = 60px (15 * 4)

  return (
    <div className="relative flex items-end space-x-0.5" style={{ height: `${chartHeightPx}px`, marginBottom: '2px' }}>
      {showReference && referenceLineHeight !== undefined && (
        <>
          <div
            className="absolute left-0 right-0 h-px bg-red-500 opacity-70 z-10"
            style={{
              bottom: `${((referenceLineHeight - minValue) / range) * chartHeightPx}px`
            }}
          ></div>
          <div
            className="absolute left-1 text-xs text-red-500 bg-gray-50 px-1"
            style={{
              bottom: `${((referenceLineHeight - minValue) / range) * chartHeightPx + 2}px`
            }}
          >
            {referenceLabel}
          </div>
        </>
      )}
      {data.map((value, i) => {
        // Scale the bar height based on chartMin/chartMax using actual chart height
        const scaledHeight = Math.max(1, ((value - minValue) / range) * chartHeightPx);
        return (
          <div
            key={i}
            className={`w-0.5 ${threshold && i >= threshold ? aboveColor : belowColor} rounded-t`}
            style={{ height: `${scaledHeight}px` }}
          />
        );
      })}
    </div>
  );
};

const AnalyticsHD: React.FC<AnalyticsHDProps> = ({ config, className = '' }) => {
  const { usageTrend, userLicenses, renewalInsights } = config;

  // Generate sample data for charts if the data is a template string
  const getChartData = (data: any) => {
    if (Array.isArray(data)) {
      return data;
    }
    // Generate sample rising trend data
    return [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  };

  return (
    <div className={`flex-1 bg-white rounded-lg border border-gray-200 p-3 overflow-y-auto ${className}`}>
      <div className="h-full">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Analytics</h3>
        
        <div className="space-y-3">
          {/* Usage Trend */}
          <div className="bg-gray-50 rounded-md p-2">
            <div className="text-xs font-medium text-gray-700 mb-1">Usage Trend</div>
            <SparkChartHD
              data={getChartData(usageTrend)}
              belowColor="bg-red-500"
              aboveColor="bg-green-500"
              height={12}
              multiplier={2}
            />
          </div>

          {/* User Licenses */}
          <div className="bg-gray-50 rounded-md p-2">
            <div className="text-xs font-medium text-gray-700 mb-1">User Licenses</div>
            <SparkChartHD
              data={getChartData(userLicenses)}
              belowColor="bg-red-500"
              aboveColor="bg-green-500"
              height={12}
              multiplier={2}
            />
          </div>

          {/* Renewal Insights - Compact */}
          {renewalInsights && (
            <div className="bg-gray-50 rounded-md p-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Renewal Insights</div>
              <div className="text-xs text-gray-600 mb-1">
                <span className="font-medium">{renewalInsights.renewalStage}</span> - {renewalInsights.confidence}% confidence
              </div>
              <div className="text-xs text-gray-500 mb-1">{renewalInsights.recommendedAction}</div>
              
              {renewalInsights.keyReasons && renewalInsights.keyReasons.length > 0 && (
                <div className="space-y-1">
                  {renewalInsights.keyReasons.slice(0, 2).map((reason, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      <span className="font-medium">{reason.category}:</span> {reason.detail}
                    </div>
                  ))}
                  {renewalInsights.keyReasons.length > 2 && (
                    <div className="text-xs text-gray-400">+{renewalInsights.keyReasons.length - 2} more</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHD;
