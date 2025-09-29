// src/app/renewals/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

type RenewalRow = {
  id: string;
  customer_id: string;
  contract_id: string | null;
  renewal_date: string; // YYYY-MM-DD
  current_arr: number | null;
  proposed_arr: number | null;
  probability: number | null;
  stage: string | null;
  risk_level: string | null;
  created_at: string | null;
  updated_at: string | null;
  customers?: { name?: string | null } | null;
  contracts?: { contract_number?: string | null; arr?: number | null } | null;
};

export default function RenewalsPage() {
  const [renewals, setRenewals] = useState<RenewalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchRenewals(); }, []);

  async function fetchRenewals() {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch('/api/renewals', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch renewals (${res.status})`);
      const data = await res.json();
      setRenewals(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching renewals:', e);
      setError(e instanceof Error ? e.message : 'An error occurred');
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
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

  const fmtMoney = (v: number | null | undefined) =>
    typeof v === 'number' ? `$${v.toLocaleString()}` : '—';

  const fmtDate = (s: string | null | undefined) =>
    s ? new Date(s).toLocaleDateString() : '—';

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Renewals</h1>
          <p className="mt-2 text-sm text-gray-600">Monitor and manage upcoming renewals</p>
        </div>

        <div className="flex justify-between items-center mb-4">
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
              onClick={() => fetch('/api/renewals/test', { method: 'POST' }).then(fetchRenewals)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Test Renewal
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renewals.map((r) => {
              const title =
                r.customers?.name ??
                r.contracts?.contract_number ??
                'Untitled Renewal';

              const created = r.created_at || r.updated_at;

              return (
                <div key={r.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                      <p className="text-sm text-gray-500">Stage: {r.stage ?? '—'}</p>
                      <p className="text-xs text-gray-500">Risk: {r.risk_level ?? '—'}</p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      {fmtMoney(r.current_arr)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Renewal Date:</span> {fmtDate(r.renewal_date)}
                    </div>
                    <div>
                      <span className="font-medium">Proposed ARR:</span> {fmtMoney(r.proposed_arr)}
                    </div>
                    {created && (
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {formatDistanceToNow(new Date(created), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
