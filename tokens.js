// routes/tokens.js — Token Queue System using JSON database
const express = require('express');
const router  = express.Router();
const db      = require('../jsondb');
const auth    = require('../middleware/auth');

function todayDate() { return new Date().toISOString().split('T')[0]; }

// POST /api/tokens — generate new token
router.post('/', (req, res) => {
  try {
    const { customer_name, customer_phone, purpose } = req.body;
    if (!customer_name) return res.status(400).json({ success: false, message: 'Customer name is required' });
    const today   = todayDate();
    const todayTokens = db.tokens.all(t => t.token_date === today);
    const tokenNum = todayTokens.length + 1;
    const serving  = todayTokens.filter(t => t.status === 'served').length;
    const waiting  = tokenNum - serving - 1;
    const estimatedWait = Math.max(0, waiting * 5); // 5 min per token

    const token = db.tokens.insert({
      token_number: tokenNum, customer_name,
      customer_phone: customer_phone || '',
      purpose: purpose || 'purchase',
      token_date: today, status: 'waiting',
    });
    res.status(201).json({ success: true, data: { ...token, estimated_wait_minutes: estimatedWait } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/tokens — all tokens (optionally filter by ?date= or ?status=)
router.get('/', (req, res) => {
  try {
    let tokens = db.tokens.all();
    if (req.query.date === 'today' || !req.query.date) {
      tokens = tokens.filter(t => t.token_date === todayDate());
    } else if (req.query.date) {
      tokens = tokens.filter(t => t.token_date === req.query.date);
    }
    if (req.query.status) tokens = tokens.filter(t => t.status === req.query.status);
    tokens.sort((a, b) => a.token_number - b.token_number);
    res.json({ success: true, data: tokens });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/tokens/today — all today's tokens
router.get('/today', (req, res) => {
  const tokens = db.tokens.all(t => t.token_date === todayDate());
  tokens.sort((a, b) => a.token_number - b.token_number);
  res.json({ success: true, data: tokens });
});

// GET /api/tokens/current — currently serving token
router.get('/current', (req, res) => {
  const today   = todayDate();
  const serving = db.tokens.all(t => t.token_date === today && t.status === 'serving');
  if (serving.length) return res.json({ success: true, data: serving[serving.length - 1] });
  // fallback: last served
  const served  = db.tokens.all(t => t.token_date === today && t.status === 'served');
  served.sort((a, b) => b.token_number - a.token_number);
  res.json({ success: true, data: served[0] || null });
});

// GET /api/tokens/stats
router.get('/stats', (req, res) => {
  const today  = todayDate();
  const tokens = db.tokens.all(t => t.token_date === today);
  res.json({ success: true, data: {
    total_today: tokens.length,
    waiting:     tokens.filter(t => t.status === 'waiting').length,
    serving:     tokens.filter(t => t.status === 'serving').length,
    served:      tokens.filter(t => t.status === 'served').length,
    avg_wait_minutes: 5,
  }});
});

// PUT /api/tokens/:id/status — update token status
router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const valid = ['waiting', 'serving', 'served', 'skipped'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  const updates = { status };
  if (status === 'served') updates.served_at = new Date().toISOString();
  const updated = db.tokens.update(req.params.id, updates);
  if (!updated) return res.status(404).json({ success: false, message: 'Token not found' });
  res.json({ success: true, data: updated });
});

module.exports = router;
