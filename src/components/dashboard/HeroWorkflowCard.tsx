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
        className="relative overflow-hidden rounded-2xl px-10 py-9"
        style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2B55 40%, #3B2667 70%, #4A2D7A 100%)' }}
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
        className="relative overflow-hidden rounded-2xl px-10 py-14 text-center"
        style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2B55 40%, #3B2667 70%, #4A2D7A 100%)' }}
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

  // Descriptive headline: "Prepare renewal strategy for GrowthStack — usage dropped 23%"
  const headline = `${workflow.workflowName} \u2014 ${triggerReason.toLowerCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative overflow-hidden rounded-2xl px-10 py-9 cursor-pointer transition-transform hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2B55 40%, #3B2667 70%, #4A2D7A 100%)',
        boxShadow: '0 12px 48px rgba(74, 45, 122, 0.25)',
      }}
    >
      {/* Decorative gradient glow */}
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.02, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(232, 114, 58, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(212, 168, 67, 0.08) 0%, transparent 40%)',
        }}
      />

      {/* Header: "TODAY'S ONE THING" + bounty circle */}
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#E8723A' }}
          />
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Today&apos;s One Thing
          </span>
        </div>
        {/* Bounty circle + label */}
        <div className="flex flex-col items-center">
          <div
            className="flex items-center justify-center w-[52px] h-[52px] rounded-full relative z-10"
            style={{
              background: 'rgba(232, 114, 58, 0.15)',
              border: '1.5px solid rgba(232, 114, 58, 0.4)',
            }}
          >
            <span
              className="text-lg font-bold leading-none"
              style={{ fontFamily: 'var(--font-fraunces)', color: '#E8723A' }}
            >
              {bounty.points}
            </span>
          </div>
          <span
            className="text-[9px] font-medium uppercase tracking-wider mt-1"
            style={{ color: 'rgba(232, 114, 58, 0.7)' }}
          >
            Points
          </span>
        </div>
      </div>

      {/* Descriptive headline — Fraunces serif */}
      <h2
        className="text-[1.65rem] font-semibold text-white leading-snug mb-4 relative z-10 max-w-[80%]"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        {headline}
      </h2>

      {/* Customer info bar */}
      <div
        className="flex items-center gap-4 rounded-xl px-5 py-3.5 mb-4 relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Initials avatar */}
        <div
          className="w-[46px] h-[46px] rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #4A7FD4, #6B9BE0)' }}
        >
          <span
            className="text-base font-bold text-white"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            {getInitials(workflow.customerName)}
          </span>
        </div>
        {/* Name + context */}
        <div className="flex-1 min-w-0">
          <p className="text-[0.95rem] font-semibold text-white truncate">{workflow.customerName}</p>
          <p className="text-sm truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{triggerReason}</p>
        </div>
        {/* ARR */}
        {workflow.currentArr !== undefined && workflow.currentArr > 0 && (
          <div className="text-right flex-shrink-0">
            <span className="text-[0.7rem] font-medium uppercase tracking-wide block" style={{ color: 'rgba(255,255,255,0.4)' }}>ARR</span>
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
        <div className="flex items-center gap-2.5">
          {/* Category tag */}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide ${category.heroTagBg} ${category.heroTagText}`}
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {category.shortLabel}
          </span>
          {/* Due date tag */}
          <span
            className="text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wide"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {getDueLabel(workflow.daysUntilRenewal)}
          </span>
        </div>
        {/* Launch button */}
        <button
          onClick={() => onLaunch(workflow)}
          disabled={isLaunching}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {isLaunching ? (
            <>
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Launching...
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Launch Workflow
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
