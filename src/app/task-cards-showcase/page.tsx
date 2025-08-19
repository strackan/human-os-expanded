"use client";

import React, { useState } from 'react';
import SampleTaskCards from '@/components/SampleTaskCards';
import RotatingTaskCards from '@/components/RotatingTaskCards';
import { ViewColumnsIcon, PlayIcon } from '@heroicons/react/24/outline';

export default function TaskCardsShowcasePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sample Task Cards Showcase
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Explore our AI-powered renewal management task cards. These proactive alerts 
              automatically identify opportunities, assess customer health, and recommend 
              the next best actions to maximize retention and growth.
            </p>
            
            {/* View Toggle */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                tabIndex={0}
                aria-label="Switch to grid view"
              >
                <ViewColumnsIcon className="h-5 w-5 mr-2" />
                Grid View
              </button>
              <button
                onClick={() => setViewMode('carousel')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  viewMode === 'carousel'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                tabIndex={0}
                aria-label="Switch to carousel view"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Carousel View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {viewMode === 'grid' ? <SampleTaskCards /> : <RotatingTaskCards />}
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Proactive Alerts</h3>
              <p className="text-gray-600">
                AI automatically identifies renewal opportunities and risk factors 
                before they become critical issues.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Recommendations</h3>
              <p className="text-gray-600">
                Each task card includes specific, actionable recommendations 
                tailored to the customer's situation and renewal stage.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear Rationale</h3>
              <p className="text-gray-600">
                Every alert includes a clear explanation of why it was generated, 
                helping teams understand the context and urgency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
