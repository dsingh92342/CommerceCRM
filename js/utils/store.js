// localStorage-backed reactive store
const KEY = 'crm_v2_state';

const DEFAULT_STATE = {
  stores: [
    { id: 'amazon',   name: 'Amazon',   color: '#ff9900', logo: 'AMZ', connected: true },
    { id: 'flipkart', name: 'Flipkart', color: '#2874f0', logo: 'FLP', connected: true },
    { id: 'meesho',   name: 'Meesho',   color: '#f43397', logo: 'MSH', connected: true },
    { id: 'myntra',   name: 'Myntra',   color: '#ff3f6c', logo: 'MYN', connected: true },
    { id: 'shopify',  name: 'Shopify',  color: '#95bf47', logo: 'SHP', connected: true }
  ],
  customers: [],
  orders: [],
  messages: [],
  notes: [],         // { id, customerId, body, createdAt }
  tasks: [],         // { id, title, due, done, customerId, orderId }
  campaigns: [],     // { id, name, channel, segment, status, sentAt, audienceSize }
  customConfigs: [], // { id, name, method, url, headers: [{k,v}], body, pollSec }
  theme: 'light',
  onboarded: false
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return seedDefaults(structuredClone(DEFAULT_STATE));
}

function seedDefaults(s) {
  // Seed with realistic sample data
  s.customers = [
    { id: 'C-1042', name: 'Aarav Sharma',   email: 'aarav.sharma@gmail.com',  phone: '+91 98100 12345', city: 'Mumbai',     store: 'amazon',   orders: 8,  spent: 18420, segment: 'VIP',     lastOrder: '2026-08-28' },
    { id: 'C-1041', name: 'Priya Iyer',     email: 'priya.iyer@outlook.com',  phone: '+91 99620 44112', city: 'Bengaluru',  store: 'flipkart', orders: 5,  spent:  9420, segment: 'Loyal',  lastOrder: '2026-09-01' },
    { id: 'C-1040', name: 'Rohan Mehta',    email: 'rohan.m@yahoo.com',       phone: '+91 99876 22310', city: 'Delhi',      store: 'myntra',   orders: 12, spent: 27890, segment: 'VIP',     lastOrder: '2026-08-30' },
    { id: 'C-1039', name: 'Sneha Kapoor',   email: 'sneha.kapoor@gmail.com',  phone: '+91 98765 88210', city: 'Pune',       store: 'amazon',   orders: 3,  spent:  4180, segment: 'New',     lastOrder: '2026-09-02' },
    { id: 'C-1038', name: 'Kunal Verma',    email: 'kunal.v@rediffmail.com',  phone: '+91 90220 11456', city: 'Hyderabad',  store: 'meesho',   orders: 6,  spent:  6210, segment: 'Regular', lastOrder: '2026-08-22' },
    { id: 'C-1037', name: 'Ananya Singh',   email: 'ananya.singh@gmail.com',  phone: '+91 99110 77892', city: 'Lucknow',    store: 'shopify',  orders: 2,  spent:  2490, segment: 'New',     lastOrder: '2026-08-19' },
    { id: 'C-1036', name: 'Vikram Patel',   email: 'vikram.p@gmail.com',      phone: '+91 90909 32010', city: 'Ahmedabad',  store: 'flipkart', orders: 9,  spent: 15600, segment: 'Loyal',   lastOrder: '2026-08-26' },
    { id: 'C-1035', name: 'Meera Reddy',    email: 'meera.r@gmail.com',       phone: '+91 94440 11380', city: 'Chennai',    store: 'myntra',   orders: 4,  spent:  7920, segment: 'Regular', lastOrder: '2026-08-15' },
    { id: 'C-1034', name: 'Aditya Joshi',   email: 'aditya.joshi@gmail.com',  phone: '+91 97710 44671', city: 'Jaipur',     store: 'amazon',   orders: 1,  spent:   890, segment: 'New',     lastOrder: '2026-09-03' },
    { id: 'C-1033', name: 'Riya Nair',      email: 'riya.nair@gmail.com',     phone: '+91 98950 88021', city: 'Kochi',      store: 'meesho',   orders: 7,  spent:  5340, segment: 'Regular', lastOrder: '2026-08-29' },
    { id: 'C-1032', name: 'Karthik Rao',    email: 'karthik.r@gmail.com',     phone: '+91 90080 44219', city: 'Mysuru',     store: 'shopify',  orders: 11, spent: 21500, segment: 'VIP',     lastOrder: '2026-08-25' },
    { id: 'C-1031', name: 'Pooja Desai',    email: 'pooja.d@gmail.com',       phone: '+91 99229 11880', city: 'Surat',      store: 'myntra',   orders: 3,  spent:  5680, segment: 'Regular', lastOrder: '2026-08-12' }
  ];
  s.orders = [
    { id: 'ORD-7821', customerId: 'C-1042', customer: 'Aarav Sharma',  store: 'amazon',   product: 'Wireless Earbuds Pro',     qty: 1, amount:  4999, status: 'Delivered',  date: '2026-09-04', timeline: [{s:'Placed',d:'2026-09-04'},{s:'Shipped',d:'2026-09-05'},{s:'Delivered',d:'2026-09-07'}] },
    { id: 'ORD-7820', customerId: 'C-1041', customer: 'Priya Iyer',    store: 'flipkart', product: 'Smart Fitness Band',       qty: 1, amount:  1899, status: 'Shipped',    date: '2026-09-04', timeline: [{s:'Placed',d:'2026-09-04'},{s:'Shipped',d:'2026-09-05'}] },
    { id: 'ORD-7819', customerId: 'C-1040', customer: 'Rohan Mehta',   store: 'myntra',   product: 'Designer Kurta Set',       qty: 2, amount:  3298, status: 'Processing', date: '2026-09-03', timeline: [{s:'Placed',d:'2026-09-03'}] },
    { id: 'ORD-7818', customerId: 'C-1039', customer: 'Sneha Kapoor',  store: 'amazon',   product: 'Phone Stand + Charger',    qty: 1, amount:   799, status: 'Delivered',  date: '2026-09-03', timeline: [{s:'Placed',d:'2026-09-03'},{s:'Shipped',d:'2026-09-04'},{s:'Delivered',d:'2026-09-06'}] },
    { id: 'ORD-7817', customerId: 'C-1038', customer: 'Kunal Verma',   store: 'meesho',   product: 'Cotton T-Shirt Combo',     qty: 3, amount:   899, status: 'Delivered',  date: '2026-09-02', timeline: [{s:'Placed',d:'2026-09-02'},{s:'Shipped',d:'2026-09-03'},{s:'Delivered',d:'2026-09-05'}] },
    { id: 'ORD-7816', customerId: 'C-1037', customer: 'Ananya Singh',  store: 'shopify',  product: 'Aromatherapy Candle Set',  qty: 1, amount:  1299, status: 'Return',     date: '2026-09-02', timeline: [{s:'Placed',d:'2026-09-02'},{s:'Shipped',d:'2026-09-03'},{s:'Delivered',d:'2026-09-05'},{s:'Return Requested',d:'2026-09-07'}] },
    { id: 'ORD-7815', customerId: 'C-1036', customer: 'Vikram Patel',  store: 'flipkart', product: 'Bluetooth Speaker',        qty: 1, amount:  2299, status: 'Delivered',  date: '2026-09-01', timeline: [{s:'Placed',d:'2026-09-01'},{s:'Shipped',d:'2026-09-02'},{s:'Delivered',d:'2026-09-04'}] },
    { id: 'ORD-7814', customerId: 'C-1035', customer: 'Meera Reddy',   store: 'myntra',   product: 'Ethnic Saree',             qty: 1, amount:  2499, status: 'Shipped',    date: '2026-09-01', timeline: [{s:'Placed',d:'2026-09-01'},{s:'Shipped',d:'2026-09-03'}] },
    { id: 'ORD-7813', customerId: 'C-1034', customer: 'Aditya Joshi',  store: 'amazon',   product: 'Laptop Sleeve 14"',        qty: 1, amount:   890, status: 'Cancelled',  date: '2026-08-31', timeline: [{s:'Placed',d:'2026-08-31'},{s:'Cancelled',d:'2026-08-31'}] },
    { id: 'ORD-7812', customerId: 'C-1033', customer: 'Riya Nair',     store: 'meesho',   product: 'Hair Care Combo Pack',     qty: 1, amount:   599, status: 'Delivered',  date: '2026-08-31', timeline: [{s:'Placed',d:'2026-08-31'},{s:'Shipped',d:'2026-09-01'},{s:'Delivered',d:'2026-09-03'}] },
    { id: 'ORD-7811', customerId: 'C-1042', customer: 'Aarav Sharma',  store: 'amazon',   product: 'USB-C Hub 7-in-1',         qty: 1, amount:  1799, status: 'Delivered',  date: '2026-08-30', timeline: [{s:'Placed',d:'2026-08-30'},{s:'Shipped',d:'2026-08-31'},{s:'Delivered',d:'2026-09-02'}] },
    { id: 'ORD-7810', customerId: 'C-1041', customer: 'Priya Iyer',    store: 'flipkart', product: 'Kitchen Knife Set',        qty: 1, amount:  1299, status: 'Processing', date: '2026-08-30', timeline: [{s:'Placed',d:'2026-08-30'}] },
    { id: 'ORD-7809', customerId: 'C-1032', customer: 'Karthik Rao',   store: 'shopify',  product: 'Leather Wallet',           qty: 1, amount:  3499, status: 'Refunded',   date: '2026-08-29', timeline: [{s:'Placed',d:'2026-08-29'},{s:'Shipped',d:'2026-08-30'},{s:'Delivered',d:'2026-09-02'},{s:'Refunded',d:'2026-09-04'}] },
    { id: 'ORD-7808', customerId: 'C-1031', customer: 'Pooja Desai',   store: 'myntra',   product: 'Casual Dress',             qty: 1, amount:  1899, status: 'Delivered',  date: '2026-08-28', timeline: [{s:'Placed',d:'2026-08-28'},{s:'Shipped',d:'2026-08-29'},{s:'Delivered',d:'2026-09-01'}] }
  ];
  s.messages = [
    { id: 'M-501', customerId: 'C-1042', customer: 'Aarav Sharma', store: 'amazon',   subject: 'Replacement for defective earbuds', body: 'Hi, the left earbud of ORD-7821 isn\'t charging. Can I get a replacement? I\'ve been a loyal customer for 2 years and this is the first issue.', time: '2026-09-05 09:24', unread: true, status: 'Open' },
    { id: 'M-502', customerId: 'C-1039', customer: 'Sneha Kapoor', store: 'amazon',   subject: 'Order delayed by 3 days',   body: 'My order ORD-7818 was supposed to arrive on 2nd Sep, still not received. Please help with the tracking.', time: '2026-09-05 08:11', unread: true, status: 'Open' },
    { id: 'M-503', customerId: 'C-1037', customer: 'Ananya Singh', store: 'shopify',  subject: 'Return pickup not scheduled', body: 'I requested a return for the candle set 2 days ago, no update yet. Can someone please schedule the pickup?', time: '2026-09-04 19:42', unread: true, status: 'Pending' },
    { id: 'M-504', customerId: 'C-1036', customer: 'Vikram Patel', store: 'flipkart', subject: 'Thanks for the fast delivery!', body: 'Just wanted to say the speaker arrived in perfect condition. Loving it!', time: '2026-09-04 14:08', unread: false, status: 'Closed' },
    { id: 'M-505', customerId: 'C-1033', customer: 'Riya Nair',    store: 'meesho',   subject: 'Coupon for next purchase?', body: 'Love your t-shirt quality. Can I get a loyalty coupon for my next order?', time: '2026-09-03 21:30', unread: false, status: 'Open' },
    { id: 'M-506', customerId: 'C-1040', customer: 'Rohan Mehta',  store: 'myntra',   subject: 'Bulk order inquiry',         body: 'I run a small boutique. Can we discuss wholesale pricing for kurta sets?', time: '2026-09-02 16:45', unread: false, status: 'Open' }
  ];
  s.tasks = [
    { id: 'T-1', title: 'Call Aarav about earbud replacement', due: '2026-09-06', done: false, customerId: 'C-1042', orderId: 'ORD-7821' },
    { id: 'T-2', title: 'Schedule return pickup for Ananya',  due: '2026-09-05', done: false, customerId: 'C-1037', orderId: 'ORD-7816' },
    { id: 'T-3', title: 'Send wholesale catalog to Rohan',     due: '2026-09-08', done: false, customerId: 'C-1040' },
    { id: 'T-4', title: 'Reorder inventory: T-shirt combo',    due: '2026-09-10', done: true,  customerId: null, orderId: null }
  ];
  s.campaigns = [
    { id: 'CMP-1', name: 'Festive Season Sale',     channel: 'Email', segment: 'VIP',     status: 'Sent',     sentAt: '2026-08-20', audienceSize: 4 },
    { id: 'CMP-2', name: 'Win-back inactive buyers', channel: 'Email', segment: 'Regular', status: 'Scheduled', sentAt: '2026-09-10', audienceSize: 4 },
    { id: 'CMP-3', name: 'New arrival alert',       channel: 'SMS',   segment: 'Loyal',   status: 'Draft',    sentAt: null,        audienceSize: 3 }
  ];
  s.onboarded = true;
  return s;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
}

export const store = {
  get: () => state,
  set: (patch) => { state = { ...state, ...patch }; save(); notify(); },
  update: (fn) => { state = fn(state); save(); notify(); },
  reset: () => { localStorage.removeItem(KEY); state = seedDefaults(structuredClone(DEFAULT_STATE)); save(); notify(); },
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); }
};
function notify() { listeners.forEach(fn => fn(state)); }

// Apply saved theme immediately
if (state.theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
