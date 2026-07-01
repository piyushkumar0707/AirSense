# AirSense — Full Codebase Memory Map

> **Purpose:** Instant reference for any AI assistant or developer. Read this before writing any code. Avoids re-scanning the whole repo.
> **Last updated:** 2026-06-29
> **Workspace root:** `c:/Users/121pi/Desktop/assesment/gen ai hackathon/`

---

## 1. Project Overview

AirSense is a 3-service hackathon application for Delhi air quality intelligence:

| Feature | Weight (Judging) | Status |
|---|---|---|
| **AQI Forecasting** (24-72hr SARIMA) | High – Technical Excellence 20% | ✅ Real SARIMA model on `cpcb_samples.csv` |
| **Source Attribution** (traffic/industrial/construction/biomass) | High | ✅ Weighted scoring model, live OWM data |
| **Enforcement Ranking** | Medium | ✅ Rule-based composite score |
| **City Comparison** (Delhi live, Mumbai/Kolkata historical) | Medium | ✅ Mock data only |
| **Citizen Advisory Chat** (EN + HI) | Medium | ✅ Groq/Gemini LLM |

---

## 2. Services & Ports

| Service | Tech | Port | Entry Point | Start Command |
|---|---|---|---|---|
| **Frontend** | React 18 + Vite | **3000** | `frontend/src/main.jsx` | `npm run dev` in `frontend/` |
| **Backend** | Node.js + Express | **5000** | `backend/src/app.js` | `npm run dev` in `backend/` |
| **ML Service** | Python + FastAPI | **8001** | `ml-service/main.py` | `uvicorn main:app --reload --port 8001` in `ml-service/` |

Vite proxies `/api` → `http://localhost:5000` (see `frontend/vite.config.js`).

---

## 3. Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/airsense
REDIS_URL=redis://localhost:6379
ML_SERVICE_URL=http://localhost:8001
OPENWEATHER_API_KEY=<your_openweather_api_key>
LLM_API_KEY=<your_groq_api_key>
LLM_PROVIDER=Groq
DEMO_MODE=false
NODE_ENV=development
```

### ML Service (`ml-service/.env`)
```
CPCB_DATA_PATH=./data/cpcb_samples.csv
OPENWEATHER_API_KEY=<your_openweather_api_key>
ZONES_METADATA_PATH=./data/zones_metadata.csv
MODEL_PATH=./models/sarima_model.pkl
USE_MOCK_DATA=false
```

### Frontend (no `.env` — uses Vite proxy)
- `VITE_API_BASE_URL` not set → falls back to `/api` (proxied to backend:5000)

**Key flags:**
- `DEMO_MODE=false` → backend calls real ML service (not mock)
- `USE_MOCK_DATA=false` → ML service runs real models (not mock_outputs.json)
- If `DEMO_MODE=true`: backend skips ML call, returns mock data directly
- Redis and MongoDB fail gracefully (non-fatal — app works without them)

---

## 4. Complete File Tree

```
gen ai hackathon/
├── AGENTS.md                    ← Build rules, pitfalls, judging criteria (READ FIRST)
├── PRD.md                       ← Full product spec
├── ARCHITECTURE.md              ← System architecture diagram
├── 00-shared-foundation.md      ← API contract (locked)
├── README.md                    ← Setup instructions
├── docker-compose.yml
│
├── backend/
│   ├── .env                     ← Credentials + config (see §3)
│   ├── package.json             ← deps: express, mongoose, redis, openai, @google/genai, axios
│   └── src/
│       ├── app.js               ← Express app setup, MongoDB connect, route mounting
│       ├── ingest.js            ← Data ingestion script
│       ├── seed.js              ← MongoDB seed script
│       ├── routes/
│       │   ├── forecast.routes.js       ← GET /api/forecast/:wardId
│       │   ├── attribution.routes.js    ← GET /api/attribution/:zoneId
│       │   ├── enforcement.routes.js    ← GET /api/enforcement/priorities?limit=N
│       │   ├── cities.routes.js         ← GET /api/cities/compare?cities=delhi,mumbai
│       │   └── advisory.routes.js       ← POST /api/advisory/chat
│       ├── models/
│       │   ├── Forecast.js              ← Mongoose schema
│       │   ├── Attribution.js           ← Mongoose schema
│       │   ├── EnforcementPriority.js   ← Mongoose schema
│       │   ├── AdvisoryLog.js           ← Mongoose schema
│       │   ├── Reading.js               ← Mongoose schema
│       │   ├── Station.js               ← Mongoose schema
│       │   └── Zone.js                  ← Mongoose schema
│       └── services/
│           ├── ml-client.js     ← axios wrapper for ML service, mock fallback
│           ├── llm-client.js    ← Groq/OpenAI/Gemini advisory generator
│           ├── cache.js         ← Redis read/write (5-min TTL, silent fail)
│           ├── zones.js         ← Loads zones from zones_metadata.csv (or fallback)
│           └── mock-data.js     ← Loads mock_outputs.json
│
├── frontend/
│   ├── vite.config.js           ← Proxy /api → localhost:5000, port 3000
│   ├── package.json             ← deps: react, react-router-dom, leaflet, recharts, axios
│   ├── index.html
│   └── src/
│       ├── main.jsx             ← React entry point
│       ├── App.jsx              ← Router: / → Dashboard, /compare → ComparePage, /advisory → AdvisoryPage
│       ├── index.css            ← All CSS (dark theme, glassmorphism, ~850 lines)
│       ├── constants/
│       │   └── zones.js         ← FALLBACK_ZONES, getAQIColor(), getAQICategory(), SOURCE_COLORS
│       ├── services/
│       │   └── api.js           ← All axios calls (fetchZones, fetchForecast, fetchAttribution, etc.)
│       ├── pages/
│       │   ├── Dashboard.jsx    ← Main page: map + enforcement + forecast/attribution tabs
│       │   ├── ComparePage.jsx  ← Multi-city AQI comparison
│       │   └── AdvisoryPage.jsx ← Citizen health advisory chat
│       └── components/
│           ├── NavBar.jsx
│           ├── MapView.jsx              ← react-leaflet map, zone circles
│           ├── ForecastChart.jsx        ← recharts area chart, RMSE comparison box
│           ├── AttributionPanel.jsx     ← Source breakdown bars + evidence text
│           ├── EnforcementList.jsx      ← Ranked enforcement cards
│           ├── AdvisoryChat.jsx         ← Chat widget (EN/HI)
│           └── CityCompare.jsx          ← Multi-city chart
│
└── ml-service/
    ├── .env                     ← API keys, data paths
    ├── requirements.txt         ← fastapi, uvicorn, pandas, numpy, statsmodels, prophet, xgboost, httpx
    ├── main.py                  ← FastAPI app, /forecast/:wardId, /attribution/:zoneId, /enforcement/priorities
    ├── weather_client.py        ← OWM weather + air quality fetcher, CSV fallback, 10-min in-process cache
    ├── MODEL_NOTES.md
    ├── forecast_vs_actual.png
    ├── data/
    │   ├── zones_metadata.csv           ← CANONICAL zone list (zoneId, name, lat, lng, landUseType, population_estimate, caaqms_station_ref)
    │   ├── cpcb_samples.csv             ← Historical CPCB data (skiprows=6, cols: time, pm10, pm25, no2, so2, co)
    │   ├── cpcb_delhi_cleaned.csv       ← Cleaned version
    │   ├── weather_samples.csv          ← Historical weather (skiprows=3, cols: time, temp, humidity, precip, wcode, wind_dir, wind_speed)
    │   └── mock_outputs.json            ← Fallback mock data (forecast, attribution, enforcement, cities)
    ├── forecasting/
    │   ├── model.py             ← SARIMA(1,1,1)(1,0,1,4) on cpcb_samples.csv; returns forecast + RMSE comparison
    │   └── interpolation.py     ← Spatial interpolation between CAAQMS stations
    ├── attribution/
    │   └── scoring_model.py     ← Weighted scoring: traffic/industrial/construction/biomass_burning; live OWM data
    └── enforcement/
        └── ranking.py           ← Composite score = 0.4*AQI + 0.3*population + 0.3*attribution_confidence
```

---

## 5. API Contract (Locked — do NOT change shapes)

### Backend REST API (all via `http://localhost:5000`)

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/forecast/:wardId` | GET | 72hr forecast + RMSE comparison |
| `GET /api/attribution/:zoneId` | GET | Source attribution breakdown |
| `GET /api/enforcement/priorities?limit=N` | GET | Ranked enforcement zones |
| `GET /api/cities/compare?cities=delhi,mumbai` | GET | Multi-city historical comparison |
| `POST /api/advisory/chat` | POST | LLM health advisory |
| `GET /api/forecast/` | GET | List valid zone IDs |
| `GET /health` | GET | Health check |

### ML Service REST API (all via `http://localhost:8001`)

| Endpoint | Method | Description |
|---|---|---|
| `GET /forecast/:ward_id` | GET | SARIMA forecast for zone |
| `GET /attribution/:zone_id` | GET | Attribution scores for zone |
| `GET /enforcement/priorities?limit=N` | GET | All zones ranked |
| `GET /health` | GET | Health check |

### Key Response Shapes

**Forecast response:**
```json
{
  "wardId": "anand-vihar",
  "generatedAt": "ISO timestamp",
  "forecast": [
    { "timestamp": "ISO", "predictedAQI": 210, "confidenceLow": 190, "confidenceHigh": 232 }
  ],
  "baselineComparison": {
    "modelRMSE": 18.5,
    "persistenceRMSE": 25.2,
    "modelName": "SARIMA-Real",
    "improvementPercent": 26.6
  },
  "dataSource": "real-model"
}
```

**Attribution response:**
```json
{
  "zoneId": "anand-vihar",
  "timestamp": "ISO",
  "currentAQI": 210,
  "sources": [
    { "category": "traffic", "confidence": 0.42, "evidence": "NO2: 60 μg/m³..." },
    { "category": "industrial", "confidence": 0.33, "evidence": "SO2: 35 μg/m³..." },
    { "category": "construction", "confidence": 0.15, "evidence": "PM10:PM2.5 ratio: 2.1" },
    { "category": "biomass_burning", "confidence": 0.10, "evidence": "Seasonal context" }
  ],
  "dominantSource": "traffic",
  "windDirection": "180°",
  "windSpeed": 3.5,
  "weatherDataSource": "live | csv-fallback | cache",
  "aqiSource": "live-owm | csv-fallback"
}
```

**Enforcement priorities response:**
```json
{
  "generatedAt": "ISO",
  "priorities": [
    {
      "zoneId": "anand-vihar",
      "name": "Anand Vihar",
      "score": 0.72,
      "rank": 1,
      "reason": "AQI 310 (Very Poor) with 68% traffic attribution confidence...",
      "evidence": {
        "aqi": 310, "aqiCategory": "Very Poor",
        "population": 48000, "dominantSource": "traffic", "attributionConfidence": 0.68
      }
    }
  ],
  "totalZonesEvaluated": 10,
  "dataSource": "real-model"
}
```

**Advisory chat:**
```json
// Request: POST /api/advisory/chat
{ "location": "anand-vihar", "query": "Is it safe to jog?", "language": "en" }

// Response:
{ "reply": "...", "riskLevel": "low|moderate|high|very-high|severe", "location": "anand-vihar", "currentAQI": 210, "aqiSource": "live-owm|ml-forecast-fallback|fallback" }
```

---

## 6. Canonical Zone List (11 zones)

These are the ONLY valid zone IDs across all services. Never invent new ones.

| zoneId | Name | Land Use | Lat | Lng |
|---|---|---|---|---|
| `anand-vihar` | Anand Vihar | industrial | 28.6469 | 77.3152 |
| `rk-puram` | RK Puram | residential | 28.5651 | 77.1876 |
| `ito` | ITO | commercial | 28.6271 | 77.2421 |
| `dwarka` | Dwarka | residential | 28.5921 | 77.0460 |
| `rohini` | Rohini | residential | 28.7413 | 77.1151 |
| `punjabi-bagh` | Punjabi Bagh | mixed | 28.6714 | 77.1321 |
| `okhla` | Okhla | industrial | 28.5355 | 77.2767 |
| `narela` | Narela | industrial | 28.8561 | 77.0956 |
| `lodhi-road` | Lodhi Road | commercial | 28.5918 | 77.2216 |
| `wazirpur` | Wazirpur | industrial | 28.7108 | 77.1721 |
| `mandir-marg` | Mandir Marg | commercial | 28.6358 | 77.2010 |

> **Note:** `mandir-marg` is in ML + frontend FALLBACK_ZONES but NOT in backend fallback. `narela`, `lodhi-road`, `wazirpur` are in backend fallback but NOT in frontend FALLBACK_ZONES. Canonical source: `ml-service/data/zones_metadata.csv`.

---

## 7. Key Implementation Details

### ML Service

**Forecasting model** (`forecasting/model.py`):
- Reads `cpcb_samples.csv` (skiprows=6), resamples to 6-hourly, fits SARIMAX(1,1,1)(1,0,1,4)
- Forecasts 7 steps (= 42hrs). Uses last 28 periods for RMSE calculation
- Results cached in `_model_cache` dict (process lifetime — shared across all zone requests)
- Adds deterministic zone offset via MD5 hash of wardId to simulate spatial variability
- Falls back to random noise around AQI=250 if model fails

**Attribution model** (`attribution/scoring_model.py`):
- Fetches live pollutants via `weather_client.get_air_quality(lat, lon)` (OWM Air Pollution API)
- Applies deterministic zone offset (MD5 hash) to simulate zone-level variability
- Scoring: traffic = f(NO2, CO, peak_hour); industrial = f(SO2, CO, land_use); construction = f(PM10/PM2.5 ratio); biomass = seasonal
- All scores normalized to sum=1.0
- Falls back to `cpcb_samples.csv` if OWM unavailable

**Enforcement ranking** (`enforcement/ranking.py`):
- Calls `get_attribution()` for every zone
- Score = 0.4×(AQI/500) + 0.3×(pop/max_pop) + 0.3×attribution_confidence
- Generates action text per dominant source (specific, not generic)

**Weather client** (`weather_client.py`):
- In-process cache (10 min TTL)
- Fallback chain: live OWM → `weather_samples.csv` → hardcoded defaults
- Never raises an exception

### Backend

**Data flow per request:**
1. Validate zone ID (`services/zones.js`, loaded from `zones_metadata.csv`)
2. Check Redis cache (5-min TTL)
3. Call ML service (axios, 10s timeout)
4. On ML failure: use `mock_outputs.json` mock data
5. Cache result in Redis (best-effort)
6. Persist to MongoDB (best-effort, non-fatal)

**LLM integration** (`services/llm-client.js`):
- `LLM_PROVIDER=Groq` → OpenAI SDK with Groq baseURL
- Model: `llama3-8b-8192`
- Supports: `groq`, `gemini`, `openai` via env var
- Falls back to static template if no LLM configured

### Frontend

**Route structure:**
- `/` → `Dashboard.jsx` (map, forecast, attribution, enforcement)
- `/compare` → `ComparePage.jsx` (multi-city chart)
- `/advisory` → `AdvisoryPage.jsx` (citizen health chat)

**Dashboard data flow:**
1. Mount: load zones + enforcement priorities
2. Zone select: fetch forecast + attribution (parallel)
3. Enriches zones with enforcement data for map coloring
4. Two right-panel tabs: Forecast | Attribution

**Key CSS classes** (`index.css`, dark theme):
- `.card`, `.card-title`, `.card-title-icon`
- `.dashboard-grid`, `.dashboard-left`, `.dashboard-right`
- `.stat-row`, `.stat-tile`, `.stat-label`, `.stat-value`, `.stat-sub`
- `.btn`, `.btn-ghost` (`.active` modifier), `.zone-btn`, `.zone-selector`
- `.rmse-box`, `.rmse-label`, `.rmse-model`, `.rmse-baseline`, `.rmse-badge`
- `.tag`, `.tag-muted`, `.tag-amber`, `.tag-green`
- `.skeleton`, `.empty-state`, `.empty-state-icon`
- `.section-header`, `.section-sub`

---

## 8. Data Files

| File | Format | Size | Used By |
|---|---|---|---|
| `ml-service/data/zones_metadata.csv` | CSV | 748B | Backend zones.js, ML attribution, ML enforcement |
| `ml-service/data/cpcb_samples.csv` | CSV (skiprows=6) | 107KB | ML forecasting (SARIMA), ML attribution fallback |
| `ml-service/data/cpcb_delhi_cleaned.csv` | CSV | 148KB | Unused currently |
| `ml-service/data/weather_samples.csv` | CSV (skiprows=3) | 89KB | ML weather_client fallback |
| `ml-service/data/mock_outputs.json` | JSON | 13.6KB | Backend mock fallback |

**zones_metadata.csv columns:** `zoneId, name, lat, lng, landUseType, population_estimate, caaqms_station_ref`
**cpcb_samples.csv columns (after skiprows=6):** `time, pm10, pm25, no2, so2, co`
**weather_samples.csv columns (after skiprows=3):** `time, temp, humidity, precip, wcode, wind_dir, wind_speed`

---

## 9. Known Issues / Gaps

1. **Zone list inconsistency:** `mandir-marg` missing from backend fallback; `narela/lodhi-road/wazirpur` missing from frontend FALLBACK_ZONES. Always use `zones_metadata.csv` as canonical source.

2. **`/api/zones` endpoint missing:** Frontend `fetchZones()` calls `/api/zones` which doesn't exist — silently falls back to `FALLBACK_ZONES` constant. No backend route for this.

3. **SARIMA cache is model-level:** All zones share the same trained model + a deterministic ward offset. Not truly zone-specific forecasting.

4. **Attribution indentation bug:** In `scoring_model.py`, `get_attribution()` only returns a result inside the `if zone_meta is None:` block (indentation error). Works in current usage because `zone_meta` is always passed as `None` from `main.py`.

5. **City comparison is mock-only:** `cities.routes.js` uses `getMockData()` — not a real pipeline.

6. **Prophet + XGBoost installed but not used** — only SARIMAX active in forecasting.

7. **Redis + MongoDB optional** — both fail gracefully; app works without them.

---

## 10. Demo Mode

Set `DEMO_MODE=true` in `backend/.env`:
- Backend skips all ML calls, returns `mock_outputs.json` data directly
- No dependency on ML service or OWM API
- Ideal for offline demo / judging fallback

Current config: `DEMO_MODE=false` (real data mode).

---

## 11. Quick Commands

```powershell
# Start all 3 services (run in separate terminals)
cd "c:\Users\121pi\Desktop\assesment\gen ai hackathon\frontend" ; npm run dev
cd "c:\Users\121pi\Desktop\assesment\gen ai hackathon\backend" ; npm run dev
cd "c:\Users\121pi\Desktop\assesment\gen ai hackathon\ml-service" ; python -m uvicorn main:app --reload --port 8001

# Health checks
curl http://localhost:3000           # Frontend (browser)
curl http://localhost:5000/health    # Backend
curl http://localhost:8001/health    # ML service

# Test key endpoints
curl http://localhost:5000/api/forecast/anand-vihar
curl http://localhost:5000/api/attribution/anand-vihar
curl http://localhost:5000/api/enforcement/priorities
curl "http://localhost:5000/api/cities/compare?cities=delhi,mumbai"
```
