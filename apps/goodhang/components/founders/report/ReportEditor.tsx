'use client';

import { Check, RotateCcw } from 'lucide-react';
import type { ExecutiveReport, CharacterProfile } from '@/lib/founders/types';

export type ReportTab = 'status' | 'personality' | 'voice' | 'character';

export interface ReportConfirmations {
  status: boolean;
  personality: boolean;
  voice: boolean;
  character: boolean;
}

interface ReportEditorProps {
  report: ExecutiveReport;
  characterProfile?: CharacterProfile | null;
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
  confirmations: ReportConfirmations;
  onConfirmSection: () => void;
  originalReport?: ExecutiveReport | null;
  onResetEdits?: () => void;
  onTakeAssessment?: () => void;
  onFieldEdit?: (field: string, index: number, value: string) => void;
  hasCompletedAssessment?: boolean;
  onContinue?: () => void;
  className?: string;
}

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'personality', label: 'Personality' },
  { id: 'voice', label: 'Voice' },
  { id: 'character', label: 'Character' },
];

export function ReportEditor({
  report, characterProfile, activeTab, onTabChange, confirmations, onConfirmSection,
  onResetEdits, onContinue, className = '',
}: ReportEditorProps) {
  const allConfirmed = confirmations.status && confirmations.personality && confirmations.voice && confirmations.character;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-[var(--gh-dark-700)] px-4 pt-4">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 text-sm rounded-t-lg transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[var(--gh-dark-700)] text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white hover:bg-[var(--gh-dark-700)]/50'
              }`}>
              {tab.label}
              {confirmations[tab.id] && <Check className="w-3.5 h-3.5 text-green-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'status' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Summary</label>
              <p className="text-sm text-white whitespace-pre-wrap">{report.summary}</p>
            </div>
            {report.strengths && report.strengths.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Strengths</label>
                <div className="space-y-2">
                  {report.strengths.map((s, i) => (
                    <div key={i} className="p-3 bg-[var(--gh-dark-700)] rounded-lg">
                      <p className="text-sm text-white font-medium">{s.strength}</p>
                      <p className="text-xs text-gray-400 mt-1">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {report.challenges && report.challenges.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Challenges</label>
                <div className="space-y-2">
                  {report.challenges.map((c, i) => (
                    <div key={i} className="p-3 bg-[var(--gh-dark-700)] rounded-lg">
                      <p className="text-sm text-white font-medium">{c.challenge}</p>
                      <p className="text-xs text-gray-400 mt-1">{c.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'personality' && report.personality && (
          <div className="space-y-3">
            {report.personality.map((trait, i) => (
              <div key={i} className="p-3 bg-[var(--gh-dark-700)] rounded-lg">
                <p className="text-sm text-white font-medium">{trait.trait}</p>
                <p className="text-xs text-gray-400 mt-1">{trait.description}</p>
                {trait.insight && <p className="text-xs text-purple-400 mt-1 italic">{trait.insight}</p>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'voice' && report.voice && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Tone</label>
              <p className="text-sm text-white">{report.voice.tone}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Style</label>
              <p className="text-sm text-white">{report.voice.style}</p>
            </div>
            {report.voice.characteristics && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Characteristics</label>
                <div className="flex flex-wrap gap-2">
                  {report.voice.characteristics.map((c, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'character' && characterProfile && (
          <div className="space-y-4">
            {characterProfile.summary && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Summary</label>
                <p className="text-sm text-white whitespace-pre-wrap">{characterProfile.summary}</p>
              </div>
            )}
            {characterProfile.attributes && Object.keys(characterProfile.attributes).length > 0 && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Attributes</label>
                <div className="space-y-2">
                  {Object.entries(characterProfile.attributes).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-[var(--gh-dark-700)] rounded-lg">
                      <span className="text-sm text-white">{key}</span>
                      <span className="text-sm text-gray-400">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex-shrink-0 border-t border-[var(--gh-dark-700)] p-4 flex gap-2">
        {onResetEdits && (
          <button onClick={onResetEdits} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
        <div className="flex-1" />
        {allConfirmed && onContinue ? (
          <button onClick={onContinue} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
            Continue
          </button>
        ) : (
          <button onClick={onConfirmSection} disabled={confirmations[activeTab]}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed">
            {confirmations[activeTab] ? 'Confirmed' : 'Looks Good'}
          </button>
        )}
      </div>
    </div>
  );
}
