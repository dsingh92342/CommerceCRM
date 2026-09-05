import { data } from '../utils/seed.js';
import { $, esc, toast, confirmDialog } from '../utils/format.js';
import { store } from '../utils/store.js';

export function renderSettings() {
  const s = data.state();
  $('#pageTitle').textContent = 'Settings';
  $('#pageSubtitle').textContent = 'Preferences and data management';

  $('#view').innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><div class="card-title">Appearance</div></div>
        <div class="card-pad">
          <div class="between" style="padding:8px 0; border-bottom:1px solid var(--border)">
            <div>
              <div style="font-weight:600">Theme</div>
              <div class="cell-sub">Switch between light and dark</div>
            </div>
            <div class="tabs">
              <button class="${s.theme === 'light' ? 'active' : ''}" data-theme="light">☀ Light</button>
              <button class="${s.theme === 'dark' ? 'active' : ''}" data-theme="dark">🌙 Dark</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">Profile</div></div>
        <div class="card-pad">
          <div class="form-group"><label>Seller name</label><input id="sName" value="Seller Admin" /></div>
          <div class="form-group"><label>Email</label><input id="sEmail" value="admin@commercecrm.in" /></div>
          <div class="form-group"><label>Currency</label>
            <select id="sCurr"><option>INR (₹)</option><option>USD ($)</option><option>EUR (€)</option></select>
          </div>
          <button class="btn btn-primary" id="sSave">Save changes</button>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">Data</div></div>
        <div class="card-pad">
          <div class="between" style="padding:8px 0">
            <div>
              <div style="font-weight:600">Storage</div>
              <div class="cell-sub">${s.customers.length} customers, ${s.orders.length} orders, ${s.messages.length} messages, ${s.tasks.length} tasks</div>
            </div>
            <div class="text-muted" style="font-size:11.5px" id="sSize"></div>
          </div>
          <div class="row-flex mt-16" style="gap:8px; flex-wrap:wrap">
            <button class="btn btn-ghost" id="sExport">⬇ Export all data (JSON)</button>
            <button class="btn btn-ghost" id="sImport">⬆ Import JSON</button>
            <input type="file" id="sFile" accept="application/json" style="display:none" />
            <div class="spacer"></div>
            <button class="btn btn-danger" id="sReset">⚠ Reset to defaults</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">About</div></div>
        <div class="card-pad cell-sub" style="line-height:1.7">
          <strong>CommerceCRM v2.0</strong> — A complete CRM for ecommerce sellers.<br>
          Built with vanilla HTML, CSS, and JavaScript. All data stored locally in your browser.<br><br>
          <span class="text-muted">${esc(JSON.stringify({ v: 2, customers: s.customers.length, orders: s.orders.length }, null, 2))}</span>
        </div>
      </div>
    </div>
  `;

  $('#view').querySelectorAll('[data-theme]').forEach(b => {
    b.onclick = () => {
      const t = b.dataset.theme;
      document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : '');
      store.set({ theme: t });
      renderSettings();
    };
  });
  $('#sSize').textContent = ((JSON.stringify(s).length / 1024).toFixed(1)) + ' KB';
  $('#sSave').onclick = () => toast('Settings saved');
  $('#sExport').onclick = () => {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `crm-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast('Data exported');
  };
  $('#sImport').onclick = () => $('#sFile').click();
  $('#sFile').onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const obj = JSON.parse(ev.target.result);
        store.set(obj);
        toast('Data imported');
        renderSettings();
      } catch { toast('Invalid JSON', 'error'); }
    };
    r.readAsText(f);
  };
  $('#sReset').onclick = async () => {
    if (await confirmDialog('This will erase ALL your data and restore sample data. Continue?')) {
      store.reset();
      toast('Reset to defaults', 'warning');
      renderSettings();
    }
  };
}
