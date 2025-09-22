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
  .kx-btn.secondary{background:#0a0f14}
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
          Subscribe to unlock lore perks.
        </p>
        <div class="kx-row">
          <button class="kx-btn" id="kx-connect-kasware">Connect KasWare</button>
          <button class="kx-btn secondary" id="kx-connect-evm" title="For Kasplex L2 later">Connect EVM</button>
          <span class="kx-muted" id="kx-status">Not connected</span>
        </div>
      </div>
    `;

    const status = root.querySelector('#kx-status');

    root.querySelector('#kx-connect-kasware').onclick = async () => {
      try {
        const res = await window.KasparexSDK.wallet.connect('kasware');
        status.textContent = `Connected: ${short(res.address)} (Kaspa)`;
      } catch (e) {
        alert(e.message || String(e));
      }
    };

    root.querySelector('#kx-connect-evm').onclick = async () => {
      try {
        const res = await window.KasparexSDK.wallet.connect('evm');
        status.textContent = `Connected: ${short(res.address)} (EVM)`;
      } catch (e) {
        alert(e.message || String(e));
      }
    };
  }

  function short(addr) {
    return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
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
