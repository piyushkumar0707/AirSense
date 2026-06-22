require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Station = require('./models/Station');
const Reading = require('./models/Reading');
const { zones } = require('./services/zones');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/airsense';
const AQI_CSV_PATH = process.env.CPCB_CSV_PATH || path.join(__dirname, '../../ml-service/data/cpcb_delhi_cleaned.csv');

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function readCsv(csvPath) {
  if (!fs.existsSync(csvPath)) {
    return [];
  }

  const lines = fs.readFileSync(csvPath, 'utf-8').trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const row = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, row[index]]));
  });
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function ensureStations() {
  for (const zone of zones) {
    await Station.findOneAndUpdate(
      { stationId: zone.caaqmsStationRef },
      {
        stationId: zone.caaqmsStationRef,
        name: `${zone.name} CAAQMS`,
        lat: zone.lat,
        lng: zone.lng,
        city: zone.city,
      },
      { upsert: true, new: true, runValidators: true }
    );
  }
}

async function ingestReadings() {
  const rows = readCsv(AQI_CSV_PATH);
  if (!rows.length) {
    console.log(`[INGEST] No CPCB CSV found at ${AQI_CSV_PATH}. Run npm run seed for demo data.`);
    return 0;
  }

  let count = 0;
  for (const row of rows) {
    const stationId = row.stationId || row.station_id || row.caaqms_station_ref;
    const timestamp = row.timestamp ? new Date(row.timestamp) : null;
    const aqi = toNumber(row.aqi);

    if (!stationId || !timestamp || Number.isNaN(timestamp.getTime()) || aqi === undefined) {
      continue;
    }

    await Reading.findOneAndUpdate(
      { stationId, timestamp },
      {
        stationId,
        timestamp,
        pm25: toNumber(row.pm25),
        pm10: toNumber(row.pm10),
        no2: toNumber(row.no2),
        so2: toNumber(row.so2),
        co: toNumber(row.co),
        aqi,
      },
      { upsert: true, new: true, runValidators: true }
    );
    count += 1;
  }

  return count;
}

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`[INGEST] Connected to ${MONGO_URI}`);

  await ensureStations();
  const readings = await ingestReadings();
  console.log(`[INGEST] Upserted ${readings} readings`);
}

main()
  .catch((err) => {
    console.error('[INGEST] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
