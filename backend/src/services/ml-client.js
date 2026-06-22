/**
 * ml-client.js
 * Axios wrapper for calling the Python ML microservice.
 * Falls back to mock_outputs.json if ML service is unavailable OR DEMO_MODE=true.
 */

const axios = require('axios');
const { getMockData } = require('./mock-data');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
const DEMO_MODE = process.env.DEMO_MODE === 'true';

/**
 * Generic ML service caller with mock fallback.
 * @param {string} endpoint - e.g. '/forecast/anand-vihar'
 * @param {string} method - 'get' | 'post'
 * @param {object} data - POST body (optional)
 */
async function callML(endpoint, method = 'get', data = null) {
  if (DEMO_MODE) {
    console.log(`[DEMO_MODE] Returning mock data for ${endpoint}`);
    return getMockResponse(endpoint);
  }

  try {
    const url = `${ML_SERVICE_URL}${endpoint}`;
    const response = await axios({ method, url, data, timeout: 10000 });
    return response.data;
  } catch (err) {
    console.warn(`[ML CLIENT] ML service unavailable (${err.message}), falling back to mock data`);
    const mockResponse = getMockResponse(endpoint);
    if (mockResponse) {
      return { ...mockResponse, dataFreshness: 'stale' };
    }
    throw new Error('ML service down and no mock data available for this endpoint');
  }
}

/**
 * Parse the endpoint path and return the relevant mock data slice.
 */
function getMockResponse(endpoint) {
  const mockData = getMockData();
  if (!mockData) return null;

  // /forecast/:wardId
  const forecastMatch = endpoint.match(/^\/forecast\/(.+)$/);
  if (forecastMatch) {
    const wardId = forecastMatch[1];
    return mockData.forecast[wardId] || Object.values(mockData.forecast)[0];
  }

  // /attribution/:zoneId
  const attributionMatch = endpoint.match(/^\/attribution\/(.+)$/);
  if (attributionMatch) {
    const zoneId = attributionMatch[1];
    return mockData.attribution[zoneId] || Object.values(mockData.attribution)[0];
  }

  // /enforcement/priorities
  if (endpoint.startsWith('/enforcement')) {
    return mockData.enforcement;
  }

  return null;
}

module.exports = { callML };
