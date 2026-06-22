"""
ranking.py — Enforcement Priority Ranking

Combines attribution output + AQI severity + population exposure into a
weighted score for ranking zones by enforcement priority.

Formula: score = (aqi_weight * aqi_score) + (pop_weight * pop_score) + (attr_weight * attr_confidence)
where weights sum to 1.0.

This reuses attribution engine output — NOT a separate ML model (per AGENTS.md §5).
"""

from datetime import datetime, timezone
from typing import Any

# Zone population reference (from zones_metadata.csv)
ZONE_POPULATION = {
    "anand-vihar": 48000, "rk-puram": 62000, "ito": 35000,
    "dwarka": 85000, "rohini": 92000, "punjabi-bagh": 54000,
    "okhla": 41000, "narela": 28000, "lodhi-road": 22000,
    "wazirpur": 33000,
}

# Weighting for the composite score
WEIGHTS = {
    "aqi": 0.40,       # Higher AQI → higher priority
    "population": 0.30, # More people exposed → higher priority
    "attribution": 0.30, # Higher attribution confidence → more certain enforcement target
}

MAX_POPULATION = max(ZONE_POPULATION.values())  # for normalization


def aqi_to_category(aqi: int) -> str:
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"


def compute_zone_score(aqi: int, population: int, attribution_confidence: float) -> float:
    """Compute normalized composite enforcement priority score [0, 1]."""
    aqi_score = min(aqi / 500.0, 1.0)
    pop_score = population / MAX_POPULATION
    attr_score = attribution_confidence
    return round(
        WEIGHTS["aqi"] * aqi_score
        + WEIGHTS["population"] * pop_score
        + WEIGHTS["attribution"] * attr_score,
        3,
    )


def get_enforcement_priorities(limit: int = 10) -> dict[str, Any]:
    """
    Rank all zones by enforcement priority.

    TODO (ML Engineer — Week 2):
      1. For each zone, fetch latest attribution output from MongoDB
      2. For each zone, fetch latest AQI reading from MongoDB
      3. Call compute_zone_score() with real values
      4. Build reason text from real attribution data
      5. Return sorted list

    Returns:
        dict matching API contract enforcement shape
    """
    now = datetime.now(timezone.utc)

    # Stub zone data — replace with real DB reads in Week 2
    zone_stubs = [
        {"zoneId": "okhla", "aqi": 378, "dominantSource": "industrial", "confidence": 0.62},
        {"zoneId": "anand-vihar", "aqi": 320, "dominantSource": "traffic", "confidence": 0.58},
        {"zoneId": "narela", "aqi": 295, "dominantSource": "industrial", "confidence": 0.51},
        {"zoneId": "wazirpur", "aqi": 268, "dominantSource": "industrial", "confidence": 0.49},
        {"zoneId": "rohini", "aqi": 245, "dominantSource": "traffic", "confidence": 0.52},
        {"zoneId": "punjabi-bagh", "aqi": 232, "dominantSource": "traffic", "confidence": 0.45},
        {"zoneId": "rk-puram", "aqi": 198, "dominantSource": "traffic", "confidence": 0.65},
        {"zoneId": "ito", "aqi": 185, "dominantSource": "traffic", "confidence": 0.48},
        {"zoneId": "dwarka", "aqi": 172, "dominantSource": "construction", "confidence": 0.38},
        {"zoneId": "lodhi-road", "aqi": 145, "dominantSource": "traffic", "confidence": 0.42},
    ]

    priorities = []
    for i, zone in enumerate(zone_stubs):
        pop = ZONE_POPULATION.get(zone["zoneId"], 10000)
        score = compute_zone_score(zone["aqi"], pop, zone["confidence"])
        reason = build_reason_text(zone["zoneId"], zone["aqi"], pop, zone["dominantSource"], zone["confidence"])
        priorities.append({
            "zoneId": zone["zoneId"],
            "name": zone["zoneId"].replace("-", " ").title(),
            "score": score,
            "rank": i + 1,
            "reason": reason,
            "evidence": {
                "aqi": zone["aqi"],
                "aqiCategory": aqi_to_category(zone["aqi"]),
                "population": pop,
                "dominantSource": zone["dominantSource"],
                "attributionConfidence": zone["confidence"],
            },
        })

    # Sort by score descending and re-rank
    priorities.sort(key=lambda x: x["score"], reverse=True)
    for i, p in enumerate(priorities):
        p["rank"] = i + 1

    return {
        "generatedAt": now.isoformat(),
        "priorities": priorities[:limit],
        "totalZonesEvaluated": len(zone_stubs),
        "dataSource": "stub-model",
    }


def build_reason_text(zone_id: str, aqi: int, population: int, dominant_source: str, confidence: float) -> str:
    cat = aqi_to_category(aqi)
    return (
        f"AQI {aqi} ({cat}) with {round(confidence * 100)}% {dominant_source} attribution confidence. "
        f"~{population:,} residents exposed. "
        f"Enforcement action targeting {dominant_source} sources recommended."
    )
