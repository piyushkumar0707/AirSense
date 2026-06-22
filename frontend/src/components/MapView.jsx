import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DELHI_CENTER = [28.6139, 77.2090];

const ZONE_COORDS = {
  'anand-vihar': [28.6469, 77.3152],
  'rk-puram': [28.5651, 77.1876],
  'ito': [28.6271, 77.2421],
  'dwarka': [28.5921, 77.0460],
  'rohini': [28.7413, 77.1151],
  'punjabi-bagh': [28.6714, 77.1321],
  'okhla': [28.5355, 77.2767],
  'narela': [28.8561, 77.0956],
  'lodhi-road': [28.5918, 77.2216],
  'wazirpur': [28.7108, 77.1721],
};

function getAQIColor(aqi) {
  if (aqi <= 50) return '#22c55e';
  if (aqi <= 100) return '#a3e635';
  if (aqi <= 200) return '#facc15';
  if (aqi <= 300) return '#f97316';
  if (aqi <= 400) return '#ef4444';
  return '#7c3aed';
}

function getAQICategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

/**
 * MapView — Delhi map with AQI heatmap circles and source attribution popup.
 * Props:
 *   zones: [{ zoneId, name, currentAQI, dominantSource, attributionConfidence }]
 *   onZoneClick: (zoneId) => void
 *   selectedZone: string | null
 */
export default function MapView({ zones = [], onZoneClick, selectedZone }) {
  return (
    <div style={{ height: '420px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e293b' }}>
      <MapContainer
        center={DELHI_CENTER}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {zones.map((zone) => {
          const coords = ZONE_COORDS[zone.zoneId];
          if (!coords) return null;
          const color = getAQIColor(zone.currentAQI || 200);
          const isSelected = selectedZone === zone.zoneId;

          return (
            <CircleMarker
              key={zone.zoneId}
              center={coords}
              radius={isSelected ? 22 : 16}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.75,
                color: isSelected ? '#ffffff' : color,
                weight: isSelected ? 2 : 1,
              }}
              eventHandlers={{ click: () => onZoneClick && onZoneClick(zone.zoneId) }}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <strong>{zone.name || zone.zoneId}</strong>
                  <br />
                  <span style={{ color, fontWeight: 700, fontSize: '1.2rem' }}>
                    AQI {zone.currentAQI || '—'}
                  </span>
                  {' '}
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    ({getAQICategory(zone.currentAQI || 200)})
                  </span>
                  <br />
                  {zone.dominantSource && (
                    <span style={{ fontSize: '0.8rem' }}>
                      🏭 Dominant: <strong>{zone.dominantSource}</strong>
                      {zone.attributionConfidence && ` (${Math.round(zone.attributionConfidence * 100)}%)`}
                    </span>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
