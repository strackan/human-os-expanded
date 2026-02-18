'use client';

import { Settings, X, Clock } from 'lucide-react';
import { ProductionSidebar } from './ProductionSidebar';
import type { ProductionMode } from '@/lib/founders/types';

interface ProductionLayoutProps {
  mode: ProductionMode;
  onModeChange: (mode: ProductionMode) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  sessionDuration?: string;
  children: React.ReactNode;
}

const MODE_LABELS: Record<ProductionMode, { label: string; color: string }> = {
  default: { label: 'Production', color: 'text-gray-400' },
  journal: { label: 'Journal', color: 'text-amber-400' },
  brainstorm: { label: 'Brainstorm', color: 'text-yellow-400' },
  'check-in': { label: 'Check-in', color: 'text-green-400' },
  post: { label: 'Post', color: 'text-blue-400' },
  search: { label: 'Search', color: 'text-purple-400' },
  crisis: { label: 'Crisis', color: 'text-red-400' },
};

export function ProductionLayout({ mode, onModeChange, sidebarCollapsed, onToggleSidebar, sessionDuration, children }: ProductionLayoutProps) {
  const modeInfo = MODE_LABELS[mode];
  return (
    <div className="flex flex-col h-screen bg-[var(--gh-dark-900)]">
      <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--gh-dark-700)] bg-[var(--gh-dark-850)]">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-gray-300">Founder OS</h1>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${modeInfo.color}`}>{modeInfo.label}</span>
            {mode !== 'default' && (
              <button onClick={() => onModeChange('default')} className="p-0.5 text-gray-500 hover:text-gray-300 rounded transition-colors" title="Exit mode">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sessionDuration && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3 h-3" />{sessionDuration}
            </span>
          )}
          <button className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-[var(--gh-dark-700)] transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <ProductionSidebar currentMode={mode} onModeChange={onModeChange} collapsed={sidebarCollapsed} onToggleCollapse={onToggleSidebar} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
