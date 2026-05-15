import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import {
  BadgeIndianRupee,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileBarChart,
  Image,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  PackagePlus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  UploadCloud,
  Users,
  Wallet,
  XCircle
} from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('illuminate_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const demo = {
  totals: {
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    packageSales: 0,
    totalIncome: 0,
    pendingWithdrawals: 0,
    pendingTaskApprovals: 0,
    openTickets: 0
  },
  users: [],
  packages: [],
  payments: [],
  withdrawals: [],
  submissions: [],
  tickets: [],
  reports: { incomeByType: [], withdrawalsByStatus: [], recentTransactions: [] },
  banners: []
};

function App() {
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(() => JSON.parse(localStorage.getItem('illuminate_admin_user') || 'null'));
  const [token, setToken] = useState(localStorage.getItem('illuminate_admin_token'));
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const data = useAdminData(Boolean(token), refresh);

  function saveSession(payload) {
    localStorage.setItem('illuminate_admin_token', payload.token);
    localStorage.setItem('illuminate_admin_user', JSON.stringify(payload.user));
    setToken(payload.token);
    setAdmin(payload.user);
    setNotice('Admin session started.');
  }

  function logout() {
    localStorage.removeItem('illuminate_admin_token');
    localStorage.removeItem('illuminate_admin_user');
    setToken(null);
    setAdmin(null);
  }

  if (!token) return <LoginScreen onSession={saveSession} />;

  const nav = [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['users', 'Users', Users],
    ['packages', 'Packages', Boxes],
    ['payments', 'Payments', CreditCard],
    ['tasks', 'Tasks', ClipboardCheck],
    ['withdrawals', 'Withdrawals', Wallet],
    ['support', 'Support', Ticket],
    ['reports', 'Reports', FileBarChart],
    ['content', 'Content', Image],
    ['notifications', 'Notifications', Bell]
  ];

  return (
    <div className="admin-shell">
      <aside className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <span><Sparkles size={20} /></span>
          <strong>Illuminate</strong>
        </div>
        <nav>
          {nav.map(([key, label, Icon]) => (
            <button key={key} className={active === key ? 'active' : ''} onClick={() => { setActive(key); setSidebarOpen(false); }}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="admin-topbar">
          <button className="icon-btn mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)} title="Menu"><Menu size={20} /></button>
          <div>
            <span className="kicker">Admin Portal</span>
            <h1>{nav.find(([key]) => key === active)?.[1]}</h1>
          </div>
          <div className="admin-actions">
            <div className="admin-chip"><ShieldCheck size={16} /> {admin?.name || 'Admin'}</div>
            <button className="ghost" onClick={logout}><LogOut size={17} /> Logout</button>
          </div>
        </header>

        {notice && <div className="toast" onAnimationEnd={() => setNotice('')}>{notice}</div>}

        {active === 'dashboard' && <Dashboard data={data} />}
        {active === 'users' && <UsersPage users={data.users} onRefresh={() => setRefresh((x) => x + 1)} />}
        {active === 'packages' && <PackagesPage packages={data.packages} onRefresh={() => setRefresh((x) => x + 1)} />}
        {active === 'payments' && <PaymentsPage payments={data.payments} onRefresh={() => setRefresh((x) => x + 1)} />}
        {active === 'tasks' && <TasksPage submissions={data.submissions} packages={data.packages} onRefresh={() => setRefresh((x) => x + 1)} />}
        {active === 'withdrawals' && <WithdrawalsPage withdrawals={data.withdrawals} onRefresh={() => setRefresh((x) => x + 1)} />}
        {active === 'support' && <SupportPage tickets={data.tickets} />}
        {active === 'reports' && <ReportsPage reports={data.reports} />}
        {active === 'content' && <ContentPage banners={data.banners} />}
        {active === 'notifications' && <NotificationsPage />}
      </main>
    </div>
  );
}

function useAdminData(enabled, refresh) {
  const [data, setData] = useState(demo);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    Promise.allSettled([
      api.get('/admin/dashboard'),
      api.get('/admin/users'),
      api.get('/packages'),
      api.get('/payments/admin'),
      api.get('/withdrawals/admin'),
      api.get('/tasks/admin/submissions'),
      api.get('/support/admin'),
      api.get('/admin/reports'),
      api.get('/admin/banners')
    ]).then((results) => {
      if (!mounted) return;
      setData({
        totals: results[0].value?.data?.totals || demo.totals,
        users: results[1].value?.data?.users || [],
        packages: results[2].value?.data?.packages || [],
        payments: results[3].value?.data?.payments || [],
        withdrawals: results[4].value?.data?.withdrawals || [],
        submissions: results[5].value?.data?.submissions || [],
        tickets: results[6].value?.data?.tickets || [],
        reports: results[7].value?.data || demo.reports,
        banners: results[8].value?.data?.banners || []
      });
    });
    return () => {
      mounted = false;
    };
  }, [enabled, refresh]);

  return data;
}

function LoginScreen({ onSession }) {
  const [form, setForm] = useState({ identifier: 'admin@illuminate.com', password: 'Admin@12345' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      if (res.data.user?.role !== 'admin') throw new Error('Admin role required');
      onSession(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to login');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="login-copy">
          <span className="kicker">Operations Control</span>
          <h1>Illuminate Admin Portal</h1>
          <p>Approve payments, verify task screenshots, control packages and income levels, handle withdrawals, and keep the promotion network moving cleanly.</p>
        </div>
      </section>
      <section className="login-card">
        <div className="brand login-brand">
          <span><Sparkles size={20} /></span>
          <strong>Illuminate</strong>
        </div>
        <h2>Admin Sign In</h2>
        <form onSubmit={submit}>
          <label>Email or mobile<input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} /></label>
          <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="error">{error}</p>}
          <button className="primary" disabled={busy}><LogIn size={18} /> {busy ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </section>
    </div>
  );
}

function Dashboard({ data }) {
  const cards = [
    ['Total Users', data.totals.totalUsers, Users],
    ['Active Users', data.totals.activeUsers, CheckCircle2],
    ['Package Sales', money(data.totals.packageSales), BadgeIndianRupee],
    ['Pending Withdrawals', data.totals.pendingWithdrawals, Wallet],
    ['Task Approvals', data.totals.pendingTaskApprovals, ClipboardCheck],
    ['Open Tickets', data.totals.openTickets, Ticket]
  ];

  return (
    <section className="page-grid">
      <div className="stat-grid">
        {cards.map(([label, value, Icon]) => (
          <article className="stat-card" key={label}>
            <Icon size={22} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="two-col">
        <Panel title="Approval Priorities" icon={SlidersHorizontal}>
          <QueueRow label="Pending payments" value={data.totals.pendingPayments || 0} tone="gold" />
          <QueueRow label="Task screenshots" value={data.totals.pendingTaskApprovals || 0} tone="green" />
          <QueueRow label="Withdrawal requests" value={data.totals.pendingWithdrawals || 0} tone="coral" />
        </Panel>
        <Panel title="Business Snapshot" icon={FileBarChart}>
          <div className="snapshot">
            <span>Total income generated</span>
            <strong>{money(data.totals.totalIncome)}</strong>
            <p>Referral and task income credited after approval flows.</p>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function UsersPage({ users, onRefresh }) {
  return (
    <Panel title="Member Management" icon={Users} action={<SearchBox />}>
      <DataTable
        columns={['Name', 'Contact', 'Package', 'Sponsor', 'Status', 'Action']}
        rows={users.map((user) => [
          user.name,
          `${user.email || ''}\n${user.mobile || ''}`,
          user.package?.name || 'Not selected',
          user.sponsor?.name || 'Direct',
          <Badge tone={user.status === 'active' ? 'green' : 'gold'}>{user.status}</Badge>,
          <button className="mini" onClick={async () => { await api.put(`/admin/users/${user.id}`, { status: user.status === 'active' ? 'inactive' : 'active' }); onRefresh(); }}>Toggle</button>
        ])}
        empty="No users yet."
      />
    </Panel>
  );
}

function PackagesPage({ packages, onRefresh }) {
  const [form, setForm] = useState({ name: '', baseAmount: '', taxAmount: '', finalAmount: '' });

  async function createPackage(event) {
    event.preventDefault();
    await api.post('/packages', {
      name: form.name,
      baseAmount: Number(form.baseAmount),
      taxAmount: Number(form.taxAmount || 0),
      finalAmount: Number(form.finalAmount)
    });
    setForm({ name: '', baseAmount: '', taxAmount: '', finalAmount: '' });
    onRefresh();
  }

  return (
    <div className="two-col">
      <Panel title="Packages" icon={Boxes}>
        <DataTable
          columns={['Name', 'Base', 'Tax', 'Final', 'Status']}
          rows={packages.map((pkg) => [pkg.name, money(pkg.baseAmount), money(pkg.taxAmount), money(pkg.finalAmount), <Badge tone="green">{pkg.status}</Badge>])}
          empty="No packages available."
        />
      </Panel>
      <Panel title="Create Package" icon={PackagePlus}>
        <form className="stack" onSubmit={createPackage}>
          <input required placeholder="Package name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="number" placeholder="Base amount" value={form.baseAmount} onChange={(e) => setForm({ ...form, baseAmount: e.target.value })} />
          <input type="number" placeholder="Tax amount" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
          <input required type="number" placeholder="Final amount" value={form.finalAmount} onChange={(e) => setForm({ ...form, finalAmount: e.target.value })} />
          <button className="primary">Save Package</button>
        </form>
      </Panel>
    </div>
  );
}

function PaymentsPage({ payments, onRefresh }) {
  async function decide(id, action) {
    await api.put(`/payments/admin/${id}/${action}`, { adminRemarks: action === 'approve' ? 'Verified' : 'Rejected by admin' });
    onRefresh();
  }

  return (
    <Panel title="Payment Approvals" icon={CreditCard} action={<SearchBox />}>
      <DataTable
        columns={['User', 'Package', 'Amount', 'Mode', 'UTR', 'Status', 'Action']}
        rows={payments.map((payment) => [
          payment.user?.name || 'Member',
          payment.package?.name || '-',
          money(payment.amount),
          payment.paymentMode,
          payment.utrNumber || '-',
          <Badge tone={payment.status === 'approved' ? 'green' : payment.status === 'rejected' ? 'coral' : 'gold'}>{payment.status}</Badge>,
          <ActionPair onApprove={() => decide(payment.id, 'approve')} onReject={() => decide(payment.id, 'reject')} disabled={payment.status !== 'pending'} />
        ])}
        empty="No payments found."
      />
    </Panel>
  );
}

function TasksPage({ submissions, packages, onRefresh }) {
  const [task, setTask] = useState({ title: '', platform: 'youtube', taskUrl: '', description: '', rewardAmount: '', packageId: '' });

  async function createTask(event) {
    event.preventDefault();
    await api.post('/tasks', {
      ...task,
      rewardAmount: Number(task.rewardAmount || 0),
      packageId: task.packageId || null
    });
    setTask({ title: '', platform: 'youtube', taskUrl: '', description: '', rewardAmount: '', packageId: '' });
    onRefresh();
  }

  async function decide(id, action) {
    await api.put(`/tasks/admin/submissions/${id}/${action}`, { adminRemarks: action === 'approve' ? 'Proof verified' : 'Proof unclear' });
    onRefresh();
  }

  return (
    <div className="two-col">
      <Panel title="Task Screenshot Verification" icon={ClipboardCheck}>
        <DataTable
          columns={['User', 'Task', 'Platform', 'Reward', 'Status', 'Action']}
          rows={submissions.map((item) => [
            item.user?.name || 'Member',
            item.task?.title || '-',
            item.task?.platform || '-',
            money(item.task?.rewardAmount),
            <Badge tone={item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'coral' : 'gold'}>{item.status}</Badge>,
            <ActionPair onApprove={() => decide(item.id, 'approve')} onReject={() => decide(item.id, 'reject')} disabled={item.status === 'approved'} />
          ])}
          empty="No task submissions yet."
        />
      </Panel>
      <Panel title="Create Promotion Task" icon={ClipboardCheck}>
        <form className="stack" onSubmit={createTask}>
          <input required placeholder="Task title" value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} />
          <select value={task.platform} onChange={(e) => setTask({ ...task, platform: e.target.value })}>
            {['youtube', 'instagram', 'facebook', 'google', 'website', 'whatsapp', 'banner', 'local', 'other'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input placeholder="Task URL" value={task.taskUrl} onChange={(e) => setTask({ ...task, taskUrl: e.target.value })} />
          <textarea required placeholder="Task instructions" value={task.description} onChange={(e) => setTask({ ...task, description: e.target.value })} />
          <input type="number" placeholder="Reward amount" value={task.rewardAmount} onChange={(e) => setTask({ ...task, rewardAmount: e.target.value })} />
          <select value={task.packageId} onChange={(e) => setTask({ ...task, packageId: e.target.value })}>
            <option value="">All packages</option>
            {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
          </select>
          <button className="primary">Create Task</button>
        </form>
      </Panel>
    </div>
  );
}

function WithdrawalsPage({ withdrawals, onRefresh }) {
  async function decide(id, action) {
    await api.put(`/withdrawals/admin/${id}/${action}`, action === 'paid' ? undefined : { adminRemarks: action });
    onRefresh();
  }

  return (
    <Panel title="Withdrawal Desk" icon={Wallet}>
      <DataTable
        columns={['User', 'Amount', 'Bank / UPI', 'Status', 'Action']}
        rows={withdrawals.map((item) => [
          item.user?.name || 'Member',
          money(item.amount),
          item.bankSnapshot?.upiId || item.bankSnapshot?.bankName || '-',
          <Badge tone={item.status === 'paid' ? 'green' : item.status === 'rejected' ? 'coral' : 'gold'}>{item.status}</Badge>,
          <div className="row-actions">
            <button className="mini approve" onClick={() => decide(item.id, 'approve')} disabled={item.status !== 'pending'}>Approve</button>
            <button className="mini" onClick={() => decide(item.id, 'paid')} disabled={item.status !== 'approved'}>Paid</button>
            <button className="mini reject" onClick={() => decide(item.id, 'reject')} disabled={!['pending', 'approved'].includes(item.status)}>Reject</button>
          </div>
        ])}
        empty="No withdrawal requests."
      />
    </Panel>
  );
}

function SupportPage({ tickets }) {
  return (
    <Panel title="Support Tickets" icon={Ticket}>
      <DataTable
        columns={['User', 'Subject', 'Priority', 'Status']}
        rows={tickets.map((ticket) => [
          ticket.user?.name || 'Member',
          ticket.subject,
          <Badge tone={ticket.priority === 'high' ? 'coral' : 'gold'}>{ticket.priority}</Badge>,
          <Badge tone={ticket.status === 'closed' ? 'green' : 'gold'}>{ticket.status}</Badge>
        ])}
        empty="No support tickets."
      />
    </Panel>
  );
}

function ReportsPage({ reports }) {
  return (
    <div className="two-col">
      <Panel title="Income by Type" icon={BadgeIndianRupee}>
        {(reports.incomeByType || []).length ? reports.incomeByType.map((item) => <QueueRow key={item.type} label={item.type} value={money(item.total)} tone="green" />) : <Empty text="No income records yet." />}
      </Panel>
      <Panel title="Withdrawal Summary" icon={FileBarChart}>
        {(reports.withdrawalsByStatus || []).length ? reports.withdrawalsByStatus.map((item) => <QueueRow key={item.status} label={item.status} value={money(item.total)} tone="gold" />) : <Empty text="No withdrawal records yet." />}
      </Panel>
    </div>
  );
}

function ContentPage({ banners }) {
  const [banner, setBanner] = useState({ title: '', imageUrl: '', linkUrl: '', placement: 'home', status: 'active' });

  async function createBanner(event) {
    event.preventDefault();
    await api.post('/admin/banners', banner);
    setBanner({ title: '', imageUrl: '', linkUrl: '', placement: 'home', status: 'active' });
  }

  return (
    <div className="two-col">
      <Panel title="Banners" icon={Image}>
        <DataTable
          columns={['Title', 'Placement', 'Status']}
          rows={banners.map((banner) => [banner.title, banner.placement, <Badge tone="green">{banner.status}</Badge>])}
          empty="No banners yet."
        />
      </Panel>
      <Panel title="Create Banner" icon={UploadCloud}>
        <form className="stack" onSubmit={createBanner}>
          <input required placeholder="Banner title" value={banner.title} onChange={(e) => setBanner({ ...banner, title: e.target.value })} />
          <input required placeholder="Image URL" value={banner.imageUrl} onChange={(e) => setBanner({ ...banner, imageUrl: e.target.value })} />
          <input placeholder="Link URL" value={banner.linkUrl} onChange={(e) => setBanner({ ...banner, linkUrl: e.target.value })} />
          <select value={banner.placement} onChange={(e) => setBanner({ ...banner, placement: e.target.value })}><option value="home">Home</option><option value="dashboard">Dashboard</option><option value="promotion">Promotion</option><option value="mobile">Mobile</option></select>
          <button className="primary">Save Banner</button>
        </form>
      </Panel>
    </div>
  );
}

function NotificationsPage() {
  const [notification, setNotification] = useState({ title: '', body: '', type: 'general' });

  async function broadcast(event) {
    event.preventDefault();
    await api.post('/admin/notifications', notification);
    setNotification({ title: '', body: '', type: 'general' });
  }

  return (
    <Panel title="Send Notification" icon={Bell}>
      <form className="notification-form" onSubmit={broadcast}>
        <input required placeholder="Title" value={notification.title} onChange={(e) => setNotification({ ...notification, title: e.target.value })} />
        <textarea required placeholder="Message body" value={notification.body} onChange={(e) => setNotification({ ...notification, body: e.target.value })} />
        <select value={notification.type} onChange={(e) => setNotification({ ...notification, type: e.target.value })}><option value="general">General</option><option value="task">Task</option><option value="payment">Payment</option><option value="withdrawal">Withdrawal</option><option value="income">Income</option></select>
        <button className="primary">Broadcast</button>
      </form>
    </Panel>
  );
}

function Panel({ title, icon: Icon, action, children }) {
  return (
    <section className="panel">
      <header className="panel-head">
        <div>
          <span><Icon size={18} /></span>
          <h2>{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function DataTable({ columns, rows, empty }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
          )) : (
            <tr><td colSpan={columns.length}><Empty text={empty} /></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ tone = 'green', children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function SearchBox() {
  return <label className="search"><Search size={16} /><input placeholder="Search" /></label>;
}

function ActionPair({ onApprove, onReject, disabled }) {
  return (
    <div className="row-actions">
      <button className="mini approve" onClick={onApprove} disabled={disabled}><CheckCircle2 size={14} /> Approve</button>
      <button className="mini reject" onClick={onReject} disabled={disabled}><XCircle size={14} /> Reject</button>
    </div>
  );
}

function QueueRow({ label, value, tone }) {
  return (
    <div className="queue-row">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
      <ChevronRight size={17} />
    </div>
  );
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}

createRoot(document.getElementById('root')).render(<App />);
