'use client';

import { useEffect, useRef } from 'react';
import { renderTokenToCanvas } from '@/lib/favors/visualGenerator';
import type { FavorToken, FavorTokenWithOwner } from '@/lib/types/database';

interface TokenCardProps {
  token: FavorToken | FavorTokenWithOwner;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showOwner?: boolean;
  onClick?: (() => void) | undefined;
}

const SIZES = {
  sm: 64,
  md: 96,
  lg: 128,
};

export function TokenCard({
  token,
  size = 'md',
  showName = true,
  showOwner = false,
  onClick,
}: TokenCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelSize = SIZES[size];

  useEffect(() => {
    if (canvasRef.current) {
      renderTokenToCanvas(canvasRef.current, {
        visualSeed: token.visual_seed,
        signaturePattern: token.signature_pattern,
        size: pixelSize,
      });
    }
  }, [token.visual_seed, token.signature_pattern, pixelSize]);

  const owner = 'owner' in token ? token.owner : undefined;

  return (
    <div
      className={`flex flex-col items-center gap-2 ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
      onClick={onClick}
    >
      {/* Token Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={pixelSize}
          height={pixelSize}
          className="rounded-full border-2 border-neon-gold/50 shadow-[0_0_15px_rgba(255,215,0,0.3)]"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full bg-neon-gold/10 blur-md -z-10"
          style={{ width: pixelSize, height: pixelSize }}
        />
      </div>

      {/* Token Name */}
      {showName && (
        <div className="text-center">
          <div className="font-mono text-sm text-neon-gold font-bold">
            {token.name}
          </div>
          {showOwner && owner && (
            <div className="font-mono text-xs text-foreground-dim mt-1">
              Held by {owner.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
