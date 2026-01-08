'use client';

/**
 * D&D Character Results Page - Gated Reveal
 *
 * Shows teaser of character (class, race, alignment)
 * Gates full details behind desktop app download
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface CharacterProfile {
  tagline: string;
  alignment: string;
  race: string;
  class: string;
}

interface CharacterResults {
  session_id: string;
  character_profile?: CharacterProfile;
  attributes?: {
    INT: number;
    WIS: number;
    CHA: number;
    CON: number;
    STR: number;
    DEX: number;
  };
  signals?: {
    social_energy?: string;
    relationship_style?: string;
    interest_vectors?: string[];
    enneagram_hint?: string;
  };
  matching?: {
    ideal_group_size?: string;
    connection_style?: string;
    energy_pattern?: string;
    good_match_with?: string[];
    avoid_match_with?: string[];
  };
}

// Character class icons/emojis
const CLASS_ICONS: Record<string, string> = {
  Paladin: '⚔️',
  Wizard: '🧙',
  Bard: '🎭',
  Rogue: '🗡️',
  Ranger: '🏹',
  Sorcerer: '✨',
  Artificer: '⚙️',
  Barbarian: '💪',
  Cleric: '🙏',
};

// Race icons available for future use when full results are shown
// const RACE_ICONS: Record<string, string> = {
//   Elven: '🧝', 'Half-Orc': '👹', Tiefling: '😈',
//   Dwarven: '🧔', Human: '👤', Halfling: '🍀',
// };

export default function CharacterResultsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [results, setResults] = useState<CharacterResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activationKey, setActivationKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      try {
        const response = await fetch(`/api/assessment/${sessionId}/results`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load results');
        }

        const data = await response.json();
        setResults(data);

        // Try to get activation key
        if (data.activation_key) {
          setActivationKey(data.activation_key.code);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load results';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionId) {
      loadResults();
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Summoning your character...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-red-400 mb-4">Character Not Found</h2>
          <p className="text-gray-300 mb-6">{error || 'Results not found'}</p>
        </div>
      </div>
    );
  }

  const character = results.character_profile;
  const characterClass = character?.class || 'Adventurer';
  const race = character?.race || 'Human';
  const alignment = character?.alignment || 'True Neutral';
  const classIcon = CLASS_ICONS[characterClass] || '⚔️';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-2xl mx-auto py-12 px-6">
        {/* Success Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm mb-4">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Character Created
          </div>
          <h1 className="text-3xl font-bold text-gray-200 mb-2">Your Adventure Awaits</h1>
          <p className="text-gray-500">The gods have spoken. Your path is revealed.</p>
        </div>

        {/* Character Teaser Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden mb-8">
          {/* Card Header - Character Preview */}
          <div className="bg-gradient-to-r from-emerald-900/50 to-purple-900/50 p-8 text-center border-b border-gray-700">
            <div className="text-6xl mb-4">{classIcon}</div>
            <h2 className="text-4xl font-bold text-white mb-2 tracking-wide">
              {race} {characterClass}
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/30 rounded-full">
              <span className="text-gray-400 text-sm">{alignment}</span>
            </div>
          </div>

          {/* Blurred/Gated Content */}
          <div className="p-8">
            {/* Attribute Preview - Blurred */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Attributes</h3>
              <div className="grid grid-cols-6 gap-2">
                {['INT', 'WIS', 'CHA', 'CON', 'STR', 'DEX'].map((attr) => (
                  <div key={attr} className="text-center">
                    <div className="text-xs text-gray-600 mb-1">{attr}</div>
                    <div className="w-full h-8 bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-gray-600 blur-sm select-none">??</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tagline Preview - Blurred */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Essence</h3>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-500 blur-sm select-none italic">
                  &quot;A mysterious soul with hidden depths awaiting discovery...&quot;
                </p>
              </div>
            </div>

            {/* Matching Preview - Blurred */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Compatible Souls</h3>
              <div className="flex flex-wrap gap-2">
                {['????????', '????????', '????????'].map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-800 rounded-full text-gray-600 text-sm blur-sm select-none">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" style={{ top: '40%' }}></div>
          </div>
        </div>

        {/* Download CTA */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-purple-900/30 border border-emerald-500/30 rounded-2xl p-8 text-center mb-8">
          <div className="text-4xl mb-4">🔮</div>
          <h3 className="text-2xl font-bold text-white mb-3">
            Unlock Your Full Character
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Download the GoodHang client to see your complete results and join the world&apos;s first AI-native social network!
          </p>

          {/* Activation Key */}
          {activationKey && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">Your Activation Key</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/50 border border-emerald-500/30 rounded-lg font-mono text-emerald-400">
                {activationKey}
                <button
                  onClick={() => navigator.clipboard.writeText(activationKey)}
                  className="text-gray-500 hover:text-emerald-400 transition-colors"
                  title="Copy to clipboard"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`goodhang://activate?code=${activationKey || ''}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25"
            >
              <span>🚀</span>
              Open in Desktop App
            </a>
            <a
              href="/download"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-200 border border-gray-700"
            >
              <span>⬇️</span>
              Download Desktop App
            </a>
          </div>

          {/* Platform badges */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
            <span>Available for</span>
            <span className="text-gray-500">Windows</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-500">macOS</span>
          </div>
        </div>

        {/* What you'll unlock */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">What you&apos;ll unlock</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-emerald-500">✓</span>
              <div>
                <p className="text-white text-sm font-medium">Full Attribute Scores</p>
                <p className="text-gray-600 text-xs">Your complete D&D stat block</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-500">✓</span>
              <div>
                <p className="text-white text-sm font-medium">Character Tagline</p>
                <p className="text-gray-600 text-xs">Your unique essence in words</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-500">✓</span>
              <div>
                <p className="text-white text-sm font-medium">Compatibility Profile</p>
                <p className="text-gray-600 text-xs">Who you vibe with (and don&apos;t)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-500">✓</span>
              <div>
                <p className="text-white text-sm font-medium">Social Network Access</p>
                <p className="text-gray-600 text-xs">Connect with compatible souls</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm">
          <p>Questions? <a href="mailto:hello@goodhang.club" className="text-emerald-500 hover:underline">hello@goodhang.club</a></p>
        </div>
      </div>
    </div>
  );
}
