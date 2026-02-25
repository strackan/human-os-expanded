/**
 * TitleSlide Component
 *
 * First slide in a presentation - company name, title, date, and prepared by.
 * Uses a modern dark gradient with subtle geometric accents.
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
    <div className="h-full relative flex flex-col items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Subtle geometric accent - top-right glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
      {/* Bottom-left accent */}
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-purple-500/8 blur-3xl" />
      {/* Thin accent line across top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-60" />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-10 py-8 w-full">
        {/* Logo - clean bordered badge */}
        <div className="w-14 h-14 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center mb-10">
          <span className="text-lg font-semibold tracking-wide text-white/90">IHS</span>
        </div>

        {/* Company name / main title */}
        {editable ? (
          <input
            type="text"
            value={title}
            onChange={(e) => handleFieldChange('subtitle', e.target.value)}
            className="text-4xl font-bold text-center bg-transparent border-b border-white/20 focus:border-indigo-400 outline-none mb-3 w-full max-w-lg tracking-tight"
          />
        ) : (
          <h1 className="text-4xl font-bold text-center mb-3 tracking-tight">{title}</h1>
        )}

        {/* Decorative divider */}
        <div className="w-16 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mb-4" />

        {/* Subtitle */}
        {editable ? (
          <input
            type="text"
            value={content.subtitle || ''}
            onChange={(e) => handleFieldChange('subtitle', e.target.value)}
            placeholder="Subtitle"
            className="text-xl text-center bg-transparent border-b border-white/20 focus:border-indigo-400 outline-none mb-8 text-white/80 w-full max-w-lg placeholder:text-white/40 font-light tracking-wide"
          />
        ) : (
          <h2 className="text-xl font-light text-white/80 mb-8 tracking-wide">{content.subtitle}</h2>
        )}

        {/* Date and prepared by - bottom section */}
        <div className="mt-auto text-center space-y-1">
          {content.date && (
            <p className="text-sm text-white/50 font-medium tracking-wider uppercase">{content.date}</p>
          )}
          {content.preparedBy && (
            <p className="text-sm text-white/40">Prepared by {content.preparedBy}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TitleSlide;
