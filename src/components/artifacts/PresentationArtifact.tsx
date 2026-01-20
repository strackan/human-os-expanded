/**
 * PresentationArtifact Component
 *
 * Renders an editable slide deck presentation within the workflow.
 * Used for QBR meeting decks, performance reviews, and customer presentations.
 *
 * Features:
 * - Slide carousel navigation (arrows + dots)
 * - Editable content (when editable=true)
 * - Multiple slide types (title, metrics, highlights, recommendations, next-steps)
 * - Export to PDF capability
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Presentation,
  Edit3,
  Eye,
  FileSpreadsheet,
  Cloud,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import {
  ArtifactContainer,
} from '@/components/artifacts/primitives';
import {
  TitleSlide,
  MetricsSlide,
  HighlightsSlide,
  RecommendationsSlide,
  NextStepsSlide,
} from './presentation/slides';
import type { TitleSlideContent } from './presentation/slides/TitleSlide';
import type { MetricsSlideContent } from './presentation/slides/MetricsSlide';
import type { HighlightsSlideContent } from './presentation/slides/HighlightsSlide';
import type { RecommendationsSlideContent } from './presentation/slides/RecommendationsSlide';
import type { NextStepsSlideContent } from './presentation/slides/NextStepsSlide';

// Slide type definitions
export type SlideType = 'title' | 'metrics' | 'highlights' | 'recommendations' | 'next-steps';

export type SlideContent =
  | TitleSlideContent
  | MetricsSlideContent
  | HighlightsSlideContent
  | RecommendationsSlideContent
  | NextStepsSlideContent;

export interface PresentationSlide {
  id: string;
  type: SlideType;
  title: string;
  content: SlideContent;
}

export interface PresentationArtifactProps {
  artifactId?: string;
  title?: string;
  subtitle?: string;
  customerName?: string;
  slides?: PresentationSlide[];
  editable?: boolean;
  isLoading?: boolean;
  error?: string;
  onSlideChange?: (slideIndex: number, content: SlideContent) => void;
  onExport?: () => void;
}

// Default slides for demo/testing
const DEFAULT_SLIDES: PresentationSlide[] = [
  {
    id: 'title',
    type: 'title',
    title: 'GrowthStack',
    content: {
      subtitle: '90-Day Performance Review',
      date: 'December 2024',
      preparedBy: 'Grace (InHerSight)',
    },
  },
  {
    id: 'metrics',
    type: 'metrics',
    title: 'Brand Performance',
    content: {
      impressions: { value: '60K', trend: 'up', trendValue: '+12% vs prior' },
      profileViews: { value: '4,500', trend: 'up', trendValue: '+8% vs prior' },
      applyClicks: { value: '120', trend: 'up', trendValue: '+15% vs prior' },
      newRatings: { value: '45', trend: 'up', trendValue: '+23% vs prior' },
      reportingPeriod: 'Last 90 Days',
    },
  },
  {
    id: 'highlights',
    type: 'highlights',
    title: 'Key Wins',
    content: {
      items: [
        'Featured in "Top 50 Companies for Women in Tech" article',
        '35% of new hires in Q3 came through InHerSight pipeline',
        'CEO quoted InHerSight data in investor presentation',
        'Used InHerSight insights to restructure parental leave policy',
      ],
    },
  },
  {
    id: 'recommendations',
    type: 'recommendations',
    title: 'Strategic Recommendations',
    content: {
      items: [
        {
          title: 'Upgrade to Enterprise Tier',
          description: 'Unlock API access for Greenhouse integration',
          priority: 'high',
        },
        {
          title: 'Multi-year Renewal',
          description: 'Lock in current pricing with a 2-year commitment',
          priority: 'high',
        },
        {
          title: 'London Office Expansion',
          description: 'Add UK employer profile when London office launches',
          priority: 'medium',
        },
      ],
    },
  },
  {
    id: 'next-steps',
    type: 'next-steps',
    title: 'Next Steps',
    content: {
      items: [
        {
          title: 'Schedule renewal discussion with Sarah Johnson',
          owner: 'Grace',
          dueDate: 'Dec 15',
          completed: false,
        },
        {
          title: 'Prepare Enterprise tier pricing proposal',
          owner: 'Grace',
          dueDate: 'Dec 20',
          completed: false,
        },
        {
          title: 'Review multi-year contract terms',
          owner: 'Grace',
          dueDate: 'Jan 15',
          completed: false,
        },
      ],
    },
  },
];

export function PresentationArtifact({
  artifactId = 'presentation',
  title = '90-Day Performance Review',
  subtitle,
  customerName = 'GrowthStack',
  slides = DEFAULT_SLIDES,
  editable = true,
  isLoading = false,
  error,
  onSlideChange,
  onExport,
}: PresentationArtifactProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [localSlides, setLocalSlides] = useState(slides);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const displaySubtitle = subtitle || customerName;
  const currentSlide = localSlides[currentSlideIndex];
  const totalSlides = localSlides.length;

  // Navigation
  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlideIndex(index);
    }
  };

  const goToPrevious = () => goToSlide(currentSlideIndex - 1);
  const goToNext = () => goToSlide(currentSlideIndex + 1);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  // Handle content change
  const handleContentChange = (content: SlideContent) => {
    const newSlides = [...localSlides];
    newSlides[currentSlideIndex] = {
      ...newSlides[currentSlideIndex],
      content,
    };
    setLocalSlides(newSlides);
    onSlideChange?.(currentSlideIndex, content);
  };

  // Close export menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Export to PowerPoint via server API
  const handleExportPptx = useCallback(async () => {
    console.log('[PresentationArtifact] Starting PPTX export...');
    setIsExporting(true);
    setExportError(null);
    setIsExportMenuOpen(false);
    try {
      console.log('[PresentationArtifact] Sending request to /api/export/pptx');
      const response = await fetch('/api/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: localSlides,
          customerName,
          fileName: `${customerName.replace(/\s+/g, '-')}_QBR_${new Date().toISOString().split('T')[0]}`,
        }),
      });

      console.log('[PresentationArtifact] Response status:', response.status);

      if (!response.ok) {
        // Try to parse error as JSON, fall back to status text
        let errorMessage = 'Failed to generate PowerPoint';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Download the file
      console.log('[PresentationArtifact] Downloading blob...');
      const blob = await response.blob();
      console.log('[PresentationArtifact] Blob size:', blob.size);

      if (blob.size === 0) {
        throw new Error('Generated file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${customerName.replace(/\s+/g, '-')}_QBR_${new Date().toISOString().split('T')[0]}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('[PresentationArtifact] Download triggered successfully');
    } catch (err) {
      console.error('[PresentationArtifact] Failed to export PPTX:', err);
      setExportError(err instanceof Error ? err.message : 'Failed to export PowerPoint');
    } finally {
      setIsExporting(false);
    }
  }, [localSlides, customerName]);

  // Export to Google Drive
  const handleExportToDrive = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    setIsExportMenuOpen(false);
    try {
      // Call the Drive upload API
      const response = await fetch('/api/export/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: localSlides,
          customerName,
          fileName: `${customerName.replace(/\s+/g, '-')}_QBR_${new Date().toISOString().split('T')[0]}`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload to Drive');
      }

      const { url } = await response.json();
      // Open the Drive file in a new tab
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to export to Drive:', err);
      setExportError(err instanceof Error ? err.message : 'Failed to upload to Drive');
    } finally {
      setIsExporting(false);
    }
  }, [localSlides, customerName]);

  // Legacy export handler (PDF via print)
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      window.print();
    }
  };

  // Render current slide based on type
  const renderSlide = () => {
    if (!currentSlide) return null;

    const slideProps = {
      title: currentSlide.title,
      content: currentSlide.content as any,
      editable: isEditMode,
      onContentChange: handleContentChange,
    };

    switch (currentSlide.type) {
      case 'title':
        return <TitleSlide {...slideProps} />;
      case 'metrics':
        return <MetricsSlide {...slideProps} />;
      case 'highlights':
        return <HighlightsSlide {...slideProps} />;
      case 'recommendations':
        return <RecommendationsSlide {...slideProps} />;
      case 'next-steps':
        return <NextStepsSlide {...slideProps} />;
      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-500">
            Unknown slide type: {currentSlide.type}
          </div>
        );
    }
  };

  return (
    <ArtifactContainer
      artifactId={artifactId}
      variant="default"
      isLoading={isLoading}
      error={error}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Presentation className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{displaySubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Slide counter */}
          <span className="text-sm text-gray-500">
            {currentSlideIndex + 1} / {totalSlides}
          </span>
          {/* Edit/View toggle */}
          {editable && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`p-2 rounded-lg transition-colors ${
                isEditMode
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={isEditMode ? 'View mode' : 'Edit mode'}
            >
              {isEditMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            </button>
          )}
          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExporting}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Export presentation"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={handleExportPptx}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-orange-500" />
                  Download PowerPoint
                </button>
                <button
                  onClick={handleExportToDrive}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Cloud className="w-4 h-4 text-blue-500" />
                  Save to Google Drive
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-400" />
                  Print / Save as PDF
                </button>
              </div>
            )}
          </div>
          {/* Export error toast */}
          {exportError && (
            <div className="absolute top-14 right-4 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg shadow-lg border border-red-200">
              {exportError}
              <button
                onClick={() => setExportError(null)}
                className="ml-2 text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slide content */}
      <div
        ref={slideContainerRef}
        className="relative flex-1 p-4 min-h-[400px]"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Navigation arrows */}
        <button
          onClick={goToPrevious}
          disabled={currentSlideIndex === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 shadow-md text-gray-600 hover:bg-white hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={goToNext}
          disabled={currentSlideIndex === totalSlides - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 shadow-md text-gray-600 hover:bg-white hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide */}
        <div className="h-full mx-8 overflow-hidden rounded-lg shadow-lg border border-gray-200">
          {renderSlide()}
        </div>
      </div>

      {/* Slide indicators */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-center gap-2">
        {localSlides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentSlideIndex
                ? 'bg-blue-600 w-6'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}: ${slide.title}`}
            title={slide.title}
          />
        ))}
      </div>
    </ArtifactContainer>
  );
}

PresentationArtifact.displayName = 'PresentationArtifact';
export default PresentationArtifact;
