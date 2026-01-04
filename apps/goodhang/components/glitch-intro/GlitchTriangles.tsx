import React from 'react';

interface GlitchTrianglesProps {
  show: boolean;
  positions: Array<{
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    delay: number;
  }>;
}

export function GlitchTriangles({ show, positions }: GlitchTrianglesProps) {
  if (!show) return null;

  return (
    <>
      {positions.map((pos, i) => (
        <div
          key={i}
          className="triangle-chaos"
          style={{
            ...pos,
            animationDelay: `${pos.delay}s`,
            position: 'absolute'
          }}
        />
      ))}
    </>
  );
}
