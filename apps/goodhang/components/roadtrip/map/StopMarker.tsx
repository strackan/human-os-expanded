'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { PlannedStop } from '@/types/roadtrip';

interface StopMarkerProps {
  stop: PlannedStop;
  onClick: (stop: PlannedStop) => void;
  onBlogClick?: ((stop: PlannedStop) => void) | undefined;
  interestCount?: number | undefined;
  isCurrentLocation?: boolean | undefined;
  isVisited?: boolean | undefined;
}

// Create custom pushpin icons
const createPushpinIcon = (color: string, size: number = 24, isCurrentLocation: boolean = false) => {
  const pulseAnimation = isCurrentLocation ? `
    @keyframes pulse {
      0%, 100% { transform: translateX(-50%) scale(1); box-shadow: 0 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(0,0,0,0.2), 0 0 0 0 rgba(45, 90, 74, 0.4); }
      50% { transform: translateX(-50%) scale(1.1); box-shadow: 0 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(0,0,0,0.2), 0 0 0 8px rgba(45, 90, 74, 0); }
    }
  ` : '';

  const animationStyle = isCurrentLocation ? 'animation: pulse 2s ease-in-out infinite;' : '';

  return L.divIcon({
    className: 'custom-pushpin',
    html: `
      <style>${pulseAnimation}</style>
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size + 12}px;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: ${size}px;
          height: ${size}px;
          background: radial-gradient(circle at 30% 30%, ${color} 0%, ${adjustColor(color, -30)} 70%);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(0,0,0,0.2);
          ${animationStyle}
        "></div>
        <div style="
          position: absolute;
          top: ${size - 4}px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 12px;
          background: linear-gradient(to bottom, #888 0%, #666 100%);
          border-radius: 0 0 2px 2px;
        "></div>
      </div>
    `,
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 12],
    popupAnchor: [0, -size - 8],
  });
};

// Helper to darken/lighten colors
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Different pin colors for different stop types
const getPinColor = (stop: PlannedStop, isCurrentLocation: boolean, isVisited: boolean): string => {
  if (isCurrentLocation) return '#2D5A4A'; // Forest green for current location
  if (isVisited) return '#2D5A4A'; // Forest green for visited
  if (stop.isHome) return '#2D5A4A'; // Forest green for home
  if (stop.isHighlight) return '#C41E3A'; // Red for highlights
  return '#D4A84B'; // Mustard for regular future stops
};

const getPinSize = (stop: PlannedStop, isCurrentLocation: boolean): number => {
  if (isCurrentLocation) return 32; // Bigger for current location
  if (stop.isHighlight) return 28;
  if (stop.isHome) return 26;
  return 22;
};

export default function StopMarker({ stop, onClick, onBlogClick, interestCount, isCurrentLocation = false, isVisited = false }: StopMarkerProps) {
  const color = getPinColor(stop, isCurrentLocation, isVisited);
  const size = getPinSize(stop, isCurrentLocation);
  const icon = createPushpinIcon(color, size, isCurrentLocation);

  const hasBlogContent = stop.blogContent?.visitedAt;
  const handleClick = () => {
    if (hasBlogContent && onBlogClick) {
      onBlogClick(stop);
    } else {
      onClick(stop);
    }
  };

  return (
    <Marker
      position={[stop.lat, stop.lng]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <Popup>
        <div className="text-center min-w-[120px]">
          <h3 className="rt-heading-elegant font-bold text-[var(--rt-navy)] text-lg mb-1">
            {stop.name}
          </h3>
          {isCurrentLocation && (
            <span className="rt-stamp text-xs mb-2 inline-block bg-[var(--rt-forest)] text-white">Currently Here</span>
          )}
          {stop.note && !isCurrentLocation && (
            <span className="rt-stamp text-xs mb-2 inline-block">{stop.note}</span>
          )}
          {hasBlogContent && stop.blogContent?.visitedAt && (
            <p className="text-xs text-[var(--rt-cork-dark)] mt-1">
              Visited {new Date(stop.blogContent.visitedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
          {interestCount && interestCount > 0 && !hasBlogContent && (
            <p className="text-sm text-[var(--rt-cork-dark)] mt-1">
              {interestCount} {interestCount === 1 ? 'person' : 'people'} interested
            </p>
          )}
          <button
            onClick={handleClick}
            className="mt-2 text-sm text-[var(--rt-forest)] hover:text-[var(--rt-rust)] underline rt-typewriter"
          >
            {hasBlogContent ? 'See what happened' : "Let's connect here"}
          </button>
        </div>
      </Popup>
    </Marker>
  );
}
