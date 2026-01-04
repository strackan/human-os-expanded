'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { PlannedStop, CustomSpotData } from '@/types/roadtrip';
import { PLANNED_STOPS, MAP_CENTER, MAP_ZOOM, CURRENT_STOP_INDEX } from '@/lib/roadtrip/stops';
import { getCustomSpots, getStopInterestCounts } from '@/lib/roadtrip/api';
import StopMarker from './StopMarker';
import CustomSpotMarker from './CustomSpotMarker';
import RouteVector from './RouteVector';

interface RouteMapProps {
  onStopClick: (stop: PlannedStop) => void;
  onMapClick: (lat: number, lng: number) => void;
  onCustomSpotClick: (spot: CustomSpotData) => void;
  onBlogClick?: (stop: PlannedStop) => void;
}

// Component to handle map clicks
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function RouteMap({
  onStopClick,
  onMapClick,
  onCustomSpotClick,
  onBlogClick,
}: RouteMapProps) {
  const [customSpots, setCustomSpots] = useState<CustomSpotData[]>([]);
  const [interestCounts, setInterestCounts] = useState<Map<string, number>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [spots, counts] = await Promise.all([
          getCustomSpots(),
          getStopInterestCounts(),
        ]);
        setCustomSpots(spots);
        setInterestCounts(counts);
      } catch (error) {
        console.error('Error loading map data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Vintage map frame */}
      <div className="absolute inset-0 pointer-events-none z-10 border-8 border-[var(--rt-cork-dark)] shadow-inner" />

      {/* Corner decorations */}
      <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-[var(--rt-cork-dark)]/50 z-10 pointer-events-none" />
      <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-[var(--rt-cork-dark)]/50 z-10 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-[var(--rt-cork-dark)]/50 z-10 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-[var(--rt-cork-dark)]/50 z-10 pointer-events-none" />

      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="w-full h-full"
        scrollWheelZoom={true}
        style={{ background: '#E8DCC4' }}
      >
        {/* Use a vintage-style tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Route line */}
        <RouteVector />

        {/* Planned stop markers */}
        {PLANNED_STOPS.map((stop, index) => {
          // Skip duplicate return home marker in display
          if (stop.id === 'raleigh-return') return null;

          const isCurrentLocation = index === CURRENT_STOP_INDEX;
          const isVisited = index <= CURRENT_STOP_INDEX;

          return (
            <StopMarker
              key={`${stop.id}-${index}`}
              stop={stop}
              onClick={onStopClick}
              onBlogClick={onBlogClick}
              interestCount={interestCounts.get(stop.id)}
              isCurrentLocation={isCurrentLocation}
              isVisited={isVisited}
            />
          );
        })}

        {/* Custom spot markers from user requests */}
        {!isLoading &&
          customSpots.map((spot, index) => (
            <CustomSpotMarker
              key={`custom-${index}`}
              spot={spot}
              onClick={onCustomSpotClick}
            />
          ))}

        {/* Map click handler */}
        <MapClickHandler onMapClick={onMapClick} />
      </MapContainer>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--rt-cream)]/50 flex items-center justify-center z-20">
          <div className="rt-paper-note p-4 rt-typewriter">Loading map data...</div>
        </div>
      )}
    </div>
  );
}
