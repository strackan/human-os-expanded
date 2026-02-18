'use client';

import {
  BookOpen, Lightbulb, Heart, AlertTriangle, PenTool, Search,
  ListTodo, Plus, Users, Calendar, PanelLeftClose, PanelLeftOpen, User,
} from 'lucide-react';
import { useFoundersAuth } from '@/lib/founders/auth-context';
import type { ProductionMode } from '@/lib/founders/types';

interface ProductionSidebarProps {
  currentMode: ProductionMode;
  onModeChange: (mode: ProductionMode) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const MODE_CONFIG: Array<{
  mode: ProductionMode;
  label: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  { mode: 'journal', label: 'Journal', icon: <BookOpen className="w-5 h-5" />, accent: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  { mode: 'brainstorm', label: 'Brainstorm', icon: <Lightbulb className="w-5 h-5" />, accent: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  { mode: 'check-in', label: 'Check-in', icon: <Heart className="w-5 h-5" />, accent: 'text-green-400 bg-green-400/10 border-green-400/30' },
  { mode: 'post', label: 'Post', icon: <PenTool className="w-5 h-5" />, accent: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  { mode: 'search', label: 'Search', icon: <Search className="w-5 h-5" />, accent: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  { mode: 'crisis', label: 'Crisis', icon: <AlertTriangle className="w-5 h-5" />, accent: 'text-red-400 bg-red-400/10 border-red-400/30' },
];

const QUICK_ACCESS = [
  { id: 'context', label: 'Add Context', icon: <Plus className="w-5 h-5" /> },
  { id: 'experts', label: 'Add Expert', icon: <Users className="w-5 h-5" /> },
  { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-5 h-5" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
];

export function ProductionSidebar({ currentMode, onModeChange, collapsed, onToggleCollapse }: ProductionSidebarProps) {
  return (
    <aside
      style={{ width: collapsed ? 60 : 200, transition: 'width 0.2s ease-in-out' }}
      className="flex flex-col border-r border-[var(--gh-dark-700)] bg-[var(--gh-dark-850)] h-full overflow-hidden"
    >
      <div className="flex items-center justify-end p-2">
        <button onClick={onToggleCollapse} className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-[var(--gh-dark-700)] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex flex-col gap-1 px-2">
        {!collapsed && <span className="text-[10px] uppercase tracking-wider text-gray-600 px-2 mb-1">Modes</span>}
        {MODE_CONFIG.map(({ mode, label, icon, accent }) => {
          const isActive = currentMode === mode;
          return (
            <button key={mode} onClick={() => onModeChange(isActive ? 'default' : mode)} title={label}
              className={`flex items-center gap-3 rounded-lg transition-all ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'} ${
                isActive ? `${accent} border` : 'text-gray-400 hover:text-white hover:bg-[var(--gh-dark-700)] border border-transparent'}`}>
              {icon}
              {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
            </button>
          );
        })}
      </div>

      <div className="my-3 mx-3 border-t border-[var(--gh-dark-700)]" />

      <div className="flex flex-col gap-1 px-2">
        {!collapsed && <span className="text-[10px] uppercase tracking-wider text-gray-600 px-2 mb-1">Quick Access</span>}
        {QUICK_ACCESS.map(({ id, label, icon }) => (
          <button key={id} title={label}
            className={`flex items-center gap-3 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--gh-dark-700)] transition-colors ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'}`}>
            {icon}
            {!collapsed && <span className="text-sm truncate">{label}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1" />
      <UserBadge collapsed={collapsed} />
    </aside>
  );
}

function UserBadge({ collapsed }: { collapsed: boolean }) {
  const { status } = useFoundersAuth();
  const name = status?.user?.full_name || status?.contexts?.active || '...';
  const slug = status?.contexts?.active || '';
  return (
    <div className={`border-t border-[var(--gh-dark-700)] p-2 ${collapsed ? 'flex justify-center' : ''}`}>
      <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-500 ${collapsed ? 'justify-center' : ''}`}
        title={`${name} (${slug})`}>
        <User className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span className="text-xs truncate">{name}</span>}
      </div>
    </div>
  );
}
