import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CITY_COLORS = {
  Delhi: '#3b82f6',
  Mumbai: '#10b981',
  Kolkata: '#f59e0b',
};

/**
 * CityCompare — Multi-city AQI historical comparison chart.
 * Props:
 *   cities: [{ name, historicalAQI: [{ date, aqi }], isLive, dataNote }]
 */
export default function CityCompare({ cities = [] }) {
  if (!cities.length) {
    return <div className="loading">Loading city comparison data…</div>;
  }

  // Merge all cities into a single dataset keyed by date
  const dateMap = {};
  cities.forEach((city) => {
    (city.historicalAQI || []).forEach(({ date, aqi }) => {
      if (!dateMap[date]) dateMap[date] = { date };
      dateMap[date][city.name] = aqi;
    });
  });
  const chartData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {cities.map((city) => (
          <div key={city.name} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.5rem 0.75rem',
          }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: CITY_COLORS[city.name] || '#94a3b8', display: 'inline-block' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{city.name}</span>
            {!city.isLive && <span style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(100,116,139,0.2)', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>historical</span>}
            {city.isLive && <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>live</span>}
          </div>
        ))}
      </div>

      <p style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.75rem' }}>
        ⚠️ Delhi shown with live pipeline; other cities use historical CPCB data only (not live forecasting).
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }}
            tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'AQI', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
          {cities.map((city) => (
            <Line key={city.name} type="monotone" dataKey={city.name}
              stroke={CITY_COLORS[city.name] || '#94a3b8'}
              strokeWidth={2} dot={false}
              strokeDasharray={city.isLive ? '0' : '5 3'}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
