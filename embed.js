(function () {
  const WIDGET_ID = 'kasparex-widget';

  function css(styles) {
    const s = document.createElement('style');
    s.textContent = styles;
    document.head.appendChild(s);
  }

  css(`
  .kx-card{border:1px solid #e5e7eb;border-radius:12px;padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
  .kx-row{display:flex;align-items:center;gap:12px}
  .kx-btn{background:#0097b2;color:#fff;border:0;border-radius:10px;padding:10px 14px;cursor:pointer}
  .kx-badge{background:#eef7f9;color:#036572;padding:4px 8px;border-radius:999px;font-size:12px}
  .kx-muted{color:#6b7280;font-size:14px}
  `);

  function render(root, opts) {
    root.innerHTML = `
      <div class="kx-card">
        <div class="kx-row" style="justify-content:space-between">
          <div><strong>${opts.token} • ${opts.plan}</strong></div>
          <span class="kx-badge">${opts.tenant}</span>
        </div>
        <p class="kx-muted" style="margin:10px 0 14px">
          Subscribe to unlock lore perks. (Demo — no transactions yet)
        </p>
        <div class="kx-row">
          <button class="kx-btn" id="kx-subscribe">Connect wallet</button>
          <span class="kx-muted">KasWare supported first.</span>
        </div>
      </div>
    `;
    root.querySelector('#kx-subscribe').onclick = () => {
      alert(`Demo: connecting wallet for ${opts.token} / ${opts.plan} (tenant: ${opts.tenant})`);
      // Later: invoke SDK to connect KasWare and call SubscriptionManager
    };
  }

  function boot() {
    const root = document.getElementById(WIDGET_ID);
    if (!root) return;
    const opts = {
      tenant: root.dataset.tenant || 'tenant',
      widget: root.dataset.widget || 'subscription',
      token: root.dataset.token || 'KREX',
      plan: root.dataset.plan || 'default'
    };
    render(root, opts);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
