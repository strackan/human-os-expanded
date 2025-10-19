'use client';

import { useState } from 'react';
import { ChevronRight, TrendingUp, Heart, Target, Users } from 'lucide-react';

interface WhenYouReReadyProps {
  className?: string;
}

const cards = [
  {
    id: 'performance',
    title: 'Performance',
    subtitle: 'Revenue metrics',
    icon: TrendingUp,
    iconColor: 'text-green-500'
  },
  {
    id: 'customers',
    title: 'Customers',
    subtitle: 'Portfolio overview',
    icon: Heart,
    iconColor: 'text-red-400'
  },
  {
    id: 'my-plays',
    title: 'My Plays',
    subtitle: 'Workflow library',
    icon: Target,
    iconColor: 'text-blue-500'
  },
  {
    id: 'team',
    title: 'Team',
    subtitle: 'Peer insights',
    icon: Users,
    iconColor: 'text-purple-500'
  }
];

export default function WhenYouReReady({ className = '' }: WhenYouReReadyProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`${className}`}>
      {/* Divider with Toggle */}
      <div className="text-center py-8">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-2"
        >
          <span>When you're ready</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Expandable Cards Grid */}
      {isExpanded && (
        <div className="grid grid-cols-4 gap-4 animate-fade-in">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group text-left"
              >
                <div className="flex flex-col gap-4">
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  <div>
                    <h3 className="text-base font-medium text-gray-900 group-hover:text-gray-700">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
