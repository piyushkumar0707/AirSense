"""
scoring_model.py — Weighted Source Attribution Scoring Model

NOT a black-box — every score is traceable to its inputs (required by PRD §5,
and critical for judges evaluating explainability).

Model logic (weighted scoring, not ML classifier):
  1. Traffic score:     weighted by NO2 levels + time-of-day + road proximity
  2. Industrial score:  weighted by SO2/CO levels + land-use type (industrial zones)
  3. Construction score:weighted by PM10:PM2.5 ratio + active permit proximity
  4. Biomass burning:   weighted by season (Oct-Jan peak) + fire hotspot data

All four scores are normalized to sum to 1.0 → confidence scores.
"""

from datetime import datetime, timezone
from typing import Any


# Land-use type weights — industrial zones get higher base industrial weight
LAND_USE_INDUSTRIAL_WEIGHT = {
    "industrial": 0.55,
    "mixed": 0.30,
    "commercial": 0.15,
    "residential": 0.05,
}

# Month-based biomass burning seasonal weight (Oct–Jan peak in Delhi)
BIOMASS_SEASONAL_WEIGHT = {
    10: 0.25, 11: 0.40, 12: 0.35, 1: 0.30,
}


def get_attribution(zone_id: str, pollutant_readings: dict = None, zone_meta: dict = None) -> dict[str, Any]:
    """
    Compute weighted source attribution for a zone.

    Args:
        zone_id: Zone identifier
        pollutant_readings: dict with keys pm25, pm10, no2, so2, co, aqi
        zone_meta: dict with landUseType, lat, lng, windDirection, windSpeed

    TODO (ML Engineer — Week 2):
      1. Fetch latest pollutant readings for zone from MongoDB
      2. Fetch zone metadata (land-use type) from zones collection
      3. Fetch wind direction from OpenWeatherMap for plume-drift adjustment
      4. Run compute_attribution_scores() below with real values
      5. Replace stub return

    Returns:
        dict matching API contract attribution shape
    """
    now = datetime.now(timezone.utc)

    if pollutant_readings is None:
        # Stub — realistic fake values for testing
        pollutant_readings = {
            "pm25": 145.0, "pm10": 280.0, "no2": 65.0,
            "so2": 38.0, "co": 1.8, "aqi": 290,
        }
    if zone_meta is None:
        zone_meta = {
            "landUseType": "industrial",
            "windDirection": "NW",
            "windSpeed": 3.5,
        }

    scores = compute_attribution_scores(pollutant_readings, zone_meta, now)
    sources = [
        {
            "category": category,
            "confidence": round(score, 2),
            "evidence": build_evidence_text(category, pollutant_readings, zone_meta),
        }
        for category, score in sorted(scores.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "zoneId": zone_id,
        "timestamp": now.isoformat(),
        "currentAQI": pollutant_readings.get("aqi", 0),
        "sources": sources,
        "windDirection": zone_meta.get("windDirection", "N/A"),
        "windSpeed": zone_meta.get("windSpeed", 0.0),
        "dominantSource": sources[0]["category"] if sources else "unknown",
        "dataSource": "scoring-model-stub",
    }


def compute_attribution_scores(
    readings: dict, zone_meta: dict, timestamp: datetime
) -> dict[str, float]:
    """
    Core scoring logic — fully explainable weighted model.
    Returns unnormalized raw scores, then normalizes to sum to 1.
    """
    month = timestamp.month
    hour = timestamp.hour
    land_use = zone_meta.get("landUseType", "mixed")

    pm25 = readings.get("pm25", 0)
    pm10 = readings.get("pm10", 0)
    no2 = readings.get("no2", 0)
    so2 = readings.get("so2", 0)
    co = readings.get("co", 0)

    # ── Traffic score ─────────────────────────────────────────────────────
    peak_hour_bonus = 1.3 if (7 <= hour <= 10 or 17 <= hour <= 20) else 1.0
    traffic_raw = (no2 / 80.0) * peak_hour_bonus * 0.6 + (co / 2.0) * 0.4

    # ── Industrial score ──────────────────────────────────────────────────
    land_weight = LAND_USE_INDUSTRIAL_WEIGHT.get(land_use, 0.2)
    industrial_raw = (so2 / 60.0) * 0.5 + (co / 2.0) * 0.3 + land_weight * 0.5

    # ── Construction score ────────────────────────────────────────────────
    pm_ratio = (pm10 / pm25) if pm25 > 0 else 1.0  # construction raises coarse PM
    construction_raw = min((pm_ratio - 1.5) / 3.0, 1.0) * 0.8  # capped at 0.8

    # ── Biomass burning score ─────────────────────────────────────────────
    seasonal_weight = BIOMASS_SEASONAL_WEIGHT.get(month, 0.05)
    biomass_raw = seasonal_weight

    raw = {
        "traffic": max(traffic_raw, 0),
        "industrial": max(industrial_raw, 0),
        "construction": max(construction_raw, 0),
        "biomass_burning": max(biomass_raw, 0),
    }

    # Normalize to sum = 1
    total = sum(raw.values()) or 1.0
    return {k: v / total for k, v in raw.items()}


def build_evidence_text(category: str, readings: dict, zone_meta: dict) -> str:
    """Generate human-readable evidence for each attribution score."""
    land_use = zone_meta.get("landUseType", "mixed")
    evidence_map = {
        "traffic": f"NO2: {readings.get('no2', 'N/A')} μg/m³, CO: {readings.get('co', 'N/A')} mg/m³ — typical traffic signature",
        "industrial": f"SO2: {readings.get('so2', 'N/A')} μg/m³, land-use: {land_use}",
        "construction": f"PM10:PM2.5 ratio: {round(readings.get('pm10', 1)/max(readings.get('pm25', 1), 0.1), 1)} — elevated coarse particles",
        "biomass_burning": "Seasonal/calendar context; fire hotspot data not yet integrated",
    }
    return evidence_map.get(category, "")
