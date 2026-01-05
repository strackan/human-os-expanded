'use client';

import { useState } from 'react';
import Image from 'next/image';
import Modal from './ui/Modal';
import { PlannedStop } from '@/types/roadtrip';

interface BlogModalProps {
  stop: PlannedStop;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlogModal({ stop, isOpen, onClose }: BlogModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const blogContent = stop.blogContent;

  if (!blogContent) return null;

  const photos = blogContent.photos || [];
  const hasPhotos = photos.length > 0;
  const hasMultiplePhotos = photos.length > 1;

  const goToPrevious = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="paper">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center border-b border-[var(--rt-cork-dark)]/20 pb-4">
          <h2 className="rt-heading-elegant text-2xl font-bold text-[var(--rt-navy)]">
            {stop.name}
          </h2>
          {blogContent.visitedAt && (
            <p className="rt-typewriter text-sm text-[var(--rt-cork-dark)] mt-1">
              {formatDate(blogContent.visitedAt)}
            </p>
          )}
        </div>

        {/* Photo Gallery */}
        {hasPhotos && (
          <div className="relative">
            {/* Main Photo */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-[var(--rt-cork)]/20">
              <Image
                src={photos[currentPhotoIndex] ?? ''}
                alt={`${stop.name} photo ${currentPhotoIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
                onError={(e) => {
                  // Fallback for missing images
                  const target = e.target as HTMLImageElement;
                  target.src = '/roadtrip/sample/placeholder.jpg';
                }}
              />

              {/* Navigation arrows */}
              {hasMultiplePhotos && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-colors"
                    aria-label="Previous photo"
                  >
                    <svg className="w-6 h-6 text-[var(--rt-navy)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-colors"
                    aria-label="Next photo"
                  >
                    <svg className="w-6 h-6 text-[var(--rt-navy)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Photo indicator dots */}
            {hasMultiplePhotos && (
              <div className="flex justify-center gap-2 mt-3">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      index === currentPhotoIndex
                        ? 'bg-[var(--rt-forest)]'
                        : 'bg-[var(--rt-cork-dark)]/30 hover:bg-[var(--rt-cork-dark)]/50'
                    }`}
                    aria-label={`Go to photo ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Text */}
        {blogContent.summary && (
          <div className="rt-paper-note p-4 bg-[var(--rt-cream)]/50">
            <p className="rt-typewriter text-[var(--rt-navy)] leading-relaxed">
              {blogContent.summary}
            </p>
          </div>
        )}

        {/* No content fallback */}
        {!hasPhotos && !blogContent.summary && (
          <div className="text-center py-8">
            <p className="rt-typewriter text-[var(--rt-cork-dark)]">
              Content coming soon...
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
