import { data } from '../utils/seed.js';
import { $, esc, toast, openModal, confirmDialog } from '../utils/format.js';
import { configForm, headerRow } from './forms.js';

let activeConfig = null; // currently being edited/sent
let lastResponse = null;
let pollTimer = null;
let viewMode = 'auto';
let chartInstance = null;

const PRESETS = {
  jsonplaceholder: { name: 'JSONPlaceholder Users', method: 'GET', url: 'https://jsonplaceholder.typicode.com/users', headers: [], body: '', env: '{}', pollSec: 0 },
  reqres: { name: 'ReqRes Users', method: 'GET', url: 'https://reqres.in/api/users?page=1', headers: [{ k: 'x-api-key', v: 'reqres-free-key' }], body: '', env: '{}', pollSec: 0 },
  openweather: { name: 'OpenWeather (needs API key)', method: 'GET', url: 'https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid={{API_KEY}}', headers: [], body: '', env: '{"API_KEY": "your_key_here"}', pollSec: 0 },
  blank: { name: 'Blank config', method: 'GET', url: '', headers: [], body: '', env: '{}', pollSec: 0 }
};

export function renderCustom() {
  $('#pageTitle').textContent = 'Custom API';
  $('#pageSubtitle').textContent = 'Connect your own REST API and visualize the data';

  const configs = data.state().customConfigs;
  $('#view').innerHTML = `
    <div class="filter-bar">
      <div class="spacer"></div>
      <button class="btn btn-ghost btn-sm" id="ciPreset">📋 Load preset</button>
      <button class="btn btn-primary btn-sm" id="ciAdd">+ New Config</button>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Saved Configurations</div>
            <div class="card-sub">${configs.length} saved · click to load</div>
          </div>
        </div>
        <div class="card-pad" id="ciConfigList">
          ${configs.length === 0 ? `<div class="empty"><div class="empty-icon">⚡</div>No saved configs yet. Click "+ New Config" to start.</div>` : configs.map(c => `
            <div class="note-card row-flex" data-id="${c.id}" style="cursor:pointer; gap:10px; align-items:center">
              <div style="flex:1">
                <div style="font-weight:600">${esc(c.name)}</div>
                <div class="cell-sub">${esc(c.method)} ${esc(c.url.slice(0, 60))}${c.url.length > 60 ? '…' : ''} ${c.pollSec ? `· ⟳ ${c.pollSec}s` : ''}</div>
              </div>
              <button class="icon-btn" data-act="edit" data-id="${c.id}" title="Edit">✎</button>
              <button class="icon-btn" data-act="del" data-id="${c.id}" title="Delete">🗑</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Response</div>
            <div class="card-sub" id="ciRespMeta">Select or create a config to test</div>
          </div>
          <div class="tabs" id="ciViewTabs">
            <button class="${viewMode === 'auto' ? 'active' : ''}" data-view="auto">Auto</button>
            <button class="${viewMode === 'chart' ? 'active' : ''}" data-view="chart">Chart</button>
            <button class="${viewMode === 'json' ? 'active' : ''}" data-view="json">JSON</button>
          </div>
        </div>
        <div class="card-pad" id="ciResp" style="min-height:300px">
          <div class="empty"><div class="empty-icon">📡</div>Send a request to see results</div>
        </div>
      </div>
    </div>

    <div class="card mt-16">
      <div class="card-head">
        <div>
          <div class="card-title">How to set up a real webhook receiver</div>
          <div class="card-sub">Browser apps can't directly receive webhooks — you need a tiny backend</div>
        </div>
      </div>
      <div class="card-pad" style="font-size:13px; line-height:1.7">
        <p>Because this CRM runs in the browser, incoming webhooks need a small server to forward them. Here's a minimal Node.js example you can deploy for free on <strong>Render</strong> or <strong>Railway</strong>:</p>
        <pre class="code-block"><code>// server.js
import express from 'express';
const app = express();
app.use(express.json());
const events = [];
app.post('/webhook', (req, res) =&gt; {
  events.push({ receivedAt: new Date(), body: req.body });
  res.sendStatus(200);
});
app.get('/events', (_, res) =&gt; res.json(events));
app.listen(3000, () =&gt; console.log('Listening on 3000'));</code></pre>
        <p class="mt-16">Then point your provider's webhook URL to <code>https://your-app.onrender.com/webhook</code> and fetch from <code>/events</code> using the Custom API tab above.</p>
      </div>
    </div>
  `;

  $('#ciAdd').onclick = () => openConfigForm();
  $('#ciPreset').onclick = () => {
    openModal({
      title: 'Load preset',
      body: `<div style="display:grid; gap:8px">
        ${Object.entries(PRESETS).map(([k, p]) => `<button class="btn btn-ghost" data-preset="${k}" style="justify-content:flex-start">${esc(p.name)}</button>`).join('')}
      </div>`,
      hideFooter: true,
      size: '420px'
    });
    document.querySelectorAll('[data-preset]').forEach(b => {
      b.onclick = () => {
        $('#modalBackdrop').classList.remove('open');
        const p = PRESETS[b.dataset.preset];
        openConfigForm(p);
      };
    });
  };

  $('#ciConfigList').querySelectorAll('[data-id]').forEach(el => {
    el.onclick = e => {
      if (e.target.closest('button')) return;
      const cfg = configs.find(c => c.id === el.dataset.id);
      if (cfg) { activeConfig = cfg; sendRequest(); }
    };
  });
  $('#ciConfigList').querySelectorAll('[data-act="edit"]').forEach(b => {
    b.onclick = e => { e.stopPropagation(); openConfigForm(configs.find(c => c.id === b.dataset.id)); };
  });
  $('#ciConfigList').querySelectorAll('[data-act="del"]').forEach(b => {
    b.onclick = async e => {
      e.stopPropagation();
      if (await confirmDialog('Delete this config?')) { data.deleteConfig(b.dataset.id); renderCustom(); }
    };
  });

  $('#ciViewTabs').querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      viewMode = b.dataset.view;
      $('#ciViewTabs').querySelectorAll('button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderResponse();
    };
  });

  // Resume polling if any active config
  if (activeConfig && activeConfig.pollSec > 0) startPolling();
  else stopPolling();
}

export function openConfigForm(cfg = null) {
  openModal({
    title: cfg && cfg.id ? `Edit: ${cfg.name}` : 'New Config',
    body: configForm(cfg || {}),
    size: '640px',
    onSubmit: (d) => {
      // Collect headers + env
      const headers = [];
      $('#ciHeaders').querySelectorAll('.ci-headers-row').forEach(row => {
        const k = row.querySelector('.ci-hk').value.trim();
        const v = row.querySelector('.ci-hv').value.trim();
        if (k) headers.push({ k, v });
      });
      let env = {};
      try { env = d.env ? JSON.parse(d.env) : {}; } catch { toast('Invalid env JSON', 'error'); return; }
      if (!d.name?.trim()) { toast('Name required', 'error'); return; }
      if (!d.url?.trim()) { toast('URL required', 'error'); return; }
      const payload = { name: d.name, method: d.method, url: d.url, headers, body: d.body || '', env, pollSec: +d.pollSec || 0 };
      if (cfg && cfg.id) { data.updateConfig(cfg.id, payload); toast('Config updated'); }
      else { data.addConfig(payload); toast('Config saved'); }
      $('#modalBackdrop').classList.remove('open');
      renderCustom();
    }
  });
  // Add header button
  setTimeout(() => {
    const btn = $('#ciAddHeader');
    if (btn) btn.onclick = () => {
      const wrap = $('#ciHeaders');
      const ph = wrap.querySelector('.text-muted'); if (ph) ph.remove();
      const div = document.createElement('div');
      div.innerHTML = headerRow();
      wrap.appendChild(div.firstElementChild);
      bindHeaderRemoves();
    };
    bindHeaderRemoves();
  }, 50);
}
function bindHeaderRemoves() {
  document.querySelectorAll('#ciHeaders [data-rm]').forEach(b => {
    b.onclick = () => { b.closest('.ci-headers-row').remove(); };
  });
}

async function sendRequest() {
  if (!activeConfig) return;
  // Substitute env vars
  const envStr = JSON.stringify(activeConfig.env || {});
  let env = {};
  try { env = JSON.parse(envStr); } catch {}
  const sub = s => s.replace(/\{\{(\w+)\}\}/g, (_, k) => env[k] ?? '');
  const url = sub(activeConfig.url);
  const headers = {};
  (activeConfig.headers || []).forEach(h => { if (h.k) headers[h.k] = sub(h.v); });
  const method = activeConfig.method;
  const body = activeConfig.body ? sub(activeConfig.body) : null;

  const meta = $('#ciRespMeta');
  const resp = $('#ciResp');
  meta.textContent = 'Sending…';
  resp.innerHTML = `<div class="empty"><div class="empty-icon">⏳</div>Loading…</div>`;

  const t0 = performance.now();
  try {
    const opts = { method, headers };
    if (method !== 'GET' && method !== 'HEAD' && body) opts.body = body;
    const res = await fetch(url, opts);
    const text = await res.text();
    const ms = Math.round(performance.now() - t0);
    let parsed = null;
    try { parsed = JSON.parse(text); } catch {}
    lastResponse = { status: res.status, ok: res.ok, ms, text, parsed };
    meta.innerHTML = `<span class="${res.ok ? 'text-success' : 'text-danger'}">● ${res.status}</span> · ${ms} ms · ${text.length.toLocaleString()} bytes`;
    renderResponse();
  } catch (err) {
    meta.innerHTML = `<span class="text-danger">● Network error</span>`;
    resp.innerHTML = `<div class="empty"><div class="empty-icon">❌</div>${esc(err.message)}<div class="cell-sub mt-8">Tip: this is usually CORS. Run from your own backend, or use a CORS proxy.</div></div>`;
  }
}

function renderResponse() {
  const resp = $('#ciResp');
  if (!resp || !lastResponse) return;
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  if (viewMode === 'json' || !lastResponse.parsed) {
    resp.innerHTML = `<pre class="code-block" style="max-height:480px">${esc(lastResponse.text || '')}</pre>`;
    return;
  }

  const data = lastResponse.parsed;
  const arr = Array.isArray(data) ? data
    : Array.isArray(data?.data) ? data.data
    : Array.isArray(data?.items) ? data.items
    : Array.isArray(data?.results) ? data.results
    : Array.isArray(data?.users) ? data.users
    : Array.isArray(data?.orders) ? data.orders
    : null;

  if (viewMode === 'chart' && arr && arr.length && typeof arr[0] === 'object') {
    // Find a numeric field to chart
    const numField = Object.keys(arr[0]).find(k => typeof arr[0][k] === 'number');
    const labelField = Object.keys(arr[0]).find(k => typeof arr[0][k] === 'string') || numField;
    if (numField) {
      const labels = arr.slice(0, 20).map(o => String(o[labelField] || '').slice(0, 12));
      const values = arr.slice(0, 20).map(o => o[numField]);
      resp.innerHTML = `<canvas id="ciChart" height="200"></canvas><div class="cell-sub mt-8">Chart of <code>${esc(numField)}</code> by <code>${esc(labelField)}</code></div>`;
      chartInstance = new Chart($('#ciChart'), {
        type: 'bar',
        data: { labels, datasets: [{ data: values, backgroundColor: '#4f46e5' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
      return;
    }
  }

  if (!arr || !arr.length || typeof arr[0] !== 'object') {
    const rows = Object.entries(data).map(([k, v]) => ({ key: k, val: typeof v === 'object' ? JSON.stringify(v) : String(v) }));
    resp.innerHTML = `
      <div class="kpi" style="margin-bottom:12px"><div class="kpi-label">Object</div><div class="kpi-value">${rows.length} fields</div></div>
      <div class="table-wrap" style="border:1px solid var(--border); border-radius:8px">
        <table class="table"><thead><tr><th>Field</th><th>Value</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td><strong>${esc(r.key)}</strong></td><td><code>${esc(r.val)}</code></td></tr>`).join('')}</tbody></table>
      </div>`;
    return;
  }

  const keys = [];
  arr.forEach(o => Object.keys(o || {}).forEach(k => { if (!keys.includes(k)) keys.push(k); }));
  const preview = arr.slice(0, 50);
  resp.innerHTML = `
    <div class="kpi-grid col-3" style="grid-template-columns:repeat(3,1fr); margin-bottom:12px">
      <div class="kpi"><div class="kpi-label">Records</div><div class="kpi-value" style="font-size:20px">${arr.length}</div></div>
      <div class="kpi"><div class="kpi-label">Fields</div><div class="kpi-value" style="font-size:20px">${keys.length}</div></div>
      <div class="kpi"><div class="kpi-label">Showing</div><div class="kpi-value" style="font-size:20px">${preview.length}/${arr.length}</div></div>
    </div>
    <div class="table-wrap" style="border:1px solid var(--border); border-radius:8px; max-height:380px; overflow:auto">
      <table class="table">
        <thead><tr>${keys.map(k => `<th>${esc(k)}</th>`).join('')}</tr></thead>
        <tbody>${preview.map(o => `<tr>${keys.map(k => {
          let v = o?.[k];
          if (v && typeof v === 'object') v = JSON.stringify(v);
          return `<td>${esc(v == null ? '' : String(v))}</td>`;
        }).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>`;
}

function startPolling() {
  stopPolling();
  if (!activeConfig?.pollSec) return;
  pollTimer = setInterval(() => {
    if (location.hash === '#custom') sendRequest();
    else stopPolling();
  }, activeConfig.pollSec * 1000);
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}
