/**
 * Report Tab Content Components
 *
 * Individual tab renderers for the executive report sections.
 * These are pure display components with no edit functionality.
 */

import ReactMarkdown from 'react-markdown';
import { ChevronRight, Sparkles, Mic, Sword } from 'lucide-react';
import type { ExecutiveReport, CharacterProfile } from '@/lib/types';

// =============================================================================
// STATUS TAB
// =============================================================================

interface StatusTabProps {
  report: ExecutiveReport;
}

export function StatusTab({ report }: StatusTabProps) {
  return (
    <div className="space-y-4">
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown>{report.summary}</ReactMarkdown>
      </div>
      <div className="pt-4 border-t border-gh-dark-600">
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">
          Communication Style
        </h4>
        <p className="text-white mb-2">{report.communication.style}</p>
        <ul className="space-y-1">
          {report.communication.preferences.map((pref, i) => (
            <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              {pref}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// =============================================================================
// PERSONALITY TAB
// =============================================================================

interface PersonalityTabProps {
  report: ExecutiveReport;
}

export function PersonalityTab({ report }: PersonalityTabProps) {
  return (
    <div className="space-y-4">
      {report.personality.map((p, i) => (
        <div key={i} className="bg-gh-dark-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-1">{p.trait}</h4>
          <p className="text-gray-300 text-sm mb-2">{p.description}</p>
          <p className="text-blue-400 text-sm flex items-start gap-1">
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {p.insight}
          </p>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// VOICE TAB
// =============================================================================

interface VoiceTabProps {
  report: ExecutiveReport;
}

export function VoiceTab({ report }: VoiceTabProps) {
  if (!report.voice) {
    return (
      <div className="text-center py-8">
        <Mic className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">
          Voice analysis will be generated based on your conversations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">
          Your Tone
        </h4>
        <p className="text-white">{report.voice.tone}</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">
          Writing Style
        </h4>
        <p className="text-gray-300">{report.voice.style}</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">
          Characteristics
        </h4>
        <ul className="space-y-1">
          {report.voice.characteristics.map((char, i) => (
            <li key={i} className="text-gray-300 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
              {char}
            </li>
          ))}
        </ul>
      </div>
      {report.voice.examples && report.voice.examples.length > 0 && (
        <div className="pt-4 border-t border-gh-dark-600">
          <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">
            Example Phrases
          </h4>
          <div className="space-y-2">
            {report.voice.examples.map((example, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-purple-500 pl-3 text-gray-300 italic text-sm"
              >
                "{example}"
              </blockquote>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CHARACTER TAB
// =============================================================================

interface CharacterTabProps {
  characterProfile: CharacterProfile | null;
  /** Optional callback when user wants to take the assessment */
  onTakeAssessment?: () => void;
}

export function CharacterTab({ characterProfile, onTakeAssessment }: CharacterTabProps) {
  if (!characterProfile) {
    return (
      <div className="text-center py-8">
        <Sword className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 mb-2">
          Your D&D character profile will be generated after completing the Good
          Hang assessment.
        </p>
        <p className="text-gray-500 text-sm mb-4">
          This maps your personality to a unique race, class, and alignment.
        </p>
        {onTakeAssessment && (
          <>
            <button
              onClick={onTakeAssessment}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Take The Assessment Now
            </button>
            <p className="text-gray-600 text-xs mt-3">
              Optional - Required for Good Hang Social mode
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="text-4xl mb-2">⚔️</div>
        <h3 className="text-xl font-bold text-white mb-1">
          {characterProfile.title ||
            `${characterProfile.race} ${characterProfile.characterClass}`}
        </h3>
        <p className="text-gray-400">{characterProfile.alignment}</p>
      </div>
      {characterProfile.attributes && (
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(characterProfile.attributes).map(([attr, value]) => (
            <div
              key={attr}
              className="bg-gh-dark-700/50 rounded-lg p-3 text-center"
            >
              <div className="text-lg font-bold text-white">{value}</div>
              <div className="text-xs text-gray-400 uppercase">
                {attr.substring(0, 3)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
