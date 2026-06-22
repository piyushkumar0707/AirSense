/**
 * attribution.routes.js
 * GET /api/attribution/:zoneId
 * Returns source attribution breakdown for a zone (traffic/industrial/construction/biomass_burning).
 */

const express = require('express');
const router = express.Router();
const { callML } = require('../services/ml-client');
const { getCache, setCache } = require('../services/cache');
const Attribution = require('../models/Attribution');

const VALID_ZONES = [
  'anand-vihar', 'rk-puram', 'ito', 'dwarka', 'rohini',
  'punjabi-bagh', 'okhla', 'narela', 'lodhi-road', 'wazirpur',
];

/**
 * GET /api/attribution/:zoneId
 */
router.get('/:zoneId', async (req, res) => {
  const { zoneId } = req.params;

  if (!VALID_ZONES.includes(zoneId)) {
    return res.status(400).json({
      error: 'Invalid zone ID',
      message: `zoneId "${zoneId}" not found. Valid zones: ${VALID_ZONES.join(', ')}`,
    });
  }

  const cacheKey = `attribution:${zoneId}`;

  try {
    // Check cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    // Call ML service
    const mlData = await callML(`/attribution/${zoneId}`);

    // Cache for 5 minutes
    await setCache(cacheKey, mlData, 300);

    // Persist to MongoDB (best-effort)
    try {
      await Attribution.findOneAndUpdate(
        { zoneId },
        { zoneId, ...mlData, timestamp: new Date() },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn('[ATTRIBUTION] DB persist failed (non-fatal):', dbErr.message);
    }

    return res.json(mlData);
  } catch (err) {
    console.error('[ATTRIBUTION ROUTE ERROR]', err.message);
    return res.status(503).json({
      error: 'Attribution service unavailable',
      message: err.message,
      retryAfter: 30,
    });
  }
});

/**
 * GET /api/attribution  — list all available zones
 */
router.get('/', (_req, res) => {
  res.json({ availableZones: VALID_ZONES });
});

module.exports = router;
