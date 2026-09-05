import { data } from '../utils/seed.js';
import { $, esc, fmtDate, openModal, confirmDialog, toast } from '../utils/format.js';
import { taskForm } from './forms.js';

let filter = { tab: 'pending' };

export function renderTasks() {
  const all = data.state().tasks;
  const pending = all.filter(t => !t.done);
  $('#pageTitle').textContent = 'Tasks';
  $('#pageSubtitle').textContent = `${pending.length} pending · ${all.length} total`;

  $('#view').innerHTML = `
    <div class="filter-bar">
      <div class="tabs" id="tTabs">
        <button class="${filter.tab === 'pending' ? 'active' : ''}" data-tab="pending">Pending (${pending.length})</button>
        <button class="${filter.tab === 'done' ? 'active' : ''}" data-tab="done">Completed (${all.length - pending.length})</button>
        <button class="${filter.tab === 'all' ? 'active' : ''}" data-tab="all">All</button>
      </div>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-sm" id="tAdd">+ New Task</button>
    </div>
    <div class="card card-pad" id="tList"></div>
  `;

  $('#tAdd').onclick = () => openTaskForm();
  $('#tTabs').querySelectorAll('button').forEach(b => {
    b.onclick = () => { filter.tab = b.dataset.tab; draw(); $('#tTabs').querySelectorAll('button').forEach(x => x.classList.remove('active')); b.classList.add('active'); };
  });

  draw();
}

function draw() {
  let rows = data.state().tasks;
  if (filter.tab === 'pending') rows = rows.filter(t => !t.done);
  else if (filter.tab === 'done') rows = rows.filter(t => t.done);
  rows = rows.sort((a, b) => (a.done === b.done ? new Date(a.due) - new Date(b.due) : a.done ? 1 : -1));

  const el = $('#tList');
  if (!rows.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">✅</div>No ${filter.tab} tasks</div>`;
    return;
  }
  el.innerHTML = rows.map(t => {
    const overdue = !t.done && new Date(t.due) < new Date(new Date().toISOString().slice(0, 10));
    const customer = t.customerId ? data.getCustomer(t.customerId) : null;
    return `
    <div class="row-flex" style="padding:12px 0; border-bottom:1px solid var(--border)" data-id="${t.id}">
      <input type="checkbox" class="checkbox" ${t.done ? 'checked' : ''} data-toggle/>
      <div style="flex:1; ${t.done ? 'opacity:.5; text-decoration:line-through' : ''}">
        <div style="font-weight:600">${esc(t.title)}</div>
        <div class="cell-sub">
          📅 <span style="color:${overdue ? 'var(--danger)' : 'inherit'}">${esc(t.due || 'No date')}${overdue ? ' (overdue)' : ''}</span>
          ${customer ? ` · 👤 ${esc(customer.name)}` : ''}
        </div>
      </div>
      <div class="row-actions" style="opacity:1">
        <button class="icon-btn" data-edit title="Edit">✎</button>
        <button class="icon-btn" data-del title="Delete">🗑</button>
      </div>
    </div>`;
  }).join('');

  el.querySelectorAll('[data-id]').forEach(row => {
    const id = row.dataset.id;
    row.querySelector('[data-toggle]').onchange = () => { data.toggleTask(id); renderTasks(); };
    row.querySelector('[data-edit]').onclick = () => { const t = data.state().tasks.find(x => x.id === id); openTaskForm(t); };
    row.querySelector('[data-del]').onclick = async () => {
      if (await confirmDialog('Delete this task?')) { data.deleteTask(id); renderTasks(); }
    };
  });
}

export function openTaskForm(t = null) {
  openModal({
    title: t ? 'Edit Task' : 'New Task',
    body: taskForm(t || {}),
    onSubmit: (d) => {
      if (!d.title?.trim()) { toast('Title required', 'error'); return; }
      const payload = { ...d, customerId: d.customerId || null };
      if (t) { data.updateTask(t.id, payload); toast('Task updated'); }
      else { data.addTask(payload); toast('Task added'); }
      $('#modalBackdrop').classList.remove('open');
      renderTasks();
    }
  });
}
