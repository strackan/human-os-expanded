'use client';

import React, { useState } from 'react';
import { MessageSquare, ChevronRight, Edit3, Check } from 'lucide-react';

interface TalkingPoint {
  id: string;
  text: string;
  section: 'opening' | 'middle' | 'close';
}

interface TalkingPointsArtifactProps {
  customerName?: string;
  initialPoints?: TalkingPoint[];
  onContinue?: () => void;
  onBack?: () => void;
}

export default function TalkingPointsArtifact({
  customerName = 'Customer',
  initialPoints = [],
  onContinue,
  onBack
}: TalkingPointsArtifactProps) {
  const [points, setPoints] = useState<TalkingPoint[]>(initialPoints);
  const [editing, setEditing] = useState(false);
  const [editedPoints, setEditedPoints] = useState<{ [key: string]: string }>(
    initialPoints.reduce((acc, p) => ({ ...acc, [p.id]: p.text }), {})
  );

  const handleEditPoint = (id: string, newText: string) => {
    setEditedPoints({ ...editedPoints, [id]: newText });
  };

  const handleSaveEdits = () => {
    setPoints(points.map(p => ({ ...p, text: editedPoints[p.id] || p.text })));
    setEditing(false);
  };

  const handleSoundsGood = () => {
    setEditing(false);
    onContinue?.();
  };

  const getSectionTitle = (section: 'opening' | 'middle' | 'close') => {
    switch (section) {
      case 'opening': return 'Opening: Accountability & Context';
      case 'middle': return 'Middle: Solution & Path Forward';
      case 'close': return 'Close: Commitment & Next Steps';
    }
  };

  const getSectionColor = (section: 'opening' | 'middle' | 'close') => {
    switch (section) {
      case 'opening': return 'bg-red-50 border-red-200';
      case 'middle': return 'bg-blue-50 border-blue-200';
      case 'close': return 'bg-green-50 border-green-200';
    }
  };

  const groupedPoints = {
    opening: points.filter(p => p.section === 'opening'),
    middle: points.filter(p => p.section === 'middle'),
    close: points.filter(p => p.section === 'close')
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-medium text-gray-900">Talking Points</h2>
        </div>
        <p className="text-sm text-gray-500">
          Structured conversation prep for your call with {customerName}
        </p>
      </div>

      {/* Talking Points Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6 max-w-3xl">
          {/* Opening Section */}
          {groupedPoints.opening.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                {getSectionTitle('opening')}
              </h3>
              <div className={`border rounded-lg p-4 ${getSectionColor('opening')}`}>
                <ol className="space-y-3">
                  {groupedPoints.opening.map((point, index) => (
                    <li key={point.id} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border border-gray-300">
                        {index + 1}
                      </span>
                      {editing ? (
                        <textarea
                          value={editedPoints[point.id]}
                          onChange={(e) => handleEditPoint(point.id, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                      ) : (
                        <p className="flex-1 text-sm text-gray-900 leading-relaxed">{point.text}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Middle Section */}
          {groupedPoints.middle.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                {getSectionTitle('middle')}
              </h3>
              <div className={`border rounded-lg p-4 ${getSectionColor('middle')}`}>
                <ol className="space-y-3">
                  {groupedPoints.middle.map((point, index) => (
                    <li key={point.id} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border border-gray-300">
                        {index + 1}
                      </span>
                      {editing ? (
                        <textarea
                          value={editedPoints[point.id]}
                          onChange={(e) => handleEditPoint(point.id, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                      ) : (
                        <p className="flex-1 text-sm text-gray-900 leading-relaxed">{point.text}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Close Section */}
          {groupedPoints.close.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                {getSectionTitle('close')}
              </h3>
              <div className={`border rounded-lg p-4 ${getSectionColor('close')}`}>
                <ol className="space-y-3">
                  {groupedPoints.close.map((point, index) => (
                    <li key={point.id} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border border-gray-300">
                        {index + 1}
                      </span>
                      {editing ? (
                        <textarea
                          value={editedPoints[point.id]}
                          onChange={(e) => handleEditPoint(point.id, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                      ) : (
                        <p className="flex-1 text-sm text-gray-900 leading-relaxed">{point.text}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
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

        {editing ? (
          <button
            onClick={handleSaveEdits}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Changes
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Let me edit
            </button>
            <button
              onClick={handleSoundsGood}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
            >
              Sounds good
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
