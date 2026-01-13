'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/lib/services/EventService';
import { EventCard } from './EventCard';
import { useRouter } from 'next/navigation';

export function EventsDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  async function fetchEvents() {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }
  
  const handleActionClick = (action: string) => {
    // Handle different actions based on the action text
    if (action.includes('Schedule')) {
      // Navigate to scheduling page
      router.push('/schedule');
    } else if (action.includes('Review')) {
      // Navigate to review page
      router.push('/reviews');
    } else if (action.includes('Monitor')) {
      // Navigate to monitoring dashboard
      router.push('/monitor');
    }
  };
  
  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading events</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchEvents}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Active Events</h2>
        <button
          onClick={fetchEvents}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        >
          Refresh
        </button>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No active events</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onActionClick={handleActionClick}
            />
          ))}
        </div>
      )}
    </div>
  );
} 