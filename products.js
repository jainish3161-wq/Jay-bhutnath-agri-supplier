// routes/products.js — Product CRUD using JSON database
const express = require('express');
const router  = express.Router();
const db      = require('../jsondb');
const auth    = require('../middleware/auth');

// GET /api/products — list all (filter: ?category=  ?in_stock=1)
router.get('/', (req, res) => {
  try {
    let products = db.products.all();
    if (req.query.category)
      products = products.filter(p => p.category?.toLowerCase() === req.query.category.toLowerCase());
    if (req.query.in_stock !== undefined)
      products = products.filter(p => p.in_stock === Number(req.query.in_stock));
    res.json({ success: true, data: products });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/products/:id — single product
router.get('/:id', (req, res) => {
  const product = db.products.findOne(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
});

// POST /api/products — add (admin)
router.post('/', auth, (req, res) => {
  try {
    const { name, name_gu, category, price_per_kg, price_per_quintal, image_emoji,
            min_order_kg, in_stock, description, description_gu } = req.body;
    if (!name || !price_per_kg) return res.status(400).json({ success: false, message: 'name and price_per_kg required' });
    const product = db.products.insert({ name, name_gu, category, price_per_kg: Number(price_per_kg),
      price_per_quintal: Number(price_per_quintal || price_per_kg * 100),
      image_emoji: image_emoji || '🌾', min_order_kg: Number(min_order_kg || 1),
      in_stock: in_stock !== undefined ? Number(in_stock) : 1,
      description, description_gu });
    res.status(201).json({ success: true, data: product });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/products/:id — update (admin)
router.put('/:id', auth, (req, res) => {
  const updated = db.products.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: updated });
});

// DELETE /api/products/:id — delete (admin)
router.delete('/:id', auth, (req, res) => {
  const ok = db.products.delete(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product deleted' });
});

module.exports = router;
