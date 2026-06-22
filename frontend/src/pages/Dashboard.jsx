import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapView from '../components/MapView.jsx';
import ForecastChart from '../components/ForecastChart.jsx';
import EnforcementList from '../components/EnforcementList.jsx';
import CityCompare from '../components/CityCompare.jsx';
import AdvisoryChat from '../components/AdvisoryChat.jsx';

// Static zone reference (from zones_metadata.csv — keep in sync)
const ZONE_LIST = [
  { zoneId: 'anand-vihar', name: 'Anand Vihar', currentAQI: 320, dominantSource: 'traffic', attributionConfidence: 0.58 },
  { zoneId: 'rk-puram', name: 'RK Puram', currentAQI: 198, dominantSource: 'traffic', attributionConfidence: 0.65 },
  { zoneId: 'ito', name: 'ITO', currentAQI: 185, dominantSource: 'traffic', attributionConfidence: 0.48 },
  { zoneId: 'dwarka', name: 'Dwarka', currentAQI: 172, dominantSource: 'construction', attributionConfidence: 0.38 },
  { zoneId: 'rohini', name: 'Rohini', currentAQI: 245, dominantSource: 'traffic', attributionConfidence: 0.52 },
  { zoneId: 'punjabi-bagh', name: 'Punjabi Bagh', currentAQI: 232, dominantSource: 'traffic', attributionConfidence: 0.45 },
  { zoneId: 'okhla', name: 'Okhla', currentAQI: 378, dominantSource: 'industrial', attributionConfidence: 0.62 },
  { zoneId: 'narela', name: 'Narela', currentAQI: 295, dominantSource: 'industrial', attributionConfidence: 0.51 },
  { zoneId: 'lodhi-road', name: 'Lodhi Road', currentAQI: 145, dominantSource: 'traffic', attributionConfidence: 0.42 },
  { zoneId: 'wazirpur', name: 'Wazirpur', currentAQI: 268, dominantSource: 'industrial', attributionConfidence: 0.49 },
];

const TABS = ['map', 'enforcement', 'cities', 'advisory'];
const TAB_LABELS = { map: '🗺️ Map & Forecast', enforcement: '🚨 Enforcement', cities: '🌆 Multi-City', advisory: '💬 Advisory' };

export default function Dashboard({ tab: propTab }) {
  const [activeTab, setActiveTab] = useState(propTab || 'map');
  const [selectedZone, setSelectedZone] = useState('anand-vihar');
  const [forecastData, setForecastData] = useState(null);
  const [attributionData, setAttributionData] = useState(null);
  const [enforcementData, setEnforcementData] = useState(null);
  const [citiesData, setCitiesData] = useState(null);
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  // Load forecast + attribution when zone selected
  useEffect(() => {
    if (activeTab !== 'map') return;
    fetchForecast(selectedZone);
    fetchAttribution(selectedZone);
  }, [selectedZone, activeTab]);

  useEffect(() => {
    if (activeTab === 'enforcement' && !enforcementData) fetchEnforcement();
    if (activeTab === 'cities' && !citiesData) fetchCities();
  }, [activeTab]);

  async function fetchForecast(wardId) {
    setLoading((l) => ({ ...l, forecast: true }));
    try {
      const { data } = await axios.get(`/api/forecast/${wardId}`);
      setForecastData(data);
      setErrors((e) => ({ ...e, forecast: null }));
    } catch (err) {
      setErrors((e) => ({ ...e, forecast: err.message }));
    } finally {
      setLoading((l) => ({ ...l, forecast: false }));
    }
  }

  async function fetchAttribution(zoneId) {
    setLoading((l) => ({ ...l, attribution: true }));
    try {
      const { data } = await axios.get(`/api/attribution/${zoneId}`);
      setAttributionData(data);
      setErrors((e) => ({ ...e, attribution: null }));
    } catch (err) {
      setErrors((e) => ({ ...e, attribution: err.message }));
    } finally {
      setLoading((l) => ({ ...l, attribution: false }));
    }
  }

  async function fetchEnforcement() {
    setLoading((l) => ({ ...l, enforcement: true }));
    try {
      const { data } = await axios.get('/api/enforcement/priorities?limit=10');
      setEnforcementData(data);
    } catch (err) {
      setErrors((e) => ({ ...e, enforcement: err.message }));
    } finally {
      setLoading((l) => ({ ...l, enforcement: false }));
    }
  }

  async function fetchCities() {
    setLoading((l) => ({ ...l, cities: true }));
    try {
      const { data } = await axios.get('/api/cities/compare?cities=delhi,mumbai,kolkata');
      setCitiesData(data);
    } catch (err) {
      setErrors((e) => ({ ...e, cities: err.message }));
    } finally {
      setLoading((l) => ({ ...l, cities: false }));
    }
  }

  return (
    <div>
      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500,
              background: activeTab === tab ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: activeTab === tab ? '#3b82f6' : '#64748b',
              border: activeTab === tab ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Map + Forecast Tab */}
      {activeTab === 'map' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="card">
              <p className="card-title">Delhi AQI Map — Click a zone to drill in</p>
              <MapView zones={ZONE_LIST} onZoneClick={setSelectedZone} selectedZone={selectedZone} />
            </div>
          </div>

          {/* Forecast */}
          <div className="card">
            <p className="card-title">AQI Forecast</p>
            {loading.forecast && <div className="loading">Loading forecast…</div>}
            {errors.forecast && <div className="error-msg">Forecast error: {errors.forecast}</div>}
            {forecastData && !loading.forecast && (
              <ForecastChart
                wardId={forecastData.wardId}
                forecast={forecastData.forecast}
                baselineComparison={forecastData.baselineComparison}
              />
            )}
          </div>

          {/* Attribution */}
          <div className="card">
            <p className="card-title">Source Attribution — {selectedZone.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
            {loading.attribution && <div className="loading">Loading attribution…</div>}
            {errors.attribution && <div className="error-msg">{errors.attribution}</div>}
            {attributionData && !loading.attribution && (
              <div>
                {attributionData.sources?.map((src) => (
                  <div key={src.category} style={{ marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{src.category.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3b82f6' }}>{Math.round(src.confidence * 100)}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${src.confidence * 100}%`, background: '#3b82f6', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                    {src.evidence && <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>{src.evidence}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enforcement Tab */}
      {activeTab === 'enforcement' && (
        <div className="card">
          <p className="card-title">Enforcement Priority List — {new Date().toLocaleDateString()}</p>
          {loading.enforcement && <div className="loading">Calculating priorities…</div>}
          {errors.enforcement && <div className="error-msg">{errors.enforcement}</div>}
          <EnforcementList priorities={enforcementData?.priorities || []} />
        </div>
      )}

      {/* Multi-City Tab */}
      {activeTab === 'cities' && (
        <div className="card">
          <p className="card-title">Multi-City AQI Comparison</p>
          {loading.cities && <div className="loading">Loading city data…</div>}
          {errors.cities && <div className="error-msg">{errors.cities}</div>}
          <CityCompare cities={citiesData?.cities || []} />
        </div>
      )}

      {/* Advisory Tab */}
      {activeTab === 'advisory' && (
        <div className="card">
          <p className="card-title">Citizen Health Advisory Chat 💬</p>
          <AdvisoryChat />
        </div>
      )}
    </div>
  );
}
