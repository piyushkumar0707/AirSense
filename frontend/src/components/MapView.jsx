import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FALLBACK_ZONES, getAQIColor, getAQICategory, SOURCE_COLORS } from '../constants/zones';

const DELHI_CENTER = [28.6139, 77.2090];

/**
 * MapView — Dark Leaflet map of Delhi with AQI-colored zone markers.
 *
 * Props:
 *   zones: enriched zone objects with currentAQI, dominantSource, attributionConfidence
 *   onZoneClick: (zoneId: string) => void
 *   selectedZone: string | null
 */
export default function MapView({ zones = [], onZoneClick, selectedZone }) {
  // Merge API zone data over the fallback coords
  const enriched = FALLBACK_ZONES.map((fz) => {
    const live = zones.find((z) => z.zoneId === fz.zoneId) || {};
    return { ...fz, ...live };
  });

  return (
    <div className="map-wrap" style={{ height: '440px' }}>
      <MapContainer
        center={DELHI_CENTER}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />

        {enriched.map((zone) => {
          const aqi = zone.currentAQI || null;  // null = not yet loaded; don't fallback to misleading 200
          const aqiColor = getAQIColor(aqi);
          const srcColor = zone.dominantSource ? (SOURCE_COLORS[zone.dominantSource] || '#64748b') : aqiColor;
          const isSelected = selectedZone === zone.zoneId;

          return (
            <CircleMarker
              key={zone.zoneId}
              center={[zone.lat, zone.lng]}
              radius={isSelected ? 22 : 16}
              pathOptions={{
                fillColor: srcColor,
                fillOpacity: isSelected ? 0.9 : 0.72,
                color: isSelected ? '#ffffff' : srcColor,
                weight: isSelected ? 3 : 1.5,
              }}
              eventHandlers={{ click: () => onZoneClick && onZoneClick(zone.zoneId) }}
            >
              <Popup>
                <div style={{ minWidth: 190 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                    {zone.name}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: aqi ? aqiColor : '#64748b', lineHeight: 1 }}>
                    {aqi ? `AQI ${aqi}` : 'AQI —'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.4rem' }}>
                    {aqi ? getAQICategory(aqi) : 'Loading live data…'}
                  </div>
                  {zone.dominantSource && (
                    <div style={{ fontSize: '0.78rem', borderTop: '1px solid #333', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
                      <span style={{ color: srcColor, fontWeight: 600 }}>
                        ● {zone.dominantSource.charAt(0).toUpperCase() + zone.dominantSource.slice(1)}
                      </span>
                      {zone.attributionConfidence && (
                        <span style={{ color: '#888' }}>
                          {' '}({Math.round(zone.attributionConfidence * 100)}% confidence)
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      onClick={() => onZoneClick && onZoneClick(zone.zoneId)}
                      style={{
                        width: '100%', padding: '0.3rem 0.6rem', borderRadius: '6px',
                        background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)',
                        color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      View Forecast & Attribution →
                    </button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* AQI Legend */}
      <div className="map-legend">
        <div style={{ fontWeight: 600, color: '#7b91b0', marginBottom: '0.25rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Source Attribution
        </div>
        {[
          { color: '#ef4444', label: 'Traffic' },
          { color: '#f97316', label: 'Industrial' },
          { color: '#a16207', label: 'Construction' },
          { color: '#64748b', label: 'Unknown/Loading' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="legend-dot" style={{ background: color }} />
            <span style={{ color: '#7b91b0' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
