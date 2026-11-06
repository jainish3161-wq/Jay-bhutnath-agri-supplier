// routes/delivery-partners.js — Delivery Partner Management (Admin)
const express = require('express');
const router  = express.Router();
const db      = require('../jsondb');
const auth    = require('../middleware/auth');
const jwt     = require('jsonwebtoken');

const SECRET = () => process.env.JWT_SECRET || 'jaybhutnath_agri_jwt_secret_2024';

// GET /api/delivery-partners — list all partners (admin)
router.get('/', auth, (req, res) => {
  try {
    let partners = db.deliveryPartners.all();
    if (req.query.status) partners = partners.filter(p => p.status === req.query.status);
    // Count their deliveries
    const enriched = partners.map(p => {
      const { pin, ...safe } = p;
      const deliveries       = db.delivery.all(d => d.driver_phone === p.phone);
      safe.total_deliveries  = deliveries.length;
      safe.delivered_count   = deliveries.filter(d => d.status === 'delivered').length;
      safe.active_deliveries = deliveries.filter(d => ['assigned','picked_up','in_transit'].includes(d.status)).length;
      return safe;
    });
    res.json({ success: true, data: enriched });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/delivery-partners — add new partner (admin)
router.post('/', auth, (req, res) => {
  try {
    const { name, phone, pin, vehicle_number, area, status } = req.body;
    if (!name || !phone || !pin)
      return res.status(400).json({ success: false, message: 'Name, phone and PIN are required' });
    if (!/^\d{10}$/.test(phone.replace(/\s/g,'')))
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit phone number' });
    if (!/^\d{4}$/.test(String(pin).trim()))
      return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
    if (db.deliveryPartners.findOne(p => p.phone === phone.trim()))
      return res.status(409).json({ success: false, message: 'Partner with this phone already exists' });

    const partner = db.deliveryPartners.insert({
      name, phone: phone.trim(), pin: String(pin).trim(),
      vehicle_number: vehicle_number || '',
      area: area || 'Mandvi',
      status: status || 'active',   // active | inactive
      last_login: null,
    });
    const { pin: _p, ...safe } = partner;
    res.status(201).json({ success: true, data: safe, message: 'Delivery partner added!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/delivery-partners/me/deliveries — partner fetches their own deliveries (MUST be before /:id)
router.get('/me/deliveries', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.delivery_token;
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, SECRET());
    if (!['delivery'].includes(decoded.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
    const deliveries = db.delivery.all(d => d.driver_phone === decoded.phone);
    deliveries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, data: deliveries, partner: { name: decoded.name, phone: decoded.phone } });
  } catch (e) { res.status(401).json({ success: false, message: 'Invalid or expired token' }); }
});

// GET /api/delivery-partners/:id — single partner (admin)
router.get('/:id', auth, (req, res) => {
  const partner = db.deliveryPartners.findOne(p => p.id === Number(req.params.id));
  if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
  const { pin, ...safe } = partner;
  const deliveries = db.delivery.all(d => d.driver_phone === partner.phone);
  res.json({ success: true, data: { ...safe, deliveries } });
});

// PUT /api/delivery-partners/:id — update partner (admin)
router.put('/:id', auth, (req, res) => {
  const updates = { ...req.body };
  if (updates.pin && !/^\d{4}$/.test(String(updates.pin)))
    return res.status(400).json({ success: false, message: 'PIN must be 4 digits' });
  const updated = db.deliveryPartners.update(req.params.id, updates);
  if (!updated) return res.status(404).json({ success: false, message: 'Partner not found' });
  const { pin, ...safe } = updated;
  res.json({ success: true, data: safe });
});

// DELETE /api/delivery-partners/:id (admin)
router.delete('/:id', auth, (req, res) => {
  const ok = db.deliveryPartners.delete(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Partner not found' });
  res.json({ success: true, message: 'Delivery partner removed' });
});

module.exports = router;
