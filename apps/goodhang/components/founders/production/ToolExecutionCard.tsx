'use client';

import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import type { DoGateResult } from '@/lib/founders/types';

interface ToolExecutionCardProps {
  result: DoGateResult;
}

export function ToolExecutionCard({ result }: ToolExecutionCardProps) {
  if (!result.matched) return null;
  const isSuccess = result.confidence >= 0.7;
  const isPartial = result.confidence >= 0.4 && result.confidence < 0.7;
  const statusConfig = isSuccess
    ? { icon: <CheckCircle className="w-4 h-4" />, color: 'border-green-500/30 bg-green-500/5', iconColor: 'text-green-400' }
    : isPartial
    ? { icon: <AlertTriangle className="w-4 h-4" />, color: 'border-yellow-500/30 bg-yellow-500/5', iconColor: 'text-yellow-400' }
    : { icon: <AlertCircle className="w-4 h-4" />, color: 'border-red-500/30 bg-red-500/5', iconColor: 'text-red-400' };

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${statusConfig.color} mx-4 my-1 animate-founders-fade-in`}>
      <span className={`mt-0.5 ${statusConfig.iconColor}`}>{statusConfig.icon}</span>
      <div className="flex-1 min-w-0">
        {result.aliasPattern && <span className="text-[11px] text-gray-500 font-mono">{result.aliasPattern}</span>}
        <p className="text-sm text-gray-300 mt-0.5">{result.summary}</p>
      </div>
    </div>
  );
}
