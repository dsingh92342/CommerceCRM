// Format & DOM utilities
export const fmtINR = n => '₹' + Math.round(n || 0).toLocaleString('en-IN');
export const fmtNum = n => (n || 0).toLocaleString('en-IN');
export const fmtPct = n => (n || 0).toFixed(1) + '%';
export const fmtDate = d => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const fmtDateTime = d => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
export const fmtRelative = d => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  const diffMs = Date.now() - date.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return min + 'm ago';
  const hr = Math.round(min / 60);
  if (hr < 24) return hr + 'h ago';
  const day = Math.round(hr / 24);
  if (day < 30) return day + 'd ago';
  return fmtDate(date);
};
export const initials = name => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
export const uid = (prefix = 'ID') => prefix + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

export const STATUS_TAG = {
  Delivered: 'success', Shipped: 'info', Processing: 'warning', Return: 'warning',
  Cancelled: 'danger', Refunded: 'danger', Open: 'info', Pending: 'warning', Closed: 'success',
  'Awaiting Pickup': 'warning', 'RMA Approved': 'info', 'Refund Processed': 'success',
  Sent: 'success', Scheduled: 'info', Draft: 'warning'
};
export const SEGMENT_TAG = { VIP: 'vip', Loyal: 'info', Regular: '', New: 'new' };
export const STORE_BY_ID = (stores, id) => stores.find(s => s.id === id);
export const storeColor = id => {
  const m = { amazon: '#ff9900', flipkart: '#2874f0', meesho: '#f43397', myntra: '#ff3f6c', shopify: '#95bf47' };
  return m[id] || '#94a3b8';
};
export const storeChip = (stores, id) => {
  const s = STORE_BY_ID(stores, id);
  if (!s) return '';
  return `<span class="store-chip" style="--c:${s.color};--c-soft:${s.color}22">${s.name}</span>`;
};
export const statusTag = s => `<span class="tag ${STATUS_TAG[s] || ''}">${s}</span>`;
export const segmentTag = s => `<span class="tag ${SEGMENT_TAG[s] || ''}">${s}</span>`;

// === Safe HTML (escape all user-controlled data) ===
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
// tagged template: html`<div>${userInput}</div>` is safe
export const html = (strings, ...vals) =>
  strings.reduce((acc, s, i) => acc + s + (i < vals.length ? esc(vals[i]) : ''), '');

// === DOM ===
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

// === CSV export ===
export const exportCSV = (filename, rows) => {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const escCsv = v => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => escCsv(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// === Toasts ===
let toastSeq = 0;
export const toast = (msg, type = 'success', duration = 3000) => {
  const wrap = $('#toastWrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  el.innerHTML = `<span class="toast-icon">${icons[type] || '✓'}</span><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; el.style.transition = 'all .2s'; }, duration - 200);
  setTimeout(() => el.remove(), duration);
};

// === Modal helpers ===
export const openModal = ({ title, body, onSubmit, submitLabel = 'Save', size, hideFooter = false }) => {
  $('#modalTitle').textContent = title;
  const modal = $('#modal');
  if (size) modal.style.maxWidth = size; else modal.style.maxWidth = '';
  const mbody = $('#modalBody');
  mbody.innerHTML = '';
  if (typeof body === 'string') mbody.innerHTML = body; else mbody.appendChild(body);
  $('#modalBackdrop').classList.add('open');
  const close = () => $('#modalBackdrop').classList.remove('open');
  $('#modalClose').onclick = close;
  if (onSubmit && !hideFooter) {
    const form = mbody.querySelector('form');
    if (form) {
      // ensure submit button
      let submit = form.querySelector('[type="submit"]');
      if (!submit) {
        submit = document.createElement('button');
        submit.type = 'submit';
        submit.className = 'btn btn-primary';
        submit.textContent = submitLabel;
      }
      const footer = document.createElement('div');
      footer.style.cssText = 'display:flex; gap:8px; justify-content:flex-end; margin-top:16px';
      const cancel = document.createElement('button');
      cancel.type = 'button'; cancel.className = 'btn btn-ghost'; cancel.textContent = 'Cancel';
      cancel.onclick = close;
      footer.appendChild(cancel);
      footer.appendChild(submit);
      form.appendChild(footer);
      form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        try { await onSubmit(data, form); } catch (err) { toast(err.message || 'Failed', 'error'); }
      };
    }
  }
  return { close };
};

export const confirmDialog = (msg) => new Promise(resolve => {
  openModal({
    title: 'Are you sure?',
    body: `<p style="margin-bottom:16px">${esc(msg)}</p>
      <div style="display:flex; gap:8px; justify-content:flex-end">
        <button class="btn btn-ghost" id="cfCancel">Cancel</button>
        <button class="btn btn-danger" id="cfOk">Delete</button>
      </div>`,
    size: '420px', hideFooter: true
  });
  $('#cfCancel').onclick = () => { $('#modalBackdrop').classList.remove('open'); resolve(false); };
  $('#cfOk').onclick = () => { $('#modalBackdrop').classList.remove('open'); resolve(true); };
});

// === Drawer ===
export const openDrawer = (content) => {
  const d = $('#drawer');
  if (typeof content === 'string') d.innerHTML = content; else { d.innerHTML = ''; d.appendChild(content); }
  $('#drawerBackdrop').classList.add('open');
  d.classList.add('open');
};
export const closeDrawer = () => {
  $('#drawerBackdrop').classList.remove('open');
  $('#drawer').classList.remove('open');
};

// === Pagination ===
export const paginate = (rows, page, perPage) => {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * perPage;
  return { rows: rows.slice(start, start + perPage), page: p, pages, total };
};

export const renderPager = (el, page, pages, onChange) => {
  if (!el) return;
  el.innerHTML = `
    <div>Page <strong>${page}</strong> of <strong>${pages}</strong> · ${pages > 1 ? Math.ceil(pages*10) : ''} total</div>
    <div class="pages">
      <button class="page-btn" data-p="first" ${page === 1 ? 'disabled' : ''}>«</button>
      <button class="page-btn" data-p="prev" ${page === 1 ? 'disabled' : ''}>‹</button>
      ${Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        const n = i + 1;
        return `<button class="page-btn ${n === page ? 'active' : ''}" data-p="${n}">${n}</button>`;
      }).join('')}
      <button class="page-btn" data-p="next" ${page === pages ? 'disabled' : ''}>›</button>
      <button class="page-btn" data-p="last" ${page === pages ? 'disabled' : ''}>»</button>
    </div>`;
  el.querySelectorAll('button[data-p]').forEach(b => {
    b.onclick = () => {
      const p = b.dataset.p;
      let next = page;
      if (p === 'first') next = 1;
      else if (p === 'prev') next = page - 1;
      else if (p === 'next') next = page + 1;
      else if (p === 'last') next = pages;
      else next = +p;
      onChange(next);
    };
  });
};
