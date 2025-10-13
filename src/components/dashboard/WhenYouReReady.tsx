'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface WhenYouReReadyProps {
  className?: string;
}

export default function WhenYouReReady({ className = '' }: WhenYouReReadyProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`text-center py-8 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-2"
      >
        <span>When you're ready</span>
        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
    </div>
  );
}
