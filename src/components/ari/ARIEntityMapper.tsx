'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ARIEntityMapperProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onMapped: (mapping: { entityName: string; entityType: string; competitors: string[] }) => void;
}

export function ARIEntityMapper({
  isOpen,
  onClose,
  customerId,
  customerName,
  onMapped,
}: ARIEntityMapperProps) {
  const [entityName, setEntityName] = useState(customerName);
  const [entityType, setEntityType] = useState<'company' | 'person'>('company');
  const [competitorInput, setCompetitorInput] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const addCompetitor = () => {
    const name = competitorInput.trim();
    if (name && !competitors.includes(name)) {
      setCompetitors([...competitors, name]);
      setCompetitorInput('');
    }
  };

  const removeCompetitor = (name: string) => {
    setCompetitors(competitors.filter((c) => c !== name));
  };

  const handleSubmit = async () => {
    if (!entityName.trim()) {
      setError('Entity name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/ari/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          entityName: entityName.trim(),
          entityType,
          competitors: competitors.map((c) => ({ name: c, entity_type: 'company' })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create mapping');
      }

      onMapped({ entityName: entityName.trim(), entityType, competitors });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mapping');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="ari-mapper-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 id="ari-mapper-title" className="text-lg font-semibold text-gray-900">
              Set Up AI Visibility Tracking
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Entity Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Name (as AI models know it)
              </label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., NewsUSA"
              />
            </div>

            {/* Entity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEntityType('company')}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                    entityType === 'company'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Company
                </button>
                <button
                  onClick={() => setEntityType('person')}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                    entityType === 'person'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Person
                </button>
              </div>
            </div>

            {/* Competitors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Competitors to Track
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add competitor name"
                />
                <button
                  onClick={addCompetitor}
                  className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {competitors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {competitors.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {c}
                      <button
                        onClick={() => removeCompetitor(c)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & Track'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
