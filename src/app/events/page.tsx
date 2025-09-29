'use client';

import { EventsDashboard } from '@/components/events/EventsDashboard';

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Events Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor and respond to important renewal events
          </p>
        </div>
        <EventsDashboard />
      </div>
    </div>
  );
} 