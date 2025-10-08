import React from 'react';
import { CustomerOverviewConfig, CustomerMetric } from '../config/WorkflowConfig';

interface CustomerOverviewHDProps {
  config: CustomerOverviewConfig;
  className?: string;
}

const MetricCardHD = ({ metric }: { metric: CustomerMetric }) => {
  // Add null check for metric
  if (!metric) {
    return (
      <div className="bg-gray-50 rounded-md p-2 flex flex-col justify-between">
        <span className="text-xs text-gray-400">No data</span>
        <span className="text-sm font-medium text-gray-400">--</span>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'green': return 'text-green-500';
      case 'orange': return 'text-orange-600';
      case 'red': return 'text-red-500';
      default: return 'text-gray-900';
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    if (trend === 'flat') return '→';
    return null;
  };

  // Check if sublabel contains semicolon-separated values for list display
  const sublabelItems = metric.sublabel?.includes(';')
    ? metric.sublabel.split(';').map(item => item.trim())
    : null;

  return (
    <div className="bg-gray-50 rounded-md p-2 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{metric.label}</span>
        {metric.trendValue && (
          <span className={`text-xs ${
            metric.trend === 'up' ? 'text-green-500' :
            metric.trend === 'down' ? 'text-red-500' :
            metric.trend === 'flat' ? 'text-yellow-600' : 
            getStatusColor(metric.status)
          }`}>
            {getTrendIcon(metric.trend)} {metric.trendValue}
          </span>
        )}
      </div>

      <div className={`${sublabelItems ? 'flex-1 flex flex-col justify-center' : ''}`}>
        <div className={`text-sm font-bold ${getStatusColor(metric.status)} text-center`}>
          {metric.value}
          {metric.sublabel && !sublabelItems && (
            <span className="text-xs text-gray-500"> {metric.sublabel}</span>
          )}
        </div>

        {sublabelItems && (
          <div className="mt-1 space-y-0.5">
            {sublabelItems.map((item, i) => (
              <div key={i} className="flex items-start">
                <span className="text-gray-400 mr-1" style={{ fontSize: '8px', lineHeight: '12px', marginTop: '1px' }}>―</span>
                <span className="text-xs text-gray-500 leading-tight">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {metric.sparkData && (
        <div className="flex items-end justify-center space-x-px mt-1">
          {metric.sparkData.map((height, i) => (
            <div
              key={i}
              className={`w-0.5 ${metric.status === 'red' ? 'bg-red-500' : 'bg-green-500'} rounded-t`}
              style={{ height: `${height + 2}px` }}
            />
          ))}
        </div>
      )}

      {metric.trend && typeof metric.trend === 'string' && !['up', 'down'].includes(metric.trend) && (
        <div className={`text-xs ${getStatusColor('orange')} text-center mt-1`}>
          {metric.trend}
        </div>
      )}
    </div>
  );
};

const CustomerOverviewHD: React.FC<CustomerOverviewHDProps> = ({ config, className = '' }) => {
  const { metrics } = config;

  return (
    <div className={`flex-1 bg-white rounded-lg border border-gray-200 p-3 overflow-y-auto ${className}`}>
      <div className="h-full">
        <div className="grid grid-cols-2 grid-rows-4 gap-2 h-full">
          <MetricCardHD metric={metrics.arr} />
          <MetricCardHD metric={metrics.licenseUnitPrice} />

          <div className="bg-gray-50 rounded-md p-2 flex flex-col justify-between">
            <span className="text-xs text-gray-600">{metrics.renewalDate.label}</span>
            <div className={`text-sm font-semibold ${metrics.renewalDate.status === 'orange' ? 'text-orange-600' : 'text-gray-900'} text-center`}>
              {metrics.renewalDate.value}
            </div>
            {metrics.renewalDate.sublabel && (
              <div className="text-xs text-gray-500 text-center">{metrics.renewalDate.sublabel}</div>
            )}
          </div>

          <div className="bg-gray-50 rounded-md p-2 flex flex-col justify-between">
            <span className="text-xs text-gray-600">{metrics.primaryContact.label}</span>
            <div className="text-center">
              <div className="font-medium text-gray-900 text-sm">{metrics.primaryContact.value}</div>
              {metrics.primaryContact.role && (
                <div className="text-xs text-gray-600">{metrics.primaryContact.role}</div>
              )}
            </div>
          </div>

          <MetricCardHD metric={metrics.riskScore} />
          <MetricCardHD metric={metrics.growthScore} />
          <MetricCardHD metric={metrics.yoyGrowth} />
          <MetricCardHD metric={metrics.lastMonth} />
        </div>
      </div>
    </div>
  );
};

export default CustomerOverviewHD;



