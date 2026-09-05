// Reactive data layer over the store
import { store } from './store.js';
import { uid, todayISO, daysAgo } from './format.js';

export const data = {
  state: () => store.get(),

  // === Customers ===
  addCustomer: (c) => {
    const customer = { id: uid('C'), orders: 0, spent: 0, lastOrder: '—', segment: 'New', ...c };
    store.update(s => ({ ...s, customers: [customer, ...s.customers] }));
    return customer;
  },
  updateCustomer: (id, patch) => store.update(s => ({
    ...s, customers: s.customers.map(c => c.id === id ? { ...c, ...patch } : c)
  })),
  deleteCustomer: (id) => store.update(s => ({
    ...s,
    customers: s.customers.filter(c => c.id !== id),
    orders: s.orders.filter(o => o.customerId !== id),
    messages: s.messages.filter(m => m.customerId !== id)
  })),
  getCustomer: (id) => store.get().customers.find(c => c.id === id),

  // === Orders ===
  addOrder: (o) => {
    const order = {
      id: uid('ORD'),
      date: todayISO(),
      timeline: [{ s: 'Placed', d: todayISO() }],
      ...o
    };
    store.update(s => {
      const customers = s.customers.map(c => {
        if (c.id !== order.customerId) return c;
        return { ...c, orders: (c.orders || 0) + 1, spent: (c.spent || 0) + order.amount, lastOrder: order.date };
      });
      return { ...s, orders: [order, ...s.orders], customers };
    });
    return order;
  },
  updateOrder: (id, patch) => store.update(s => ({
    ...s, orders: s.orders.map(o => o.id === id ? { ...o, ...patch } : o)
  })),
  deleteOrder: (id) => store.update(s => ({
    ...s, orders: s.orders.filter(o => o.id !== id)
  })),
  getOrder: (id) => store.get().orders.find(o => o.id === id),

  // === Messages ===
  addMessage: (m) => {
    const msg = { id: uid('M'), time: new Date().toISOString().slice(0, 16).replace('T', ' '), unread: true, status: 'Open', ...m };
    store.update(s => ({ ...s, messages: [msg, ...s.messages] }));
    return msg;
  },
  updateMessage: (id, patch) => store.update(s => ({
    ...s, messages: s.messages.map(m => m.id === id ? { ...m, ...patch } : m)
  })),
  deleteMessage: (id) => store.update(s => ({
    ...s, messages: s.messages.filter(m => m.id !== id)
  })),

  // === Notes (per customer) ===
  addNote: (customerId, body) => {
    const n = { id: uid('N'), customerId, body, createdAt: new Date().toISOString() };
    store.update(s => ({ ...s, notes: [n, ...s.notes] }));
    return n;
  },
  deleteNote: (id) => store.update(s => ({ ...s, notes: s.notes.filter(n => n.id !== id) })),

  // === Tasks ===
  addTask: (t) => {
    const task = { id: uid('T'), done: false, due: todayISO(), ...t };
    store.update(s => ({ ...s, tasks: [task, ...s.tasks] }));
    return task;
  },
  toggleTask: (id) => store.update(s => ({
    ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
  })),
  updateTask: (id, patch) => store.update(s => ({
    ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch } : t)
  })),
  deleteTask: (id) => store.update(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) })),

  // === Campaigns ===
  addCampaign: (c) => {
    const segment = c.segment || 'All';
    const audienceSize = segment === 'All'
      ? store.get().customers.length
      : store.get().customers.filter(x => x.segment === segment).length;
    const camp = { id: uid('CMP'), status: 'Draft', sentAt: null, audienceSize, ...c };
    store.update(s => ({ ...s, campaigns: [camp, ...s.campaigns] }));
    return camp;
  },
  updateCampaign: (id, patch) => store.update(s => ({
    ...s, campaigns: s.campaigns.map(c => c.id === id ? { ...c, ...patch } : c)
  })),
  deleteCampaign: (id) => store.update(s => ({ ...s, campaigns: s.campaigns.filter(c => c.id !== id) })),

  // === Custom configs ===
  addConfig: (c) => {
    const conf = { id: uid('CFG'), headers: [], pollSec: 0, ...c };
    store.update(s => ({ ...s, customConfigs: [conf, ...s.customConfigs] }));
    return conf;
  },
  updateConfig: (id, patch) => store.update(s => ({
    ...s, customConfigs: s.customConfigs.map(c => c.id === id ? { ...c, ...patch } : c)
  })),
  deleteConfig: (id) => store.update(s => ({ ...s, customConfigs: s.customConfigs.filter(c => c.id !== id) })),

  // === Analytics ===
  analytics: (range = 7) => {
    const s = store.get();
    const since = new Date(); since.setDate(since.getDate() - range);
    const ordersInRange = s.orders.filter(o => new Date(o.date) >= since && o.status !== 'Cancelled');
    const cancelledInRange = s.orders.filter(o => new Date(o.date) >= since && o.status === 'Cancelled');
    const totalRevenue = ordersInRange.reduce((sum, o) => sum + o.amount, 0);
    const refundValue = s.orders.filter(o => o.status === 'Refunded').reduce((sum, o) => sum + o.amount, 0);
    const aov = ordersInRange.length ? Math.round(totalRevenue / ordersInRange.length) : 0;
    const cancelRate = s.orders.filter(o => new Date(o.date) >= since).length
      ? (cancelledInRange.length / s.orders.filter(o => new Date(o.date) >= since).length * 100) : 0;

    // revenue by store
    const byStore = s.stores.map(st => {
      const rev = ordersInRange.filter(o => o.store === st.id).reduce((sum, o) => sum + o.amount, 0);
      const cnt = ordersInRange.filter(o => o.store === st.id).length;
      return { id: st.id, name: st.name, value: rev, count: cnt, color: st.color };
    });
    // daily
    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = s.orders.filter(o => o.date === key).length;
      const revenue = s.orders.filter(o => o.date === key && o.status !== 'Cancelled').reduce((a, o) => a + o.amount, 0);
      days.push({ date: key.slice(5), count, revenue });
    }
    // status counts (in range)
    const statusCounts = ordersInRange.concat(cancelledInRange).reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1; return acc;
    }, {});

    return {
      totalRevenue, totalOrders: ordersInRange.length + cancelledInRange.length,
      aov, cancelRate, refundValue, byStore, days, statusCounts,
      totalCustomers: s.customers.length,
      unreadMessages: s.messages.filter(m => m.unread).length,
      pendingTasks: s.tasks.filter(t => !t.done).length
    };
  }
};
