'use client';

import React, { useState } from 'react';
import { Users, ChevronRight, TrendingUp, TrendingDown, Minus, Edit3 } from 'lucide-react';

interface Stakeholder {
  name: string;
  role: string;
  email: string;
  relationshipStrength: 'strong' | 'moderate' | 'weak';
  communicationStyle: string;
  keyConcerns: string[];
  leveragePoints: string[];
  recentInteractions: string;
  notes?: string;
}

interface StakeholderProfileArtifactProps {
  customerName?: string;
  stakeholders: Stakeholder[];
  onContinue?: () => void;
  onBack?: () => void;
}

export default function StakeholderProfileArtifact({
  customerName = 'Customer',
  stakeholders,
  onContinue,
  onBack
}: StakeholderProfileArtifactProps) {
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: boolean }>({});
  const [notes, setNotes] = useState<{ [key: string]: string }>(
    stakeholders.reduce((acc, s) => ({ ...acc, [s.email]: s.notes || '' }), {})
  );

  const getRelationshipColor = (strength: 'strong' | 'moderate' | 'weak') => {
    switch (strength) {
      case 'strong': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-amber-600 bg-amber-50';
      case 'weak': return 'text-red-600 bg-red-50';
    }
  };

  const getRelationshipIcon = (strength: 'strong' | 'moderate' | 'weak') => {
    switch (strength) {
      case 'strong': return <TrendingUp className="w-4 h-4" />;
      case 'moderate': return <Minus className="w-4 h-4" />;
      case 'weak': return <TrendingDown className="w-4 h-4" />;
    }
  };

  const toggleEditNotes = (email: string) => {
    setEditingNotes(prev => ({ ...prev, [email]: !prev[email] }));
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-medium text-gray-900">Stakeholder Profiles</h2>
        </div>
        <p className="text-sm text-gray-500">
          Key executives at {customerName}
        </p>
      </div>

      {/* Stakeholder Cards */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-1 gap-6 max-w-4xl">
          {stakeholders.map((stakeholder) => (
            <div
              key={stakeholder.email}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900">{stakeholder.name}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{stakeholder.role}</p>
                    <p className="text-xs text-gray-500 mt-1">{stakeholder.email}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${getRelationshipColor(stakeholder.relationshipStrength)}`}>
                    {getRelationshipIcon(stakeholder.relationshipStrength)}
                    {stakeholder.relationshipStrength.charAt(0).toUpperCase() + stakeholder.relationshipStrength.slice(1)} Relationship
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-4 space-y-4">
                {/* Communication Style */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Communication Style</h4>
                  <p className="text-sm text-gray-900">{stakeholder.communicationStyle}</p>
                </div>

                {/* Key Concerns */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Key Concerns</h4>
                  <ul className="space-y-1.5">
                    {stakeholder.keyConcerns.map((concern, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Leverage Points */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Leverage Points</h4>
                  <ul className="space-y-1.5">
                    {stakeholder.leveragePoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-1.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recent Interactions */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Recent Interactions</h4>
                  <p className="text-sm text-gray-600 italic">{stakeholder.recentInteractions}</p>
                </div>

                {/* Notes Section */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-700">Your Notes</h4>
                    <button
                      onClick={() => toggleEditNotes(stakeholder.email)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      {editingNotes[stakeholder.email] ? 'Save' : 'Edit'}
                    </button>
                  </div>
                  {editingNotes[stakeholder.email] ? (
                    <textarea
                      value={notes[stakeholder.email]}
                      onChange={(e) => setNotes({ ...notes, [stakeholder.email]: e.target.value })}
                      placeholder="Add your notes about this stakeholder..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 min-h-[60px]">
                      {notes[stakeholder.email] || 'No notes yet. Click "Edit" to add notes.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
          >
            Back
          </button>
        )}

        <div className="flex-1"></div>

        {onContinue && (
          <button
            onClick={onContinue}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
