'use client';

import { useState, useEffect } from 'react';
import { EMOTION_CATEGORIES, PLUTCHIK_EMOTIONS } from '@/lib/emotionUtils';
import AddCustomWordModal from '@/components/AddCustomWordModal';
import { useToast } from '@/components/Toast';

interface Emotion {
  id: number;
  name: string;
  displayName: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    color: string;
    type: string;
    isPrimary: boolean;
    relevanceScore: number;
  }>;
  isCore: boolean;
  plutchikProfile: {
    joy: number;
    trust: number;
    fear: number;
    surprise: number;
    sadness: number;
    anticipation: number;
    anger: number;
    disgust: number;
  } | null;
  intensity: number;
  arousal: number;
  valence: number;
  dominance: number;
  analysis?: {
    dominantEmotion: string;
    complexity: number;
    color: string;
    intensityLevel: string;
    valenceLevel: string;
    arousalLevel: string;
  };
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  iconName: string;
  type: string;
  emotionCount?: number;
}

export default function MoodsPage() {
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [coreOnly, setCoreOnly] = useState(false);
  const [selectedIntensity, setSelectedIntensity] = useState('all');
  const [selectedValence, setSelectedValence] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'wheel'>('grid');
  const [insights, setInsights] = useState<string[]>([]);
  const [searchStats, setSearchStats] = useState<any>(null);
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenMatchingCount, setHiddenMatchingCount] = useState(0);
  
  // Toast notifications
  const { showToast } = useToast();

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?type=emotional_type&includeCount=true');
        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch emotions based on filters
  useEffect(() => {
    const fetchEmotions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (coreOnly) params.append('coreOnly', 'true');
        if (selectedIntensity !== 'all') params.append('intensity', selectedIntensity);
        if (selectedValence !== 'all') params.append('valence', selectedValence);
        if (showHidden) params.append('showHidden', 'true');
        // Remove limit so search can find ALL matching moods
        
        const response = await fetch(`/api/moods/search?${params}`);
        const data = await response.json();
        
        setEmotions(data.moods || []);
        setInsights(data.insights || []);
        setSearchStats(data);
        setHiddenMatchingCount(data.hiddenMatchingCount || 0);
      } catch (error) {
        console.error('Error fetching emotions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmotions();
  }, [searchQuery, selectedCategory, coreOnly, selectedIntensity, selectedValence, showHidden]);

  const renderEmotionCard = (emotion: Emotion) => (
    <div
      key={emotion.id}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border-l-4"
      style={{ borderLeftColor: emotion.analysis?.color || '#6B7280' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{emotion.displayName}</h3>
          {emotion.isCore && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Core Emotion
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            {emotion.analysis?.intensityLevel} intensity
          </div>
        </div>
      </div>
      
      {emotion.analysis && (
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-700">Dominant:</span>
            <span className="text-sm capitalize text-gray-600">{emotion.analysis.dominantEmotion}</span>
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Complexity: {emotion.analysis.complexity}</span>
            <span>Valence: {emotion.analysis.valenceLevel}</span>
            <span>Arousal: {emotion.analysis.arousalLevel}</span>
          </div>
        </div>
      )}
      
      {emotion.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {emotion.categories.filter(cat => cat.isPrimary).slice(0, 2).map(category => (
            <span
              key={category.id}
              className="inline-block text-xs px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </span>
          ))}
        </div>
      )}
      
      {emotion.plutchikProfile && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1">Plutchik Profile:</div>
          <div className="flex space-x-1">
            {Object.entries(emotion.plutchikProfile).map(([key, value]) => (
              value > 0 && (
                <div
                  key={key}
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: PLUTCHIK_EMOTIONS[key as keyof typeof PLUTCHIK_EMOTIONS]?.color || '#6B7280',
                    opacity: value / 3
                  }}
                  title={`${key}: ${value}`}
                />
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPlutchikWheel = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Plutchik Emotion Wheel</h3>
      <div className="relative w-80 h-80 mx-auto">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {Object.entries(PLUTCHIK_EMOTIONS).map(([key, emotion], index) => {
            const angle = (index * 45) * (Math.PI / 180);
            const x1 = 150 + 50 * Math.cos(angle);
            const y1 = 150 + 50 * Math.sin(angle);
            const x2 = 150 + 120 * Math.cos(angle);
            const y2 = 150 + 120 * Math.sin(angle);
            
            return (
              <g key={key}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={emotion.color}
                  strokeWidth="8"
                />
                <text
                  x={x2 + 10 * Math.cos(angle)}
                  y={y2 + 10 * Math.sin(angle)}
                  textAnchor="middle"
                  fontSize="12"
                  fill={emotion.color}
                  className="font-medium"
                >
                  {emotion.name}
                </text>
              </g>
            );
          })}
          <circle
            cx="150"
            cy="150"
            r="40"
            fill="none"
            stroke="#6B7280"
            strokeWidth="2"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-600 mt-4 text-center">
        The Plutchik wheel shows the 8 basic emotions and their relationships
      </p>
    </div>
  );

  return (
    <div className="h-full bg-main-bg">
      <div className="h-full p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Enhanced Emotion System</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSuggestModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Suggest New Emotion
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('wheel')}
                  className={`px-3 py-1 rounded ${viewMode === 'wheel' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Wheel
                </button>
              </div>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Emotions
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by emotion name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.slug}>
                      {category.name} {category.emotionCount ? `(${category.emotionCount})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="intensity-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Intensity
                </label>
                <select
                  id="intensity-select"
                  value={selectedIntensity}
                  onChange={(e) => setSelectedIntensity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Intensities</option>
                  <option value="low">Low (1-4)</option>
                  <option value="medium">Medium (5-7)</option>
                  <option value="high">High (8-10)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="valence-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Valence
                </label>
                <select
                  id="valence-select"
                  value={selectedValence}
                  onChange={(e) => setSelectedValence(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Valences</option>
                  <option value="negative">Negative (1-3)</option>
                  <option value="neutral">Neutral (4-7)</option>
                  <option value="positive">Positive (8-10)</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={coreOnly}
                  onChange={(e) => setCoreOnly(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Core emotions only</span>
              </label>
              
              {searchStats && (
                <div className="text-sm text-gray-600">
                  Showing {searchStats.returned} of {searchStats.total} emotions
                  {showHidden && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      Including Hidden
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Insights */}
          {insights.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Insights</h3>
              <ul className="space-y-1">
                {insights.map((insight, index) => (
                  <li key={index} className="text-sm text-blue-800">
                    • {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Main Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading emotions...</div>
            </div>
          ) : viewMode === 'wheel' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderPlutchikWheel()}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Emotion Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Emotions:</span>
                    <span className="font-medium">{emotions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Core Emotions:</span>
                    <span className="font-medium">{emotions.filter(e => e.isCore).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Complex Emotions:</span>
                    <span className="font-medium">
                      {emotions.filter(e => e.analysis && e.analysis.complexity > 2).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">High Intensity:</span>
                    <span className="font-medium">
                      {emotions.filter(e => e.analysis && e.analysis.intensityLevel === 'high').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}`}>
              {emotions.map(renderEmotionCard)}
            </div>
          )}
          
          {emotions.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No emotions found matching your criteria.</div>
              <p className="text-gray-400 mt-2">Try adjusting your search filters.</p>
              
              {/* Show hidden moods option */}
              {hiddenMatchingCount > 0 && !showHidden && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 mb-2">
                    {hiddenMatchingCount} hidden emotion{hiddenMatchingCount === 1 ? '' : 's'} match your search.
                  </p>
                  <button
                    onClick={() => setShowHidden(true)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    View Hidden Moods
                  </button>
                </div>
              )}
              
              {/* Show option to hide hidden moods when they're visible */}
              {showHidden && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 mb-2">
                    Currently showing hidden moods.
                  </p>
                  <button
                    onClick={() => setShowHidden(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Hide Hidden Moods
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <AddCustomWordModal
        isOpen={suggestModalOpen}
        onClose={() => setSuggestModalOpen(false)}
        onMoodAdded={(result) => {
          showToast(result.message || 'Custom mood created successfully', 'success');
        }}
      />

    </div>
  );
} 