/**
 * server-check.js — Checks backend connectivity and shows a banner when offline.
 * Include on every page: <script src="server-check.js"></script>
 * Must be included AFTER auth.js
 */
(function() {
  const API = window.API_BASE || 'http://localhost:3001/api';

  // Create the offline banner
  const banner = document.createElement('div');
  banner.id = 'serverOfflineBanner';
  banner.style.cssText = [
    'display:none',
    'position:fixed',
    'bottom:0',
    'left:0',
    'right:0',
    'z-index:99999',
    'background:linear-gradient(135deg,#7f1d1d,#991b1b)',
    'color:white',
    'padding:12px 20px',
    'font-family:Poppins,sans-serif',
    'font-size:13px',
    'font-weight:600',
    'display:none',
    'align-items:center',
    'justify-content:space-between',
    'gap:12px',
    'box-shadow:0 -4px 20px rgba(0,0,0,0.4)',
    'border-top:1px solid rgba(255,255,255,0.1)'
  ].join(';');

  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">⚠️</span>
      <div>
        <div style="font-weight:800">Backend Server Offline</div>
        <div style="font-size:11px;opacity:0.75;font-weight:400">Buttons won't work. Please run <strong>START-HERE.bat</strong> first, then refresh this page.</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
      <button onclick="window.location.reload()" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:white;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;font-family:Poppins,sans-serif">↻ Retry</button>
      <button onclick="document.getElementById('serverOfflineBanner').style.display='none'" style="background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:18px;line-height:1;padding:0 4px">✕</button>
    </div>
  `;

  // Create the online indicator (top right corner dot)
  const onlineChip = document.createElement('div');
  onlineChip.id = 'serverOnlineChip';
  onlineChip.style.cssText = [
    'position:fixed',
    'bottom:16px',
    'right:16px',
    'z-index:99998',
    'background:rgba(22,163,74,0.9)',
    'color:white',
    'padding:5px 12px',
    'border-radius:20px',
    'font-family:Poppins,sans-serif',
    'font-size:11px',
    'font-weight:700',
    'display:none',
    'align-items:center',
    'gap:6px',
    'box-shadow:0 4px 12px rgba(0,0,0,0.2)',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity 0.5s'
  ].join(';');
  onlineChip.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:white;display:inline-block;animation:pulse 1.5s infinite"></span> Server Online';

  // Add keyframe animation
  const style = document.createElement('style');
  style.textContent = '@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}';

  // Append to body when DOM is ready
  function appendElements() {
    document.body.appendChild(banner);
    document.body.appendChild(onlineChip);
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', appendElements);
  } else {
    appendElements();
  }

  let lastStatus = null; // null = unknown, true = online, false = offline
  let checkCount = 0;

  async function checkServer() {
    try {
      const r = await fetch(API + '/health', { method: 'GET', cache: 'no-store' });
      const ok = r.ok;

      if (ok !== lastStatus) {
        lastStatus = ok;
        if (ok) {
          // Online
          banner.style.display = 'none';
          onlineChip.style.display = 'flex';
          onlineChip.style.opacity = '1';
          if (checkCount > 1) {
            // Only show "back online" chip if was previously offline
            setTimeout(() => { onlineChip.style.opacity = '0'; setTimeout(() => { onlineChip.style.display = 'none'; }, 500); }, 3000);
          } else {
            // First check success - just hide it quietly
            setTimeout(() => { onlineChip.style.opacity = '0'; setTimeout(() => { onlineChip.style.display = 'none'; }, 500); }, 1500);
          }
        } else {
          // Offline
          banner.style.display = 'flex';
          onlineChip.style.display = 'none';
        }
      }
    } catch(e) {
      if (lastStatus !== false) {
        lastStatus = false;
        banner.style.display = 'flex';
        onlineChip.style.display = 'none';
      }
    }
    checkCount++;
  }

  // Check after DOM loads (slight delay to not block page render)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(checkServer, 800));
  } else {
    setTimeout(checkServer, 800);
  }

  // Re-check every 30 seconds
  setInterval(checkServer, 30000);

  // Also expose a manual check
  window.checkServerHealth = checkServer;
})();
