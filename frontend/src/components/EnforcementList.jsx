import React from 'react';

const SOURCE_ICONS = {
  traffic: '🚗',
  industrial: '🏭',
  construction: '🏗️',
  biomass_burning: '🔥',
};

const SOURCE_COLORS = {
  traffic: '#3b82f6',
  industrial: '#f97316',
  construction: '#f59e0b',
  biomass_burning: '#ef4444',
};

function getRiskBadgeStyle(score) {
  if (score >= 0.85) return { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' };
  if (score >= 0.70) return { background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' };
  return { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' };
}

/**
 * EnforcementList — Ranked enforcement priority cards.
 * Props:
 *   priorities: [{ zoneId, name, score, rank, reason, evidence }]
 */
export default function EnforcementList({ priorities = [] }) {
  if (!priorities.length) {
    return <div className="loading">Loading enforcement priorities…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {priorities.map((item) => (
        <div key={item.zoneId} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {/* Rank badge */}
          <div style={{
            minWidth: '36px', height: '36px', borderRadius: '50%',
            background: item.rank <= 2 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem',
            color: item.rank <= 2 ? '#ef4444' : '#3b82f6',
            flexShrink: 0,
          }}>
            #{item.rank}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.name}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Priority score */}
                <span style={{ ...getRiskBadgeStyle(item.score), fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 600 }}>
                  Score: {Math.round(item.score * 100)}
                </span>
                {/* AQI badge */}
                <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 600 }}>
                  AQI {item.evidence?.aqi} — {item.evidence?.aqiCategory}
                </span>
                {/* Dominant source */}
                {item.evidence?.dominantSource && (
                  <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                    {SOURCE_ICONS[item.evidence.dominantSource]} {item.evidence.dominantSource}
                  </span>
                )}
              </div>
            </div>

            {/* Reason text */}
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              {item.reason}
            </p>

            {/* Evidence row */}
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
              <span>👥 {item.evidence?.population?.toLocaleString()} residents</span>
              <span>🎯 Attribution: {Math.round((item.evidence?.attributionConfidence || 0) * 100)}% confidence</span>
              {item.evidence?.keyPollutant && (
                <span>⚠️ {item.evidence.keyPollutant}: {item.evidence.keyPollutantValue}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
