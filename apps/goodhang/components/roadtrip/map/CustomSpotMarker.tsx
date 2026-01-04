'use client';

import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { CustomSpotData } from '@/types/roadtrip';

interface CustomSpotMarkerProps {
  spot: CustomSpotData;
  onClick: (spot: CustomSpotData) => void;
}

// Create a smaller, grayed out pushpin for custom spots
const createCustomSpotIcon = () => {
  return L.divIcon({
    className: 'custom-spot-pin',
    html: `
      <div style="
        position: relative;
        width: 16px;
        height: 24px;
        opacity: 0.7;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 16px;
          background: radial-gradient(circle at 30% 30%, #9CA3AF 0%, #6B7280 70%);
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        "></div>
        <div style="
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 10px;
          background: linear-gradient(to bottom, #888 0%, #666 100%);
          border-radius: 0 0 1px 1px;
        "></div>
      </div>
    `,
    iconSize: [16, 24],
    iconAnchor: [8, 24],
    popupAnchor: [0, -20],
  });
};

export default function CustomSpotMarker({ spot, onClick }: CustomSpotMarkerProps) {
  const icon = createCustomSpotIcon();

  return (
    <Marker
      position={[spot.lat, spot.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(spot),
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
        <div className="text-center">
          <p className="font-medium text-[var(--rt-navy)]">{spot.city}</p>
          <p className="text-xs text-[var(--rt-cork-dark)]">
            {spot.count} {spot.count === 1 ? 'request' : 'requests'}
          </p>
        </div>
      </Tooltip>
    </Marker>
  );
}
