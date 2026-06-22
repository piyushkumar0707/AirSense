"""
model.py — AQI Forecasting Model (SARIMA / Prophet / XGBoost)

Build order (per AGENTS.md):
  1. SARIMA/Prophet baseline first — validate RMSE vs persistence baseline
  2. Only upgrade to XGBoost if it measurably beats baseline AND there's time

RMSE vs persistence baseline MUST be computed and returned — this is the key
judging metric (Technical Excellence, 20% weight).
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).parent.parent / "data"
ZONES_CSV = DATA_PATH / "zones_metadata.csv"


def get_forecast(ward_id: str) -> dict[str, Any]:
    """
    Generate a 24-72hr AQI forecast for the given ward.

    TODO (ML Engineer — Week 2):
      1. Load historical readings for ward_id from MongoDB/CSV
      2. Fit SARIMA model on historical AQI
      3. Generate forecast for next 72hrs (6-hr intervals)
      4. Compute RMSE of this model vs persistence baseline on validation set
      5. Return the full result dict

    Returns:
        dict matching the API contract from 00-shared-foundation.md
    """
    # ── STUB IMPLEMENTATION — replace in Week 2 ──────────────────────────────
    # Generates a plausible random walk forecast for testing purposes
    base_aqi = np.random.randint(180, 340)
    forecast_points = []
    now = datetime.now(timezone.utc)

    for i in range(7):  # 7 points × 6hrs = 42hrs ≈ 48hr forecast
        ts = now + timedelta(hours=i * 6)
        noise = np.random.normal(0, 15)
        predicted = int(np.clip(base_aqi + noise + i * 2, 50, 500))
        forecast_points.append({
            "timestamp": ts.isoformat(),
            "predictedAQI": predicted,
            "confidenceLow": max(50, predicted - 28),
            "confidenceHigh": min(500, predicted + 28),
        })

    # Stub RMSE values — MUST be replaced with real computed values in Week 2
    model_rmse = round(np.random.uniform(15, 22), 1)
    persistence_rmse = round(model_rmse * np.random.uniform(1.2, 1.4), 1)

    return {
        "wardId": ward_id,
        "generatedAt": now.isoformat(),
        "forecast": forecast_points,
        "baselineComparison": {
            "modelRMSE": model_rmse,
            "persistenceRMSE": persistence_rmse,
            "modelName": "SARIMA-stub",
            "improvementPercent": round((1 - model_rmse / persistence_rmse) * 100, 1),
        },
        "dataSource": "stub-model",
    }


def compute_persistence_rmse(actual: list[float], n_steps_ahead: int = 1) -> float:
    """
    Compute RMSE for the persistence baseline (predict next = current).
    Always compute this alongside your model — required for judging.
    """
    if len(actual) < n_steps_ahead + 1:
        return float("nan")
    y_true = actual[n_steps_ahead:]
    y_pred = actual[: len(actual) - n_steps_ahead]
    return float(np.sqrt(np.mean((np.array(y_true) - np.array(y_pred)) ** 2)))
