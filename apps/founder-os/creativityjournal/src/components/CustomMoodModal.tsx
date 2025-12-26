import React, { useState } from 'react';
import { X, Info } from 'lucide-react';

interface PlutchikMappings {
  joy: number;
  trust: number;
  fear: number;
  surprise: number;
  sadness: number;
  anticipation: number;
  anger: number;
  disgust: number;
}

interface CustomMoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  moodName: string;
  onMoodCreated: (mood: any) => void;
}

const plutchikEmotions = [
  { key: 'joy', name: 'Joy', color: '#FFD700', description: 'Happiness, cheerfulness, delight' },
  { key: 'trust', name: 'Trust', color: '#32CD32', description: 'Confidence, faith, reliability' },
  { key: 'fear', name: 'Fear', color: '#9400D3', description: 'Anxiety, worry, apprehension' },
  { key: 'surprise', name: 'Surprise', color: '#FF8C00', description: 'Amazement, astonishment, wonder' },
  { key: 'sadness', name: 'Sadness', color: '#4169E1', description: 'Sorrow, melancholy, grief' },
  { key: 'anticipation', name: 'Anticipation', color: '#FFA500', description: 'Expectation, excitement, eagerness' },
  { key: 'anger', name: 'Anger', color: '#FF0000', description: 'Rage, irritation, frustration' },
  { key: 'disgust', name: 'Disgust', color: '#8B4513', description: 'Revulsion, aversion, distaste' }
];

export function CustomMoodModal({ isOpen, onClose, moodName, onMoodCreated }: CustomMoodModalProps) {
  const [description, setDescription] = useState('');
  const [plutchikMappings, setPlutchikMappings] = useState<PlutchikMappings>({
    joy: 0, trust: 0, fear: 0, surprise: 0,
    sadness: 0, anticipation: 0, anger: 0, disgust: 0
  });
  const [arousalLevel, setArousalLevel] = useState(5);
  const [valence, setValence] = useState(5);
  const [dominance, setDominance] = useState(5);
  const [intensity, setIntensity] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSliderChange = (emotion: string, value: number) => {
    setPlutchikMappings(prev => ({
      ...prev,
      [emotion]: value
    }));
  };

  const handleCreateMood = async () => {
    if (!moodName.trim()) {
      setError('Mood name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user-moods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: moodName,
          description,
          plutchikMappings,
          arousalLevel,
          valence,
          dominance,
          intensity
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create mood');
      }

      const createdMood = await response.json();
      onMoodCreated(createdMood);
      onClose();
      
      // Reset form
      setDescription('');
      setPlutchikMappings({
        joy: 0, trust: 0, fear: 0, surprise: 0,
        sadness: 0, anticipation: 0, anger: 0, disgust: 0
      });
      setArousalLevel(5);
      setValence(5);
      setDominance(5);
      setIntensity(5);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create mood');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const getTotalEmotionValue = () => {
    return Object.values(plutchikMappings).reduce((sum, value) => sum + value, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Custom Mood: "{moodName}"
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How would you describe this emotion?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Plutchik Emotion Mappings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm font-medium text-gray-700">
                Plutchik Emotion Mappings
              </label>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    Rate how much each basic emotion contributes to your mood (0-10)
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plutchikEmotions.map((emotion) => (
                <div key={emotion.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: emotion.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {emotion.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {plutchikMappings[emotion.key as keyof PlutchikMappings]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={plutchikMappings[emotion.key as keyof PlutchikMappings]}
                    onChange={(e) => handleSliderChange(emotion.key, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${emotion.color} 0%, ${emotion.color} ${plutchikMappings[emotion.key as keyof PlutchikMappings] * 10}%, #e5e7eb ${plutchikMappings[emotion.key as keyof PlutchikMappings] * 10}%, #e5e7eb 100%)`
                    }}
                    disabled={isLoading}
                    aria-label={`${emotion.name} intensity level`}
                  />
                  <p className="text-xs text-gray-500">{emotion.description}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-3 text-sm text-gray-600">
              Total intensity: {getTotalEmotionValue()}/80
            </div>
          </div>

          {/* Additional Properties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Additional Properties
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Arousal Level (1-10)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Calm</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={arousalLevel}
                    onChange={(e) => setArousalLevel(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isLoading}
                    aria-label="Arousal level from calm to energized"
                  />
                  <span className="text-xs text-gray-500">Energized</span>
                  <span className="text-sm font-medium text-gray-700 min-w-[2ch]">
                    {arousalLevel}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Valence (1-10)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Negative</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={valence}
                    onChange={(e) => setValence(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isLoading}
                    aria-label="Valence from negative to positive"
                  />
                  <span className="text-xs text-gray-500">Positive</span>
                  <span className="text-sm font-medium text-gray-700 min-w-[2ch]">
                    {valence}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Dominance (1-10)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Powerless</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={dominance}
                    onChange={(e) => setDominance(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isLoading}
                    aria-label="Dominance from powerless to in control"
                  />
                  <span className="text-xs text-gray-500">In Control</span>
                  <span className="text-sm font-medium text-gray-700 min-w-[2ch]">
                    {dominance}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Intensity (1-10)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Subtle</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={isLoading}
                    aria-label="Intensity from subtle to intense"
                  />
                  <span className="text-xs text-gray-500">Intense</span>
                  <span className="text-sm font-medium text-gray-700 min-w-[2ch]">
                    {intensity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateMood}
            disabled={isLoading || !moodName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            Create Mood
          </button>
        </div>
      </div>
    </div>
  );
} 