// Print-friendly invoice view for any order
import { data } from '../utils/seed.js';
import { $, esc, fmtINR, storeColor } from '../utils/format.js';

export function renderInvoice(orderId) {
  const order = data.state().orders.find(o => o.id === orderId);
  if (!order) {
    $('#view').innerHTML = `<div class="empty"><div class="empty-icon">🔍</div>Order not found</div>`;
    return;
  }
  const store = data.state().stores.find(s => s.id === order.store);
  const customer = data.state().customers.find(c => c.name === order.customer);
  const subtotal = order.amount;
  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + tax + shipping;

  $('#pageTitle').textContent = `Invoice ${order.id}`;
  $('#pageSubtitle').textContent = 'Printable invoice with tax breakdown';

  $('#view').innerHTML = `
    <div class="filter-bar">
      <button class="btn btn-ghost" onclick="history.back()">← Back</button>
      <div style="flex:1"></div>
      <button class="btn btn-primary" id="printBtn">🖨 Print / Save as PDF</button>
    </div>

    <div class="invoice" id="invoice">
      <div class="invoice-head">
        <div>
          <div class="invoice-brand">CommerceCRM</div>
          <div class="cell-sub">Seller Hub</div>
          <div class="cell-sub">support@commercecrm.app</div>
          <div class="cell-sub">GSTIN: 27ABCDE1234F1Z5</div>
        </div>
        <div class="right">
          <div style="font-size:28px; font-weight:800; letter-spacing:-.02em">INVOICE</div>
          <div class="cell-sub">#${esc(order.id)}</div>
          <div class="cell-sub">Date: ${esc(order.date)}</div>
          <div style="margin-top:8px"><span class="tag ${order.status === 'Delivered' ? 'success' : order.status === 'Cancelled' ? 'danger' : 'info'}">${esc(order.status)}</span></div>
        </div>
      </div>

      <div class="invoice-parties">
        <div>
          <div class="cell-sub" style="text-transform:uppercase; font-size:11px; letter-spacing:.05em; font-weight:600">Bill from</div>
          <div style="font-weight:700; margin-top:4px">CommerceCRM Trading</div>
          <div class="cell-sub">123 Market Street</div>
          <div class="cell-sub">Mumbai, MH 400001</div>
          <div class="cell-sub">India</div>
        </div>
        <div class="right">
          <div class="cell-sub" style="text-transform:uppercase; font-size:11px; letter-spacing:.05em; font-weight:600">Bill to</div>
          <div style="font-weight:700; margin-top:4px">${esc(order.customer)}</div>
          ${customer ? `
            <div class="cell-sub">${esc(customer.email)}</div>
            <div class="cell-sub">${esc(customer.phone)}</div>
            <div class="cell-sub">${esc(customer.city)}, India</div>
          ` : '<div class="cell-sub">—</div>'}
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Store</th>
            <th class="right">Qty</th>
            <th class="right">Rate</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${esc(order.product)}</strong><div class="cell-sub">SKU-${esc(order.id)}</div></td>
            <td><span class="store-chip-mini" style="--c:${storeColor(order.store)}">${esc(store?.name || order.store)}</span></td>
            <td class="right">${order.qty}</td>
            <td class="right">${fmtINR(Math.round(subtotal / order.qty))}</td>
            <td class="right"><strong>${fmtINR(subtotal)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="invoice-totals">
        <div class="right" style="min-width:280px">
          <div class="invoice-row"><span>Subtotal</span><strong>${fmtINR(subtotal)}</strong></div>
          <div class="invoice-row"><span>GST (18%)</span><strong>${fmtINR(tax)}</strong></div>
          <div class="invoice-row"><span>Shipping</span><strong>${shipping === 0 ? 'FREE' : fmtINR(shipping)}</strong></div>
          <div class="invoice-row grand"><span>Total</span><strong>${fmtINR(total)}</strong></div>
        </div>
      </div>

      <div class="invoice-foot">
        <div>
          <div class="cell-sub" style="text-transform:uppercase; font-size:11px; letter-spacing:.05em; font-weight:600">Payment</div>
          <div style="margin-top:4px">${esc(order.status === 'Cancelled' ? 'Refunded' : 'Paid via Marketplace')}</div>
        </div>
        <div class="right">
          <div class="cell-sub" style="text-transform:uppercase; font-size:11px; letter-spacing:.05em; font-weight:600">Channel</div>
          <div style="margin-top:4px">${esc(store?.name || order.store)}</div>
        </div>
      </div>

      <div class="invoice-note">
        Thanks for your business! For questions, contact support@commercecrm.app
      </div>
    </div>
  `;

  $('#printBtn').addEventListener('click', () => window.print());
}
