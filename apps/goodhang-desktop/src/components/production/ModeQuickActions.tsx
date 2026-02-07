/**
 * Mode Quick Actions
 *
 * Horizontal row of contextual quick action buttons above the chat input.
 * Changes based on the current production mode.
 */

import type { ProductionMode } from '@/lib/types/production';
import type { QuickAction } from '@/lib/types/shared';

interface ModeQuickActionsProps {
  mode: ProductionMode;
  onAction: (value: string) => void;
  disabled?: boolean;
}

const MODE_ACTIONS: Record<ProductionMode, QuickAction[]> = {
  default: [
    { label: "What's urgent?", value: "What's urgent right now?" },
    { label: 'Energy check', value: 'How am I doing on energy today?' },
    { label: 'Parking lot', value: "What's in my parking lot?" },
  ],
  journal: [
    { label: 'Gratitude', value: "What am I grateful for today?" },
    { label: 'Reflection', value: "Let me reflect on today." },
    { label: "Tomorrow's intention", value: "What's my intention for tomorrow?" },
  ],
  brainstorm: [
    { label: 'What if...', value: 'What if we tried a completely different approach?' },
    { label: '10 ideas for...', value: 'Give me 10 ideas for ' },
    { label: 'Combine ideas', value: "Let's combine the best ideas so far." },
  ],
  checkin: [
    { label: 'How am I?', value: "Let's do a full check-in." },
    { label: 'Top 3 priorities', value: 'What are my top 3 priorities today?' },
    { label: 'Blocked items', value: "What's blocking me right now?" },
  ],
  crisis: [
    { label: 'Breathe', value: "I need to slow down. Help me breathe." },
    { label: 'Brain dump', value: "Let me brain dump everything that's on my mind." },
    { label: 'Pick ONE thing', value: "Help me pick the single most important thing to focus on right now." },
  ],
  post: [
    { label: 'LinkedIn post', value: 'Help me draft a LinkedIn post about ' },
    { label: 'Reply draft', value: 'Help me draft a reply to ' },
    { label: 'Schedule', value: "What content do I have scheduled?" },
  ],
  search: [
    { label: 'Who knows...', value: 'Who in my network knows about ' },
    { label: 'Austin contacts', value: 'Show me my Austin-based contacts.' },
    { label: 'Recent connections', value: 'Who have I connected with recently?' },
  ],
};

export function ModeQuickActions({ mode, onAction, disabled }: ModeQuickActionsProps) {
  const actions = MODE_ACTIONS[mode] || MODE_ACTIONS.default;

  return (
    <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
      {actions.map((action) => (
        <button
          key={action.value}
          onClick={() => onAction(action.value)}
          disabled={disabled}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-gray-400 bg-gh-dark-700 hover:bg-gh-dark-600 hover:text-white rounded-full border border-gh-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

export default ModeQuickActions;
