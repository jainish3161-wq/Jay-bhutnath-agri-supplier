/**
 * farmer-auth.js — REDIRECT SHIM
 * This file now just loads auth.js which contains all auth logic.
 * Kept for backward compatibility with any old references.
 */
// All logic is now in auth.js
if (typeof requireAuth === 'undefined') {
  document.write('<script src="auth.js"><\/script>');
}
