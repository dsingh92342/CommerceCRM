import { data } from '../utils/seed.js';
import { $, esc, storeChip, statusTag, initials, fmtDateTime, openModal, confirmDialog, toast } from '../utils/format.js';

let activeId = null;

export function renderMessages() {
  const msgs = data.state().messages;
  if (!msgs.find(m => m.id === activeId)) activeId = msgs[0]?.id;
  const unread = msgs.filter(m => m.unread).length;

  $('#pageTitle').textContent = 'Messages';
  $('#pageSubtitle').textContent = `${unread} unread · ${msgs.length} total`;

  $('#view').innerHTML = `
    <div class="filter-bar">
      <div class="spacer"></div>
      <button class="btn btn-ghost btn-sm" id="mAdd">+ Compose</button>
    </div>
    <div class="inbox">
      <div class="inbox-list" id="mList">
        ${msgs.map(m => `
          <div class="inbox-item ${m.unread ? 'unread' : ''} ${m.id === activeId ? 'active' : ''}" data-id="${m.id}">
            ${m.unread ? '<div class="unread-dot"></div>' : '<div style="width:8px"></div>'}
            <div style="flex:1; min-width:0">
              <div class="i-name">${esc(m.customer)}</div>
              <div class="i-subj">${esc(m.subject)}</div>
              <div class="i-preview">${esc(m.body)}</div>
            </div>
            <div class="i-time">${esc(m.time.slice(5))}</div>
          </div>`).join('') || '<div class="empty"><div class="empty-icon">💬</div>No messages</div>'}
      </div>
      <div class="inbox-detail" id="mDetail"></div>
    </div>
  `;

  $('#mList').querySelectorAll('.inbox-item').forEach(el => {
    el.onclick = () => {
      activeId = el.dataset.id;
      const m = data.state().messages.find(x => x.id === activeId);
      if (m && m.unread) { data.updateMessage(m.id, { unread: false }); }
      renderMessages();
    };
  });
  $('#mAdd').onclick = () => compose();

  drawDetail();
}

function drawDetail() {
  const m = data.state().messages.find(x => x.id === activeId);
  const el = $('#mDetail');
  if (!el) return;
  if (!m) { el.innerHTML = `<div class="empty"><div class="empty-icon">💬</div>Select a message to read</div>`; return; }
  el.innerHTML = `
    <div class="inbox-detail-head">
      <div class="inbox-detail-subj">${esc(m.subject)}</div>
      <div class="inbox-meta">
        <div class="row-flex">
          <div class="mini-avatar">${initials(m.customer)}</div>
          <div>
            <div style="font-weight:600; color:var(--text)">${esc(m.customer)}</div>
            <div>${esc(m.time)}</div>
          </div>
        </div>
        ${storeChip(data.state().stores, m.store)}
        ${statusTag(m.status)}
        <div class="spacer"></div>
        <button class="btn btn-ghost btn-sm" id="mDel">🗑 Delete</button>
        <button class="btn btn-ghost btn-sm" id="mClose">${m.status === 'Closed' ? '✓ Closed' : 'Mark closed'}</button>
      </div>
    </div>
    <div class="inbox-body">${esc(m.body)}</div>
    <div class="inbox-reply">
      <textarea id="mReply" placeholder="Type your reply to ${esc(m.customer)}..."></textarea>
      <div class="reply-actions">
        <button class="btn btn-ghost" id="mInsert">Insert customer name</button>
        <button class="btn btn-primary" id="mSend">Send Reply</button>
      </div>
    </div>
  `;
  $('#mSend').onclick = () => {
    const txt = $('#mReply').value.trim();
    if (!txt) { toast('Type a reply first', 'warning'); return; }
    toast('Reply sent to ' + m.customer, 'success');
    data.updateMessage(m.id, { status: 'Closed' });
    $('#mReply').value = '';
    renderMessages();
  };
  $('#mInsert').onclick = () => { $('#mReply').value += m.customer; };
  $('#mDel').onclick = async () => {
    if (await confirmDialog('Delete this message?')) { data.deleteMessage(m.id); activeId = null; renderMessages(); }
  };
  $('#mClose').onclick = () => { data.updateMessage(m.id, { status: 'Closed' }); renderMessages(); };
}

function compose() {
  openModal({
    title: 'New Message',
    body: `<form id="entityForm">
      <div class="form-group"><label>Customer *</label>
        <select name="customerId" required>
          <option value="">— Select —</option>
          ${data.state().customers.map(c => `<option value="${c.id}">${c.name} (${c.email})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Subject *</label><input name="subject" required placeholder="Subject"/></div>
      <div class="form-group"><label>Message *</label><textarea name="body" rows="5" required placeholder="Write your message..."></textarea></div>
    </form>`,
    onSubmit: (d) => {
      if (!d.customerId || !d.subject || !d.body) { toast('All fields required', 'error'); return; }
      const c = data.getCustomer(d.customerId);
      if (!c) return;
      data.addMessage({ customerId: c.id, customer: c.name, store: c.store, subject: d.subject, body: d.body });
      toast('Message created');
      $('#modalBackdrop').classList.remove('open');
      renderMessages();
    }
  });
}
