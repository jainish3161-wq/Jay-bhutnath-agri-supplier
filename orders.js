// routes/orders.js — Orders CRUD using JSON database
const express = require('express');
const router  = express.Router();
const db      = require('../jsondb');
const auth    = require('../middleware/auth');

function genOrderNumber() {
  const y = new Date().getFullYear();
  const n = String(db.orders.count() + 1).padStart(4, '0');
  return `JB-${y}-${n}`;
}

// GET /api/orders — all orders (admin)
router.get('/', auth, (req, res) => {
  try {
    let orders = db.orders.all();
    if (req.query.status) orders = orders.filter(o => o.status === req.query.status);
    if (req.query.date)   orders = orders.filter(o => o.created_at?.startsWith(req.query.date));
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, data: orders });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/orders/my/:phone — customer's own orders
router.get('/my/:phone', (req, res) => {
  const orders = db.orders.all(o => o.customer_phone === req.params.phone);
  res.json({ success: true, data: orders });
});

// GET /api/orders/:id — single order
router.get('/:id', (req, res) => {
  const order = db.orders.findOne(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: order });
});

// POST /api/orders — place new order
router.post('/', (req, res) => {
  try {
    const { customer_name, customer_phone, customer_address, customer_village,
            product_id, quantity_kg, payment_method, delivery_notes } = req.body;
    if (!customer_name || !customer_phone || !quantity_kg)
      return res.status(400).json({ success: false, message: 'customer_name, customer_phone and quantity_kg are required' });

    const product = product_id ? db.products.findOne(p => p.id === Number(product_id)) : null;
    const price   = product ? product.price_per_kg : 0;
    const total   = Number((price * Number(quantity_kg)).toFixed(2));

    const order = db.orders.insert({
      order_number:     genOrderNumber(),
      customer_name,
      customer_phone,
      customer_address: customer_address || '',
      customer_village: customer_village || '',
      product_id:       product_id ? Number(product_id) : null,
      product_name:     product ? product.name : (req.body.product_name || ''),
      quantity_kg:      Number(quantity_kg),
      total_amount:     total,
      payment_method:   payment_method || 'cash',
      status:           'pending',
      delivery_notes:   delivery_notes || '',
      driver_name:      '',
    });
    res.status(201).json({ success: true, data: order, message: `Order ${order.order_number} placed successfully!` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/orders/:id/status — update status (admin)
router.put('/:id/status', auth, (req, res) => {
  const { status, driver_name } = req.body;
  const valid = ['pending','confirmed','processing','dispatched','delivered','cancelled'];
  if (!valid.includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status' });
  const updates = { status };
  if (driver_name) updates.driver_name = driver_name;
  const updated = db.orders.update(req.params.id, updates);
  if (!updated) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: updated });
});

// DELETE /api/orders/:id — cancel/delete (admin)
router.delete('/:id', auth, (req, res) => {
  const ok = db.orders.delete(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, message: 'Order deleted' });
});

module.exports = router;
