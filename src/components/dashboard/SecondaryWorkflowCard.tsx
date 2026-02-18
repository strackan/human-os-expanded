'use client';

import { motion } from 'framer-motion';
import { getCategoryConfig } from '@/lib/workflows/category-classification';
import { getTriggerReason } from '@/lib/workflows/trigger-reasons';
import { calculateBountyPoints } from '@/lib/workflows/bounty';
import type { DashboardWorkflow } from './HeroWorkflowCard';

interface SecondaryWorkflowCardProps {
  workflow: DashboardWorkflow;
  onClick: (workflow: DashboardWorkflow) => void;
  index: number;
}

function formatArr(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${Math.round(arr / 1_000)}K`;
  return `$${arr}`;
}

export default function SecondaryWorkflowCard({ workflow, onClick, index }: SecondaryWorkflowCardProps) {
  const category = getCategoryConfig(workflow.workflowType);
  const bounty = calculateBountyPoints(workflow.priorityScore);
  const triggerReason = getTriggerReason({
    workflowType: workflow.workflowType,
    daysUntilRenewal: workflow.daysUntilRenewal,
    currentArr: workflow.currentArr,
    healthScore: workflow.healthScore,
  });

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
      onClick={() => onClick(workflow)}
      className={`text-left w-full bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group overflow-hidden border-t-4 ${category.accentColor}`}
    >
      <div className="px-5 pt-5 pb-4">
        {/* Category tag + bounty points */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${category.bgColor} ${category.textColor}`}>
            {category.shortLabel}
          </span>
          <span
            className="text-xs font-bold text-amber-500"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            +{bounty.points} pts
          </span>
        </div>

        {/* Customer name */}
        <h3
          className="text-base font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors truncate"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          {workflow.customerName}
        </h3>

        {/* Workflow name */}
        <p className="text-sm text-gray-500 mb-2 line-clamp-1">
          {workflow.workflowName}
        </p>

        {/* Trigger reason context */}
        <p className="text-xs text-gray-400 line-clamp-1 mb-4">
          {triggerReason}
        </p>

        {/* Bottom row: ARR + play button */}
        <div className="flex items-center justify-between">
          {workflow.currentArr !== undefined && workflow.currentArr > 0 ? (
            <div>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">ARR </span>
              <span
                className="text-sm font-bold text-gray-700"
                style={{ fontFamily: 'var(--font-fraunces)' }}
              >
                {formatArr(workflow.currentArr)}
              </span>
            </div>
          ) : (
            <div />
          )}
          <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
