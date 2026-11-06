// routes/farmers.js — Farmer & Trader Registration + Admin Approval
const express = require('express');
const router  = express.Router();
const db      = require('../jsondb');
const auth    = require('../middleware/auth');

// POST /api/farmers/register — self-registration (farmer OR trader)
router.post('/register', (req, res) => {
  try {
    const { name, phone, pin, role, village, taluka, district, state,
            crop_type, land_acres, company_name, gst_number, bank_name, account_number } = req.body;
    if (!name || !phone || !pin) return res.status(400).json({ success: false, message: 'Name, phone and PIN are required' });
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit phone number' });
    if (!/^\d{4}$/.test(String(pin).trim())) return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
    if (db.farmers.findOne(f => f.phone === phone.trim())) return res.status(409).json({ success: false, message: 'An account with this phone number is already registered' });
    // Also check delivery partners
    if (db.deliveryPartners.findOne(p => p.phone === phone.trim())) return res.status(409).json({ success: false, message: 'This phone is already registered as a delivery partner' });

    const validRole = ['farmer', 'trader'].includes(role) ? role : 'farmer';
    const record = {
      name, phone: phone.trim(), pin: String(pin).trim(),
      role: validRole,
      village: village || '', taluka: taluka || '',
      district: district || 'Kutch', state: state || 'Gujarat',
      crop_type: Array.isArray(crop_type) ? crop_type.join(', ') : (crop_type || ''),
      land_acres: land_acres ? Number(land_acres) : null,
      company_name: company_name || '',
      gst_number: gst_number || '',
      bank_name: bank_name || '', account_number: account_number || '',
      status: 'pending', approved_by: null, approved_at: null, rejection_reason: null,
    };
    const farmer = db.farmers.insert(record);
    res.status(201).json({
      success: true,
      data: { farmer_id: farmer.id, name: farmer.name, phone: farmer.phone, status: 'pending', role: validRole },
      message: `${validRole === 'trader' ? 'Trader' : 'Farmer'} registration submitted! Waiting for admin approval.`,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/farmers — all (admin), support ?status= ?role= ?district=
router.get('/', auth, (req, res) => {
  try {
    let list = db.farmers.all();
    if (req.query.status)   list = list.filter(f => f.status   === req.query.status);
    if (req.query.role)     list = list.filter(f => (f.role || 'farmer') === req.query.role);
    if (req.query.district) list = list.filter(f => f.district === req.query.district);
    const safe = list.map(({ pin, account_number, ...r }) => r);
    res.json({ success: true, data: safe });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/farmers/stats/summary (admin)
router.get('/stats/summary', auth, (req, res) => {
  const all = db.farmers.all();
  const byDistrict = {}, byCrop = {};
  all.forEach(f => {
    byDistrict[f.district || 'Unknown'] = (byDistrict[f.district || 'Unknown'] || 0) + 1;
    (f.crop_type || '').split(',').forEach(c => { const t = c.trim(); if (t) byCrop[t] = (byCrop[t] || 0) + 1; });
  });
  res.json({ success: true, data: {
    total: all.length,
    farmers:  all.filter(f => (f.role||'farmer') === 'farmer').length,
    traders:  all.filter(f => f.role === 'trader').length,
    pending:  all.filter(f => f.status === 'pending').length,
    approved: all.filter(f => f.status === 'approved').length,
    rejected: all.filter(f => f.status === 'rejected').length,
    districts: Object.entries(byDistrict).map(([name, count]) => ({ name, count })),
    crops:     Object.entries(byCrop).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  }});
});

// GET /api/farmers/:id (admin)
router.get('/:id', auth, (req, res) => {
  const farmer = db.farmers.findOne(f => f.id === Number(req.params.id));
  if (!farmer) return res.status(404).json({ success: false, message: 'Not found' });
  const { pin, account_number, ...safe } = farmer;
  res.json({ success: true, data: safe });
});

// PUT /api/farmers/:id/approve
router.put('/:id/approve', auth, (req, res) => {
  const farmer = db.farmers.findOne(f => f.id === Number(req.params.id));
  if (!farmer) return res.status(404).json({ success: false, message: 'Not found' });
  const updated = db.farmers.update(req.params.id, { status: 'approved', approved_by: 'admin', approved_at: new Date().toISOString(), rejection_reason: null });
  const { pin, account_number, ...safe } = updated;
  res.json({ success: true, data: safe, message: `${farmer.name} approved.` });
});

// PUT /api/farmers/:id/reject
router.put('/:id/reject', auth, (req, res) => {
  const { reason } = req.body;
  const farmer = db.farmers.findOne(f => f.id === Number(req.params.id));
  if (!farmer) return res.status(404).json({ success: false, message: 'Not found' });
  const updated = db.farmers.update(req.params.id, { status: 'rejected', rejection_reason: reason || 'Not approved', approved_by: null, approved_at: null });
  const { pin, account_number, ...safe } = updated;
  res.json({ success: true, data: safe, message: `${farmer.name} rejected.` });
});

// PUT /api/farmers/:id — general update (admin)
router.put('/:id', auth, (req, res) => {
  const { pin, ...updates } = req.body;
  const updated = db.farmers.update(req.params.id, updates);
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  const { pin: _p, account_number, ...safe } = updated;
  res.json({ success: true, data: safe });
});

// DELETE /api/farmers/:id
router.delete('/:id', auth, (req, res) => {
  const ok = db.farmers.delete(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Account removed' });
});

module.exports = router;
