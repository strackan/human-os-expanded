'use client';

import { useState } from 'react';

export default function CalendarTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [duration, setDuration] = useState('90');
  const [taskType, setTaskType] = useState('deep');
  const [windowDays, setWindowDays] = useState('7');

  const testFindNextOpening = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/test/calendar?action=findNextOpening&duration=${duration}&taskType=${taskType}&windowDays=${windowDays}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testWorkload = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test/calendar?action=workload');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testAvailability = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test/calendar?action=availability');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testPreferences = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test/calendar?action=preferences');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Calendar Service Test
          </h1>
          <p className="text-gray-600">
            Test the findNextOpening() algorithm and workload analysis
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            findNextOpening() Algorithm
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="15"
                max="480"
                step="15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="deep">Deep Work</option>
                <option value="admin">Admin Task</option>
                <option value="meeting">Meeting</option>
                <option value="customer">Customer Call</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Window (days)
              </label>
              <input
                type="number"
                value={windowDays}
                onChange={(e) => setWindowDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
                max="30"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={testFindNextOpening}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Finding...' : 'Find Next Opening'}
            </button>

            <button
              onClick={testWorkload}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Test Workload Analysis'}
            </button>

            <button
              onClick={testAvailability}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Test Weekly Availability'}
            </button>

            <button
              onClick={testPreferences}
              disabled={loading}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'View Preferences'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium mb-2">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Results</h2>

            {/* findNextOpening result */}
            {result.slot && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-blue-900 font-medium text-lg">
                        {result.slot.startFormatted}
                      </h3>
                      <p className="text-blue-700 text-sm mt-1">
                        {result.slot.durationMinutes} minutes
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-blue-900">
                        {result.slot.score}
                      </div>
                      <div className="text-xs text-blue-600">Score</div>
                    </div>
                  </div>

                  <p className="text-blue-800 text-sm bg-blue-100 rounded p-2">
                    💡 {result.slot.reasoning}
                  </p>
                </div>

                <div className="text-sm text-gray-600">
                  <p><strong>Start:</strong> {new Date(result.slot.start).toLocaleString()}</p>
                  <p><strong>End:</strong> {new Date(result.slot.end).toLocaleString()}</p>
                  <p><strong>Task Type:</strong> {result.parameters.taskType}</p>
                  <p><strong>Duration:</strong> {result.parameters.duration} minutes</p>
                </div>
              </div>
            )}

            {/* Workload result */}
            {result.workload && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-semibold text-gray-900">
                      {result.workload.summary.total_items}
                    </div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-semibold text-gray-900">
                      {result.workload.summary.estimated_hours}h
                    </div>
                    <div className="text-sm text-gray-600">Estimated</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-semibold text-gray-900">
                      {result.workload.summary.customer_count}
                    </div>
                    <div className="text-sm text-gray-600">Customers</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-semibold text-red-600">
                      {result.workload.categorized.urgent}
                    </div>
                    <div className="text-sm text-gray-600">Urgent</div>
                  </div>
                </div>

                {result.workload.items.urgent.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      🚨 Urgent Items
                    </h4>
                    <div className="space-y-2">
                      {result.workload.items.urgent.map((item: any, i: number) => (
                        <div key={i} className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="font-medium text-red-900">{item.title}</div>
                          <div className="text-sm text-red-700 mt-1">{item.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.workload.items.important.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      ⚡ Important Items
                    </h4>
                    <div className="space-y-2">
                      {result.workload.items.important.map((item: any, i: number) => (
                        <div key={i} className="bg-blue-50 border border-blue-200 rounded p-3">
                          <div className="font-medium text-blue-900">{item.title}</div>
                          <div className="text-sm text-blue-700 mt-1">{item.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Availability result */}
            {result.availability && (
              <div className="space-y-3">
                {result.availability.map((day: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-200">
                    <div className="w-24 text-sm font-medium text-gray-900">
                      {day.dateFormatted}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full"
                            style={{ width: `${day.utilization}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {day.utilization}%
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {day.availableHours}h free
                    </div>
                    <div className="text-sm text-gray-500">
                      {day.meetingCount} meetings
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Preferences result */}
            {result.preferences && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Work Hours</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(result.preferences.workHours, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Focus Blocks</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(result.preferences.focusBlocks, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Buffer Time</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(result.preferences.bufferTime, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Raw JSON */}
            <details className="mt-6">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                View Raw JSON
              </summary>
              <pre className="mt-2 bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Instructions */}
        {!result && !error && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-blue-900 font-medium mb-3">Instructions</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• <strong>Find Next Opening:</strong> Tests the AI scheduling algorithm to find the best available time slot</li>
              <li>• <strong>Test Workload:</strong> Shows upcoming snoozed tasks, renewals, and priorities</li>
              <li>• <strong>Test Availability:</strong> Displays weekly calendar availability analysis</li>
              <li>• <strong>View Preferences:</strong> Shows your work hours, focus blocks, and buffer time settings</li>
            </ul>

            <div className="mt-4 p-3 bg-white rounded border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Make sure you've run the seed script first:
              </p>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                npx supabase db execute -f supabase/seed_weekly_planner_test_data.sql
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
