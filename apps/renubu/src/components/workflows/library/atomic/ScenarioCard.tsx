import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export interface ScenarioCardProps {
  title: string;
  price: number;
  increasePercent: number;
  probability?: number;
  pros: string[];
  cons: string[];
  recommended?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  format?: 'currency' | 'number';
}

/**
 * ScenarioCard - Atomic Component
 *
 * Displays a pricing or decision scenario with pros/cons analysis.
 * Used in pricing recommendations, negotiation options, and alternative proposals.
 *
 * @example
 * <ScenarioCard
 *   title="Recommended"
 *   price={120000}
 *   increasePercent={7.5}
 *   probability={80}
 *   pros={['Data-driven', 'Defensible', 'Balanced']}
 *   cons={['May require justification']}
 *   recommended
 *   onSelect={() => console.log('Selected')}
 * />
 */
export const ScenarioCard = React.memo(function ScenarioCard({
  title,
  price,
  increasePercent,
  probability,
  pros,
  cons,
  recommended = false,
  selected = false,
  onSelect,
  format = 'currency'
}: ScenarioCardProps) {
  const formattedPrice = React.useMemo(() => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    }
    return new Intl.NumberFormat('en-US').format(price);
  }, [price, format]);

  const isInteractive = !!onSelect;

  const getIncreaseColor = () => {
    if (increasePercent < 0) return 'text-red-600';
    if (increasePercent < 5) return 'text-green-600';
    if (increasePercent < 10) return 'text-blue-600';
    return 'text-purple-600';
  };

  return (
    <div
      className={`
        relative rounded-lg border-2 p-5
        transition-all duration-200
        ${
          selected
            ? 'border-blue-500 bg-blue-50 shadow-lg'
            : recommended
            ? 'border-green-500 bg-green-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }
        ${isInteractive ? 'cursor-pointer hover:shadow-lg' : ''}
      `}
      onClick={isInteractive ? onSelect : undefined}
      role={isInteractive ? 'button' : 'article'}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
    >
      {/* Recommended Badge */}
      {recommended && (
        <div className="absolute -top-3 left-4 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full shadow-md">
          Recommended
        </div>
      )}

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2">
          <CheckCircleIcon className="w-8 h-8 text-blue-600" />
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {formattedPrice}
          </span>
          <span className={`text-lg font-semibold ${getIncreaseColor()}`}>
            {increasePercent > 0 ? '+' : ''}
            {increasePercent}%
          </span>
        </div>
        {probability !== undefined && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Acceptance Probability</span>
              <span className="font-semibold">{probability}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  probability >= 80
                    ? 'bg-green-500'
                    : probability >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${probability}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pros */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <span className="text-green-600">✓</span> Pros
        </h4>
        <ul className="space-y-1">
          {pros.map((pro, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cons */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <span className="text-red-600">✗</span> Cons
        </h4>
        <ul className="space-y-1">
          {cons.map((con, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>{con}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

ScenarioCard.displayName = 'ScenarioCard';

export default ScenarioCard;
