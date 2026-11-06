// routes/delivery.js — Delivery Management using JSON database
const express = require('express');
const router  = express.Router();
const db      = require('../jsondb');
const auth    = require('../middleware/auth');

function todayDate() { return new Date().toISOString().split('T')[0]; }

// GET /api/delivery — list all deliveries (admin)
router.get('/', auth, (req, res) => {
  try {
    let deliveries = db.delivery.all();
    if (req.query.status) deliveries = deliveries.filter(d => d.status === req.query.status);
    if (req.query.driver) deliveries = deliveries.filter(d => d.driver_phone === req.query.driver || d.driver_name?.toLowerCase().includes(req.query.driver.toLowerCase()));
    deliveries.sort((a, b) => new Date(b.assigned_at || b.created_at) - new Date(a.assigned_at || a.created_at));
    res.json({ success: true, data: deliveries });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/delivery — create delivery assignment
router.post('/', auth, (req, res) => {
  try {
    const { order_id, driver_name, driver_phone, vehicle_number, pickup_address, delivery_address, notes } = req.body;
    if (!delivery_address) return res.status(400).json({ success: false, message: 'delivery_address is required' });
    const entry = db.delivery.insert({
      order_id:      order_id ? Number(order_id) : null,
      driver_name:   driver_name   || '',
      driver_phone:  driver_phone  || '',
      vehicle_number:vehicle_number|| '',
      pickup_address:pickup_address|| 'Jay Bhutnath Agri, Mandvi',
      delivery_address,
      status:        'assigned',
      assigned_at:   new Date().toISOString(),
      notes:         notes || '',
    });
    // Update order status to dispatched if linked
    if (order_id) {
      db.orders.update(order_id, { status: 'dispatched', driver_name: driver_name || '' });
    }
    res.status(201).json({ success: true, data: entry });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/delivery/:id/status — update delivery status
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['assigned','picked_up','in_transit','delivered','failed'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  const updates = { status };
  if (status === 'delivered') {
    updates.delivered_at = new Date().toISOString();
    // Also mark linked order as delivered
    const del = db.delivery.findOne(d => d.id === Number(req.params.id));
    if (del?.order_id) db.orders.update(del.order_id, { status: 'delivered' });
  }
  const updated = db.delivery.update(req.params.id, updates);
  if (!updated) return res.status(404).json({ success: false, message: 'Delivery not found' });
  res.json({ success: true, data: updated });
});

// GET /api/delivery/driver/:phone — driver's assigned deliveries
router.get('/driver/:phone', (req, res) => {
  const deliveries = db.delivery.all(d => d.driver_phone === req.params.phone);
  res.json({ success: true, data: deliveries });
});

// GET /api/delivery/stats
router.get('/stats', auth, (req, res) => {
  const all = db.delivery.all();
  const today = todayDate();
  res.json({ success: true, data: {
    total:          all.length,
    assigned:       all.filter(d => d.status === 'assigned').length,
    in_transit:     all.filter(d => d.status === 'in_transit').length,
    delivered_today:all.filter(d => d.status === 'delivered' && d.delivered_at?.startsWith(today)).length,
  }});
});

module.exports = router;
