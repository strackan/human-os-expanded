'use client';

import { useState } from 'react';
import { ChevronRight, TrendingUp, Heart, Target, Users } from 'lucide-react';

interface WhenYouReReadyProps {
  className?: string;
  children?: React.ReactNode;
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

export default function WhenYouReReady({ className = '', children }: WhenYouReReadyProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      id="when-youre-ready"
      data-testid="when-youre-ready"
      data-expanded={isExpanded}
      className={`when-youre-ready ${className}`}
    >
      {/* Divider with Toggle */}
      <div className="text-center py-8 when-youre-ready__divider">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-2 when-youre-ready__toggle-btn"
          data-testid="when-youre-ready-toggle"
        >
          <span className="when-youre-ready__label">When you&apos;re ready</span>
          <ChevronRight className={`w-4 h-4 transition-transform when-youre-ready__chevron ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Expandable Cards Grid + children */}
      {isExpanded && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-4 gap-4 when-youre-ready__grid" data-testid="when-youre-ready-grid">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  data-testid={`when-youre-ready-card-${card.id}`}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group text-left when-youre-ready__card"
                >
                  <div className="flex flex-col gap-4">
                    <Icon className={`w-6 h-6 ${card.iconColor} when-youre-ready__card-icon`} />
                    <div className="when-youre-ready__card-content">
                      <h3 className="text-base font-medium text-gray-900 group-hover:text-gray-700 when-youre-ready__card-title">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 when-youre-ready__card-subtitle">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {children}
        </div>
      )}
    </div>
  );
}
