import { data } from '../utils/seed.js';
import { $, esc, fmtNum, openModal, confirmDialog, toast, statusTag } from '../utils/format.js';
import { campaignForm } from './forms.js';

export function renderCampaigns() {
  const camps = data.state().campaigns;
  $('#pageTitle').textContent = 'Campaigns';
  $('#pageSubtitle').textContent = `${camps.length} campaigns · ${camps.filter(c => c.status === 'Sent').length} sent`;

  $('#view').innerHTML = `
    <div class="filter-bar">
      <div class="spacer"></div>
      <button class="btn btn-primary btn-sm" id="cAdd">+ New Campaign</button>
    </div>
    <div class="grid-3">
      ${camps.map(c => `
        <div class="card card-pad">
          <div class="between">
            <div>
              <div style="font-size:15px;font-weight:700">${esc(c.name)}</div>
              <div class="cell-sub mt-8">${c.channel} · ${esc(c.segment)}</div>
            </div>
            ${statusTag(c.status)}
          </div>
          <div class="row-flex mt-16" style="gap:20px">
            <div>
              <div class="cell-sub">Audience</div>
              <div style="font-weight:700;font-size:18px">${fmtNum(c.audienceSize)}</div>
            </div>
            <div>
              <div class="cell-sub">${c.status === 'Sent' ? 'Sent at' : c.status === 'Scheduled' ? 'Scheduled' : 'Created'}</div>
              <div style="font-weight:600">${esc(c.sentAt || '—')}</div>
            </div>
          </div>
          <div class="row-flex mt-16" style="gap:8px">
            ${c.status === 'Draft' ? `<button class="btn btn-primary btn-sm" data-act="send" data-id="${c.id}">▶ Send now</button>` : ''}
            ${c.status === 'Draft' ? `<button class="btn btn-ghost btn-sm" data-act="schedule" data-id="${c.id}">⏰ Schedule</button>` : ''}
            <button class="btn btn-ghost btn-sm" data-act="edit" data-id="${c.id}">✎ Edit</button>
            <button class="btn btn-ghost btn-sm" data-act="dup" data-id="${c.id}">⧉ Duplicate</button>
            <div class="spacer"></div>
            <button class="icon-btn" data-act="del" data-id="${c.id}">🗑</button>
          </div>
        </div>
      `).join('') || '<div class="empty"><div class="empty-icon">📣</div>No campaigns yet — create your first one</div>'}
    </div>
  `;

  $('#cAdd').onclick = () => openForm();
  $('#view').querySelectorAll('[data-act]').forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.id;
      const c = camps.find(x => x.id === id);
      if (!c) return;
      if (b.dataset.act === 'edit') openForm(c);
      else if (b.dataset.act === 'dup') { data.addCampaign({ ...c, name: c.name + ' (copy)', status: 'Draft', sentAt: null }); toast('Duplicated'); renderCampaigns(); }
      else if (b.dataset.act === 'del') {
        if (await confirmDialog('Delete this campaign?')) { data.deleteCampaign(id); renderCampaigns(); }
      }
      else if (b.dataset.act === 'send') {
        data.updateCampaign(id, { status: 'Sent', sentAt: new Date().toISOString().slice(0, 10) });
        toast('Campaign sent to ' + c.audienceSize + ' recipients', 'success');
        renderCampaigns();
      }
      else if (b.dataset.act === 'schedule') {
        const d = prompt('Schedule date (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
        if (d) { data.updateCampaign(id, { status: 'Scheduled', sentAt: d }); toast('Scheduled for ' + d); renderCampaigns(); }
      }
    };
  });
}

export function openForm(c = null) {
  openModal({
    title: c ? 'Edit Campaign' : 'New Campaign',
    body: campaignForm(c || {}),
    onSubmit: (d) => {
      if (!d.name?.trim()) { toast('Name required', 'error'); return; }
      if (c) { data.updateCampaign(c.id, d); toast('Campaign updated'); }
      else { data.addCampaign(d); toast('Campaign created'); }
      $('#modalBackdrop').classList.remove('open');
      renderCampaigns();
    }
  });
}
