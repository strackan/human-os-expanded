'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Renewal {
  id: string;
  customer_id: string;
  product_name: string;
  current_value: number;
  renewal_date: string;
  status: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export default function RenewalsPage() {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRenewals();
  }, []);

  async function fetchRenewals() {
    try {
      const response = await fetch('/api/renewals');
      if (!response.ok) {
        throw new Error('Failed to fetch renewals');
      }
      const data = await response.json();
      setRenewals(data);
    } catch (error) {
      console.error('Error fetching renewals:', error);
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
              <p className="text-gray-600">Loading renewals...</p>
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
              <div className="text-red-600 mb-2">Error loading renewals</div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchRenewals}
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
          <h1 className="text-3xl font-bold text-gray-900">Renewals Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor and manage your renewal opportunities
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Active Renewals</h2>
            <button
              onClick={fetchRenewals}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Refresh
            </button>
          </div>

          {renewals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No renewals available</p>
              <button
                onClick={() => fetch('/api/renewals/test', { method: 'POST' })}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Test Renewal
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {renewals.map((renewal) => (
                <div
                  key={renewal.id}
                  className="bg-white rounded-lg shadow p-6 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {renewal.product_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Status: {renewal.status}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      ${renewal.current_value.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Renewal Date:</span>{' '}
                      {new Date(renewal.renewal_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Created:</span>{' '}
                      {formatDistanceToNow(new Date(renewal.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  {renewal.metadata && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Additional Info:
                      </h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(renewal.metadata, null, 2)}
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