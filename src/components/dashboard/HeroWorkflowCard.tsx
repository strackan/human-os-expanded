'use client';

import { motion } from 'framer-motion';
import { getCategoryConfig } from '@/lib/workflows/category-classification';
import { getTriggerReason } from '@/lib/workflows/trigger-reasons';
import { calculateBountyPoints } from '@/lib/workflows/bounty';

export interface DashboardWorkflow {
  id: string;
  workflowConfigId: string;
  workflowName: string;
  workflowType: string;
  customerId: string;
  customerName: string;
  priorityScore: number;
  currentArr?: number;
  healthScore?: number;
  renewalDate?: string;
  daysUntilRenewal?: number;
}

interface HeroWorkflowCardProps {
  workflow: DashboardWorkflow | null;
  onLaunch: (workflow: DashboardWorkflow) => void;
  isLoading?: boolean;
  isLaunching?: boolean;
}

function getPriorityBadge(score: number): { label: string; className: string } {
  if (score >= 80) return { label: 'Critical', className: 'bg-red-100 text-red-700' };
  if (score >= 60) return { label: 'High', className: 'bg-orange-100 text-orange-700' };
  if (score >= 40) return { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Low', className: 'bg-green-100 text-green-700' };
}

function formatArr(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${Math.round(arr / 1_000)}K`;
  return `$${arr}`;
}

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function formatRenewalDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HeroWorkflowCard({ workflow, onLaunch, isLoading, isLaunching }: HeroWorkflowCardProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative overflow-hidden rounded-3xl px-12 py-14 border border-purple-200/50"
        style={{ background: 'linear-gradient(135deg, #f8f7f4, #ede9fe, #e0e7ff)' }}
      >
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between">
            <div className="h-6 w-24 bg-white/60 rounded-full" />
            <div className="h-6 w-20 bg-white/60 rounded-full" />
          </div>
          <div className="h-10 w-72 bg-white/60 rounded-lg" />
          <div className="h-6 w-48 bg-white/40 rounded-lg" />
          <div className="h-8 w-96 bg-white/30 rounded-full" />
          <div className="flex gap-6 mt-6">
            <div className="h-5 w-20 bg-white/40 rounded" />
            <div className="h-5 w-20 bg-white/40 rounded" />
            <div className="h-5 w-20 bg-white/40 rounded" />
          </div>
          <div className="h-12 w-48 bg-white/50 rounded-xl mt-4" />
        </div>
      </motion.div>
    );
  }

  // Empty state
  if (!workflow) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative overflow-hidden rounded-3xl px-12 py-14 border border-gray-200 bg-gray-50 text-center"
      >
        <p className="text-lg text-gray-400">No workflows queued right now. Nice work!</p>
      </motion.div>
    );
  }

  const category = getCategoryConfig(workflow.workflowType);
  const bounty = calculateBountyPoints(workflow.priorityScore);
  const priority = getPriorityBadge(workflow.priorityScore);
  const triggerReason = getTriggerReason({
    workflowType: workflow.workflowType,
    daysUntilRenewal: workflow.daysUntilRenewal,
    currentArr: workflow.currentArr,
    healthScore: workflow.healthScore,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative overflow-hidden rounded-3xl px-12 py-14 border border-purple-200/50"
      style={{ background: 'linear-gradient(135deg, #f8f7f4, #ede9fe, #e0e7ff)' }}
    >
      {/* Decorative gradient orb */}
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #a855f7, #6366f1, transparent)' }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${category.bgColor} ${category.textColor} ${category.borderColor}`}>
            {category.label}
          </span>
          <span className="text-sm font-medium text-gray-500">Today&apos;s One Thing</span>
        </div>
        <span
          className="text-sm font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          +{bounty.points} pts
        </span>
      </div>

      {/* Customer name */}
      <h2
        className="text-3xl font-bold text-gray-900 mb-1 relative z-10"
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        {workflow.customerName}
      </h2>

      {/* Workflow title */}
      <p className="text-lg text-gray-600 mb-4 relative z-10">
        {workflow.workflowName}
      </p>

      {/* Trigger reason chip */}
      <div className="mb-6 relative z-10">
        <span className="inline-block text-sm px-4 py-2 rounded-full bg-white/70 text-gray-700 border border-gray-200/60">
          {triggerReason}
        </span>
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-6 mb-8 text-sm relative z-10">
        {workflow.currentArr && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">ARR</span>
            <span className="font-semibold text-gray-700">{formatArr(workflow.currentArr)}</span>
          </div>
        )}
        {workflow.healthScore !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Health</span>
            <span className={`font-semibold ${getHealthColor(workflow.healthScore)}`}>{workflow.healthScore}</span>
          </div>
        )}
        {workflow.renewalDate && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Contract End</span>
            <span className="font-semibold text-gray-700">{formatRenewalDate(workflow.renewalDate)}</span>
          </div>
        )}
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${priority.className}`}>
          {priority.label}
        </span>
      </div>

      {/* CTA button */}
      <button
        onClick={() => onLaunch(workflow)}
        disabled={isLaunching}
        className="relative z-10 px-8 py-3.5 rounded-xl text-white font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'var(--dashboard-accent-primary, #2D2A53)' }}
      >
        {isLaunching ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Launching...
          </span>
        ) : (
          'Launch Task Mode'
        )}
      </button>
    </motion.div>
  );
}
