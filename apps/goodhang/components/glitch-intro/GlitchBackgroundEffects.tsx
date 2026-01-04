import React from 'react';

interface GlitchBackgroundEffectsProps {
  showBackgroundEffects: boolean;
  showEdgeCorruption: boolean;
}

export function GlitchBackgroundEffects({ showBackgroundEffects, showEdgeCorruption }: GlitchBackgroundEffectsProps) {
  return (
    <>
      {/* Film Grain - Always visible */}
      <div className="film-grain" />

      {/* CRT Effects */}
      <div className="crt-bulge" />
      {showBackgroundEffects && <div className="crt-scanlines" />}

      {/* VHS Tape Artifacts */}
      {showBackgroundEffects && (
        <>
          <div className="vhs-tape-wrinkle" style={{ animationDelay: '0s' }} />
          <div className="vhs-tape-wrinkle" style={{ animationDelay: '2s' }} />
          <div className="vhs-tape-wrinkle" style={{ animationDelay: '4s' }} />
        </>
      )}

      {/* Heat Distortion */}
      {showBackgroundEffects && <div className="heat-distortion" />}

      {/* Edge Corruption - Creeping from sides */}
      {showEdgeCorruption && (
        <>
          <div className="edge-corruption top" />
          <div className="edge-corruption bottom" />
          <div className="edge-corruption left" />
          <div className="edge-corruption right" />
        </>
      )}
    </>
  );
}
