import { data } from '../utils/seed.js';
import { $, esc, fmtINR, toast } from '../utils/format.js';

export function renderIntegrations() {
  const s = data.state().stores;
  $('#pageTitle').textContent = 'Integrations';
  $('#pageSubtitle').textContent = 'Connect and manage your marketplace channels';

  // Compute orders/revenue per store
  const orders = data.state().orders;
  const stats = s.map(st => {
    const my = orders.filter(o => o.store === st.id && o.status !== 'Cancelled' && o.status !== 'Refunded');
    return { ...st, count: my.length, revenue: my.reduce((a, o) => a + o.amount, 0) };
  });

  $('#view').innerHTML = `
    <div class="int-grid">
      ${stats.map(st => `
        <div class="int-card">
          <div class="int-head">
            <div class="int-logo" style="background:${st.color}">${st.logo}</div>
            <div style="flex:1">
              <div class="int-name">${esc(st.name)}</div>
              <div class="int-meta">${st.connected ? 'Connected • Synced 5 min ago' : 'Not connected'}</div>
            </div>
            <div class="toggle ${st.connected ? 'on' : ''}" data-id="${st.id}"></div>
          </div>
          <div class="int-stats">
            <div><div class="int-stat-label">Orders</div><div class="int-stat-value">${st.count}</div></div>
            <div><div class="int-stat-label">Revenue</div><div class="int-stat-value">${fmtINR(st.revenue)}</div></div>
          </div>
          <div class="int-actions">
            <button class="btn btn-ghost" data-sync="${st.id}">Sync Now</button>
            <button class="btn btn-primary" data-conf="${st.id}">Configure</button>
          </div>
        </div>`).join('')}
    </div>

    <div class="card mt-16">
      <div class="card-head">
        <div>
          <div class="card-title">Need a custom integration?</div>
          <div class="card-sub">Connect any REST API or webhook in minutes</div>
        </div>
        <a class="btn btn-primary" href="#custom">Open Custom API →</a>
      </div>
    </div>
  `;

  $('#view').querySelectorAll('.toggle').forEach(t => {
    t.onclick = () => {
      const id = t.dataset.id;
      data.state().stores = data.state().stores.map(s => s.id === id ? { ...s, connected: !s.connected } : s);
      data.state(); // touch
      import('../utils/store.js').then(m => m.store.set({ stores: data.state().stores }));
      renderIntegrations();
    };
  });
  $('#view').querySelectorAll('[data-sync]').forEach(b => {
    b.onclick = () => toast('Synced ' + (data.state().stores.find(s => s.id === b.dataset.sync)?.name || '') + ' — 0 new orders', 'info');
  });
  $('#view').querySelectorAll('[data-conf]').forEach(b => {
    b.onclick = () => toast('Configuration saved', 'success');
  });
}
