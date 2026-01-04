"use client";

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Target } from 'lucide-react';

interface MetricsProps {
  data: {
    nrr: {
      current: number;
      target: number;
      trend: string;
      status: string;
    };
    arr: {
      current: string;
      target: string;
      trend: string;
      status: string;
    };
    customers: {
      current: number;
      target: number;
      trend: string;
      status: string;
    };
    healthScore: {
      current: number;
      target: number;
      trend: string;
      status: string;
    };
  };
}

const Metrics: React.FC<MetricsProps> = ({ data }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-50';
      case 'warning': return 'bg-yellow-50';
      case 'critical': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith('+')) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend.startsWith('-')) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* NRR Metric */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Net Revenue Retention</p>
            <p className="text-2xl font-semibold text-gray-900">{data.nrr.current}%</p>
            <div className="flex items-center gap-2 mt-1">
              {getTrendIcon(data.nrr.trend)}
              <span className={`text-sm ${getStatusColor(data.nrr.status)}`}>
                {data.nrr.trend} vs target
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${getStatusBgColor(data.nrr.status)}`}>
            <Target className={`w-6 h-6 ${getStatusColor(data.nrr.status)}`} />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Target: {data.nrr.target}%</span>
          </div>
        </div>
      </div>

      {/* ARR Metric */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Annual Recurring Revenue</p>
            <p className="text-2xl font-semibold text-gray-900">{data.arr.current}</p>
            <div className="flex items-center gap-2 mt-1">
              {getTrendIcon(data.arr.trend)}
              <span className={`text-sm ${getStatusColor(data.arr.status)}`}>
                {data.arr.trend} vs target
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${getStatusBgColor(data.arr.status)}`}>
            <DollarSign className={`w-6 h-6 ${getStatusColor(data.arr.status)}`} />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Target: {data.arr.target}</span>
          </div>
        </div>
      </div>

      {/* Customers Metric */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Customers</p>
            <p className="text-2xl font-semibold text-gray-900">{data.customers.current.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-1">
              {getTrendIcon(data.customers.trend)}
              <span className={`text-sm ${getStatusColor(data.customers.status)}`}>
                {data.customers.trend} vs target
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${getStatusBgColor(data.customers.status)}`}>
            <Users className={`w-6 h-6 ${getStatusColor(data.customers.status)}`} />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Target: {data.customers.target.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Health Score Metric */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Customer Health Score</p>
            <p className="text-2xl font-semibold text-gray-900">{data.healthScore.current}/100</p>
            <div className="flex items-center gap-2 mt-1">
              {getTrendIcon(data.healthScore.trend)}
              <span className={`text-sm ${getStatusColor(data.healthScore.status)}`}>
                {data.healthScore.trend} vs target
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${getStatusBgColor(data.healthScore.status)}`}>
            <Target className={`w-6 h-6 ${getStatusColor(data.healthScore.status)}`} />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Target: {data.healthScore.target}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;

