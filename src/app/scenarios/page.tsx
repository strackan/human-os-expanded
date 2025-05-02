'use client';

import Link from 'next/link';
import { ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function ScenariosPage() {
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Scenarios</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                href="/scenarios/modeling"
                className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center mb-2">
                  <ChartBarIcon className="h-6 w-6 text-blue-500 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800">Scenario Modeling</h2>
                </div>
                <p className="text-gray-600">
                  Model different scenarios for pricing, NRR improvement, and customer satisfaction initiatives.
                </p>
              </Link>

              <Link 
                href="/scenarios/monte-carlo"
                className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center mb-2">
                  <SparklesIcon className="h-6 w-6 text-blue-500 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800">Monte Carlo Simulation</h2>
                </div>
                <p className="text-gray-600">
                  Run advanced Monte Carlo simulations to analyze potential outcomes and risks.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 