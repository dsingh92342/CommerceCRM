// Kanban board for orders pipeline — drag & drop between status columns
import { data } from '../utils/seed.js';
import { $, $$, esc, fmtINR, storeColor, toast } from '../utils/format.js';
import { store } from '../utils/store.js';

const COLUMNS = [
  { id: 'Processing', label: 'Processing', color: '#f59e0b', emoji: '⚙️' },
  { id: 'Shipped',    label: 'Shipped',    color: '#0ea5e9', emoji: '🚚' },
  { id: 'Delivered',  label: 'Delivered',  color: '#16a34a', emoji: '✅' },
  { id: 'Return',     label: 'Returns',    color: '#a855f7', emoji: '↩️' },
  { id: 'Cancelled',  label: 'Cancelled',  color: '#ef4444', emoji: '✕' }
];

export function renderKanban() {
  $('#pageTitle').textContent = 'Order Pipeline';
  $('#pageSubtitle').textContent = 'Drag and drop orders to update their status';

  const orders = data.state().orders;
  const grouped = COLUMNS.reduce((acc, c) => { acc[c.id] = []; return acc; }, {});
  orders.forEach(o => { if (grouped[o.status]) grouped[o.status].push(o); });

  const html = `
    <div class="filter-bar">
      <div class="search" style="width:300px"><span>🔍</span><input id="kSearch" placeholder="Search orders, customers, products..." /></div>
      <select id="kStore">
        <option value="All">All stores</option>
        ${data.state().stores.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
      </select>
      <div class="cell-sub" style="margin-left:auto">💡 Drag a card to change its status</div>
    </div>
    <div class="kanban" id="kanban">
      ${COLUMNS.map(col => {
        const items = grouped[col.id] || [];
        const total = items.reduce((s, o) => s + (o.status === 'Cancelled' ? 0 : o.amount), 0);
        return `
          <div class="kanban-col" data-status="${col.id}">
            <div class="kanban-col-head" style="--col:${col.color}">
              <div class="kanban-col-title">
                <span>${col.emoji}</span> ${col.label}
                <span class="kanban-count">${items.length}</span>
              </div>
              <div class="kanban-total">${fmtINR(total)}</div>
            </div>
            <div class="kanban-drop" data-status="${col.id}">
              ${items.map(o => kanbanCard(o)).join('')}
              ${items.length === 0 ? '<div class="kanban-empty">Drop here</div>' : ''}
            </div>
          </div>`;
      }).join('')}
    </div>`;
  $('#view').innerHTML = html;

  // Search
  $('#kSearch').addEventListener('input', e => filterKanban(e.target.value, $('#kStore').value));
  $('#kStore').addEventListener('change', e => filterKanban($('#kSearch').value, e.target.value));

  // Drag and drop
  let dragged = null;
  $$('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      dragged = card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
  $$('.kanban-drop').forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const newStatus = zone.dataset.status;
      const order = data.state().orders.find(o => o.id === dragged);
      if (order && order.status !== newStatus) {
        const oldStatus = order.status;
        order.status = newStatus;
        store.save();
        toast(`Order ${dragged} → ${newStatus}`, 'success');
        // If moved to Return, prompt for reason
        if (newStatus === 'Return' && oldStatus !== 'Return') {
          setTimeout(() => promptReturnReason(dragged), 200);
        }
        renderKanban();
      }
    });
  });
}

function kanbanCard(o) {
  return `
    <div class="kanban-card" draggable="true" data-id="${esc(o.id)}" title="Click to open">
      <div class="kanban-card-head">
        <span class="kanban-id">${esc(o.id)}</span>
        <span class="kanban-amount">${fmtINR(o.amount)}</span>
      </div>
      <div class="kanban-customer">${esc(o.customer)}</div>
      <div class="kanban-product">${esc(o.product)}</div>
      <div class="kanban-foot">
        <span class="store-chip-mini" style="--c:${storeColor(o.store)}">${esc(data.state().stores.find(s => s.id === o.store)?.name || o.store)}</span>
        <span class="cell-sub">${esc(o.date)}</span>
      </div>
    </div>`;
}

function filterKanban(q, storeFilter) {
  q = (q || '').toLowerCase();
  $$('.kanban-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    const matchesQ = !q || text.includes(q);
    const matchesStore = storeFilter === 'All' || card.textContent.toLowerCase().includes(storeFilter.toLowerCase());
    card.style.display = matchesQ && matchesStore ? '' : 'none';
  });
  // Hide empty columns that have no matches
  $$('.kanban-drop').forEach(zone => {
    const visible = [...zone.querySelectorAll('.kanban-card')].filter(c => c.style.display !== 'none');
    const empty = zone.querySelector('.kanban-empty');
    if (empty) empty.style.display = visible.length === 0 ? '' : 'none';
  });
}

function promptReturnReason(orderId) {
  const reason = prompt(`Reason for return of ${orderId}?`, 'Damaged product');
  if (reason) {
    const order = data.state().orders.find(o => o.id === orderId);
    if (order) {
      order.returnReason = reason;
      store.save();
      toast('Return reason saved', 'success');
    }
  }
}
