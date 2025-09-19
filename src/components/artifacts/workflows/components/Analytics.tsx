import React from 'react';
import { AnalyticsConfig } from '../config/WorkflowConfig';

interface AnalyticsProps {
  config: AnalyticsConfig;
  className?: string;
}

const SparkChart = ({
  data,
  threshold,
  belowColor,
  aboveColor,
  referenceLineHeight,
  referenceLabel,
  showReference,
  height = 20,
  multiplier = 3,
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
  const chartHeightPx = height * 4; // Since h-20 = 80px (20 * 4)

  return (
    <div className="relative flex items-end space-x-1" style={{ height: `${chartHeightPx}px`, marginBottom: '4px' }}>
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
            className={`w-1 ${threshold && i >= threshold ? aboveColor : belowColor} rounded-t`}
            style={{ height: `${scaledHeight}px` }}
          />
        );
      })}
    </div>
  );
};

const Analytics: React.FC<AnalyticsProps> = ({ config, className = '' }) => {
  const { usageTrend, userLicenses, renewalInsights } = config;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [shouldShowSeeMore, setShouldShowSeeMore] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Check if content overflows
  React.useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current && !isExpanded) {
        const container = contentRef.current.parentElement;
        if (container) {
          const containerHeight = container.clientHeight - 32; // Account for padding (p-4 = 16px * 2)
          const contentHeight = contentRef.current.scrollHeight;
          const hasOverflow = contentHeight > containerHeight;
          setShouldShowSeeMore(hasOverflow);
        }
      } else {
        setShouldShowSeeMore(false);
      }
    };

    checkOverflow();
    // Re-check on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [isExpanded, renewalInsights]);

  return (
    <div className={`flex-1 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto ${className}`}>
      <div className="h-full grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="text-sm font-semibold text-gray-800 mb-2">{usageTrend.title}</div>
          <SparkChart
            data={usageTrend.data}
            threshold={usageTrend.dataColors.threshold}
            belowColor={usageTrend.dataColors.belowColor}
            aboveColor={usageTrend.dataColors.aboveColor}
            showReference={usageTrend.showReferenceLine}
            referenceLabel={usageTrend.referenceLineLabel}
            referenceLineHeight={usageTrend.referenceLineHeight}
            chartMin={usageTrend.chartMin}
            chartMax={usageTrend.chartMax}
          />
          <div className={`text-xs ${usageTrend.chartContextColor} font-medium flex-shrink-0`}>
            {usageTrend.chartContextLabel.includes(';') ? (
              <div className="space-y-0.5">
                {usageTrend.chartContextLabel.split(';').map((item, i) => (
                  <div key={i} className="flex items-start">
                    <span className="text-gray-400 mr-1" style={{ fontSize: '6px', lineHeight: '10px', marginTop: '1px' }}>―</span>
                    <span className="leading-tight">{item.trim()}</span>
                  </div>
                ))}
              </div>
            ) : (
              usageTrend.chartContextLabel
            )}
          </div>
        </div>

        <div className={`row-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200 ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
          <div ref={contentRef} className={`${isExpanded ? 'h-auto' : 'h-full'} flex flex-col space-y-4`}>
            <div className="space-y-3">
              <div>
                <div className="text-gray-600 mb-1" style={{ fontWeight: 600, fontSize: '1rem' }}>Renewal Stage: <span className="font-medium text-blue-900">{renewalInsights.renewalStage}</span></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Confidence</span>
                  <div className="flex items-center ml-3">
                    <span className="text-sm font-bold text-orange-600">{renewalInsights.confidence}%</span>
                    <svg className="w-3 h-3 ml-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-400 via-yellow-400 via-orange-400 to-green-400 rounded-full"
                    style={{ width: '100%' }}
                  ></div>
                  <div
                    className="absolute top-0 h-full w-0.5 bg-gray-800"
                    style={{ left: `${renewalInsights.confidence}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-gray-600 mb-1" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Recommended Action</div>
              {renewalInsights.recommendedAction.includes(';') ? (
                <div className="space-y-1">
                  {renewalInsights.recommendedAction.split(';').map((action, i) => (
                    <div key={i} className="flex items-start">
                      <span className="text-gray-400 mr-1" style={{ fontSize: '8px', lineHeight: '14px', marginTop: '2px' }}>―</span>
                      <span className="text-gray-600 leading-tight" style={{ fontWeight: 400, fontSize: '0.75rem' }}>{action.trim()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-600" style={{ fontWeight: 400, fontSize: '0.75rem' }}>{renewalInsights.recommendedAction}</div>
              )}
            </div>

            <div className="flex-1">
              <div className="text-gray-600 mb-1" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Key Reasons</div>
              <div className="space-y-1">
                {renewalInsights.keyReasons.map((reason, i) => (
                  <div key={i} className="flex items-start">
                    <span className="text-xs text-gray-400 mr-2">-</span>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-gray-700">{reason.category}</span>
                      <div className="text-xs text-gray-600">{reason.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {shouldShowSeeMore && (
              <div className="text-right" style={{ marginTop: '-6px' }}>
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                >
                  See more
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex flex-col">
          <div className="text-sm font-semibold text-gray-800 mb-2 flex-shrink-0">{userLicenses.title}</div>
          <div className="flex-1 flex flex-col justify-center">
          <SparkChart
            data={userLicenses.data}
            threshold={userLicenses.dataColors.threshold}
            belowColor={userLicenses.dataColors.belowColor}
            aboveColor={userLicenses.dataColors.aboveColor}
            showReference={userLicenses.showReferenceLine}
            referenceLabel={userLicenses.referenceLineLabel}
            referenceLineHeight={userLicenses.referenceLineHeight}
            chartMin={userLicenses.chartMin}
            chartMax={userLicenses.chartMax}
            multiplier={2.5}
            height={20}
          />
          <div className={`text-xs ${userLicenses.chartContextColor} font-medium flex-shrink-0 mt-2`}>
            {userLicenses.chartContextLabel.includes(';') ? (
              <div className="space-y-0.5">
                {userLicenses.chartContextLabel.split(';').map((item, i) => (
                  <div key={i} className="flex items-start">
                    <span className="text-gray-400 mr-1" style={{ fontSize: '6px', lineHeight: '10px', marginTop: '1px' }}>―</span>
                    <span className="leading-tight">{item.trim()}</span>
                  </div>
                ))}
              </div>
            ) : (
              userLicenses.chartContextLabel
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;