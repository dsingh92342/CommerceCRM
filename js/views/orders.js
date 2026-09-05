import { data } from '../utils/seed.js';
import { $, esc, fmtINR, fmtDate, storeChip, statusTag, openModal, confirmDialog, toast, paginate, renderPager, openDrawer, closeDrawer, STATUS_TAG } from '../utils/format.js';
import { orderForm } from './forms.js';

let filter = { status: 'All', store: 'All' };
let sort = { key: 'date', dir: 'desc' };
let page = 1;
const PER_PAGE = 10;

export function renderOrders() {
  $('#pageTitle').textContent = 'Orders';
  $('#pageSubtitle').textContent = `Track ${data.state().orders.length} orders across all marketplaces`;

  const view = $('#view');
  view.innerHTML = `
    <div class="filter-bar">
      <div class="tabs" id="oTabs">
        ${['All', 'Processing', 'Shipped', 'Delivered', 'Return', 'Cancelled', 'Refunded'].map(s =>
          `<button class="${filter.status === s ? 'active' : ''}" data-s="${s}">${s}</button>`).join('')}
      </div>
      <select id="oStore" style="margin-left:auto">
        <option value="All">All stores</option>
        ${data.state().stores.map(s => `<option value="${s.id}" ${filter.store === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
      </select>
      <button class="btn btn-ghost btn-sm" id="oExport">⬇ Export</button>
      <button class="btn btn-primary btn-sm" id="oAdd">+ New Order</button>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="sortable ${sort.key === 'id' ? 'sort-' + sort.dir : ''}" data-sort="id">Order <span class="sort-arrow">▾</span></th>
              <th class="sortable ${sort.key === 'customer' ? 'sort-' + sort.dir : ''}" data-sort="customer">Customer <span class="sort-arrow">▾</span></th>
              <th>Product</th>
              <th>Store</th>
              <th class="sortable ${sort.key === 'qty' ? 'sort-' + sort.dir : ''}" data-sort="qty">Qty <span class="sort-arrow">▾</span></th>
              <th class="sortable ${sort.key === 'amount' ? 'sort-' + sort.dir : ''}" data-sort="amount">Amount <span class="sort-arrow">▾</span></th>
              <th>Status</th>
              <th class="sortable ${sort.key === 'date' ? 'sort-' + sort.dir : ''}" data-sort="date">Date <span class="sort-arrow">▾</span></th>
              <th></th>
            </tr>
          </thead>
          <tbody id="oTbody"></tbody>
        </table>
      </div>
      <div class="pagination" id="oPager"></div>
    </div>
  `;

  $('#oStore').onchange = e => { filter.store = e.target.value; page = 1; draw(); };
  $('#oAdd').onclick = () => openOrderForm();
  $('#oExport').onclick = () => {
    const rows = filtered().map(o => ({ id: o.id, customer: o.customer, product: o.product, store: o.store, qty: o.qty, amount: o.amount, status: o.status, date: o.date }));
    import('../utils/format.js').then(m => m.exportCSV(`orders-${new Date().toISOString().slice(0,10)}.csv`, rows));
    toast(`Exported ${rows.length} orders`);
  };
  $('#oTabs').querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      filter.status = b.dataset.s;
      $('#oTabs').querySelectorAll('button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      page = 1; draw();
    };
  });
  view.querySelectorAll('th.sortable').forEach(th => {
    th.onclick = () => {
      const k = th.dataset.sort;
      if (sort.key === k) sort.dir = sort.dir === 'asc' ? 'desc' : 'asc';
      else { sort.key = k; sort.dir = 'asc'; }
      draw();
    };
  });

  draw();
}

function filtered() {
  let rows = data.state().orders.filter(o => {
    if (filter.status !== 'All' && o.status !== filter.status) return false;
    if (filter.store !== 'All' && o.store !== filter.store) return false;
    return true;
  });
  rows = [...rows].sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key];
    if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
    return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
  return rows;
}

function draw() {
  const all = filtered();
  const { rows, page: p, pages, total } = paginate(all, page, PER_PAGE);
  const tbody = $('#oTbody');
  if (!total) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="table-empty"><div class="emoji">📦</div>No orders found</div></td></tr>`;
  } else {
    tbody.innerHTML = rows.map(o => `
      <tr data-id="${o.id}">
        <td><span class="cell-name">${esc(o.id)}</span></td>
        <td>${esc(o.customer)}</td>
        <td>${esc(o.product)}</td>
        <td>${storeChip(data.state().stores, o.store)}</td>
        <td>${o.qty}</td>
        <td><strong>${fmtINR(o.amount)}</strong></td>
        <td>${statusTag(o.status)}</td>
        <td>${esc(o.date)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-act="view" title="View">👁</button>
            <button class="icon-btn" data-act="invoice" title="Invoice">🧾</button>
            <button class="icon-btn" data-act="edit" title="Edit">✎</button>
            <button class="icon-btn" data-act="del" title="Delete">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('tr').forEach(tr => {
      const id = tr.dataset.id;
      tr.onclick = () => openOrderDetail(id);
      tr.querySelector('[data-act="view"]').onclick = e => { e.stopPropagation(); openOrderDetail(id); };
      tr.querySelector('[data-act="invoice"]').onclick = e => { e.stopPropagation(); location.hash = '#invoice/' + id; };
      tr.querySelector('[data-act="edit"]').onclick = e => { e.stopPropagation(); openOrderForm(data.getOrder(id)); };
      tr.querySelector('[data-act="del"]').onclick = async e => {
        e.stopPropagation();
        if (await confirmDialog('Delete this order?')) {
          data.deleteOrder(id);
          toast('Order deleted');
          renderOrders();
        }
      };
    });
  }
  renderPager($('#oPager'), p, pages, np => { page = np; draw(); });
}

export function openOrderForm(o = null) {
  openModal({
    title: o ? `Edit ${o.id}` : 'Create Order',
    body: orderForm(o || {}),
    size: '600px',
    onSubmit: (d) => {
      if (!d.product?.trim()) { toast('Product required', 'error'); return; }
      if (!d.customerId) { toast('Select a customer', 'error'); return; }
      if (!d.amount || +d.amount <= 0) { toast('Amount must be > 0', 'error'); return; }
      const customer = data.getCustomer(d.customerId);
      const payload = { ...d, qty: +d.qty || 1, amount: +d.amount, customer: customer?.name || '' };
      if (o) { data.updateOrder(o.id, payload); toast('Order updated'); }
      else { data.addOrder(payload); toast('Order created'); }
      $('#modalBackdrop').classList.remove('open');
      renderOrders();
    }
  });
}

function openOrderDetail(id) {
  const o = data.getOrder(id);
  if (!o) return;
  const customer = data.getCustomer(o.customerId);
  const timeline = o.timeline || [];
  const currentStep = timeline.length;

  openDrawer(`
    <div class="drawer-head">
      <div>
        <div style="font-size:18px;font-weight:700">${esc(o.id)}</div>
        <div class="cell-sub">${esc(o.product)} · ${esc(o.date)}</div>
      </div>
      <button class="icon-btn" data-drawer-close>✕</button>
    </div>
    <div class="drawer-body">
      <div class="kpi-grid col-3" style="grid-template-columns:repeat(3,1fr)">
        <div class="kpi"><div class="kpi-label">Amount</div><div class="kpi-value" style="font-size:20px">${fmtINR(o.amount)}</div></div>
        <div class="kpi"><div class="kpi-label">Qty</div><div class="kpi-value" style="font-size:20px">${o.qty}</div></div>
        <div class="kpi"><div class="kpi-label">Status</div><div class="kpi-value" style="font-size:16px">${statusTag(o.status)}</div></div>
      </div>

      <div class="mt-16">
        <div class="between">
          <div class="card-title">Customer</div>
          ${customer ? `<button class="linklike" id="oViewCust">View profile</button>` : ''}
        </div>
        <div class="mt-8 cell-sub">
          <strong>${esc(o.customer)}</strong> · ${storeChip(data.state().stores, o.store)}
        </div>
      </div>

      <div class="mt-16">
        <div class="between">
          <div class="card-title">Timeline</div>
          <button class="btn btn-ghost btn-sm" id="oAdvance">→ Advance status</button>
        </div>
        <div class="timeline mt-16">
          ${timeline.map((t, i) => `
            <div class="timeline-item ${i < currentStep - 1 ? 'done' : ''}">
              <div class="timeline-time">${esc(t.d)}</div>
              <div class="timeline-title">${esc(t.s)}</div>
            </div>`).join('') || '<div class="text-muted" style="font-size:12.5px">No events yet</div>'}
        </div>
      </div>

      ${o.status === 'Return' || o.status === 'Refunded' ? `
        <div class="mt-16 card card-pad" style="background:var(--panel-2)">
          <div class="card-title">RMA / Refund</div>
          <div class="cell-sub mt-8">Reason: Customer reported product defect</div>
          <div class="cell-sub">Status: ${statusTag(o.status === 'Refunded' ? 'Refund Processed' : 'RMA Approved')}</div>
        </div>` : ''}

      <div class="mt-16" style="display:flex; gap:8px; flex-wrap:wrap">
        <button class="btn btn-primary" id="oEdit">✎ Edit</button>
        <button class="btn btn-ghost" id="oInvoice">🧾 Invoice</button>
        <button class="btn btn-ghost" id="oTrack">📦 Track</button>
        ${o.status !== 'Cancelled' && o.status !== 'Refunded' ? `<button class="btn btn-danger" id="oCancel">✕ Cancel</button>` : ''}
      </div>
    </div>
  `);

  if (customer) $('#oViewCust').onclick = () => { closeDrawer(); setTimeout(() => location.hash = '#customers', 50); };
  $('#oEdit').onclick = () => { closeDrawer(); openOrderForm(o); };
  $('#oInvoice').onclick = () => { closeDrawer(); location.hash = '#invoice/' + o.id; };
  $('#oTrack').onclick = () => toast('Tracking link sent to ' + o.customer, 'info');
  const cancelBtn = $('#oCancel');
  if (cancelBtn) cancelBtn.onclick = async () => {
    if (await confirmDialog('Cancel this order?')) {
      data.updateOrder(o.id, { status: 'Cancelled', timeline: [...timeline, { s: 'Cancelled', d: new Date().toISOString().slice(0, 10) }] });
      toast('Order cancelled', 'warning');
      closeDrawer();
      renderOrders();
    }
  };
  $('#oAdvance').onclick = () => {
    const flow = { Processing: 'Shipped', Shipped: 'Delivered', Delivered: null, Return: 'Refund Processed', Cancelled: null, Refunded: null };
    const next = flow[o.status];
    if (!next) { toast('Cannot advance further', 'warning'); return; }
    data.updateOrder(o.id, { status: next, timeline: [...timeline, { s: next, d: new Date().toISOString().slice(0, 10) }] });
    toast('Status: ' + next, 'success');
    openOrderDetail(id);
  };
}
