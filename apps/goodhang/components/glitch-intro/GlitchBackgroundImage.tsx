import React from 'react';
import Image from 'next/image';

interface GlitchBackgroundImageProps {
  activeBackground: { index: number; type: string } | null;
  backgroundImages: Array<{ path: string; type: string }>;
}

export function GlitchBackgroundImage({ activeBackground, backgroundImages }: GlitchBackgroundImageProps) {
  if (!activeBackground) return null;

  const bgImage = backgroundImages[activeBackground.index];
  if (!bgImage) return null;

  return (
    <div className="glitch-background-image">
      <Image
        src={bgImage.path}
        alt=""
        fill
        sizes="100vw"
        style={{
          objectFit: 'cover',
          opacity: 0.3,
          filter: 'blur(1px) contrast(1.2) saturate(0.8)',
        }}
        className="background-pulse"
        priority={false}
        unoptimized
      />
    </div>
  );
}
