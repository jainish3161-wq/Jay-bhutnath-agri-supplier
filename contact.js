// routes/contact.js — Contact Inquiries using JSON database
const express = require('express');
const router  = express.Router();
const db      = require('../jsondb');
const auth    = require('../middleware/auth');

// POST /api/contact — save inquiry
router.post('/', (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    if (!name || !message) return res.status(400).json({ success: false, message: 'Name and message are required' });
    if (message.length < 5) return res.status(400).json({ success: false, message: 'Message is too short' });
    const inquiry = db.contacts.insert({ name, phone: phone || '', email: email || '', message, status: 'unread' });
    res.status(201).json({ success: true, data: inquiry, message: 'Thank you! We will contact you within 24 hours.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/contact — list all (admin)
router.get('/', auth, (req, res) => {
  try {
    let contacts = db.contacts.all();
    if (req.query.status) contacts = contacts.filter(c => c.status === req.query.status);
    contacts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, data: contacts });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/contact/:id/status — mark read/replied (admin)
router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const valid = ['unread', 'read', 'replied'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  const updates = { status };
  if (status === 'replied') updates.replied_at = new Date().toISOString();
  const updated = db.contacts.update(req.params.id, updates);
  if (!updated) return res.status(404).json({ success: false, message: 'Inquiry not found' });
  res.json({ success: true, data: updated });
});

// DELETE /api/contact/:id — delete (admin)
router.delete('/:id', auth, (req, res) => {
  const ok = db.contacts.delete(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Inquiry not found' });
  res.json({ success: true, message: 'Inquiry deleted' });
});

module.exports = router;
