// App shell: routing, shortcuts, mobile menu, theme, sidebar
import { renderDashboard } from './views/dashboard.js';
import { renderCustomers, openCustomerForm } from './views/customers.js';
import { renderOrders, openOrderForm } from './views/orders.js';
import { renderMessages } from './views/messages.js';
import { renderTasks, openTaskForm } from './views/tasks.js';
import { renderCampaigns, openForm as openCampaignForm } from './views/campaigns.js';
import { renderTemplates } from './views/templates.js';
import { renderIntegrations } from './views/integrations.js';
import { renderCustom, openConfigForm } from './views/custom.js';
import { renderSettings } from './views/settings.js';
import { renderKanban } from './views/kanban.js';
import { renderInvoice } from './views/invoice.js';
import { data } from './utils/seed.js';
import { store } from './utils/store.js';
import { $, $$, on, toast, openModal, closeDrawer } from './utils/format.js';

const routes = {
  dashboard: renderDashboard,
  customers: renderCustomers,
  orders: renderOrders,
  messages: renderMessages,
  tasks: renderTasks,
  campaigns: renderCampaigns,
  templates: renderTemplates,
  integrations: renderIntegrations,
  custom: renderCustom,
  settings: renderSettings,
  kanban: renderKanban
};

function setActive(route) {
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === route));
}

let currentRoute = null;
function navigate() {
  let route = (location.hash.replace('#', '') || 'dashboard').toLowerCase();

  // Handle invoice subroute: #invoice/ORD-1234
  if (route.startsWith('invoice/')) {
    const orderId = (location.hash.replace('#', '').split('/')[1] || '').toUpperCase();
    setActive('orders');
    currentRoute = 'orders';
    closeDrawer();
    $('#modalBackdrop').classList.remove('open');
    try { renderInvoice(orderId); } catch (e) { console.error(e); toast('Failed to render invoice: ' + e.message, 'error'); }
    return;
  }

  const fn = routes[route] || renderDashboard;
  setActive(route in routes ? route : 'dashboard');
  currentRoute = route in routes ? route : 'dashboard';
  closeDrawer();
  $('#modalBackdrop').classList.remove('open');
  try { fn(); } catch (e) { console.error(e); toast('Failed to render: ' + e.message, 'error'); }
  // Update badges
  const s = data.state();
  const mb = $('#msgBadge'); if (mb) mb.textContent = s.messages.filter(m => m.unread).length;
  // Mobile sidebar close
  $('#sidebar').classList.remove('open');
  $('#sidebarBackdrop').classList.remove('open');
}

window.addEventListener('hashchange', navigate);

// === Sidebar mobile ===
on($('#menuBtn'), 'click', () => { $('#sidebar').classList.add('open'); $('#sidebarBackdrop').classList.add('open'); });
on($('#closeSidebar'), 'click', () => { $('#sidebar').classList.remove('open'); $('#sidebarBackdrop').classList.remove('open'); });
on($('#sidebarBackdrop'), 'click', () => { $('#sidebar').classList.remove('open'); $('#sidebarBackdrop').classList.remove('open'); });

// === Theme ===
const setTheme = (t) => {
  document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : '');
  store.set({ theme: t });
  const btn = $('#themeBtn'); if (btn) btn.textContent = t === 'dark' ? '☀' : '🌙';
  const mbtn = $('#themeBtnMobile'); if (mbtn) mbtn.textContent = t === 'dark' ? '☀' : '🌙';
};
on($('#themeBtn'), 'click', () => setTheme(data.state().theme === 'dark' ? 'light' : 'dark'));
on($('#themeBtnMobile'), 'click', () => setTheme(data.state().theme === 'dark' ? 'light' : 'dark'));

// === Connected stores (sidebar) ===
function renderConnectedStores() {
  const s = data.state();
  const el = $('#connectedStores');
  if (!el) return;
  el.innerHTML = s.stores.map(x => `<div class="store-pill ${x.connected ? 'connected' : ''}" style="--c:${x.color}" title="${x.name}">${x.logo}</div>`).join('');
}

// === Global search ===
on($('#globalSearch'), 'keydown', (e) => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const s = data.state();
    const hit = s.customers.find(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    if (hit) { location.hash = '#customers'; setTimeout(() => openCustomer360(hit.id), 50); return; }
    const order = s.orders.find(o => o.id.toLowerCase().includes(q) || o.product.toLowerCase().includes(q));
    if (order) { location.hash = '#orders'; return; }
    toast('No results for "' + q + '"', 'info');
  }
});

// === New button context ===
on($('#newBtn'), 'click', () => {
  const r = currentRoute;
  if (r === 'customers') openCustomerForm();
  else if (r === 'orders') openOrderForm();
  else if (r === 'tasks') openTaskForm();
  else if (r === 'campaigns') openCampaignForm();
  else if (r === 'custom') openConfigForm();
  else {
    openModal({
      title: 'Create new',
      body: `<p class="text-muted" style="margin-bottom:12px">Where do you want to add something?</p>
        <div style="display:grid; gap:8px">
          <button class="btn btn-ghost" data-go="customers" style="justify-content:flex-start">👤 Customer</button>
          <button class="btn btn-ghost" data-go="orders" style="justify-content:flex-start">📦 Order</button>
          <button class="btn btn-ghost" data-go="tasks" style="justify-content:flex-start">✅ Task</button>
          <button class="btn btn-ghost" data-go="campaigns" style="justify-content:flex-start">📣 Campaign</button>
        </div>`,
      hideFooter: true, size: '380px'
    });
    document.querySelectorAll('[data-go]').forEach(b => {
      b.onclick = () => { $('#modalBackdrop').classList.remove('open'); location.hash = '#' + b.dataset.go; setTimeout(() => $('#newBtn').click(), 100); };
    });
  }
});

// === Keyboard shortcuts ===
document.addEventListener('keydown', (e) => {
  const tag = e.target.tagName;
  const inField = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

  if (e.key === 'Escape') {
    $('#modalBackdrop').classList.remove('open');
    $('#helpBackdrop').classList.remove('open');
    closeDrawer();
    return;
  }
  if (inField) return;

  if (e.key === '/') { e.preventDefault(); $('#globalSearch').focus(); return; }
  if (e.key === '?') { e.preventDefault(); $('#helpBackdrop').classList.add('open'); return; }
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); $('#newBtn').click(); return; }
  if (e.key === 't' || e.key === 'T') { e.preventDefault(); setTheme(data.state().theme === 'dark' ? 'light' : 'dark'); return; }
  const keys = { d: 'dashboard', c: 'customers', o: 'orders', p: 'kanban', m: 'messages', k: 'campaigns', e: 'templates' };
  if (keys[e.key.toLowerCase()]) {
    e.preventDefault();
    location.hash = '#' + keys[e.key.toLowerCase()];
  }
});
on($('#helpClose'), 'click', () => $('#helpBackdrop').classList.remove('open'));
on($('#helpBackdrop'), 'click', (e) => { if (e.target.id === 'helpBackdrop') e.target.classList.remove('open'); });
on($('#modalBackdrop'), 'click', (e) => { if (e.target.id === 'modalBackdrop') e.target.classList.remove('open'); });

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  // Apply theme
  setTheme(data.state().theme || 'light');
  renderConnectedStores();
  navigate();
  // Re-render connected stores when state changes
  store.subscribe(renderConnectedStores);
  // Update storage info
  const info = $('#storageInfo');
  if (info) info.textContent = `Local data: ${data.state().customers.length} customers · ${data.state().orders.length} orders`;
});
