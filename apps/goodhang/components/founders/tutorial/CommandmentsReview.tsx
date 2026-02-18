'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import type { FounderOsExtractionResult, VoiceOsExtractionResult } from '@/lib/founders/types';

interface CommandmentsReviewProps {
  founderOs?: FounderOsExtractionResult;
  voiceOs?: VoiceOsExtractionResult;
  onConfirm: () => void;
}

type TabId = 'founder_os' | 'voice_os';

export function CommandmentsReview({ founderOs, voiceOs, onConfirm }: CommandmentsReviewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('founder_os');
  const [confirmed, setConfirmed] = useState<Record<TabId, boolean>>({ founder_os: false, voice_os: false });

  const handleConfirmTab = () => {
    setConfirmed(prev => ({ ...prev, [activeTab]: true }));
    if (activeTab === 'founder_os' && !confirmed.voice_os) {
      setActiveTab('voice_os');
    }
  };

  const allConfirmed = confirmed.founder_os && confirmed.voice_os;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[var(--gh-dark-700)] p-4">
        <h2 className="text-lg font-semibold text-white mb-1">Ten Commandments</h2>
        <p className="text-sm text-gray-400">Review how AI will support you</p>
        <div className="flex gap-2 mt-3">
          {(['founder_os', 'voice_os'] as TabId[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeTab === tab ? 'bg-purple-600 text-white' : 'bg-[var(--gh-dark-700)] text-gray-400 hover:text-white'
              }`}>
              {tab === 'founder_os' ? 'Founder OS' : 'Voice OS'}
              {confirmed[tab] && <Check className="w-3.5 h-3.5 inline ml-1.5" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'founder_os' && founderOs?.commandments && (
          <div className="space-y-3">
            {Object.entries(founderOs.commandments).map(([key, value], i) => (
              <div key={key} className="p-3 bg-[var(--gh-dark-700)] rounded-lg">
                <p className="text-sm text-white font-medium mb-1">{i + 1}. {key.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-400">{value}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'voice_os' && voiceOs?.commandments && (
          <div className="space-y-3">
            {Object.entries(voiceOs.commandments).map(([key, value], i) => (
              <div key={key} className="p-3 bg-[var(--gh-dark-700)] rounded-lg">
                <p className="text-sm text-white font-medium mb-1">{i + 1}. {key.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-400">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-[var(--gh-dark-700)] p-4">
        {allConfirmed ? (
          <button onClick={onConfirm} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
            Confirm All & Continue
          </button>
        ) : (
          <button onClick={handleConfirmTab} disabled={confirmed[activeTab]}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed">
            {confirmed[activeTab] ? 'Confirmed' : 'Looks Good'}
          </button>
        )}
      </div>
    </div>
  );
}
