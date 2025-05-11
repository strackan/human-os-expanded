"use client";

import { CustomerRenewalData } from '../../data/customers';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

const categoryColor: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  red: "bg-red-100 text-red-700",
};

const CustomerRenewalDashboard = ({
  customer,
  onNextCustomer,
}: {
  customer: CustomerRenewalData;
  onNextCustomer: (key: string) => void;
}) => (
  <div className="min-h-screen bg-gray-50 py-10">
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-4 min-h-[180px]">
        <h2 className="text-3xl font-extrabold text-blue-700 tracking-tight">
          {customer.name} Renewal
        </h2>
        <div className="mb-6 space-y-2">
          <div className="text-gray-700">Usage: <span className="font-semibold">{customer.usage}</span></div>
          <div className="text-gray-700">ARR: <span className="font-semibold">{customer.arr}</span></div>
          <div className="text-gray-700">Renewal Likelihood: <span className="font-semibold">{customer.renewalLikelihood}</span></div>
          <div className="text-gray-700">Stage: <span className="font-semibold">{customer.stage}</span></div>
        </div>
        <div className="rounded-xl p-4 flex items-center gap-4 shadow-sm border bg-yellow-50 border-yellow-200">
          <PaperAirplaneIcon className="h-7 w-7 text-yellow-600" aria-hidden="true" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-yellow-800">Recommended Action</div>
            <div className="text-sm text-yellow-700 mb-2">Notify the Customer</div>
            <button
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              tabIndex={0}
              aria-label="Go to next customer"
              onClick={() => onNextCustomer(customer.key === 'acme' ? 'initech' : 'acme')}
            >
              Go to next customer – {customer.key === 'acme' ? 'Initech' : 'Acme'}
            </button>
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-2">Key Metrics</h3>
          <div className="grid grid-cols-2 gap-3 overflow-hidden">
            {customer.stats.map((stat) => (
              <div className="bg-gray-50 rounded-lg p-2 min-h-0 min-w-0" key={stat.label}>
                <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
                <span className="text-lg font-bold text-gray-900 mt-1 block">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-2">AI Insights</h3>
          <div className="grid grid-cols-2 gap-3 mb-4 overflow-hidden">
            {customer.aiInsights.map((insight, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2 h-full flex flex-col items-center">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${categoryColor[insight.color]}`}>{insight.category}</span>
                <span className="text-sm text-gray-700 text-center">{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default CustomerRenewalDashboard; 