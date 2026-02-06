/**
 * Commandments Review Component
 *
 * Displays synthesized commandments in a tabbed UI for user review and approval.
 * Two main tabs: Founder OS (10 commandments) and Voice OS (10 commandments).
 * Each commandment is displayed in a collapsible card format.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Mic, ChevronDown, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { FounderOsExtractionResult, VoiceOsExtractionResult } from '@/lib/types';

// =============================================================================
// TYPES
// =============================================================================

export type CommandmentsTab = 'founder' | 'voice';

export interface CommandmentsReviewProps {
  founderOs: FounderOsExtractionResult;
  voiceOs: VoiceOsExtractionResult;
  onConfirm: () => void;
  onEdit?: (category: 'founder' | 'voice', key: string, value: string) => void;
}

// =============================================================================
// COMMANDMENT DEFINITIONS
// =============================================================================

interface CommandmentDef {
  key: string;
  title: string;
  description: string;
  icon: string;
}

// Default commandment definitions (can be overridden by actual keys from API)
const FOUNDER_OS_DEFAULTS: Record<string, { title: string; description: string; icon: string }> = {
  CURRENT_STATE: { title: 'Current State', description: 'Core identity, energy indicators, priorities', icon: '🎯' },
  STRATEGIC_THOUGHT_PARTNER: { title: 'Strategic Thought Partner', description: 'Decision frameworks, strengths, blind spots', icon: '🧭' },
  DECISION_MAKING: { title: 'Decision Making', description: 'Style under load, paralysis triggers, support preferences', icon: '⚖️' },
  ENERGY_PATTERNS: { title: 'Energy Patterns', description: 'Energizers, drains, optimal conditions', icon: '⚡' },
  AVOIDANCE_PATTERNS: { title: 'Avoidance Patterns', description: 'Stuck indicators, avoidance behaviors, interventions', icon: '🚫' },
  RECOVERY_PROTOCOLS: { title: 'Recovery Protocols', description: 'Reset methods, timeline, support needs', icon: '🔄' },
  ACCOUNTABILITY_FRAMEWORK: { title: 'Accountability Framework', description: 'How you prefer to be held accountable', icon: '📊' },
  EMOTIONAL_SUPPORT: { title: 'Emotional Support', description: 'Support needs and boundaries', icon: '💙' },
  WORK_STYLE: { title: 'Work Style', description: 'Support methods, priority presentation, autonomy level', icon: '💼' },
  CONVERSATION_PROTOCOLS: { title: 'Conversation Protocols', description: 'Communication style, energy modes, red flags', icon: '💬' },
  CRISIS_PROTOCOLS: { title: 'Crisis Protocols', description: 'Overwhelm response, historical resilience, what NOT to do', icon: '🆘' },
  SUPPORT_CALIBRATION: { title: 'Support Calibration', description: 'State signals, mode triggers, rapport style', icon: '🎛️' },
};

const VOICE_OS_DEFAULTS: Record<string, { title: string; description: string; icon: string }> = {
  VOICE: { title: 'Voice', description: 'Always/never patterns, vocabulary fingerprint, rhythm', icon: '🎤' },
  THEMES: { title: 'Themes', description: 'Core beliefs, current focus, values', icon: '📚' },
  GUARDRAILS: { title: 'Guardrails', description: 'Topics/tones to avoid, sacred cows, hard NOs', icon: '🚧' },
  AUDIENCE: { title: 'Audience', description: 'Who you write for and how to address them', icon: '👥' },
  AUTHORITY: { title: 'Authority', description: 'Your expertise and how to convey it', icon: '🏆' },
  HUMOR: { title: 'Humor', description: 'Your style of wit and when to use it', icon: '😄' },
  CONTROVERSY: { title: 'Controversy', description: 'How you handle hot takes and pushback', icon: '🔥' },
  PERSONAL: { title: 'Personal', description: 'What you share and what stays private', icon: '🔐' },
  FORMAT: { title: 'Format', description: 'Structure preferences and content types', icon: '📝' },
  QUALITY_CONTROL: { title: 'Quality Control', description: 'Standards and polish expectations', icon: '✨' },
  STORIES: { title: 'Stories', description: 'Key narratives, story themes, vulnerability level', icon: '📖' },
  ANECDOTES: { title: 'Anecdotes', description: 'Brief examples, proof points, personal references', icon: '💬' },
  OPENINGS: { title: 'Openings', description: 'Hook styles, greeting patterns, tone openers', icon: '🚀' },
  MIDDLES: { title: 'Middles', description: 'Argument structures, evidence patterns, transitions', icon: '📊' },
  ENDINGS: { title: 'Endings', description: 'Closing patterns, CTA style, mic-drop lines', icon: '🎬' },
  BLENDS: { title: 'Blends', description: 'Content types, format preferences, mixing patterns', icon: '🎨' },
  EXAMPLES: { title: 'Examples', description: 'Sample thought leadership, story, connection message', icon: '📝' },
};

// Helper to format key to title (SNAKE_CASE -> Title Case)
function formatKeyToTitle(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Build commandment defs from actual data
function buildCommandmentDefs(
  commandments: Record<string, string> | undefined,
  defaults: Record<string, { title: string; description: string; icon: string }>
): CommandmentDef[] {
  if (!commandments) return [];

  return Object.keys(commandments).map(key => {
    const def = defaults[key];
    return {
      key,
      title: def?.title || formatKeyToTitle(key),
      description: def?.description || '',
      icon: def?.icon || '📄',
    };
  });
}

// =============================================================================
// COLLAPSIBLE CARD COMPONENT
// =============================================================================

interface CommandmentCardProps {
  def: CommandmentDef;
  content: string;
  defaultExpanded?: boolean;
}

function CommandmentCard({ def, content, defaultExpanded = false }: CommandmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-gh-dark-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gh-dark-700/70 transition-colors"
      >
        <span className="text-xl flex-shrink-0">{def.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate">{def.title}</h4>
          <p className="text-xs text-gray-500 truncate">{def.description}</p>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-gh-dark-600">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{content || '*No content generated*'}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TAB CONTENT COMPONENTS
// =============================================================================

interface FounderTabProps {
  founderOs: FounderOsExtractionResult;
}

function FounderTab({ founderOs }: FounderTabProps) {
  // Build commandment defs from actual data
  const commandments = founderOs?.commandments as unknown as Record<string, string> | undefined;
  const commandmentDefs = buildCommandmentDefs(commandments, FOUNDER_OS_DEFAULTS);

  // Get summary fields (handle different API response structures)
  const summary = founderOs?.summary as unknown as Record<string, unknown> | undefined;
  const summaryTitle = (summary?.personality_type || summary?.core_identity || 'Your Founder Profile') as string;
  const summaryPatterns = (summary?.key_patterns || []) as string[];

  return (
    <div className="space-y-3">
      {/* Summary Card */}
      {summary && (
        <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">
              {summaryTitle}
            </span>
          </div>
          {summaryPatterns.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {summaryPatterns.slice(0, 5).map((pattern, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-purple-600/30 text-purple-300 text-xs rounded-full"
                >
                  {pattern}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Commandment Cards */}
      {commandmentDefs.length > 0 ? (
        commandmentDefs.map((def, index) => (
          <CommandmentCard
            key={def.key}
            def={def}
            content={commandments?.[def.key] || ''}
            defaultExpanded={index === 0}
          />
        ))
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No Founder OS commandments found.</p>
          <p className="text-sm mt-2">This may indicate an issue with the synthesis.</p>
        </div>
      )}
    </div>
  );
}

interface VoiceTabProps {
  voiceOs: VoiceOsExtractionResult;
}

function VoiceTab({ voiceOs }: VoiceTabProps) {
  // Build commandment defs from actual data
  const commandments = voiceOs?.commandments as unknown as Record<string, string> | undefined;
  const commandmentDefs = buildCommandmentDefs(commandments, VOICE_OS_DEFAULTS);

  // Get summary fields (handle different API response structures)
  const summary = voiceOs?.summary as unknown as Record<string, unknown> | undefined;
  const summaryTitle = (summary?.voice_type || summary?.voice_essence || 'Your Voice Profile') as string;
  const summaryChars = (summary?.key_characteristics || summary?.signature_moves || []) as string[];

  return (
    <div className="space-y-3">
      {/* Summary Card */}
      {summary && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">
              {summaryTitle}
            </span>
          </div>
          {summaryChars.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {summaryChars.slice(0, 5).map((char, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-blue-600/30 text-blue-300 text-xs rounded-full"
                >
                  {char}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Commandment Cards */}
      {commandmentDefs.length > 0 ? (
        commandmentDefs.map((def, index) => (
          <CommandmentCard
            key={def.key}
            def={def}
            content={commandments?.[def.key] || ''}
            defaultExpanded={index === 0}
          />
        ))
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No Voice OS commandments found.</p>
          <p className="text-sm mt-2">This may indicate an issue with the synthesis.</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const TABS: Array<{ id: CommandmentsTab; label: string; icon: typeof Brain }> = [
  { id: 'founder', label: 'Founder OS', icon: Brain },
  { id: 'voice', label: 'Voice OS', icon: Mic },
];

export function CommandmentsReview({
  founderOs,
  voiceOs,
  onConfirm,
}: CommandmentsReviewProps) {
  const [activeTab, setActiveTab] = useState<CommandmentsTab>('founder');
  const [confirmations, setConfirmations] = useState({
    founder: false,
    voice: false,
  });

  // Debug logging
  console.log('[CommandmentsReview] founderOs:', founderOs);
  console.log('[CommandmentsReview] voiceOs:', voiceOs);
  console.log('[CommandmentsReview] founderOs.commandments:', founderOs?.commandments);
  console.log('[CommandmentsReview] voiceOs.commandments:', voiceOs?.commandments);

  const handleConfirmTab = () => {
    setConfirmations((prev) => ({ ...prev, [activeTab]: true }));

    // Auto-advance to next tab if not confirmed yet
    if (activeTab === 'founder' && !confirmations.voice) {
      setActiveTab('voice');
    }
  };

  const allConfirmed = confirmations.founder && confirmations.voice;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'founder':
        return <FounderTab founderOs={founderOs} />;
      case 'voice':
        return <VoiceTab voiceOs={voiceOs} />;
    }
  };

  return (
    <div className="bg-gh-dark-800 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gh-dark-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">Review Your Human OS</h2>
        <p className="text-sm text-gray-400 mt-1">
          These 20 commandments define how AI will work with you and speak for you.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gh-dark-700 flex-shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isConfirmed = confirmations[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                isActive
                  ? 'text-white bg-gh-dark-700/50'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gh-dark-700/30'
              }`}
            >
              {isConfirmed ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span>{tab.label}</span>
              <span className="text-xs text-gray-500">(10)</span>
              {isActive && (
                <motion.div
                  layoutId="commandmentsActiveTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 min-h-0 overflow-y-auto scrollbar-minimal">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gh-dark-700 flex-shrink-0">
        {!confirmations[activeTab] ? (
          <button
            onClick={handleConfirmTab}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Confirm {activeTab === 'founder' ? 'Founder OS' : 'Voice OS'}
          </button>
        ) : allConfirmed ? (
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Continue
          </button>
        ) : (
          <div className="text-center text-gray-400 text-sm py-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 inline mr-2" />
            {activeTab === 'founder' ? 'Founder OS' : 'Voice OS'} confirmed. Review the other tab.
          </div>
        )}
      </div>
    </div>
  );
}

export default CommandmentsReview;
