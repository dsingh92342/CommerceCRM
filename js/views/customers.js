import { data } from '../utils/seed.js';
import { $, esc, fmtINR, storeChip, statusTag, segmentTag, initials, openModal, confirmDialog, toast, paginate, renderPager, openDrawer, closeDrawer, fmtDate, fmtRelative } from '../utils/format.js';
import { customerForm } from './forms.js';

let filter = { search: '', segment: 'All', store: 'All' };
let sort = { key: 'spent', dir: 'desc' };
let page = 1;
const PER_PAGE = 8;

export function renderCustomers() {
  $('#pageTitle').textContent = 'Customers';
  $('#pageSubtitle').textContent = `${data.state().customers.length} customers across all channels`;

  const view = $('#view');
  view.innerHTML = `
    <div class="filter-bar">
      <div class="search"><span>🔍</span><input id="cSearch" placeholder="Search by name, email, city..." value="${esc(filter.search)}" /></div>
      <select id="cSegment">
        ${['All', 'VIP', 'Loyal', 'Regular', 'New'].map(s => `<option ${filter.segment === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <select id="cStore">
        <option value="All">All stores</option>
        ${data.state().stores.map(s => `<option value="${s.id}" ${filter.store === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
      </select>
      <div class="spacer"></div>
      <button class="btn btn-ghost btn-sm" id="cExport">⬇ Export CSV</button>
      <button class="btn btn-primary btn-sm" id="cAdd">+ Add Customer</button>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="sortable ${sort.key === 'name' ? 'sort-' + sort.dir : ''}" data-sort="name">Customer <span class="sort-arrow">▾</span></th>
              <th>Contact</th>
              <th class="sortable ${sort.key === 'store' ? 'sort-' + sort.dir : ''}" data-sort="store">Store <span class="sort-arrow">▾</span></th>
              <th class="sortable ${sort.key === 'orders' ? 'sort-' + sort.dir : ''}" data-sort="orders">Orders <span class="sort-arrow">▾</span></th>
              <th class="sortable ${sort.key === 'spent' ? 'sort-' + sort.dir : ''}" data-sort="spent">Spent <span class="sort-arrow">▾</span></th>
              <th class="sortable ${sort.key === 'segment' ? 'sort-' + sort.dir : ''}" data-sort="segment">Segment <span class="sort-arrow">▾</span></th>
              <th class="sortable ${sort.key === 'lastOrder' ? 'sort-' + sort.dir : ''}" data-sort="lastOrder">Last Order <span class="sort-arrow">▾</span></th>
              <th></th>
            </tr>
          </thead>
          <tbody id="cTbody"></tbody>
        </table>
      </div>
      <div class="pagination" id="cPager"></div>
    </div>
  `;

  // Events
  $('#cSearch').oninput = e => { filter.search = e.target.value; page = 1; draw(); };
  $('#cSegment').onchange = e => { filter.segment = e.target.value; page = 1; draw(); };
  $('#cStore').onchange = e => { filter.store = e.target.value; page = 1; draw(); };
  $('#cAdd').onclick = () => openCustomerForm();
  $('#cExport').onclick = () => {
    const rows = filtered().map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, city: c.city, store: c.store, orders: c.orders, spent: c.spent, segment: c.segment, lastOrder: c.lastOrder }));
    import('../utils/format.js').then(m => m.exportCSV(`customers-${new Date().toISOString().slice(0,10)}.csv`, rows));
    toast(`Exported ${rows.length} customers`);
  };
  view.querySelectorAll('th.sortable').forEach(th => {
    th.onclick = () => {
      const k = th.dataset.sort;
      if (sort.key === k) sort.dir = sort.dir === 'asc' ? 'desc' : 'asc';
      else { sort.key = k; sort.dir = 'asc'; }
      page = 1; draw();
    };
  });

  draw();
}

function filtered() {
  const q = filter.search.toLowerCase();
  let rows = data.state().customers.filter(c => {
    if (filter.segment !== 'All' && c.segment !== filter.segment) return false;
    if (filter.store !== 'All' && c.store !== filter.store) return false;
    if (q && !(c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q))) return false;
    return true;
  });
  rows = [...rows].sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key];
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
    return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
  return rows;
}

function draw() {
  const all = filtered();
  const { rows, page: p, pages, total } = paginate(all, page, PER_PAGE);
  const tbody = $('#cTbody');
  if (!tbody) return;
  if (!total) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="table-empty"><div class="emoji">🔎</div>No customers match your filters</div></td></tr>`;
  } else {
    tbody.innerHTML = rows.map(c => `
      <tr data-id="${c.id}">
        <td>
          <div class="row-flex">
            <div class="mini-avatar">${initials(c.name)}</div>
            <div>
              <div class="cell-name">${esc(c.name)}</div>
              <div class="cell-sub">${esc(c.id)} · ${esc(c.city || '—')}</div>
            </div>
          </div>
        </td>
        <td>
          <div>${esc(c.email)}</div>
          <div class="cell-sub">${esc(c.phone || '')}</div>
        </td>
        <td>${storeChip(data.state().stores, c.store)}</td>
        <td>${c.orders}</td>
        <td><strong>${fmtINR(c.spent)}</strong></td>
        <td>${segmentTag(c.segment)}</td>
        <td>${esc(c.lastOrder || '—')}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-act="view" title="View">👁</button>
            <button class="icon-btn" data-act="edit" title="Edit">✎</button>
            <button class="icon-btn" data-act="del" title="Delete">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('tr').forEach(tr => {
      const id = tr.dataset.id;
      tr.onclick = () => openCustomer360(id);
      tr.querySelector('[data-act="view"]').onclick = (e) => { e.stopPropagation(); openCustomer360(id); };
      tr.querySelector('[data-act="edit"]').onclick = (e) => { e.stopPropagation(); openCustomerForm(data.getCustomer(id)); };
      tr.querySelector('[data-act="del"]').onclick = async (e) => {
        e.stopPropagation();
        if (await confirmDialog('Delete this customer and all their orders?')) {
          data.deleteCustomer(id);
          toast('Customer deleted', 'success');
          renderCustomers();
        }
      };
    });
  }
  renderPager($('#cPager'), p, pages, np => { page = np; draw(); });
}

export function openCustomerForm(c = null) {
  openModal({
    title: c ? `Edit ${c.name}` : 'Add Customer',
    body: customerForm(c || {}),
    onSubmit: (d) => {
      if (!d.name?.trim()) { toast('Name is required', 'error'); return; }
      if (!d.email?.trim() || !d.email.includes('@')) { toast('Valid email required', 'error'); return; }
      if (c) { data.updateCustomer(c.id, d); toast('Customer updated'); }
      else { data.addCustomer(d); toast('Customer added'); }
      $('#modalBackdrop').classList.remove('open');
      renderCustomers();
    }
  });
}

function openCustomer360(id) {
  const c = data.getCustomer(id);
  if (!c) return;
  const orders = data.state().orders.filter(o => o.customerId === id);
  const messages = data.state().messages.filter(m => m.customerId === id);
  const notes = data.state().notes.filter(n => n.customerId === id);
  const tasks = data.state().tasks.filter(t => t.customerId === id);

  openDrawer(`
    <div class="drawer-head">
      <div class="row-flex">
        <div class="mini-avatar" style="width:44px;height:44px;font-size:15px">${initials(c.name)}</div>
        <div>
          <div style="font-size:18px;font-weight:700">${esc(c.name)}</div>
          <div class="cell-sub">${esc(c.id)} · ${segmentTag(c.segment)}</div>
        </div>
      </div>
      <button class="icon-btn" data-drawer-close>✕</button>
    </div>
    <div class="drawer-body">
      <div class="grid-3" style="grid-template-columns:repeat(3,1fr);gap:10px;margin-top:0">
        <div class="kpi"><div class="kpi-label">Orders</div><div class="kpi-value" style="font-size:20px">${c.orders}</div></div>
        <div class="kpi"><div class="kpi-label">Spent</div><div class="kpi-value" style="font-size:20px">${fmtINR(c.spent)}</div></div>
        <div class="kpi"><div class="kpi-label">AOV</div><div class="kpi-value" style="font-size:20px">${fmtINR(c.orders ? c.spent / c.orders : 0)}</div></div>
      </div>

      <div class="mt-16">
        <div class="card-title">Contact</div>
        <div class="cell-sub mt-8">📧 ${esc(c.email)}</div>
        <div class="cell-sub">📱 ${esc(c.phone || '—')}</div>
        <div class="cell-sub">📍 ${esc(c.city || '—')}</div>
        <div class="cell-sub">🏪 ${storeChip(data.state().stores, c.store)}</div>
      </div>

      <div class="mt-16">
        <div class="between">
          <div class="card-title">Spend over time</div>
          <div class="cell-sub">${orders.length} order${orders.length === 1 ? '' : 's'}</div>
        </div>
        <div style="height:180px; margin-top:8px"><canvas id="custChart"></canvas></div>
      </div>

      <div class="mt-16">
        <div class="between">
          <div class="card-title">Orders (${orders.length})</div>
        </div>
        <div class="mt-8">
          ${orders.slice(0, 5).map(o => `
            <div class="row-flex" style="padding:8px 0; border-bottom:1px solid var(--border)">
              <div style="flex:1">
                <div class="cell-name">${esc(o.id)} · ${esc(o.product)}</div>
                <div class="cell-sub">${esc(o.date)}</div>
              </div>
              <div style="text-align:right">
                <div><strong>${fmtINR(o.amount)}</strong></div>
                <div class="mt-8">${statusTag(o.status)}</div>
              </div>
            </div>`).join('') || '<div class="text-muted" style="font-size:12.5px; padding:12px 0">No orders yet</div>'}
        </div>
      </div>

      <div class="mt-16">
        <div class="card-title">Notes</div>
        <div class="row-flex mt-8">
          <input id="noteInput" placeholder="Add an internal note..." style="flex:1; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--panel); color:var(--text)" />
          <button class="btn btn-primary btn-sm" id="addNoteBtn">Add</button>
        </div>
        <div class="mt-8" id="notesList">
          ${notes.map(n => `
            <div class="note-card" data-id="${n.id}">
              <div>${esc(n.body)}</div>
              <div class="note-meta"><span>${fmtRelative(n.createdAt)}</span><button class="linklike" data-del-note="${n.id}">Delete</button></div>
            </div>`).join('') || '<div class="text-muted" style="font-size:12.5px; padding:8px 0">No notes yet</div>'}
        </div>
      </div>

      <div class="mt-16">
        <div class="card-title">Recent Messages</div>
        <div class="mt-8">
          ${messages.slice(0, 3).map(m => `
            <div class="note-card">
              <div><strong>${esc(m.subject)}</strong></div>
              <div class="cell-sub mt-8">${esc(m.body.slice(0, 120))}${m.body.length > 120 ? '…' : ''}</div>
              <div class="note-meta"><span>${esc(m.time)}</span>${statusTag(m.status)}</div>
            </div>`).join('') || '<div class="text-muted" style="font-size:12.5px">No messages</div>'}
        </div>
      </div>

      <div class="mt-16" style="display:flex; gap:8px">
        <button class="btn btn-primary" id="drawerEmail">📧 Email</button>
        <button class="btn btn-ghost" id="drawerTask">✓ New Task</button>
        <button class="btn btn-ghost" id="drawerEdit">✎ Edit</button>
      </div>
    </div>
  `);

  // Wire up drawer actions
  $('#addNoteBtn').onclick = () => {
    const v = $('#noteInput').value.trim();
    if (!v) return;
    data.addNote(id, v);
    openCustomer360(id);
  };
  document.querySelectorAll('[data-del-note]').forEach(b => {
    b.onclick = () => { data.deleteNote(b.dataset.delNote); openCustomer360(id); };
  });
  $('#drawerEmail').onclick = () => { location.hash = '#messages'; };
  $('#drawerTask').onclick = () => {
    openModal({
      title: 'New Task',
      body: `<form id="entityForm"><div class="form-group"><label>Task</label><input name="title" required placeholder="e.g. Follow up call"/></div><input type="hidden" name="customerId" value="${id}"/></form>`,
      onSubmit: (d) => { data.addTask({ title: d.title, customerId: id }); toast('Task added'); $('#modalBackdrop').classList.remove('open'); }
    });
  };
  $('#drawerEdit').onclick = () => { closeDrawer(); openCustomerForm(c); };

  // Render spend-over-time chart
  const chartEl = document.getElementById('custChart');
  if (chartEl && window.Chart) {
    if (window._custChart) window._custChart.destroy();
    const sorted = [...orders].sort((a, b) => a.date.localeCompare(b.date));
    const labels = sorted.map(o => o.date);
    const values = sorted.map(o => o.amount);
    // Cumulative spend
    let cum = 0; const cumValues = values.map(v => (cum += v));
    window._custChart = new Chart(chartEl, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['No orders'],
        datasets: [
          { label: 'Order', data: values, borderColor: '#94a3b8', backgroundColor: 'transparent', tension: .3, pointRadius: 3, borderWidth: 1.5 },
          { label: 'Cumulative', data: cumValues.length ? cumValues : [0], borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,.12)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 8, font: { size: 11 } } } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'k' } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }
      }
    });
  }
}
