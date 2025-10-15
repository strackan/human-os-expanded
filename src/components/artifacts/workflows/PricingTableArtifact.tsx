/**
 * Pricing Table Artifact Component (Display-Only)
 *
 * Priority 1 artifact for demo
 * Display pricing outcome from consultation - NOT editable
 *
 * Features:
 * - Clean presentation of pricing data
 * - Current vs. proposed comparison
 * - Calculated metrics (totals, change %, ARR impact)
 * - Handlebars variable support
 * - Export capability (mock)
 */

'use client';

import React from 'react';

interface PricingRow {
  id: string;
  product: string;
  currentPrice: number;
  proposedPrice: number;
  quantity: number;
}

interface PricingTableData {
  rows: PricingRow[];
  notes?: string;
  generatedDate?: string;
}

interface PricingTableArtifactProps {
  title: string;
  data?: PricingTableData;
  customerContext?: any;
  onClose?: () => void;
}

export function PricingTableArtifact({
  title,
  data,
  customerContext,
  onClose
}: PricingTableArtifactProps) {
  // Replace handlebars variables in title
  const processedTitle = title.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = customerContext;
    for (const key of keys) {
      value = value?.[key];
    }
    return value !== undefined ? String(value) : match;
  });

  // Default mock data for demo
  const pricingData = data || {
    rows: [
      { id: '1', product: 'Base Platform', currentPrice: 50000, proposedPrice: 55000, quantity: 1 },
      { id: '2', product: 'Advanced Features', currentPrice: 20000, proposedPrice: 22000, quantity: 1 },
      { id: '3', product: 'Premium Support', currentPrice: 15000, proposedPrice: 16500, quantity: 1 }
    ],
    notes: 'Pricing reflects 10% growth adjustment and premium support upgrade.',
    generatedDate: new Date().toISOString()
  };

  // Calculate metrics
  const currentTotal = pricingData.rows.reduce((sum, row) => sum + (row.currentPrice * row.quantity), 0);
  const proposedTotal = pricingData.rows.reduce((sum, row) => sum + (row.proposedPrice * row.quantity), 0);
  const metrics = {
    currentTotal,
    proposedTotal,
    arrImpact: proposedTotal - currentTotal,
    changePercent: currentTotal > 0 ? ((proposedTotal - currentTotal) / currentTotal * 100) : 0
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{processedTitle}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Renewal pricing outcome from consultation
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pricingData.generatedDate && (
            <span className="text-xs text-gray-500">
              Generated {new Date(pricingData.generatedDate).toLocaleDateString()}
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Current ARR</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(metrics.currentTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Proposed ARR</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(metrics.proposedTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">ARR Impact</p>
            <p className={`text-xl font-semibold ${metrics.arrImpact > 0 ? 'text-green-600' : metrics.arrImpact < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {metrics.arrImpact > 0 ? '+' : ''}{formatCurrency(metrics.arrImpact)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Change</p>
            <p className={`text-xl font-semibold ${metrics.changePercent > 0 ? 'text-green-600' : metrics.changePercent < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {metrics.changePercent > 0 ? '+' : ''}{metrics.changePercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product/Service
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proposed Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change %
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Impact
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pricingData.rows.map((row) => {
              const totalCurrent = row.currentPrice * row.quantity;
              const totalProposed = row.proposedPrice * row.quantity;
              const changePercent = totalCurrent > 0 ? ((totalProposed - totalCurrent) / totalCurrent * 100) : 0;
              const impact = totalProposed - totalCurrent;

              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {row.product}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-center">
                    {row.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {formatCurrency(totalCurrent)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(totalProposed)}
                  </td>
                  <td className={`px-6 py-4 text-sm text-right font-medium ${
                    changePercent > 0 ? 'text-green-600' : changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                  </td>
                  <td className={`px-6 py-4 text-sm text-right font-medium ${
                    impact > 0 ? 'text-green-600' : impact < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {impact > 0 ? '+' : ''}{formatCurrency(impact)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td colSpan={2} className="px-6 py-4 text-sm text-gray-900 uppercase">
                Total
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                {formatCurrency(metrics.currentTotal)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                {formatCurrency(metrics.proposedTotal)}
              </td>
              <td className={`px-6 py-4 text-sm text-right ${
                metrics.changePercent > 0 ? 'text-green-600' : metrics.changePercent < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {metrics.changePercent > 0 ? '+' : ''}{metrics.changePercent.toFixed(1)}%
              </td>
              <td className={`px-6 py-4 text-sm text-right ${
                metrics.arrImpact > 0 ? 'text-green-600' : metrics.arrImpact < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {metrics.arrImpact > 0 ? '+' : ''}{formatCurrency(metrics.arrImpact)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes Section */}
      {pricingData.notes && (
        <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
          <p className="text-xs font-medium text-yellow-900 mb-1">Notes</p>
          <p className="text-sm text-yellow-800">{pricingData.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          This pricing is an outcome document and cannot be edited.
        </div>
        <button
          onClick={() => alert('Export to PDF (mock)')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
}
