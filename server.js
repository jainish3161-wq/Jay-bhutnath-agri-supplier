require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path       = require('path');
require('./jsondb'); // initialise & seed DB on startup

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (server-to-server, curl)
    if (!origin) return callback(null, true);
    // Allow localhost always
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
    // Allow configured production domain
    const allowed = process.env.ALLOWED_ORIGIN || '*';
    if (allowed === '*' || origin === allowed) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate-limit login endpoints
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, message: 'Too many attempts. Try again after 15 minutes.' }
});
app.use('/api/auth/login',          loginLimiter);
app.use('/api/auth/farmer-login',   loginLimiter);
app.use('/api/auth/delivery-login', loginLimiter);
app.use('/api/auth/user-login',     loginLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',               require('./routes/auth'));
app.use('/api/products',           require('./routes/products'));
app.use('/api/orders',             require('./routes/orders'));
app.use('/api/prices',             require('./routes/prices'));
app.use('/api/farmers',            require('./routes/farmers'));
app.use('/api/contact',            require('./routes/contact'));
app.use('/api/tokens',             require('./routes/tokens'));
app.use('/api/delivery',           require('./routes/delivery'));
app.use('/api/delivery-partners',  require('./routes/delivery-partners'));

// Serve all HTML/CSS/JS as static files
app.use(express.static(path.join(__dirname, '../')));

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'ok', timestamp: new Date().toISOString(),
  version: '2.0.0', business: 'Jay Bhutnath Agri Suppler'
}));

// 404 for unknown API routes
app.use('/api/*', (req, res) => res.status(404).json({ success: false, message: 'API route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🌾  Jay Bhutnath Agri Suppler — Backend v2.0');
  console.log(`🚀  Running on http://localhost:${PORT}`);
  console.log(`🔗  API: http://localhost:${PORT}/api`);
  console.log('');
  console.log('  Admin login  → admin / admin123');
  console.log('  Farmer login → register first, get approved, then login');
  console.log('  Driver login → phone: 9000000000 / PIN: 1234 (demo)');
  console.log('');
});
