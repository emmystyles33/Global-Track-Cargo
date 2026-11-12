import { Router } from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';

const router = Router();

function wrapAsync(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  };
}

// GET /api/geocode?place=Lagos, Nigeria
// Checks geocode_cache first; only hits the free Nominatim API on a
// cache miss. This keeps repeat lookups (e.g. "Lagos, Nigeria" used
// across many shipments) fast and avoids hammering the free service.
router.get(
  '/',
  wrapAsync(async (req, res) => {
    const place = (req.query.place || '').trim();
    if (!place) return res.status(400).json({ error: 'place query param required' });

    const cacheKey = place.toLowerCase();

    const { data: cached } = await supabaseAdmin
      .from('geocode_cache')
      .select('lat, lng')
      .eq('query', cacheKey)
      .maybeSingle();

    if (cached) {
      return res.json({ lat: cached.lat, lng: cached.lng, cached: true });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'shiptrack-demo-project' },
    });
    const results = await response.json();

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const lat = parseFloat(results[0].lat);
    const lng = parseFloat(results[0].lon);

    await supabaseAdmin.from('geocode_cache').insert({ query: cacheKey, lat, lng });

    res.json({ lat, lng, cached: false });
  })
);

export default router;
