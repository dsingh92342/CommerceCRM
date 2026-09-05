// Email templates for campaigns — saved templates with variable substitution
import { data } from '../utils/seed.js';
import { $, $$, esc, toast, confirmDialog, openModal } from '../utils/format.js';
import { store } from '../utils/store.js';

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-welcome',
    name: 'Welcome new customer',
    subject: 'Welcome to {{store}}, {{name}}!',
    body: `Hi {{name}},

Welcome to {{store}}! We're thrilled to have you.

Use code WELCOME10 to get 10% off your first order.

Happy shopping!
The {{store}} Team`,
    variables: ['name', 'store']
  },
  {
    id: 'tpl-vip',
    name: 'VIP early access',
    subject: '{{name}}, get early access to new arrivals',
    body: `Hi {{name}},

As one of our VIP customers, you get 24-hour early access to our new collection.

Shop now: {{link}}

Cheers,
{{store}}`,
    variables: ['name', 'store', 'link']
  },
  {
    id: 'tpl-reorder',
    name: 'Reorder reminder',
    subject: '{{name}}, time to restock?',
    body: `Hi {{name}},

It's been a while since your last order. We've got new styles you'll love.

Browse: {{link}}

Thanks,
{{store}}`,
    variables: ['name', 'store', 'link']
  }
];

export function getTemplates() {
  const s = store.get();
  if (!s.emailTemplates || !Array.isArray(s.emailTemplates)) {
    store.set({ emailTemplates: DEFAULT_TEMPLATES });
    return DEFAULT_TEMPLATES;
  }
  return s.emailTemplates;
}

function saveTemplates(list) {
  store.set({ emailTemplates: list });
}

export function renderTemplates() {
  $('#pageTitle').textContent = 'Email Templates';
  $('#pageSubtitle').textContent = 'Reusable email templates for your campaigns';

  const templates = getTemplates();

  const html = `
    <div class="filter-bar">
      <button class="btn btn-primary" id="tplNew">+ New Template</button>
      <button class="btn btn-ghost" id="tplReset">Reset to defaults</button>
      <div class="cell-sub" style="margin-left:auto">Use {{name}}, {{store}}, {{link}} etc. — they'll auto-fill per recipient</div>
    </div>

    <div class="grid-2" style="grid-template-columns: 1fr 1.4fr">
      <div class="card">
        <div class="card-head">
          <div class="card-title">Your templates</div>
        </div>
        <div id="tplList" style="padding:8px">
          ${templates.map(t => `
            <div class="tpl-item" data-id="${esc(t.id)}">
              <div>
                <div class="cell-name">${esc(t.name)}</div>
                <div class="cell-sub">${esc(t.subject)}</div>
              </div>
              <div class="flex gap-8">
                <button class="icon-btn tpl-edit" title="Edit">✎</button>
                <button class="icon-btn tpl-del" title="Delete">🗑</button>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Preview & test</div>
            <div class="card-sub">See how a template renders with sample data</div>
          </div>
        </div>
        <div class="card-pad">
          <div class="form-group">
            <label>Sample recipient (name, email)</label>
            <input id="tplSampleName" value="Aarav Sharma" />
          </div>
          <div class="form-group">
            <label>Store</label>
            <select id="tplSampleStore">${data.state().stores.map(s => `<option>${s.name}</option>`).join('')}</select>
          </div>
          <div class="form-group">
            <label>Link</label>
            <input id="tplSampleLink" value="https://example.com/new" />
          </div>
          <div id="tplPreview"></div>
        </div>
      </div>
    </div>`;
  $('#view').innerHTML = html;

  $('#tplNew').addEventListener('click', () => editTemplate(null));
  $('#tplReset').addEventListener('click', async () => {
    if (await confirmDialog('Reset all templates to defaults?')) {
      saveTemplates(DEFAULT_TEMPLATES);
      toast('Templates reset', 'success');
      renderTemplates();
    }
  });

  $$('.tpl-edit').forEach(b => b.addEventListener('click', () => {
    const id = b.closest('.tpl-item').dataset.id;
    editTemplate(getTemplates().find(t => t.id === id));
  }));
  $$('.tpl-del').forEach(b => b.addEventListener('click', async () => {
    const id = b.closest('.tpl-item').dataset.id;
    if (await confirmDialog('Delete this template?')) {
      const list = getTemplates().filter(t => t.id !== id);
      saveTemplates(list);
      toast('Template deleted', 'success');
      renderTemplates();
    }
  }));

  $$('.tpl-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      const id = el.dataset.id;
      const t = getTemplates().find(x => x.id === id);
      renderPreview(t);
      $$('.tpl-item').forEach(x => x.classList.toggle('active', x === el));
    });
  });

  ['tplSampleName', 'tplSampleStore', 'tplSampleLink'].forEach(id => {
    $('#' + id).addEventListener('input', updateActivePreview);
    $('#' + id).addEventListener('change', updateActivePreview);
  });

  // Auto-select first
  const first = $('.tpl-item');
  if (first) { first.classList.add('active'); renderPreview(getTemplates()[0]); }
}

function updateActivePreview() {
  const active = $('.tpl-item.active');
  if (!active) return;
  renderPreview(getTemplates().find(t => t.id === active.dataset.id));
}

function renderPreview(t) {
  const sample = {
    name: $('#tplSampleName').value || 'Customer',
    store: $('#tplSampleStore').value,
    link: $('#tplSampleLink').value || 'https://example.com'
  };
  const subject = fillVars(t.subject, sample);
  const body = fillVars(t.body, sample);
  $('#tplPreview').innerHTML = `
    <div class="card" style="border:1px solid var(--border); border-radius:8px; overflow:hidden">
      <div style="padding:14px 18px; border-bottom:1px solid var(--border); background:#fafbff">
        <div class="cell-sub">Subject</div>
        <div style="font-weight:600; margin-top:4px">${esc(subject)}</div>
      </div>
      <div style="padding:18px; white-space:pre-wrap; font-family:inherit; line-height:1.7">${esc(body)}</div>
    </div>
    <div class="flex gap-8 mt-16" style="justify-content:flex-end">
      <button class="btn btn-ghost" id="tplCopy">📋 Copy</button>
      <button class="btn btn-primary" id="tplUseInCampaign">Use in Campaign</button>
    </div>`;
  $('#tplCopy').addEventListener('click', () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast('Copied to clipboard', 'success');
  });
  $('#tplUseInCampaign').addEventListener('click', () => {
    store.set({ selectedTemplateId: t.id });
    location.hash = '#campaigns';
    toast('Template selected. Open a campaign to use it.', 'info');
  });
}

function fillVars(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || `{{${k}}}`);
}

function editTemplate(t) {
  const isNew = !t;
  const tpl = t || { name: '', subject: '', body: '', variables: ['name', 'store'] };
  openModal(`
    <form id="tplForm">
      <div class="form-group">
        <label>Template name *</label>
        <input name="name" required value="${esc(tpl.name)}" placeholder="e.g. Welcome email" />
      </div>
      <div class="form-group">
        <label>Subject *</label>
        <input name="subject" required value="${esc(tpl.subject)}" placeholder="Hi {{name}}, welcome!" />
      </div>
      <div class="form-group">
        <label>Body *</label>
        <textarea name="body" required rows="10" style="font-family:inherit; resize:vertical">${esc(tpl.body)}</textarea>
      </div>
      <div class="cell-sub" style="font-size:12px">Available variables: <code>{{name}}</code>, <code>{{store}}</code>, <code>{{link}}</code> — type them in your text and they'll be replaced per recipient.</div>
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:14px">
        <button type="button" class="btn btn-ghost" data-close>Cancel</button>
        <button type="submit" class="btn btn-primary">${isNew ? 'Create' : 'Save'}</button>
      </div>
    </form>`, isNew ? 'New Template' : 'Edit Template');

  $('#tplForm').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const list = getTemplates();
    const entry = {
      id: tpl.id || 'tpl-' + Date.now(),
      name: fd.get('name').trim(),
      subject: fd.get('subject').trim(),
      body: fd.get('body'),
      variables: ['name', 'store', 'link']
    };
    if (isNew) list.push(entry); else {
      const idx = list.findIndex(x => x.id === tpl.id);
      if (idx >= 0) list[idx] = entry;
    }
    saveTemplates(list);
    toast(isNew ? 'Template created' : 'Template saved', 'success');
    document.getElementById('modalBackdrop').classList.remove('open');
    renderTemplates();
  });
}
