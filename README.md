<div align="center">

# 🛒 CommerceCRM

### A beautiful, multi-channel CRM for ecommerce sellers

Manage customers, orders, messages, tasks, campaigns, and integrations across **Amazon, Flipkart, Meesho, Myntra, and Shopify** — all from a single, fast, frontend-only dashboard.

![Status](https://img.shields.io/badge/status-ready-success)
![No Backend](https://img.shields.io/badge/backend-not%20required-blue)
![Storage](https://img.shields.io/badge/storage-localStorage-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

</div>

---

## ✨ Features at a Glance

| Module | What you can do |
|---|---|
| 📊 **Dashboard** | KPIs, daily orders chart, revenue by channel, recent orders, top customers, date-range filter (7/14/30/90 days) |
| 👥 **Customers** | Searchable, sortable, paginated table • 360° customer drawer (orders, messages, notes, spend chart) • full CRUD |
| 📦 **Orders** | Sortable/paginated table • status tabs • store filter • CSV export • click-through order detail with timeline |
| 🗂 **Pipeline (Kanban)** | Drag & drop orders between **Processing → Shipped → Delivered → Returns → Cancelled** • search & filter • per-column totals |
| 💬 **Messages** | Inbox-style two-pane view • unread badges • read/unread tracking • reply box |
| ✅ **Tasks** | Full CRUD • due dates • done/open status • link tasks to customers or orders |
| 📣 **Campaigns** | Audience builder (segment + store filter) • live preview of recipient count • email/SMS channels |
| ✉️ **Email Templates** | 3 starter templates with `{{name}}`, `{{store}}`, `{{link}}` variables • live preview • copy & "Use in Campaign" |
| 🧾 **Invoice** | Print-ready invoice per order • GST 18% • free-shipping logic • save as PDF via browser print |
| 🔌 **Integrations** | Channel cards with connect/disconnect toggles, sync stats, configure |
| ⚡ **Custom API** | Make any REST call • add custom headers • env-var placeholders • **polling mode** for live data • auto-detect table from JSON response |
| ⚙️ **Settings** | Dark mode • export/import/reset all data |

---

## 🎨 Design

- 🌗 **Light & dark mode** (toggle in topbar, persisted)
- 📱 **Fully responsive** with a mobile hamburger menu
- ⚡ **Keyboard shortcuts** — press `?` to see them all
- 🔔 **Toast notifications** for every action
- 🎯 **Safe rendering** — all user data is HTML-escaped (no XSS)
- ♿ **Accessible** — proper ARIA, keyboard navigation, focus styles

---

## 🚀 Quick Start

### Option 1 — Python (recommended)
```bash
cd path/to/first
python -m http.server 5500
# open http://localhost:5500
```

### Option 2 — Node
```bash
npx serve .
```

### Option 3 — VS Code
Install the **Live Server** extension, right-click `index.html` → **Open with Live Server**.

> ⚠️ You can't just double-click `index.html` (the `file://` protocol blocks ES module imports in some browsers). Always serve it over HTTP.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `D` | Dashboard |
| `C` | Customers |
| `O` | Orders |
| `P` | Pipeline (Kanban) |
| `M` | Messages |
| `K` | Campaigns |
| `E` | Templates |
| `N` | New (context-aware) |
| `/` | Focus search |
| `T` | Toggle theme |
| `?` | Show this help |
| `Esc` | Close any modal/drawer |

---

## 📁 Project Structure

```
first/
├── index.html              # App shell, sidebar, topbar, modals
├── README.md               # You are here
├── css/
│   └── styles.css          # Full design system (light + dark)
└── js/
    ├── app.js              # Router, shortcuts, theme, sidebar, toasts
    ├── utils/
    │   ├── format.js       # Helpers: ₹, dates, CSV, modal, drawer, pagination
    │   ├── store.js        # localStorage-backed reactive state
    │   └── seed.js         # Data layer: customers, orders, messages, etc.
    └── views/
        ├── dashboard.js    # KPIs + 2 charts + recent activity
        ├── customers.js    # Table + 360° drawer with spend chart
        ├── orders.js       # Table + detail drawer + timeline
        ├── kanban.js       # Drag-and-drop order pipeline
        ├── messages.js     # Inbox + read tracking
        ├── tasks.js        # Task list with due dates
        ├── campaigns.js    # Audience builder
        ├── templates.js    # Email templates with live preview
        ├── invoice.js      # Print-friendly invoice per order
        ├── integrations.js # Channel cards
        ├── custom.js       # Custom API client + polling
        ├── settings.js     # Theme, data management
        └── forms.js        # Reusable form templates
```

### Architectural notes

- **No build step** — pure ES modules, no bundler, no transpiler. Open the source in any browser DevTools and step through it.
- **Reactive store** — `store.js` is a tiny pub/sub over `localStorage`. Every component subscribes to changes; mutations auto-save.
- **Data layer** — `seed.js` is the only place that touches the store. Views call `data.addCustomer(...)`, `data.updateOrder(...)` etc. and never write to localStorage directly.
- **Routing** — Hash-based (`#dashboard`, `#customers`, `#invoice/ORD-7821`). No server config needed.

---

## 💾 Data Model

All data lives in `localStorage` under a single key `crm_v2_state`. You can export it from the **Settings** page and import it back — useful for moving between machines.

```jsonc
{
  "stores":     [{ "id": "amazon", "name": "Amazon", "color": "#ff9900", "logo": "AMZ", "connected": true }],
  "customers":  [{ "id": "C-1042", "name": "Aarav Sharma", "email": "...", "orders": 8, "spent": 18420, "segment": "VIP" }],
  "orders":     [{ "id": "ORD-7821", "customerId": "C-1042", "product": "Wireless Earbuds Pro", "amount": 4999, "status": "Delivered", "timeline": [{ "s": "Placed", "d": "2026-09-04" }] }],
  "messages":   [{ "id": "M-501", "customerId": "C-1042", "subject": "...", "unread": true }],
  "notes":      [{ "id": "N-1", "customerId": "C-1042", "body": "VIP - called about sizing" }],
  "tasks":      [{ "id": "T-1", "title": "Call Aarav", "due": "2026-09-06", "done": false, "customerId": "C-1042" }],
  "campaigns":  [{ "id": "CMP-1", "name": "Festive Sale", "channel": "Email", "segment": "VIP", "status": "Sent" }],
  "customConfigs": [{ "id": "cfg-1", "name": "My Backend", "url": "https://...", "pollSec": 60 }],
  "emailTemplates": [{ "id": "tpl-welcome", "name": "Welcome", "subject": "Hi {{name}}", "body": "..." }],
  "theme":      "light" | "dark",
  "onboarded":  true
}
```

### Customer Segments
- `VIP` — high spenders
- `Loyal` — repeat buyers
- `Regular` — occasional
- `New` — first order

Segments are auto-computed from spend & order count, but you can override them per customer.

---

## 🔌 Custom API Integration

The **⚡ Custom API** page lets you connect to **any** REST endpoint and visualize the data inside the CRM — no backend required.

### Features
- **Any HTTP method** (GET / POST / PUT / PATCH / DELETE)
- **Add unlimited custom headers** (Authorization, x-api-key, etc.)
- **JSON body** for non-GET requests
- **Saved configs** — your endpoints persist between sessions
- **Env-variable placeholders** like `{{API_KEY}}` — defined in the config form
- **Polling mode** — auto-refresh every N seconds for live data
- **Auto-detect** — if the response contains an array (in `data`, `items`, `results`, `users`, or `orders`), it's rendered as a table. Otherwise, a key-value view.
- **JSON view** — pretty-printed raw response

### Quick example
1. Open `#custom`
2. Preset: `JSONPlaceholder`
3. Click **▶ Send Request**
4. You should see a table of 10 users with 8 fields each

### CORS gotcha
Some APIs block browser requests. If you see `Network error`, the API doesn't allow cross-origin calls from the browser — proxy it through your own backend.

### Incoming webhooks
Browsers **can't** directly receive webhooks (there's no public URL). The Custom API page includes a copy-pasteable **Node.js Express server** snippet to deploy on Render/Railway, which forwards events back to the CRM via the API tab.

---

## 🧾 Invoices

Every order has a print-ready invoice at `#invoice/ORD-xxxx`. It includes:
- Your brand header + GSTIN
- Bill-from / bill-to blocks
- Line items with store, qty, rate, amount
- **Subtotal, GST (18%), Shipping, Grand Total**
- Payment status, channel

### Save as PDF
Open the invoice → click **🖨 Print / Save as PDF** → choose **Save as PDF** in the print dialog.

The print stylesheet hides the sidebar/topbar so only the invoice prints.

---

## 🎯 Roadmap (future)

- [ ] Real backend (Node + Postgres) for multi-user
- [ ] Real auth (email/password + OAuth)
- [ ] Real marketplace OAuth flows (Amazon SP-API, Shopify, etc.)
- [ ] Email/SMS sending (Twilio, SendGrid, SES)
- [ ] Inventory tracking
- [ ] Refund automation
- [ ] Mobile app (Capacitor / PWA install)
- [ ] Team roles (admin, sales, support)

---

## 🛠️ Built With

- **Vanilla JavaScript (ES modules)** — no frameworks, no dependencies
- **Chart.js 4.x** — for dashboard & customer spend charts
- **Inter font** — by Rasmus Andersson
- **~5,800 lines of hand-written code** across 16 files

---

## 🤝 Contributing

This is a single-developer project right now. PRs welcome! Some good first contributions:
- Add more chart types on the dashboard (revenue trend, cohort analysis)
- Add CSV import (currently only export works)
- Add more default email templates
- Translate the UI to other languages
- Add unit tests for the data layer

---

## 📝 License

you can't use this for commercial purpose

---

<div align="center">

**Made with ❤️ for small ecommerce sellers who are tired of juggling 5 dashboards.**

[⭐ Star this repo](#) · [🐛 Report a bug](#) · [💡 Request a feature](#)

</div>
