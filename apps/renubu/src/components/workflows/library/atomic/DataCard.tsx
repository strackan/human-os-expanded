import React from 'react';

export interface DataCardProps {
  title: string;
  data: Record<string, any>;
  icon?: React.ReactNode;
  variant?: 'default' | 'compact' | 'highlighted';
  formatters?: Record<string, (value: any) => string>;
}

/**
 * DataCard - Atomic Component
 *
 * Displays key-value pairs in a card layout.
 * Used for contextual information, summaries, and metadata display.
 *
 * @example
 * <DataCard
 *   title="Customer Information"
 *   data={{
 *     name: 'Acme Corp',
 *     arr: 100000,
 *     renewalDate: new Date('2025-12-31')
 *   }}
 *   formatters={{
 *     arr: (val) => `$${val.toLocaleString()}`,
 *     renewalDate: (val) => val.toLocaleDateString()
 *   }}
 *   icon={<BuildingIcon />}
 * />
 */
export const DataCard = React.memo(function DataCard({
  title,
  data,
  icon,
  variant = 'default',
  formatters = {}
}: DataCardProps) {
  const formatValue = (key: string, value: any): string => {
    // Use custom formatter if provided
    if (formatters[key]) {
      return formatters[key](value);
    }

    // Default formatting based on type
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    if (typeof value === 'number') {
      return value.toLocaleString('en-US');
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  const formatLabel = (key: string): string => {
    // Convert camelCase or snake_case to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const variantClasses = {
    default: 'bg-white border-gray-200',
    compact: 'bg-gray-50 border-gray-200',
    highlighted: 'bg-blue-50 border-blue-300'
  };

  return (
    <div
      className={`
        rounded-lg border p-4
        ${variantClasses[variant]}
        transition-all duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
        {icon && <div className="text-gray-600">{icon}</div>}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Data Rows */}
      <dl className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className={`
              flex justify-between items-start gap-4
              ${variant === 'compact' ? 'text-xs' : 'text-sm'}
            `}
          >
            <dt className="font-medium text-gray-600 min-w-[120px]">
              {formatLabel(key)}:
            </dt>
            <dd className="text-gray-900 text-right font-medium break-words">
              {formatValue(key, value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
});

DataCard.displayName = 'DataCard';

export default DataCard;
