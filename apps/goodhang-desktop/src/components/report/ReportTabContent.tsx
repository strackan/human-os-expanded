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

export function CharacterTab({ characterProfile }: CharacterTabProps) {
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

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="text-4xl mb-2">⚔️</div>
        <h3 className="text-xl font-bold text-white mb-1">
          {characterProfile.title || characterProfile.tagline ||
            `${characterProfile.race} ${characterProfile.characterClass || characterProfile.class}`}
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
