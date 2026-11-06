/**
 * config.js — Environment Configuration
 * Automatically detects local vs. production environment.
 * MUST be the FIRST script loaded on every page.
 * 
 * Local  → API uses http://localhost:3001/api
 * cPanel → API uses https://yourdomain.com/api  (auto-detected)
 */
(function () {
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '3001';

  // API base URL — automatically switches between local and production
  window.API_BASE = isLocal
    ? 'http://localhost:3001/api'
    : window.location.origin + '/api';

  // Site base URL
  window.SITE_URL = isLocal
    ? 'http://localhost:3001'
    : window.location.origin;

  // For debugging — shows in browser console
  console.log(
    '%c🌾 Jay Bhutnath Agri Portal',
    'color:#16a34a;font-weight:bold;font-size:14px'
  );
  console.log(
    '%cEnvironment: ' + (isLocal ? '🏠 Local Development' : '🌐 Production'),
    'color:#6b7280;font-size:12px'
  );
  console.log(
    '%cAPI: ' + window.API_BASE,
    'color:#6b7280;font-size:12px'
  );
})();
