"use client";

import React, { useState } from 'react';

const stages = [
  { name: 'Planning', count: 2 },
  { name: 'Outreach', count: 4 },
  { name: 'Negotiation', count: 3 },
  { name: 'Signature', count: 3 },
  { name: 'Invoice', count: 1 },
  { name: 'Paid', count: 0 },
];

const timeFrames = [
  { label: 'Today', count: 1 },
  { label: '7d', count: 2 },
  { label: '30d', count: 5 },
  { label: '60d', count: 3 },
  { label: '90d', count: 0 },
  { label: '120d', count: 1 },
];

const RenewalsHQPage = () => {
  const [viewMode, setViewMode] = useState<'stage' | 'date'>('stage');

  return (
    <div className="w-full max-w-4xl mx-auto mt-10">
      <header className="flex flex-col sm:flex-row items-center justify-between bg-white shadow-md rounded-lg px-6 py-6 mb-8 border border-gray-100">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
          Next up: <span className="text-blue-600">Acme</span>
        </h2>
        <div className="flex gap-4">
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Deal with this customer"
          >
            Deal with this
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Snooze this customer"
          >
            Snooze
          </button>
        </div>
      </header>
      {/* Toggle for timeline view */}
      <div className="mb-4 flex">
        <div className="inline-flex rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Timeline view mode">
          <button
            type="button"
            className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 transition-colors ${viewMode === 'stage' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-blue-700'}`}
            id="tab-stage"
            onClick={() => setViewMode('stage')}
          >
            By Stage
          </button>
          <button
            type="button"
            className={`ml-1 px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 transition-colors ${viewMode === 'date' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-blue-700'}`}
            id="tab-date"
            onClick={() => setViewMode('date')}
          >
            By Date
          </button>
        </div>
      </div>
      {/* Collapsed Timeline */}
      <section className="mb-10">
        {viewMode === 'stage' ? (
          <div id="timeline-stage" className="flex items-center justify-between px-2">
            {stages.map((stage, idx) => {
              const isActive = stage.count > 0;
              return (
                <div key={stage.name} className="flex flex-col items-center flex-1">
                  {/* Dot and line */}
                  <div className="flex items-center w-full">
                    {/* Left line */}
                    {idx !== 0 && <div className="h-1 flex-1 bg-gray-200" />}
                    {/* Dot with count */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        isActive ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300'
                      }`}
                      aria-label={`${stage.count} accounts in ${stage.name}`}
                    >
                      <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>{stage.count}</span>
                    </div>
                    {/* Right line */}
                    {idx !== stages.length - 1 && <div className="h-1 flex-1 bg-gray-200" />}
                  </div>
                  {/* Stage name */}
                  <span className="mt-2 text-xs font-medium text-gray-700 text-center whitespace-nowrap">
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div id="timeline-date" className="flex items-center justify-between px-2">
            {timeFrames.map((frame, idx) => {
              const isActive = frame.count > 0;
              return (
                <div key={frame.label} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {/* Left line */}
                    {idx !== 0 && <div className="h-1 flex-1 bg-gray-200" />}
                    {/* Dot with count */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        isActive ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300'
                      }`}
                      aria-label={`${frame.count} accounts in ${frame.label}`}
                    >
                      <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>{frame.count}</span>
                    </div>
                    {/* Right line */}
                    {idx !== timeFrames.length - 1 && <div className="h-1 flex-1 bg-gray-200" />}
                  </div>
                  {/* Time label */}
                  <span className="mt-2 text-xs font-medium text-gray-500 text-center whitespace-nowrap">
                    {frame.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {/* Additional content for Renewals HQ can go here */}
    </div>
  );
};

export default RenewalsHQPage; 