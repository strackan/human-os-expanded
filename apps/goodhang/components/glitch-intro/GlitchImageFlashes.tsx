import React from 'react';
import Image from 'next/image';

interface FlashItem {
  index: number;
  zone: string;
  type: string;
}

interface FlashImage {
  path: string;
  type: string;
}

interface GlitchImageFlashesProps {
  activeFlashes: FlashItem[];
  flashImages: FlashImage[];
}

export function GlitchImageFlashes({ activeFlashes, flashImages }: GlitchImageFlashesProps) {
  if (activeFlashes.length === 0) return null;

  return (
    <>
      {activeFlashes.map((flash) => {
        const imagePath = flashImages[flash.index]?.path;
        // Generate random transformations for each flash
        const rotation = (Math.random() - 0.5) * 30; // -15 to +15 degrees
        const skew = (Math.random() - 0.5) * 15; // -7.5 to +7.5 degrees
        const scale = 0.8 + Math.random() * 0.6; // 0.8 to 1.4x
        const translateX = (Math.random() - 0.5) * 40; // -20% to +20%
        const translateY = (Math.random() - 0.5) * 40;
        const blur = Math.random() * 3 + 0.5; // 0.5 to 3.5px
        const contrast = Math.random() * 0.8 + 1; // 1 to 1.8
        const saturate = Math.random() * 0.8 + 0.5; // 0.5 to 1.3
        const opacity = 0.3 + Math.random() * 0.3; // 0.3 to 0.6

        return (
          <div
            key={flash.index}
            className={`macabre-flash flash-zone-${flash.zone}`}
          >
            {imagePath && (
              <div className="flash-image-container">
                <Image
                  src={imagePath}
                  alt=""
                  fill
                  sizes="500px"
                  style={{
                    objectFit: 'cover',
                    opacity,
                    filter: `blur(${blur}px) contrast(${contrast}) saturate(${saturate}) hue-rotate(${(Math.random() - 0.5) * 20}deg)`,
                    transform: `rotate(${rotation}deg) skew(${skew}deg) scale(${scale}) translate(${translateX}%, ${translateY}%)`
                  }}
                  className={flash.type === 'macabre' ? 'glitch-filter-1' : flash.type === 'tech' ? 'glitch-filter-2' : 'glitch-filter-3'}
                  priority={false}
                  unoptimized
                />
              </div>
            )}
          </div>
        );
      })}
      <style jsx>{`
        .flash-image-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        @media (prefers-reduced-motion: reduce) {
          .macabre-flash {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
