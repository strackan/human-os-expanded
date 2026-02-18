'use client';

import { motion } from 'framer-motion';
import { getCategoryConfig } from '@/lib/workflows/category-classification';
import { calculateBountyPoints } from '@/lib/workflows/bounty';
import type { DashboardWorkflow } from './HeroWorkflowCard';

interface SecondaryWorkflowCardProps {
  workflow: DashboardWorkflow;
  onClick: (workflow: DashboardWorkflow) => void;
  index: number;
}

export default function SecondaryWorkflowCard({ workflow, onClick, index }: SecondaryWorkflowCardProps) {
  const category = getCategoryConfig(workflow.workflowType);
  const bounty = calculateBountyPoints(workflow.priorityScore);

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
      onClick={() => onClick(workflow)}
      className="text-left w-full bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
    >
      {/* Category tag + bounty */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${category.bgColor} ${category.textColor} ${category.borderColor}`}>
          {category.label}
        </span>
        <span
          className="text-xs font-bold text-purple-600"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          +{bounty.points} pts
        </span>
      </div>

      {/* Customer name */}
      <h3
        className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-900 transition-colors"
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        {workflow.customerName}
      </h3>

      {/* Workflow title */}
      <p className="text-sm text-gray-500 line-clamp-1">
        {workflow.workflowName}
      </p>
    </motion.button>
  );
}
