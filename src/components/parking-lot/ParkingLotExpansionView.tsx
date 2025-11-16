'use client';

/**
 * Parking Lot Expansion View Component
 * Displays the expanded analysis and shareable artifact from LLM
 */

import { useState } from 'react';
import {
  X,
  Sparkles,
  Target,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Copy,
  Download,
  Share2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { ParkingLotItem } from '@/types/parking-lot';
import { MODE_LABELS, MODE_ICONS, MODE_COLORS } from '@/types/parking-lot';

interface ParkingLotExpansionViewProps {
  item: ParkingLotItem;
  isOpen: boolean;
  onClose: () => void;
  onConvertToWorkflow?: (item: ParkingLotItem) => void;
}

export default function ParkingLotExpansionView({
  item,
  isOpen,
  onClose,
  onConvertToWorkflow
}: ParkingLotExpansionViewProps) {
  const [showArtifact, setShowArtifact] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen || !item.expanded_analysis) return null;

  const expansion = item.expanded_analysis;
  const hasArtifact = expansion.artifact && expansion.artifact.content;

  const handleCopySection = async (section: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadArtifact = () => {
    if (!expansion.artifact) return;

    const blob = new Blob([expansion.artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${expansion.artifact.title || 'expansion'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {item.cleaned_text}
                </h2>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                  style={{
                    backgroundColor: MODE_COLORS[item.capture_mode] + '20',
                    color: MODE_COLORS[item.capture_mode]
                  }}
                >
                  <span>{MODE_ICONS[item.capture_mode]}</span>
                  <span>{MODE_LABELS[item.capture_mode]}</span>
                </span>
              </div>
              <p className="text-sm text-gray-600">Expanded Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Background */}
            {expansion.background && (
              <section className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Background & Context
                  </h3>
                  <button
                    onClick={() => handleCopySection('background', expansion.background!)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedSection === 'background' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {expansion.background}
                </p>
              </section>
            )}

            {/* Opportunities */}
            {expansion.opportunities && expansion.opportunities.length > 0 && (
              <section className="bg-green-50 border border-green-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Opportunities ({expansion.opportunities.length})
                  </h3>
                  <button
                    onClick={() => handleCopySection('opportunities', expansion.opportunities!.join('\n'))}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedSection === 'opportunities' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <ul className="space-y-2">
                  {expansion.opportunities.map((opp, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-green-600 rounded-full mt-2" />
                      <span className="flex-1">{opp}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Risks */}
            {expansion.risks && expansion.risks.length > 0 && (
              <section className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Risks & Considerations ({expansion.risks.length})
                  </h3>
                  <button
                    onClick={() => handleCopySection('risks', expansion.risks!.join('\n'))}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedSection === 'risks' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <ul className="space-y-2">
                  {expansion.risks.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-orange-600 rounded-full mt-2" />
                      <span className="flex-1">{risk}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Action Plan */}
            {expansion.action_plan && expansion.action_plan.length > 0 && (
              <section className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Recommended Action Plan ({expansion.action_plan.length} steps)
                  </h3>
                  <button
                    onClick={() => handleCopySection('action_plan', expansion.action_plan!.join('\n'))}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedSection === 'action_plan' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <ol className="space-y-2">
                  {expansion.action_plan.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-semibold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="flex-1 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Objectives */}
            {expansion.objectives && expansion.objectives.length > 0 && (
              <section className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    Key Objectives ({expansion.objectives.length})
                  </h3>
                  <button
                    onClick={() => handleCopySection('objectives', expansion.objectives!.join('\n'))}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedSection === 'objectives' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <ul className="space-y-2">
                  {expansion.objectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-purple-600 rounded-full mt-2" />
                      <span className="flex-1">{obj}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Shareable Artifact */}
            {hasArtifact && (
              <section className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowArtifact(!showArtifact)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-gray-600" />
                    <h3 className="text-base font-semibold text-gray-900">
                      {expansion.artifact!.title || 'Shareable Document'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {expansion.artifact!.format?.toUpperCase() || 'MARKDOWN'}
                    </span>
                    {showArtifact ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                </button>

                {showArtifact && (
                  <div className="border-t border-gray-200">
                    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
                      <p className="text-sm text-gray-600">
                        {expansion.artifact!.description || 'Ready to share with your team'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopySection('artifact', expansion.artifact!.content)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
                        >
                          {copiedSection === 'artifact' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleDownloadArtifact}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                    <div className="px-5 py-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white border border-gray-200 rounded p-4">
                        {expansion.artifact!.content}
                      </pre>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {item.readiness_score >= 70 ? (
              <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Ready to convert to workflow
              </span>
            ) : (
              <span>Readiness score: {item.readiness_score}/100</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
            {(item.capture_mode === 'project' || item.readiness_score >= 70) && (
              <button
                onClick={() => onConvertToWorkflow?.(item)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Convert to Workflow</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
