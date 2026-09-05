// Reusable form templates for the modal
import { data } from '../utils/seed.js';
import { esc } from '../utils/format.js';

export const customerForm = (c = {}) => `
  <form id="entityForm" novalidate>
    <div class="form-row">
      <div class="form-group">
        <label>Full Name *</label>
        <input name="name" required value="${esc(c.name || '')}" placeholder="e.g. Riya Sharma" />
      </div>
      <div class="form-group">
        <label>Email *</label>
        <input name="email" type="email" required value="${esc(c.email || '')}" placeholder="riya@example.com" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Phone</label>
        <input name="phone" value="${esc(c.phone || '')}" placeholder="+91 98000 00000" />
      </div>
      <div class="form-group">
        <label>City</label>
        <input name="city" value="${esc(c.city || '')}" placeholder="Mumbai" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Primary Store</label>
        <select name="store">
          ${data.state().stores.map(s => `<option value="${s.id}" ${c.store === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Segment</label>
        <select name="segment">
          ${['New', 'Regular', 'Loyal', 'VIP'].map(s => `<option ${c.segment === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
  </form>`;

export const orderForm = (o = {}) => {
  const customers = data.state().customers;
  return `
  <form id="entityForm" novalidate>
    <div class="form-row">
      <div class="form-group">
        <label>Customer *</label>
        <select name="customerId" required>
          <option value="">— Select customer —</option>
          ${customers.map(c => `<option value="${c.id}" ${o.customerId === c.id ? 'selected' : ''}>${c.name} (${c.id})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Store</label>
        <select name="store">
          ${data.state().stores.map(s => `<option value="${s.id}" ${o.store === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Product *</label>
      <input name="product" required value="${esc(o.product || '')}" placeholder="e.g. Wireless Earbuds Pro" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Quantity</label>
        <input name="qty" type="number" min="1" value="${o.qty || 1}" />
      </div>
      <div class="form-group">
        <label>Amount (₹) *</label>
        <input name="amount" type="number" min="0" step="0.01" required value="${o.amount || ''}" placeholder="999" />
      </div>
    </div>
    <div class="form-group">
      <label>Status</label>
      <select name="status">
        ${['Processing', 'Shipped', 'Delivered', 'Return', 'Cancelled', 'Refunded'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>
  </form>`;
};

export const taskForm = (t = {}) => `
  <form id="entityForm" novalidate>
    <div class="form-group">
      <label>Task *</label>
      <input name="title" required value="${esc(t.title || '')}" placeholder="e.g. Call customer about return" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Due date</label>
        <input name="due" type="date" value="${esc(t.due || '')}" />
      </div>
      <div class="form-group">
        <label>Related customer</label>
        <select name="customerId">
          <option value="">— None —</option>
          ${data.state().customers.map(c => `<option value="${c.id}" ${t.customerId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
    </div>
  </form>`;

export const campaignForm = (c = {}) => `
  <form id="entityForm" novalidate>
    <div class="form-group">
      <label>Campaign Name *</label>
      <input name="name" required value="${esc(c.name || '')}" placeholder="e.g. Diwali Mega Sale" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Channel</label>
        <select name="channel">
          ${['Email', 'SMS', 'WhatsApp', 'Push'].map(ch => `<option ${c.channel === ch ? 'selected' : ''}>${ch}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Audience Segment</label>
        <select name="segment">
          ${['All', 'VIP', 'Loyal', 'Regular', 'New'].map(s => `<option ${c.segment === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Message Preview</label>
      <textarea name="preview" rows="3" placeholder="Hi {name}, get 20% off your next order with code DIWALI20">${esc(c.preview || '')}</textarea>
      <div class="hint">Use <code>{name}</code> to personalize</div>
    </div>
  </form>`;

export const configForm = (cfg = {}) => `
  <form id="entityForm" class="ci-form" novalidate>
    <div class="form-group">
      <label>Name *</label>
      <input name="name" required value="${esc(cfg.name || '')}" style="font-family:inherit" placeholder="e.g. My Backend Orders" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Method</label>
        <select name="method" id="ciMethod">
          ${['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => `<option ${cfg.method === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="grid-column: span 2">
        <label>URL *</label>
        <input name="url" required value="${esc(cfg.url || '')}" placeholder="https://api.example.com/orders" />
      </div>
    </div>
    <div class="form-group">
      <label>Headers (env vars supported: <code>{{API_KEY}}</code>)</label>
      <div class="ci-headers" id="ciHeaders">
        ${(cfg.headers || []).map((h, i) => headerRow(h.k, h.v, i)).join('') || '<div class="text-muted" style="font-size:12px">No headers</div>'}
      </div>
      <button type="button" class="btn btn-ghost btn-sm mt-8" id="ciAddHeader">+ Add header</button>
    </div>
    <div class="form-group">
      <label>Body (JSON, optional)</label>
      <textarea name="body" rows="4" placeholder='{ "key": "value" }'>${esc(cfg.body || '')}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Env vars (JSON)</label>
        <textarea name="env" rows="3" placeholder='{"API_KEY": "sk_xxx"}' style="font-family:monospace">${esc(cfg.env ? JSON.stringify(cfg.env, null, 2) : '')}</textarea>
        <div class="hint">Reference in URL/headers as <code>{{KEY}}</code></div>
      </div>
      <div class="form-group">
        <label>Auto-refresh (sec, 0=off)</label>
        <input name="pollSec" type="number" min="0" max="3600" value="${cfg.pollSec || 0}" />
      </div>
    </div>
  </form>`;

export const headerRow = (k = '', v = '', i = 0) => `
  <div class="ci-headers-row">
    <input class="ci-hk" placeholder="Header name" value="${esc(k)}" />
    <input class="ci-hv" placeholder="Value (supports {{ENV}})" value="${esc(v)}" />
    <button type="button" class="icon-btn" data-rm>✕</button>
  </div>`;
