"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useDateContext } from '../../context/DateContext';

export default function TestDateOverridePage() {
  const router = useRouter();
  const { currentDate, isDateOverridden, clearOverride } = useDateContext();

  const testDates = [
    { label: 'Today', date: new Date().toISOString().slice(0, 10).replace(/-/g, '') },
    { label: 'Tomorrow', date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '') },
    { label: 'Next Week', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '') },
    { label: 'Last Week', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '') },
    { label: 'Critical Renewal (5 days)', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '') },
    { label: 'High Priority (15 days)', date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '') },
    { label: 'Standard Renewal (30 days)', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '') },
  ];

  const handleDateTest = (dateString: string) => {
    router.push(`/tasks/do?date=${dateString}`);
  };

  const handleClearOverride = () => {
    clearOverride();
    router.push('/tasks/do');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Date Override Testing</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Status</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Current Date:</strong> {currentDate.toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Date Overridden:</strong> {isDateOverridden ? 'Yes' : 'No'}
              </p>
              {isDateOverridden && (
                <button
                  onClick={handleClearOverride}
                  className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
                >
                  Clear Override
                </button>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Different Dates</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click on any date below to test how the task system behaves on that specific date.
              This will help you see how different date-based conditions trigger workflows.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testDates.map((testDate) => (
                <button
                  key={testDate.date}
                  onClick={() => handleDateTest(testDate.date)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">{testDate.label}</div>
                  <div className="text-sm text-gray-500">{testDate.date}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
            <div className="bg-blue-50 rounded-lg p-4">
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Add <code className="bg-blue-100 px-1 rounded">?date=YYYYMMDD</code> to any URL to override the current date</li>
                <li>• The system will use this date for all date-based calculations</li>
                <li>• This affects renewal urgency, task priorities, and workflow triggers</li>
                <li>• Perfect for testing different scenarios without waiting for actual dates</li>
                <li>• The override is visible in the UI with a yellow indicator</li>
              </ul>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/tasks/do')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Tasks (Current Date)
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 