// routes/prices.js — Market Prices using JSON database
const express = require('express');
const router  = express.Router();
const db      = require('../jsondb');
const auth    = require('../middleware/auth');

// GET /api/prices — today's prices (or ?date=YYYY-MM-DD)
router.get('/', (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().split('T')[0];
    let prices = db.prices.all(p => p.price_date === today);

    // If no prices for requested date, fall back to most-recent data
    if (prices.length === 0) {
      prices = db.prices.all();
      // deduplicate by product_name — keep latest
      const seen = {};
      prices = prices
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .filter(p => { if (seen[p.product_name]) return false; seen[p.product_name] = true; return true; });
    }

    res.json({ success: true, data: prices, date: today });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/prices/history/:days — last N days grouped by date
router.get('/history/:days', (req, res) => {
  try {
    const days = Math.min(Number(req.params.days) || 7, 30);
    const allPrices = db.prices.all();
    const grouped = {};
    allPrices.forEach(p => {
      const d = p.price_date || p.created_at?.split('T')[0];
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(p);
    });
    // return last N dates
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).slice(0, days);
    const history = sortedDates.map(date => ({ date, prices: grouped[date] }));
    res.json({ success: true, data: history });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/prices — add/upsert price entry (admin)
router.post('/', auth, (req, res) => {
  try {
    const { product_name, product_name_gu, category, price_per_quintal, change_amount, market, price_date } = req.body;
    if (!product_name || !price_per_quintal)
      return res.status(400).json({ success: false, message: 'product_name and price_per_quintal are required' });
    const today = price_date || new Date().toISOString().split('T')[0];
    const entry = db.prices.upsert(
      p => p.product_name === product_name && p.price_date === today,
      { product_name, product_name_gu, category, price_per_quintal: Number(price_per_quintal),
        change_amount: Number(change_amount || 0), market: market || 'Mandvi Mandi', price_date: today }
    );
    res.json({ success: true, data: entry });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/prices/:id — update single price entry (admin)
router.put('/:id', auth, (req, res) => {
  const updated = db.prices.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Price entry not found' });
  res.json({ success: true, data: updated });
});

module.exports = router;
