'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface DemoLink {
  label: string;
  href: string;
  description?: string;
}

interface WhenYouReReadyProps {
  className?: string;
  demoLinks?: DemoLink[];
}

export default function WhenYouReReady({ className = '', demoLinks }: WhenYouReReadyProps) {
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

      {/* Expandable Demo Links */}
      {isExpanded && demoLinks && demoLinks.length > 0 && (
        <div className="mt-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Demo Workflows</h3>
            <div className="space-y-3">
              {demoLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                        {link.label}
                      </div>
                      {link.description && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {link.description}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
