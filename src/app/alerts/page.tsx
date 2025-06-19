'use client';

import { useState, useEffect } from 'react';
import { Alert } from '@/lib/services/AlertService';
import { formatDistanceToNow } from 'date-fns';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      const response = await fetch('/api/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading alerts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 mb-2">Error loading alerts</div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchAlerts}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Alerts Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor all renewal-related alerts and changes
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Recent Alerts</h2>
            <button
              onClick={fetchAlerts}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Refresh
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No alerts available</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-lg shadow p-6 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {alert.alert_type.replace(/_/g, ' ').toUpperCase()}
                      </h3>
                      {alert.alert_subtype && (
                        <p className="text-sm text-gray-500">
                          {alert.alert_subtype.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {alert.data_source}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Confidence:</span>{' '}
                      {Math.round(alert.confidence_score * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Created:</span>{' '}
                      {formatDistanceToNow(new Date(alert.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Current Value:
                    </h4>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(alert.current_value, null, 2)}
                    </pre>
                  </div>

                  {alert.previous_value && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Previous Value:
                      </h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(alert.previous_value, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 