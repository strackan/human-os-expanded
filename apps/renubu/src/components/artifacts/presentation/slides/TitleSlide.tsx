/**
 * TitleSlide Component
 *
 * First slide in a presentation - company name, title, date, and prepared by.
 */

'use client';

import React from 'react';

export interface TitleSlideContent {
  subtitle?: string;
  date?: string;
  preparedBy?: string;
}

interface TitleSlideProps {
  title: string;
  content: TitleSlideContent;
  editable?: boolean;
  onContentChange?: (content: TitleSlideContent) => void;
}

export function TitleSlide({ title, content, editable, onContentChange }: TitleSlideProps) {
  const handleFieldChange = (field: keyof TitleSlideContent, value: string) => {
    if (onContentChange) {
      onContentChange({ ...content, [field]: value });
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 rounded-lg">
      {/* Logo placeholder */}
      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mb-8">
        <span className="text-2xl font-bold">IHS</span>
      </div>

      {/* Company name / main title */}
      {editable ? (
        <input
          type="text"
          value={title}
          onChange={(e) => handleFieldChange('subtitle', e.target.value)}
          className="text-4xl font-bold text-center bg-transparent border-b border-white/30 focus:border-white outline-none mb-4 w-full max-w-lg"
        />
      ) : (
        <h1 className="text-4xl font-bold text-center mb-4">{title}</h1>
      )}

      {/* Subtitle */}
      {editable ? (
        <input
          type="text"
          value={content.subtitle || ''}
          onChange={(e) => handleFieldChange('subtitle', e.target.value)}
          placeholder="Subtitle"
          className="text-2xl text-center bg-transparent border-b border-white/30 focus:border-white outline-none mb-8 text-white/90 w-full max-w-lg placeholder:text-white/50"
        />
      ) : (
        <h2 className="text-2xl text-white/90 mb-8">{content.subtitle}</h2>
      )}

      {/* Date and prepared by */}
      <div className="mt-auto text-center text-white/70 text-sm">
        {content.date && <p className="mb-1">{content.date}</p>}
        {content.preparedBy && <p>Prepared by {content.preparedBy}</p>}
      </div>
    </div>
  );
}

export default TitleSlide;
