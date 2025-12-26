'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';

interface SuggestEmotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: any) => void;
  initialMoodName?: string;
}

const PLUTCHIK_EMOTIONS = {
  joy: {
    name: 'Joy',
    description: 'Happiness, pleasure, delight, contentment',
    examples: 'Receiving good news, achieving a goal, spending time with people you care about',
    color: '#F59E0B'
  },
  trust: {
    name: 'Trust',
    description: 'Confidence, acceptance, security, faith in others',
    examples: 'Feeling safe with someone, believing in promises, feeling accepted',
    color: '#10B981'
  },
  fear: {
    name: 'Fear',
    description: 'Worry, anxiety, terror, apprehension about danger',
    examples: 'Before an important event, in unfamiliar situations, facing uncertainty',
    color: '#8B5CF6'
  },
  surprise: {
    name: 'Surprise',
    description: 'Astonishment, amazement, unexpectedness',
    examples: 'When something unexpected happens, receiving surprising news',
    color: '#EC4899'
  },
  sadness: {
    name: 'Sadness',
    description: 'Sorrow, grief, disappointment, melancholy',
    examples: 'Losing something important, feeling isolated, when things don\'t work out',
    color: '#3B82F6'
  },
  anticipation: {
    name: 'Anticipation',
    description: 'Expectation, hope, looking forward to something',
    examples: 'Waiting for important results, planning something enjoyable, expecting change',
    color: '#84CC16'
  },
  anger: {
    name: 'Anger',
    description: 'Rage, frustration, irritation, annoyance',
    examples: 'Feeling treated unfairly, when things don\'t work properly, experiencing disrespect',
    color: '#EF4444'
  },
  disgust: {
    name: 'Disgust',
    description: 'Revulsion, contempt, aversion, strong dislike',
    examples: 'When something seems wrong or unfair, experiencing distaste, moral disagreement',
    color: '#059669'
  }
};

export function SuggestEmotionModal({ isOpen, onClose, onSubmit, initialMoodName }: SuggestEmotionModalProps) {
  console.log('[SuggestEmotionModal] Rendered with props:', { isOpen, initialMoodName });
  const [formData, setFormData] = useState({
    emotionName: '',
    userDescription: '',
    usageContext: '',
    plutchikRatings: {
      joy: 0, trust: 0, fear: 0, surprise: 0,
      sadness: 0, anticipation: 0, anger: 0, disgust: 0
    },
    granularityRatings: {
      arousal: 5,    // How energizing vs calming
      valence: 5,    // How positive vs negative
      dominance: 5,  // How in-control vs powerless
      intensity: 5   // How strong vs subtle
    },
    demographics: {
      ageRange: '',
      culturalBackground: '',
      region: ''
    },
    notifyOnReview: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('[SuggestEmotionModal] initialMoodName prop changed:', initialMoodName);
    if (initialMoodName) {
      console.log('[SuggestEmotionModal] Setting emotionName to:', initialMoodName);
      setFormData(prev => ({ ...prev, emotionName: initialMoodName }));
    }
  }, [initialMoodName]);

  useEffect(() => {
    console.log('[SuggestEmotionModal] isOpen prop changed:', isOpen);
  }, [isOpen]);

  const getMoodCompletionStatus = () => {
    // Determine status based on PAGES completed, not specific field content
    if (currentStep === 1) {
      return 'incomplete'; // Grey pill - only page 1 (basic info)
    } else {
      return 'private'; // Red pill - page 2+ reached (detailed definition)
    }
  };

  const handleSave = async () => {
    // Save as UserMood with appropriate status based on completion
    if (!formData.emotionName.trim()) {
      alert('Please enter a mood name before saving.');
      return;
    }
    
    const status = getMoodCompletionStatus();
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user-moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.emotionName,
          description: formData.userDescription || formData.usageContext || `Custom mood created during entry editing`,
          plutchikMappings: formData.plutchikRatings,
          arousalLevel: formData.granularityRatings.arousal,
          valence: formData.granularityRatings.valence,
          dominance: formData.granularityRatings.dominance,
          intensity: formData.granularityRatings.intensity,
          status: status
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`[SuggestEmotionModal] Saved as ${status} UserMood:`, result);
        onSubmit({ ...result, status: status });
        onClose();
        // Reset form
        setFormData({
          emotionName: '',
          userDescription: '',
          usageContext: '',
          plutchikRatings: { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, anticipation: 0, anger: 0, disgust: 0 },
          granularityRatings: { arousal: 5, valence: 5, dominance: 5, intensity: 5 },
          demographics: { ageRange: '', culturalBackground: '', region: '' },
          notifyOnReview: false
        });
        setCurrentStep(1);
      } else {
        alert(result.error || 'Failed to save mood');
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      alert('Failed to save mood');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormComplete = () => {
    // Check if all required fields are filled for community submission
    return (
      formData.emotionName.trim() &&
      formData.userDescription.trim() &&
      formData.usageContext.trim() &&
      Object.values(formData.plutchikRatings).some(rating => rating > 0) // At least one emotion rating
    );
  };

  const handleSubmit = async () => {
    // Submit for community evaluation (yellow pill) - requires complete form
    if (!isFormComplete()) {
      alert('Please complete all required fields before submitting for community evaluation.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Create UserMood with pending_approval status (yellow pill)
      const response = await fetch('/api/user-moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.emotionName,
          description: formData.userDescription,
          usageContext: formData.usageContext,
          plutchikMappings: formData.plutchikRatings,
          arousalLevel: formData.granularityRatings.arousal,
          valence: formData.granularityRatings.valence,
          dominance: formData.granularityRatings.dominance,
          intensity: formData.granularityRatings.intensity,
          status: 'pending_approval', // Yellow pill status
          demographics: formData.demographics,
          notifyOnReview: formData.notifyOnReview
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('[SuggestEmotionModal] Submitted for community evaluation:', result);
        onSubmit({ ...result, status: 'pending_approval' });
        onClose();
        // Reset form
        setFormData({
          emotionName: '',
          userDescription: '',
          usageContext: '',
          plutchikRatings: { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, anticipation: 0, anger: 0, disgust: 0 },
          granularityRatings: { arousal: 5, valence: 5, dominance: 5, intensity: 5 },
          demographics: { ageRange: '', culturalBackground: '', region: '' },
          notifyOnReview: false
        });
        setCurrentStep(1);
      } else {
        alert(result.error || 'Failed to submit for community evaluation');
      }
    } catch (error) {
      console.error('Error submitting for community evaluation:', error);
      alert('Failed to submit for community evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setFormData({
      emotionName: '',
      userDescription: '',
      usageContext: '',
      plutchikRatings: { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, anticipation: 0, anger: 0, disgust: 0 },
      granularityRatings: { arousal: 5, valence: 5, dominance: 5, intensity: 5 },
      demographics: { ageRange: '', culturalBackground: '', region: '' },
      notifyOnReview: false
    });
    setCurrentStep(1);
  };

  const modalTitle = 'Suggest a New Emotion';
  const modalDescription = 'Help us expand our emotion vocabulary! Describe an emotion you feel that isn\'t in our current list.';

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={modalTitle}
      size="lg"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-500">Step {currentStep} of 4</div>
        </div>
        <p className="text-gray-600">
          {modalDescription}
        </p>
      </div>
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you call this emotion? *
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="e.g., a combination of existing emotions or new word"
                value={formData.emotionName}
                onChange={(e) => setFormData(prev => ({ ...prev, emotionName: e.target.value }))}
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use your own words - slang, made-up words, or combinations are welcome!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How would you describe this emotion? *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe what this emotion feels like, when you experience it, what causes it..."
                value={formData.userDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, userDescription: e.target.value }))}
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When do you typically feel this emotion?
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="e.g., 'When someone doesn't respond to my message', 'When I'm both hungry and irritated', 'When everyone else understands something but I don't'..."
                value={formData.usageContext}
                onChange={(e) => setFormData(prev => ({ ...prev, usageContext: e.target.value }))}
                maxLength={300}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                How much of each basic emotion is in your feeling?
              </h3>
              <p className="text-gray-600 mb-6">
                Rate from 0 (not at all) to 5 (very much) how much each of these basic emotions 
                is part of what you're describing. Most emotions are a mix of several!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(PLUTCHIK_EMOTIONS).map(([key, emotion]) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: emotion.color }}
                    />
                    <span className="font-medium text-gray-900">{emotion.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{emotion.description}</p>
                  <p className="text-xs text-gray-500 mb-3">{emotion.examples}</p>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">None</span>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={formData.plutchikRatings[key as keyof typeof formData.plutchikRatings]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        plutchikRatings: {
                          ...prev.plutchikRatings,
                          [key]: parseInt(e.target.value)
                        }
                      }))}
                      className="flex-1"
                      aria-label={`${emotion.name} rating`}
                      title={`Rate how much ${emotion.name} is part of your emotion`}
                    />
                    <span className="text-xs text-gray-500">Very much</span>
                    <span className="w-8 text-sm font-medium text-center">
                      {formData.plutchikRatings[key as keyof typeof formData.plutchikRatings]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                How would you describe the "feel" of this emotion?
              </h3>
              <p className="text-gray-600 mb-6">
                These sliders help us understand the energy and quality of your emotion.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Energy Level - How energizing or calming is this emotion?
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Very calming</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.granularityRatings.arousal}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      granularityRatings: { ...prev.granularityRatings, arousal: parseInt(e.target.value) }
                    }))}
                    className="flex-1"
                    aria-label="Energy level rating"
                    title="Rate how energizing or calming this emotion is"
                  />
                  <span className="text-sm text-gray-600">Very energizing</span>
                  <span className="w-8 text-sm font-medium">{formData.granularityRatings.arousal}</span>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Positivity - How positive or negative does this emotion feel?
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Very negative</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.granularityRatings.valence}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      granularityRatings: { ...prev.granularityRatings, valence: parseInt(e.target.value) }
                    }))}
                    className="flex-1"
                    aria-label="Positivity rating"
                    title="Rate how positive or negative this emotion feels"
                  />
                  <span className="text-sm text-gray-600">Very positive</span>
                  <span className="w-8 text-sm font-medium">{formData.granularityRatings.valence}</span>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Control - How in-control or powerless do you feel?
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Powerless</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.granularityRatings.dominance}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      granularityRatings: { ...prev.granularityRatings, dominance: parseInt(e.target.value) }
                    }))}
                    className="flex-1"
                    aria-label="Control rating"
                    title="Rate how in-control or powerless you feel"
                  />
                  <span className="text-sm text-gray-600">In control</span>
                  <span className="w-8 text-sm font-medium">{formData.granularityRatings.dominance}</span>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intensity - How strong or subtle is this emotion?
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Very subtle</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.granularityRatings.intensity}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      granularityRatings: { ...prev.granularityRatings, intensity: parseInt(e.target.value) }
                    }))}
                    className="flex-1"
                    aria-label="Intensity rating"
                    title="Rate how strong or subtle this emotion is"
                  />
                  <span className="text-sm text-gray-600">Very intense</span>
                  <span className="w-8 text-sm font-medium">{formData.granularityRatings.intensity}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Help us understand generational differences (Optional)
              </h3>
              <p className="text-gray-600 mb-6">
                This helps us see how different groups express emotions differently. All fields are optional and anonymous.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
                <select
                  value={formData.demographics.ageRange}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    demographics: { ...prev.demographics, ageRange: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Age range selection"
                  title="Select your age range"
                >
                  <option value="">Prefer not to say</option>
                  <option value="13-17">13-17</option>
                  <option value="18-24">18-24</option>
                  <option value="25-34">25-34</option>
                  <option value="35-44">35-44</option>
                  <option value="45-54">45-54</option>
                  <option value="55+">55+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cultural Background</label>
                <input
                  type="text"
                  placeholder="e.g., American, Korean, Brazilian, etc."
                  value={formData.demographics.culturalBackground}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    demographics: { ...prev.demographics, culturalBackground: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <input
                  type="text"
                  placeholder="e.g., California, London, Tokyo, etc."
                  value={formData.demographics.region}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    demographics: { ...prev.demographics, region: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.notifyOnReview}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notifyOnReview: e.target.checked
                    }))}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Email me when my suggestion is reviewed
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Get notified when an admin approves or rejects your emotion suggestion
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Review Your Suggestion</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Emotion:</strong> {formData.emotionName}</p>
                  <p><strong>Description:</strong> {formData.userDescription}</p>
                  <p><strong>Main emotions:</strong> {
                    Object.entries(formData.plutchikRatings)
                      .filter(([_, rating]) => rating > 0)
                      .map(([emotion, rating]) => `${emotion} (${rating})`)
                      .join(', ') || 'None selected'
                  }</p>
                  <p><strong>Notifications:</strong> {formData.notifyOnReview ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <div>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
            )}
          </div>
          
          <div className="space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {/* Save button - available on all steps */}
            <button
              onClick={handleSave}
              disabled={isSubmitting || !formData.emotionName.trim()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              title={getMoodCompletionStatus() === 'incomplete' ? 'Save as incomplete (grey pill)' : 'Save as private complete (red pill)'}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={currentStep === 1 && (!formData.emotionName.trim() || !formData.userDescription.trim())}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !isFormComplete()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Submit for community evaluation (yellow pill)"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Community Evaluation'}
              </button>
            )}
          </div>
        </div>
    </Modal>
  );
} 