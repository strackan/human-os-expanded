import { Event } from '@/lib/services/EventService';
import { formatDistanceToNow } from 'date-fns';

interface EventCardProps {
  event: Event;
  onActionClick?: (action: string) => void;
}

export function EventCard({ event, onActionClick }: EventCardProps) {
  type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

  const severityColors: Record<SeverityLevel, string> = {
    low: 'border-blue-200 bg-blue-50',
    medium: 'border-yellow-200 bg-yellow-50',
    high: 'border-orange-200 bg-orange-50',
    critical: 'border-red-200 bg-red-50'
  };

  const severityTextColors: Record<SeverityLevel, string> = {
    low: 'text-blue-700',
    medium: 'text-yellow-700',
    high: 'text-orange-700',
    critical: 'text-red-700'
  };

  const severityBgColors: Record<SeverityLevel, string> = {
    low: 'bg-blue-100',
    medium: 'bg-yellow-100',
    high: 'bg-orange-100',
    critical: 'bg-red-100'
  };

  const severity = event.event_severity as SeverityLevel;

  return (
    <div className={`border-2 rounded-lg p-4 ${severityColors[severity]}`}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className={`font-semibold ${severityTextColors[severity]}`}>
            {event.event_type.replace(/_/g, ' ').toUpperCase()}
          </h3>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Score: {event.total_action_score}
            </p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${severityBgColors[severity]} ${severityTextColors[severity]}`}>
          {severity}
        </span>
      </div>
      
      {event.event_data?.recommended_actions && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Recommended Actions:</h4>
          <ul className="space-y-1">
            {event.event_data.recommended_actions.map((action: string, index: number) => (
              <li key={index} className="flex items-center gap-2">
                <button
                  onClick={() => onActionClick?.(action)}
                  className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  tabIndex={0}
                  aria-label={`Take action: ${action}`}
                >
                  {action}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 