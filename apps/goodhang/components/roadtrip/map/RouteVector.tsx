'use client';

import { Polyline } from 'react-leaflet';
import { ROUTE_PATH, CURRENT_STOP_INDEX } from '@/lib/roadtrip/stops';

interface RouteVectorProps {
  animated?: boolean;
  currentStopIndex?: number;
}

export default function RouteVector({ animated: _animated = false, currentStopIndex = CURRENT_STOP_INDEX }: RouteVectorProps) {
  // Split route into traveled (green) and remaining (yellow/mustard)
  // Include current stop in traveled path, so slice at currentStopIndex + 1
  const traveledPath = ROUTE_PATH.slice(0, currentStopIndex + 1);
  const remainingPath = ROUTE_PATH.slice(currentStopIndex);

  return (
    <>
      {/* === REMAINING ROUTE (future stops) === */}
      {/* Shadow layer for remaining */}
      <Polyline
        positions={remainingPath}
        pathOptions={{
          color: '#8B7355',
          weight: 6,
          opacity: 0.3,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Main remaining route - mustard/yellow dashed */}
      <Polyline
        positions={remainingPath}
        pathOptions={{
          color: '#D4A84B',
          weight: 3,
          opacity: 0.8,
          dashArray: '8, 6',
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* === TRAVELED ROUTE (visited stops) === */}
      {/* Shadow layer for traveled */}
      <Polyline
        positions={traveledPath}
        pathOptions={{
          color: '#1a3d2e',
          weight: 7,
          opacity: 0.4,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Main traveled route - solid green */}
      <Polyline
        positions={traveledPath}
        pathOptions={{
          color: '#2D5A4A',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </>
  );
}
