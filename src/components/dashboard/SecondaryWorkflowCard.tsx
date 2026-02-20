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
      className={`text-left w-full bg-white rounded-2xl border border-gray-200 hover:border-transparent hover:-translate-y-0.5 transition-all group overflow-hidden`}
      style={{ borderTop: `3px solid ${category.category === 'risk-based' ? '#D94F4F' : category.category === 'opportunity-based' ? '#2BA86A' : '#4A7FD4'}` }}
    >
      <div className="px-5 pt-5 pb-4">
        {/* Category tag + bounty points */}
        <div className="flex items-center justify-between mb-2.5">
          <span className={`text-[0.68rem] font-semibold px-2.5 py-0.5 rounded-xl uppercase tracking-wide ${category.bgColor} ${category.textColor}`}>
            {category.shortLabel}
          </span>
          <span
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-fraunces)', color: '#E8723A' }}
          >
            +{bounty.points} pts
          </span>
        </div>

        {/* Customer name */}
        <h3
          className="text-[0.95rem] font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors truncate"
        >
          {workflow.customerName}
        </h3>

        {/* Trigger reason / signal text */}
        <p className="text-[0.78rem] text-gray-400 leading-snug line-clamp-2 mb-3.5" style={{ minHeight: '2.2rem' }}>
          {triggerReason}
        </p>

        {/* Bottom row: ARR + play button */}
        <div className="flex items-center justify-between">
          {workflow.currentArr !== undefined && workflow.currentArr > 0 ? (
            <span
              className="text-[0.85rem] font-bold text-gray-800"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              {formatArr(workflow.currentArr)} ARR
            </span>
          ) : (
            <div />
          )}
          <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
            style={{ background: '#F8F6F2' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 group-hover:text-gray-900 transition-colors">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
