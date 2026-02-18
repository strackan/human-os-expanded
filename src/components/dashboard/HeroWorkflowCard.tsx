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

function formatArr(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${Math.round(arr / 1_000)}K`;
  return `$${arr}`;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function getDueLabel(daysUntilRenewal?: number): string {
  if (daysUntilRenewal === undefined) return 'UPCOMING';
  if (daysUntilRenewal <= 0) return 'OVERDUE';
  if (daysUntilRenewal <= 1) return 'DUE TODAY';
  if (daysUntilRenewal <= 7) return `DUE IN ${daysUntilRenewal}D`;
  if (daysUntilRenewal <= 30) return `DUE IN ${Math.ceil(daysUntilRenewal / 7)}W`;
  return `DUE IN ${Math.round(daysUntilRenewal / 30)}MO`;
}

export default function HeroWorkflowCard({ workflow, onLaunch, isLoading, isLaunching }: HeroWorkflowCardProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative overflow-hidden rounded-3xl px-10 py-10"
        style={{ background: 'linear-gradient(135deg, #2D2A53, #3D2A63, #2D2A53)' }}
      >
        <div className="animate-pulse space-y-5">
          <div className="flex justify-between">
            <div className="h-5 w-40 bg-white/10 rounded-full" />
            <div className="h-12 w-12 bg-white/10 rounded-full" />
          </div>
          <div className="h-8 w-[80%] bg-white/10 rounded-lg" />
          <div className="h-6 w-[50%] bg-white/10 rounded-lg" />
          <div className="h-16 w-full bg-white/5 rounded-xl" />
          <div className="flex justify-between">
            <div className="flex gap-2">
              <div className="h-7 w-16 bg-white/10 rounded-full" />
              <div className="h-7 w-24 bg-white/10 rounded-full" />
            </div>
            <div className="h-9 w-36 bg-white/10 rounded-lg" />
          </div>
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
        className="relative overflow-hidden rounded-3xl px-10 py-14 text-center"
        style={{ background: 'linear-gradient(135deg, #2D2A53, #3D2A63, #2D2A53)' }}
      >
        <p className="text-lg text-white/50">No workflows queued right now. Nice work!</p>
      </motion.div>
    );
  }

  const category = getCategoryConfig(workflow.workflowType);
  const bounty = calculateBountyPoints(workflow.priorityScore);
  const triggerReason = getTriggerReason({
    workflowType: workflow.workflowType,
    daysUntilRenewal: workflow.daysUntilRenewal,
    currentArr: workflow.currentArr,
    healthScore: workflow.healthScore,
  });

  // Build descriptive headline: "Prepare renewal strategy for GrowthStack — usage dropped 23%"
  const headline = `${workflow.workflowName} \u2014 ${triggerReason.toLowerCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative overflow-hidden rounded-3xl px-10 py-10"
      style={{ background: 'linear-gradient(135deg, #2D2A53, #3D2A63, #2D2A53)' }}
    >
      {/* Decorative gradient orb */}
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #a855f7, #6366f1, transparent)' }}
      />

      {/* Header: "TODAY'S ONE THING" + bounty circle */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">
            Today&apos;s One Thing
          </span>
        </div>
        {/* Bounty circle + label */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-amber-400 bg-white/5">
            <span
              className="text-xl font-bold leading-none text-amber-400"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              {bounty.points}
            </span>
          </div>
          <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider mt-1">Points</span>
        </div>
      </div>

      {/* Descriptive headline */}
      <h2
        className="text-[1.75rem] font-extrabold text-white leading-snug mb-6 relative z-10 max-w-[85%]"
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        {headline}
      </h2>

      {/* Customer info bar */}
      <div className="flex items-center gap-4 bg-white/5 rounded-xl px-5 py-4 mb-6 relative z-10">
        {/* Initials avatar */}
        <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">{getInitials(workflow.customerName)}</span>
        </div>
        {/* Name + context */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{workflow.customerName}</p>
          <p className="text-xs text-white/40 truncate">{triggerReason}</p>
        </div>
        {/* ARR */}
        {workflow.currentArr !== undefined && workflow.currentArr > 0 && (
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide block">ARR</span>
            <span
              className="text-lg font-bold text-white leading-none"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              {formatArr(workflow.currentArr)}
            </span>
          </div>
        )}
      </div>

      {/* Bottom row: tags + launch button */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          {/* Category tag */}
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${category.heroTagBg} ${category.heroTagText}`}>
            {category.shortLabel}
          </span>
          {/* Due date tag */}
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 text-white/70 uppercase tracking-wide">
            {getDueLabel(workflow.daysUntilRenewal)}
          </span>
        </div>
        {/* Launch button */}
        <button
          onClick={() => onLaunch(workflow)}
          disabled={isLaunching}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
        >
          {isLaunching ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Launching...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Launch Workflow
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
