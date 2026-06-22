import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';

function formatTimestamp(ts) {
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:00`;
}

/**
 * ForecastChart — AQI forecast with confidence band and persistence baseline comparison.
 * Props:
 *   wardId: string
 *   forecast: [{ timestamp, predictedAQI, confidenceLow, confidenceHigh }]
 *   baselineComparison: { modelRMSE, persistenceRMSE, modelName, improvementPercent }
 */
export default function ForecastChart({ wardId, forecast = [], baselineComparison }) {
  if (!forecast.length) {
    return <div className="loading">Select a zone to see its AQI forecast.</div>;
  }

  const chartData = forecast.map((pt) => ({
    time: formatTimestamp(pt.timestamp),
    aqi: pt.predictedAQI,
    low: pt.confidenceLow,
    high: pt.confidenceHigh,
  }));

  const maxAQI = Math.max(...forecast.map((p) => p.confidenceHigh), 400);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            72-hr AQI Forecast — {wardId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Confidence band shown in blue shading</p>
        </div>

        {baselineComparison && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px', padding: '0.6rem 1rem', textAlign: 'right',
          }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>RMSE vs Baseline</div>
            <div style={{ fontSize: '0.8rem' }}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>Model: {baselineComparison.modelRMSE}</span>
              {' vs '}
              <span style={{ color: '#f97316' }}>Persistence: {baselineComparison.persistenceRMSE}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
              ↓ {baselineComparison.improvementPercent}% better than baseline
            </div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, maxAQI + 50]} />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#f1f5f9' }}
          />
          <ReferenceLine y={200} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Poor', fill: '#f97316', fontSize: 10 }} />
          <ReferenceLine y={300} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'V. Poor', fill: '#ef4444', fontSize: 10 }} />
          <Area type="monotone" dataKey="high" stroke="none" fill="url(#aqiGrad)" />
          <Line type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={2} dot={false} name="Predicted AQI" />
          <Line type="monotone" dataKey="low" stroke="#1e40af" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Lower bound" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
