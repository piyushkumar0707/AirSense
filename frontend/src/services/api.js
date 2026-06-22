/**
 * api.js — All axios API calls, centralized.
 * Base URL driven by VITE_API_BASE_URL env var (falls back to /api via Vite proxy).
 */

import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({ baseURL: BASE, timeout: 15000 });

// ── Zones ─────────────────────────────────────────────────────────────────────
export async function fetchZones() {
  const { data } = await api.get("/zones");
  return data;
}

// ── Forecast ──────────────────────────────────────────────────────────────────
export async function fetchForecast(wardId) {
  const { data } = await api.get(`/forecast/${wardId}`);
  return data;
}

// ── Attribution ───────────────────────────────────────────────────────────────
export async function fetchAttribution(zoneId) {
  const { data } = await api.get(`/attribution/${zoneId}`);
  return data;
}

// ── Enforcement ───────────────────────────────────────────────────────────────
export async function fetchEnforcementPriorities(limit = 10) {
  const { data } = await api.get(`/enforcement/priorities?limit=${limit}`);
  return data;
}

// ── Cities comparison ─────────────────────────────────────────────────────────
export async function fetchCitiesCompare(cities = ["delhi", "mumbai", "kolkata"]) {
  const { data } = await api.get(`/cities/compare?cities=${cities.join(",")}`);
  return data;
}

// ── Advisory chat ─────────────────────────────────────────────────────────────
export async function postAdvisoryChat({ location, query, language }) {
  const { data } = await api.post("/advisory/chat", { location, query, language });
  return data;
}
