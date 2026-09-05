import { data } from '../utils/seed.js';
import { $, fmtINR, fmtPct, fmtNum, statusTag, storeChip, esc } from '../utils/format.js';

let charts = {};
let range = 7;

export function renderDashboard() {
  $('#pageTitle').textContent = 'Dashboard';
  $('#pageSubtitle').textContent = 'Overview of your multi-channel business';

  const a = data.analytics(range);
  const view = $('#view');
  view.innerHTML = `
    <div class="filter-bar">
      <div class="tabs" id="rangeTabs">
        ${[7, 14, 30, 90].map(r => `<button class="${r === range ? 'active' : ''}" data-r="${r}">${r} days</button>`).join('')}
      </div>
      <div class="spacer"></div>
      <button class="btn btn-ghost btn-sm" id="refreshBtn">↻ Refresh</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi kpi-clickable" data-kpi="revenue">
        <div class="kpi-label">Revenue (${range}d)</div>
        <div class="kpi-value">${fmtINR(a.totalRevenue)}</div>
        <div class="kpi-delta up">▲ 12.4%</div>
      </div>
      <div class="kpi kpi-clickable" data-kpi="orders">
        <div class="kpi-label">Orders (${range}d)</div>
        <div class="kpi-value">${fmtNum(a.totalOrders)}</div>
        <div class="kpi-delta up">▲ 8.1%</div>
      </div>
      <div class="kpi kpi-clickable" data-kpi="aov">
        <div class="kpi-label">Avg Order Value</div>
        <div class="kpi-value">${fmtINR(a.aov)}</div>
        <div class="kpi-delta up">▲ 3.2%</div>
      </div>
      <div class="kpi kpi-clickable" data-kpi="refund">
        <div class="kpi-label">Pending Refunds</div>
        <div class="kpi-value">${fmtINR(a.refundValue)}</div>
        <div class="kpi-delta down">Cancel rate ${fmtPct(a.cancelRate)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Daily Orders</div>
            <div class="card-sub">Volume across all channels</div>
          </div>
        </div>
        <div class="card-pad"><canvas id="lineChart" height="110"></canvas></div>
      </div>
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Revenue by Channel</div>
            <div class="card-sub">Share of revenue per marketplace</div>
          </div>
        </div>
        <div class="card-pad"><canvas id="doughChart" height="200"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <div class="card-title">Recent Orders</div>
          <a class="card-sub" href="#orders">View all →</a>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Store</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              ${data.state().orders.slice(0, 6).map(o => `
                <tr class="row-clickable" data-route="orders" data-id="${o.id}">
                  <td><div class="cell-name">${esc(o.id)}</div><div class="cell-sub">${esc(o.product)}</div></td>
                  <td>${esc(o.customer)}</td>
                  <td>${storeChip(data.state().stores, o.store)}</td>
                  <td><strong>${fmtINR(o.amount)}</strong></td>
                  <td>${statusTag(o.status)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <div class="card-title">Top Customers</div>
          <a class="card-sub" href="#customers">View all →</a>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Customer</th><th>Orders</th><th>Spent</th><th>Segment</th></tr></thead>
            <tbody>
              ${[...data.state().customers].sort((a, b) => b.spent - a.spent).slice(0, 5).map(c => `
                <tr class="row-clickable" data-route="customers" data-id="${c.id}">
                  <td><div class="cell-name">${esc(c.name)}</div><div class="cell-sub">${esc(c.city)}</div></td>
                  <td>${c.orders}</td>
                  <td><strong>${fmtINR(c.spent)}</strong></td>
                  <td>${statusTag(c.segment)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Range tabs
  $('#rangeTabs').querySelectorAll('button').forEach(b => {
    b.onclick = () => { range = +b.dataset.r; renderDashboard(); };
  });
  $('#refreshBtn').onclick = () => { renderDashboard(); };

  // KPI click -> relevant view
  view.querySelectorAll('.kpi-clickable').forEach(k => {
    k.onclick = () => {
      const map = { revenue: 'orders', orders: 'orders', aov: 'orders', refund: 'orders' };
      location.hash = '#' + (map[k.dataset.kpi] || 'orders');
    };
  });

  // Row clicks
  view.querySelectorAll('tr.row-clickable').forEach(r => {
    r.onclick = (e) => {
      e.stopPropagation();
      location.hash = '#' + r.dataset.route;
    };
  });

  drawCharts();
}

function drawCharts() {
  Object.values(charts).forEach(c => c.destroy());
  charts = {};
  const a = data.analytics(range);

  const lineEl = $('#lineChart');
  if (lineEl) {
    charts.line = new Chart(lineEl, {
      type: 'line',
      data: {
        labels: a.days.map(d => d.date),
        datasets: [
          { label: 'Orders', data: a.days.map(d => d.count), borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, .12)', fill: true, tension: .35, pointRadius: 4, borderWidth: 2, yAxisID: 'y' },
          { label: 'Revenue', data: a.days.map(d => d.revenue), borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, .08)', fill: false, tension: .35, pointRadius: 3, borderWidth: 2, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, position: 'left' },
          y1: { beginAtZero: true, position: 'right', grid: { display: false } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  const doughEl = $('#doughChart');
  if (doughEl) {
    charts.dough = new Chart(doughEl, {
      type: 'doughnut',
      data: {
        labels: a.byStore.map(s => s.name),
        datasets: [{ data: a.byStore.map(s => s.value), backgroundColor: a.byStore.map(s => s.color), borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } }
      }
    });
  }
}
