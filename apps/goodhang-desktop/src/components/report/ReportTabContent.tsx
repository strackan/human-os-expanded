/**
 * Report Tab Content Components
 *
 * Individual tab renderers for the executive report sections.
 * Supports inline editing via double-click.
 */

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronRight, Sparkles, Mic, Sword, Check, X } from 'lucide-react';
import type { ExecutiveReport, CharacterProfile } from '@/lib/types';

// =============================================================================
// EDITABLE FIELD COMPONENT
// =============================================================================

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}

function EditableField({ value, onSave, className = '', multiline = false, placeholder = 'Click to edit...' }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && multiline && e.metaKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-2">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            rows={3}
            className={`flex-1 bg-gh-dark-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none ${className}`}
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={`flex-1 bg-gh-dark-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
            placeholder={placeholder}
          />
        )}
        <button
          onClick={handleSave}
          className="p-1 text-green-400 hover:text-green-300"
          title="Save (Enter)"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-gray-400 hover:text-gray-300"
          title="Cancel (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={`cursor-pointer hover:bg-gh-dark-600/50 rounded px-1 -mx-1 transition-colors ${className}`}
      title="Double-click to edit"
    >
      {value || <span className="text-gray-500 italic">{placeholder}</span>}
    </span>
  );
}

// =============================================================================
// STATUS TAB
// =============================================================================

interface StatusTabProps {
  report: ExecutiveReport;
  onEdit?: (field: string, index: number, value: string) => void;
}

export function StatusTab({ report, onEdit }: StatusTabProps) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="prose prose-invert prose-sm max-w-none">
        {onEdit ? (
          <EditableField
            value={report.summary}
            onSave={(v) => onEdit('summary', 0, v)}
            multiline
            placeholder="Summary"
          />
        ) : (
          <ReactMarkdown>{report.summary}</ReactMarkdown>
        )}
      </div>

      {/* Work Style */}
      {report.workStyle && (
        <div className="pt-4 border-t border-gh-dark-600">
          <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">
            Work Style
          </h4>
          <p className="text-white mb-2">
            {onEdit ? (
              <EditableField
                value={report.workStyle.approach}
                onSave={(v) => onEdit('workStyle.approach', 0, v)}
                placeholder="Work approach"
              />
            ) : (
              report.workStyle.approach
            )}
          </p>
          {report.workStyle.strengths && report.workStyle.strengths.length > 0 && (
            <ul className="space-y-1">
              {report.workStyle.strengths.map((strength, i) => (
                <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  {onEdit ? (
                    <EditableField
                      value={strength}
                      onSave={(v) => onEdit('workStyle.strengths', i, v)}
                      placeholder="Strength"
                    />
                  ) : (
                    strength
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Communication Style */}
      <div className="pt-4 border-t border-gh-dark-600">
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">
          Communication Style
        </h4>
        <p className="text-white mb-2">
          {onEdit ? (
            <EditableField
              value={report.communication.style}
              onSave={(v) => onEdit('communication.style', 0, v)}
              placeholder="Communication style"
            />
          ) : (
            report.communication.style
          )}
        </p>
        <ul className="space-y-1">
          {report.communication.preferences.map((pref, i) => (
            <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              {onEdit ? (
                <EditableField
                  value={pref}
                  onSave={(v) => onEdit('communication.preferences', i, v)}
                  placeholder="Preference"
                />
              ) : (
                pref
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Key Insights */}
      {report.keyInsights && report.keyInsights.length > 0 && (
        <div className="pt-4 border-t border-gh-dark-600">
          <h4 className="text-sm font-medium text-gray-400 uppercase mb-3">
            Key Insights
          </h4>
          <ul className="space-y-2">
            {report.keyInsights.map((insight, i) => (
              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                {onEdit ? (
                  <EditableField
                    value={insight}
                    onSave={(v) => onEdit('keyInsights', i, v)}
                    placeholder="Insight"
                  />
                ) : (
                  insight
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PERSONALITY TAB
// =============================================================================

interface PersonalityTabProps {
  report: ExecutiveReport;
  onEdit?: (field: string, index: number, value: string) => void;
}

export function PersonalityTab({ report, onEdit }: PersonalityTabProps) {
  const handleEdit = (field: 'trait' | 'description' | 'insight', index: number, value: string) => {
    onEdit?.(`personality.${index}.${field}`, index, value);
  };

  return (
    <div className="space-y-4">
      {report.personality.map((p, i) => (
        <div key={i} className="bg-gh-dark-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-1">
            {onEdit ? (
              <EditableField
                value={p.trait}
                onSave={(v) => handleEdit('trait', i, v)}
                placeholder="Trait name"
              />
            ) : (
              p.trait
            )}
          </h4>
          <p className="text-gray-300 text-sm mb-2">
            {onEdit ? (
              <EditableField
                value={p.description}
                onSave={(v) => handleEdit('description', i, v)}
                multiline
                placeholder="Description"
              />
            ) : (
              p.description
            )}
          </p>
          <div className="text-blue-400 text-sm flex items-start gap-1">
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {onEdit ? (
              <EditableField
                value={p.insight}
                onSave={(v) => handleEdit('insight', i, v)}
                multiline
                className="text-blue-400"
                placeholder="Insight"
              />
            ) : (
              p.insight
            )}
          </div>
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
  onEdit?: (field: string, index: number, value: string) => void;
}

export function VoiceTab({ report, onEdit }: VoiceTabProps) {
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
        <p className="text-white">
          {onEdit ? (
            <EditableField
              value={report.voice.tone}
              onSave={(v) => onEdit('voice.tone', 0, v)}
              placeholder="Tone"
            />
          ) : (
            report.voice.tone
          )}
        </p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">
          Writing Style
        </h4>
        <p className="text-gray-300">
          {onEdit ? (
            <EditableField
              value={report.voice.style}
              onSave={(v) => onEdit('voice.style', 0, v)}
              placeholder="Style"
            />
          ) : (
            report.voice.style
          )}
        </p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">
          Characteristics
        </h4>
        <ul className="space-y-1">
          {report.voice.characteristics.map((char, i) => (
            <li key={i} className="text-gray-300 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
              {onEdit ? (
                <EditableField
                  value={char}
                  onSave={(v) => onEdit('voice.characteristics', i, v)}
                  placeholder="Characteristic"
                />
              ) : (
                char
              )}
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
                {onEdit ? (
                  <EditableField
                    value={example}
                    onSave={(v) => onEdit('voice.examples', i, v)}
                    placeholder="Example phrase"
                  />
                ) : (
                  `"${example}"`
                )}
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
}

// Helper to format social energy for display
function formatSocialEnergy(energy: string): string {
  const map: Record<string, string> = {
    'introvert': 'Introvert',
    'extrovert': 'Extrovert',
    'ambivert': 'Ambivert',
    'selective_extrovert': 'Selective Extrovert',
  };
  return map[energy] || energy;
}

// Helper to format relationship style for display
function formatRelationshipStyle(style: string): string {
  const map: Record<string, string> = {
    'depth_seeking': 'Depth Seeker',
    'breadth_seeking': 'Breadth Seeker',
    'balanced': 'Balanced',
    'experience_based': 'Experience Based',
  };
  return map[style] || style;
}

// Helper to format connection style for display
function formatConnectionStyle(style: string): string {
  const map: Record<string, string> = {
    'conversation_based': 'Conversation Based',
    'experience_based': 'Experience Based',
    'activity_based': 'Activity Based',
    'intellectual': 'Intellectual',
  };
  return map[style] || style;
}

// Helper to format energy pattern for display
function formatEnergyPattern(pattern: string): string {
  const map: Record<string, string> = {
    'spontaneous': 'Spontaneous',
    'planned': 'Planned',
    'flexible': 'Flexible',
    'routine_oriented': 'Routine Oriented',
  };
  return map[pattern] || pattern;
}

export function CharacterTab({ characterProfile }: CharacterTabProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Debug logging
  console.log('[CharacterTab] characterProfile:', characterProfile);
  console.log('[CharacterTab] signals:', characterProfile?.signals);
  console.log('[CharacterTab] matching:', characterProfile?.matching);

  if (!characterProfile) {
    return (
      <div className="text-center py-8">
        <Sword className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 mb-2">
          Your D&D character profile will be generated after completing the Good
          Hang assessment.
        </p>
        <p className="text-gray-500 text-sm">
          This maps your personality to a unique race, class, and alignment.
        </p>
      </div>
    );
  }

  const race = characterProfile.race || 'Unknown';
  const charClass = characterProfile.characterClass || characterProfile.class || 'Adventurer';
  const tagline = characterProfile.title || characterProfile.tagline;
  const { signals, matching, summary } = characterProfile;

  return (
    <div className="space-y-6">
      {/* Header: Race + Class + Alignment */}
      <div className="text-center py-4">
        <div className="text-4xl mb-2">⚔️</div>
        <h3 className="text-xl font-bold text-white mb-1">
          {race} {charClass}
        </h3>
        <p className="text-purple-400 font-medium">{characterProfile.alignment}</p>
        {tagline && (
          <p className="text-gray-400 text-sm mt-2 italic">"{tagline}"</p>
        )}
      </div>

      {/* Personality Summary */}
      {summary && (() => {
        const paragraphs = summary.split('\n\n').filter(p => p.trim());
        const firstParagraph = paragraphs[0] || '';
        const hasMore = paragraphs.length > 1;

        return (
          <div className="bg-gh-dark-700/30 rounded-lg p-4 border border-gh-dark-600">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">About You</h4>
            <div className="text-gray-300 text-sm leading-relaxed">
              <p>{firstParagraph}</p>
              {hasMore && !summaryExpanded && (
                <button
                  onClick={() => setSummaryExpanded(true)}
                  className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-flex items-center gap-1"
                >
                  See More...
                </button>
              )}
              {hasMore && summaryExpanded && (
                <>
                  {paragraphs.slice(1).map((p, i) => (
                    <p key={i} className="mt-3">{p}</p>
                  ))}
                  <button
                    onClick={() => setSummaryExpanded(false)}
                    className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-flex items-center gap-1"
                  >
                    See Less
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Attributes Grid */}
      {characterProfile.attributes && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Attributes</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(characterProfile.attributes).map(([attr, value]) => (
              <div
                key={attr}
                className="bg-gh-dark-700/50 rounded-lg p-2 text-center"
              >
                <div className="text-lg font-bold text-white">{value}</div>
                <div className="text-xs text-gray-400 uppercase">
                  {attr.substring(0, 3)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signals Section */}
      {signals && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase">Personality Signals</h4>

          <div className="grid grid-cols-2 gap-3">
            {signals.enneagram_hint && (
              <div className="bg-gh-dark-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Enneagram</div>
                <div className="text-white font-medium">{signals.enneagram_hint}</div>
              </div>
            )}
            <div className="bg-gh-dark-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Social Energy</div>
              <div className="text-white font-medium">{formatSocialEnergy(signals.social_energy)}</div>
            </div>
            <div className="bg-gh-dark-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Relationship Style</div>
              <div className="text-white font-medium">{formatRelationshipStyle(signals.relationship_style)}</div>
            </div>
          </div>

          {signals.interest_vectors && signals.interest_vectors.length > 0 && (
            <div className="bg-gh-dark-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-2">Interests</div>
              <div className="flex flex-wrap gap-1">
                {signals.interest_vectors.map((interest, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-600/30 text-purple-300 text-xs rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Matching Section */}
      {matching && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase">Social Matching</h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gh-dark-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Ideal Group Size</div>
              <div className="text-white font-medium">{matching.ideal_group_size}</div>
            </div>
            <div className="bg-gh-dark-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Connection Style</div>
              <div className="text-white font-medium">{formatConnectionStyle(matching.connection_style)}</div>
            </div>
            <div className="bg-gh-dark-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Energy Pattern</div>
              <div className="text-white font-medium">{formatEnergyPattern(matching.energy_pattern)}</div>
            </div>
          </div>

          {matching.good_match_with && matching.good_match_with.length > 0 && (
            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
              <div className="text-xs text-green-400 mb-2">Good Match With</div>
              <div className="flex flex-wrap gap-1">
                {matching.good_match_with.map((match, i) => (
                  <span key={i} className="px-2 py-1 bg-green-600/30 text-green-300 text-xs rounded-full">
                    {match}
                  </span>
                ))}
              </div>
            </div>
          )}

          {matching.avoid_match_with && matching.avoid_match_with.length > 0 && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
              <div className="text-xs text-red-400 mb-2">May Clash With</div>
              <div className="flex flex-wrap gap-1">
                {matching.avoid_match_with.map((match, i) => (
                  <span key={i} className="px-2 py-1 bg-red-600/30 text-red-300 text-xs rounded-full">
                    {match}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
