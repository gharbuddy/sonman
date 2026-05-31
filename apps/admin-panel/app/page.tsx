"use client";

import { useState, type ReactNode } from "react";

type Screen =
  | "Dashboard"
  | "Vendors"
  | "Customers"
  | "Products"
  | "Orders"
  | "Delivery Assignments"
  | "Payments"
  | "AI Product Enhancements"
  | "Settings";
type VendorStatus = "Approved" | "Pending" | "Rejected";
type OrderStatus = "Placed" | "Confirmed" | "Preparing" | "Out for delivery" | "Delivered";

const nav: { label: Screen; icon: string }[] = [
  { label: "Dashboard", icon: "grid" },
  { label: "Vendors", icon: "store" },
  { label: "Customers", icon: "users" },
  { label: "Products", icon: "box" },
  { label: "Orders", icon: "receipt" },
  { label: "Delivery Assignments", icon: "truck" },
  { label: "Payments", icon: "wallet" },
  { label: "AI Product Enhancements", icon: "spark" },
  { label: "Settings", icon: "settings" },
];

const initialVendors = [
  { id: "V-1042", name: "Freshway Market", category: "Groceries", owner: "Anita Menon", products: 124, joined: "May 28, 2026", status: "Pending" as VendorStatus },
  { id: "V-1041", name: "Urban Basket", category: "Daily essentials", owner: "Rohan Das", products: 87, joined: "May 27, 2026", status: "Pending" as VendorStatus },
  { id: "V-1039", name: "Harvest Hub", category: "Organic produce", owner: "Meera Paul", products: 203, joined: "May 24, 2026", status: "Approved" as VendorStatus },
  { id: "V-1037", name: "Dairy Daily", category: "Dairy & bakery", owner: "Kabir Shah", products: 66, joined: "May 21, 2026", status: "Approved" as VendorStatus },
  { id: "V-1035", name: "Quick Pantry", category: "Groceries", owner: "Naina Suri", products: 0, joined: "May 19, 2026", status: "Rejected" as VendorStatus },
];

const orders = [
  { id: "#SM-2498", customer: "Arjun Rao", vendor: "Harvest Hub", amount: "₹1,240", items: 8, time: "10:42 AM", status: "Out for delivery" as OrderStatus },
  { id: "#SM-2497", customer: "Priya Nair", vendor: "Freshway Market", amount: "₹860", items: 5, time: "10:35 AM", status: "Preparing" as OrderStatus },
  { id: "#SM-2496", customer: "Neha Verma", vendor: "Dairy Daily", amount: "₹540", items: 4, time: "10:18 AM", status: "Confirmed" as OrderStatus },
  { id: "#SM-2495", customer: "Samar Roy", vendor: "Urban Basket", amount: "₹1,680", items: 11, time: "09:54 AM", status: "Placed" as OrderStatus },
  { id: "#SM-2494", customer: "Isha Kapur", vendor: "Harvest Hub", amount: "₹720", items: 6, time: "09:32 AM", status: "Delivered" as OrderStatus },
  { id: "#SM-2493", customer: "Dev Patel", vendor: "Dairy Daily", amount: "₹390", items: 3, time: "09:20 AM", status: "Delivered" as OrderStatus },
];

const products = [
  { name: "Fresh Avocado", vendor: "Harvest Hub", category: "Fruits", price: "₹180", stock: 46, status: "Active" },
  { name: "Organic Milk 1L", vendor: "Dairy Daily", category: "Dairy", price: "₹72", stock: 82, status: "Active" },
  { name: "Whole Wheat Bread", vendor: "Dairy Daily", category: "Bakery", price: "₹55", stock: 14, status: "Low stock" },
  { name: "Premium Basmati Rice", vendor: "Freshway Market", category: "Staples", price: "₹620", stock: 38, status: "Active" },
  { name: "Cold Pressed Coconut Oil", vendor: "Urban Basket", category: "Cooking", price: "₹345", stock: 0, status: "Out of stock" },
];

const customers = [
  { name: "Arjun Rao", email: "arjun.rao@example.com", orders: 28, spent: "₹18,420", lastOrder: "Today, 10:42 AM", status: "Active" },
  { name: "Priya Nair", email: "priya.nair@example.com", orders: 19, spent: "₹12,860", lastOrder: "Today, 10:35 AM", status: "Active" },
  { name: "Neha Verma", email: "neha.v@example.com", orders: 14, spent: "₹9,340", lastOrder: "Today, 10:18 AM", status: "Active" },
  { name: "Samar Roy", email: "samar.roy@example.com", orders: 8, spent: "₹6,180", lastOrder: "Today, 09:54 AM", status: "New" },
  { name: "Isha Kapur", email: "isha.k@example.com", orders: 32, spent: "₹24,720", lastOrder: "Today, 09:32 AM", status: "Active" },
];

const partners = ["Unassigned", "Rahul S.", "Imran K.", "Vivek P.", "Anjali R."];
const lifecycle: OrderStatus[] = ["Placed", "Confirmed", "Preparing", "Out for delivery", "Delivered"];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    store: <><path d="M3 9l2-5h14l2 5"/><path d="M5 13v7h14v-7M9 20v-6h6v6"/><path d="M3 9c0 2 3 3 4.5 1.2C9 12 12 11 12 9c0 2 3 3 4.5 1.2C18 12 21 11 21 9"/></>,
    users: <><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6m3-3h-6"/></>,
    box: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7l8.7 5 8.7-5M12 22V12"/></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6m-6 4h6"/></>,
    truck: <><path d="M10 17h4V5H2v12h3m12 0h5v-5l-3-3h-5v8"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></>,
    wallet: <><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M16 13h4M2 9h20"/></>,
    spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zm7 14l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1 1.55V20.3h-3v-.09a1.7 1.7 0 00-1-1.55A1.7 1.7 0 008.86 19l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 007.08 15a1.7 1.7 0 00-1.55-1H5.4v-3h.13a1.7 1.7 0 001.55-1A1.7 1.7 0 006.74 8.1l-.06-.06L8.8 5.92l.06.06a1.7 1.7 0 001.88.34 1.7 1.7 0 001-1.55V4.7h3v.07a1.7 1.7 0 001 1.55 1.7 1.7 0 001.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0019.4 10a1.7 1.7 0 001.55 1h.05v3h-.05a1.7 1.7 0 00-1.55 1z"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close: <><path d="M18 6L6 18M6 6l12 12"/></>,
    bell: <><path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M14 21h-4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></>,
    arrow: <><path d="M5 12h14m-6-6l6 6-6 6"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    check: <path d="M20 6L9 17l-5-5"/>,
    x: <path d="M18 6L6 18M6 6l12 12"/>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Badge({ children, tone = "green" }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="table-wrap"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function EmptyHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: string }) {
  return <div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <button className="primary-btn">+ {action}</button>}</div>;
}

export default function AdminPanel() {
  const [screen, setScreen] = useState<Screen>("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [vendors, setVendors] = useState(initialVendors);
  const [assignments, setAssignments] = useState<Record<string, string>>({ "#SM-2498": "Rahul S.", "#SM-2497": "Unassigned", "#SM-2496": "Anjali R.", "#SM-2495": "Unassigned" });

  const choose = (next: Screen) => { setScreen(next); setMobileOpen(false); };
  const decideVendor = (id: string, status: VendorStatus) => setVendors((all) => all.map((v) => v.id === id ? { ...v, status } : v));
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand"><div className="brand-mark">S</div><div><b>sonman</b><small>ADMIN CONSOLE</small></div></div>
        <nav>{nav.map((item) => <button key={item.label} onClick={() => choose(item.label)} className={screen === item.label ? "active" : ""}><Icon name={item.icon}/><span>{item.label}</span>{item.label === "Vendors" && <i>2</i>}</button>)}</nav>
        <div className="sidebar-foot"><div className="avatar">AS</div><div><b>Arun Sharma</b><small>Super Admin</small></div><Icon name="more"/></div>
      </aside>
      {mobileOpen && <button className="overlay" onClick={() => setMobileOpen(false)} aria-label="Close menu"/>}
      <main>
        <header>
          <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open menu"><Icon name={mobileOpen ? "close" : "menu"}/></button>
          <div><h1>{screen}</h1><p>Sunday, 31 May 2026</p></div>
          <div className="header-actions"><label className="search"><Icon name="search"/><input placeholder="Search anything..."/></label><button className="icon-btn"><Icon name="bell"/><em/></button></div>
        </header>
        <div className="content">
          {screen === "Dashboard" && <Dashboard onNavigate={choose}/>}
          {screen === "Vendors" && <Vendors vendors={vendors} decide={decideVendor}/>}
          {screen === "Customers" && <Customers/>}
          {screen === "Products" && <Products/>}
          {screen === "Orders" && <Orders/>}
          {screen === "Delivery Assignments" && <Assignments assignments={assignments} setAssignments={setAssignments}/>}
          {screen === "Payments" && <Payments/>}
          {screen === "AI Product Enhancements" && <AIEnhancements/>}
          {screen === "Settings" && <Settings/>}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const stats = [["Total revenue", "₹8,42,560", "+18.2%", "wallet"], ["Total orders", "2,498", "+12.5%", "receipt"], ["Active vendors", "186", "+8.4%", "store"], ["Active customers", "12,680", "+21.6%", "users"]];
  return <><div className="hero"><div><Badge tone="cream">LIVE OVERVIEW</Badge><h2>Good morning, Arun.</h2><p>Here&apos;s what&apos;s happening across Sonman today.</p></div><div className="hero-note"><b>₹42,860</b><span>Revenue today</span><small>+14.8% from yesterday</small></div></div>
    <div className="stat-grid">{stats.map(([title, value, trend, icon]) => <div className="stat-card" key={title}><div className="stat-top"><span>{title}</span><i><Icon name={icon}/></i></div><b>{value}</b><small><strong>{trend}</strong> vs last month</small></div>)}</div>
    <div className="dashboard-grid">
      <section className="card revenue"><div className="card-head"><div><h3>Revenue overview</h3><p>Revenue performance over the last 7 days</p></div><button className="quiet-btn">Last 7 days⌄</button></div><div className="chart"><div className="y-axis"><span>60k</span><span>40k</span><span>20k</span><span>0</span></div><svg preserveAspectRatio="none" viewBox="0 0 800 220"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#12745b" stopOpacity=".25"/><stop offset="1" stopColor="#12745b" stopOpacity="0"/></linearGradient></defs><path className="chart-fill" d="M0 165 C70 125 100 145 150 110 S240 90 300 125 S390 65 450 82 S540 55 600 74 S700 26 800 38 L800 220 L0 220Z"/><path className="chart-line" d="M0 165 C70 125 100 145 150 110 S240 90 300 125 S390 65 450 82 S540 55 600 74 S700 26 800 38"/></svg><div className="x-axis"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></section>
      <section className="card channels"><div className="card-head"><div><h3>Order channels</h3><p>Today&apos;s split by platform</p></div></div><div className="donut"></div><div className="legend"><span><i className="dot green"/>Mobile app <b>68%</b></span><span><i className="dot gold"/>Web store <b>24%</b></span><span><i className="dot pale"/>Direct <b>8%</b></span></div></section>
    </div>
    <section className="card"><div className="card-head"><div><h3>Recent orders</h3><p>Latest orders across all vendors</p></div><button className="text-btn" onClick={() => onNavigate("Orders")}>View all <Icon name="arrow" size={15}/></button></div><Table headers={["Order ID", "Customer", "Vendor", "Amount", "Time", "Status"]}>{orders.slice(0, 5).map((o) => <tr key={o.id}><td><b>{o.id}</b></td><td>{o.customer}</td><td>{o.vendor}</td><td><b>{o.amount}</b></td><td>{o.time}</td><td><Badge tone={toneFor(o.status)}>{o.status}</Badge></td></tr>)}</Table></section>
  </>;
}

function Vendors({ vendors, decide }: { vendors: typeof initialVendors; decide: (id: string, status: VendorStatus) => void }) {
  return <><EmptyHeader title="Vendor management" subtitle="Review, approve, and monitor every vendor on Sonman." action="Add vendor"/><div className="mini-stats"><div><b>186</b><span>Active vendors</span></div><div><b>2</b><span>Awaiting approval</span></div><div><b>24</b><span>Added this month</span></div></div><section className="card"><div className="filter-row"><label className="search"><Icon name="search"/><input placeholder="Search vendors..."/></label><button className="quiet-btn">All categories⌄</button><button className="quiet-btn">All statuses⌄</button></div><Table headers={["Vendor", "Category", "Owner", "Products", "Joined", "Status", "Action"]}>{vendors.map((v) => <tr key={v.id}><td><div className="name-cell"><span className="vendor-logo">{v.name[0]}</span><div><b>{v.name}</b><small>{v.id}</small></div></div></td><td>{v.category}</td><td>{v.owner}</td><td>{v.products}</td><td>{v.joined}</td><td><Badge tone={toneFor(v.status)}>{v.status}</Badge></td><td>{v.status === "Pending" ? <div className="actions"><button className="approve" onClick={() => decide(v.id, "Approved")}><Icon name="check" size={14}/> Approve</button><button className="reject" onClick={() => decide(v.id, "Rejected")}><Icon name="x" size={14}/></button></div> : <button className="more-btn"><Icon name="more"/></button>}</td></tr>)}</Table></section></>;
}

function Customers() {
  return <><EmptyHeader title="Customer directory" subtitle="Understand your customer base and their order activity."/><div className="mini-stats"><div><b>12,680</b><span>Total customers</span></div><div><b>1,248</b><span>New this month</span></div><div><b>₹836</b><span>Avg. order value</span></div></div><section className="card"><div className="filter-row"><label className="search"><Icon name="search"/><input placeholder="Search customers..."/></label><button className="quiet-btn">All customers⌄</button></div><Table headers={["Customer", "Orders", "Total spent", "Last order", "Status", ""]}>{customers.map((c) => <tr key={c.email}><td><div className="name-cell"><span className="customer-avatar">{initials(c.name)}</span><div><b>{c.name}</b><small>{c.email}</small></div></div></td><td>{c.orders}</td><td><b>{c.spent}</b></td><td>{c.lastOrder}</td><td><Badge tone={c.status === "New" ? "blue" : "green"}>{c.status}</Badge></td><td><button className="more-btn"><Icon name="more"/></button></td></tr>)}</Table></section></>;
}

function Products() {
  return <><EmptyHeader title="Product catalog" subtitle="Monitor listings, stock levels, and product quality." action="Add product"/><div className="mini-stats"><div><b>4,862</b><span>Live products</span></div><div><b>84</b><span>Low stock</span></div><div><b>36</b><span>Out of stock</span></div></div><section className="card"><div className="filter-row"><label className="search"><Icon name="search"/><input placeholder="Search products..."/></label><button className="quiet-btn">All categories⌄</button><button className="quiet-btn">Stock status⌄</button></div><Table headers={["Product", "Vendor", "Category", "Price", "Stock", "Status", ""]}>{products.map((p) => <tr key={p.name}><td><div className="name-cell"><span className="product-img">◌</span><b>{p.name}</b></div></td><td>{p.vendor}</td><td>{p.category}</td><td><b>{p.price}</b></td><td>{p.stock}</td><td><Badge tone={toneFor(p.status)}>{p.status}</Badge></td><td><button className="more-btn"><Icon name="more"/></button></td></tr>)}</Table></section></>;
}

function Orders() {
  const [selected, setSelected] = useState(orders[0]);
  return <><EmptyHeader title="Order management" subtitle="Track orders and follow each step from checkout to delivery."/><div className="mini-stats"><div><b>186</b><span>Orders today</span></div><div><b>24</b><span>In progress</span></div><div><b>4</b><span>Need attention</span></div></div><section className="card"><div className="filter-row"><label className="search"><Icon name="search"/><input placeholder="Search order ID or customer..."/></label><button className="quiet-btn">All statuses⌄</button><button className="quiet-btn">Today⌄</button></div><Table headers={["Order ID", "Customer", "Vendor", "Items", "Amount", "Status", ""]}>{orders.map((o) => <tr key={o.id}><td><b>{o.id}</b></td><td>{o.customer}</td><td>{o.vendor}</td><td>{o.items}</td><td><b>{o.amount}</b></td><td><Badge tone={toneFor(o.status)}>{o.status}</Badge></td><td><button className="text-btn" onClick={() => setSelected(o)}>Track</button></td></tr>)}</Table></section><section className="card lifecycle"><div className="card-head"><div><h3>Order lifecycle: {selected.id}</h3><p>{selected.customer} · {selected.vendor} · {selected.amount}</p></div><Badge tone={toneFor(selected.status)}>{selected.status}</Badge></div><div className="steps">{lifecycle.map((step, i) => { const done = i <= lifecycle.indexOf(selected.status); return <div className={`step ${done ? "done" : ""}`} key={step}><i>{done ? "✓" : i + 1}</i><b>{step}</b><small>{done ? ["10:02 AM", "10:05 AM", "10:16 AM", "10:48 AM", "11:12 AM"][i] : "Pending"}</small></div>; })}</div></section></>;
}

function Assignments({ assignments, setAssignments }: { assignments: Record<string, string>; setAssignments: (value: Record<string, string>) => void }) {
  return <><EmptyHeader title="Delivery assignments" subtitle="Assign delivery partners and monitor active dispatches."/><div className="mini-stats"><div><b>18</b><span>Partners online</span></div><div><b>12</b><span>Active deliveries</span></div><div><b>2</b><span>Awaiting assignment</span></div></div><section className="card"><Table headers={["Order ID", "Customer", "Pickup", "Order value", "Status", "Delivery partner"]}>{orders.slice(0, 4).map((o) => <tr key={o.id}><td><b>{o.id}</b></td><td>{o.customer}</td><td>{o.vendor}</td><td><b>{o.amount}</b></td><td><Badge tone={toneFor(o.status)}>{o.status}</Badge></td><td><select value={assignments[o.id] ?? "Unassigned"} className={(assignments[o.id] ?? "Unassigned") === "Unassigned" ? "unassigned" : ""} onChange={(e) => setAssignments({ ...assignments, [o.id]: e.target.value })}>{partners.map((p) => <option key={p}>{p}</option>)}</select></td></tr>)}</Table></section><section className="card partner-card"><div className="card-head"><div><h3>Available partners</h3><p>Live availability around active delivery zones</p></div></div><div className="partner-grid">{partners.slice(1).map((p, i) => <div key={p}><span className="customer-avatar">{initials(p)}</span><div><b>{p}</b><small>{["Indiranagar · 1.2 km", "Koramangala · 2.1 km", "HSR Layout · 1.8 km", "Domlur · 2.4 km"][i]}</small></div><Badge tone="green">Online</Badge></div>)}</div></section></>;
}

function Payments() {
  return <><EmptyHeader title="Payments" subtitle="Track settlements, platform earnings, and payout activity."/><div className="stat-grid"><div className="stat-card"><span>Total GMV</span><b>₹8,42,560</b><small><strong>+18.2%</strong> this month</small></div><div className="stat-card"><span>Platform earnings</span><b>₹84,256</b><small><strong>10%</strong> avg. commission</small></div><div className="stat-card"><span>Pending payouts</span><b>₹1,26,420</b><small>Next cycle: Jun 02</small></div><div className="stat-card"><span>Refunds</span><b>₹8,940</b><small><strong>1.06%</strong> of GMV</small></div></div><section className="card"><div className="card-head"><div><h3>Recent transactions</h3><p>Payments and settlements across the platform</p></div><button className="quiet-btn">Export CSV</button></div><Table headers={["Transaction", "Vendor", "Type", "Date", "Amount", "Status"]}>{[["TXN-88342","Harvest Hub","Order payment","May 31, 10:42 AM","₹1,240","Completed"],["TXN-88341","Freshway Market","Order payment","May 31, 10:35 AM","₹860","Completed"],["PAY-12408","Dairy Daily","Vendor payout","May 31, 09:00 AM","₹18,420","Processing"],["TXN-88340","Dairy Daily","Order payment","May 31, 08:48 AM","₹540","Completed"],["REF-00882","Urban Basket","Refund","May 30, 06:24 PM","₹680","Refunded"]].map((t) => <tr key={t[0]}><td><b>{t[0]}</b></td><td>{t[1]}</td><td>{t[2]}</td><td>{t[3]}</td><td><b>{t[4]}</b></td><td><Badge tone={toneFor(t[5])}>{t[5]}</Badge></td></tr>)}</Table></section></>;
}

function AIEnhancements() {
  const [done, setDone] = useState<string[]>([]);
  const candidates = [{ name: "Organic Hass Avocado", vendor: "Harvest Hub", issue: "Missing rich description", score: 62 }, { name: "Cold Pressed Coconut Oil", vendor: "Urban Basket", issue: "Improve SEO keywords", score: 71 }, { name: "Premium Basmati Rice 5kg", vendor: "Freshway Market", issue: "Description needs formatting", score: 58 }];
  return <><div className="ai-hero"><div className="ai-icon"><Icon name="spark" size={28}/></div><div><Badge tone="cream">SONMAN AI</Badge><h2>Make every product listing stronger.</h2><p>Use AI-assisted enhancements to improve product titles, descriptions, and discoverability. Review every suggestion before publishing.</p></div></div><div className="mini-stats"><div><b>248</b><span>Products enhanced</span></div><div><b>42</b><span>Awaiting review</span></div><div><b>+18%</b><span>Avg. discovery uplift</span></div></div><section className="card"><div className="card-head"><div><h3>Recommended enhancements</h3><p>Products with the highest impact opportunities</p></div></div>{candidates.map((c) => <div className="enhancement" key={c.name}><span className="product-img">◌</span><div className="enhance-main"><b>{c.name}</b><small>{c.vendor} · {c.issue}</small><div className="score"><i style={{ width: `${c.score}%` }}/></div></div>{done.includes(c.name) ? <Badge tone="green">Enhanced</Badge> : <button className="ai-btn" onClick={() => setDone([...done, c.name])}><Icon name="spark" size={15}/> Enhance with AI</button>}</div>)}</section></>;
}

function Settings() {
  const [settings, setSettings] = useState({ orders: true, vendors: true, lowStock: true, email: false });
  const toggle = (key: keyof typeof settings) => setSettings({ ...settings, [key]: !settings[key] });
  return <><EmptyHeader title="Settings" subtitle="Manage platform preferences and admin notifications."/><section className="settings-grid"><div className="card settings-menu"><button className="selected">General</button><button>Notifications</button><button>Commission rules</button><button>Delivery zones</button><button>Admin access</button></div><div className="card settings-panel"><h3>Notification preferences</h3><p>Choose the events you want to hear about.</p>{[["orders","New order alerts","Notify the admin team whenever a customer places an order."],["vendors","Vendor applications","Receive a notification when a new vendor applies."],["lowStock","Low stock alerts","Get notified when a product reaches its low stock threshold."],["email","Daily email summary","Receive a daily operations summary by email."]].map(([key,title,copy]) => <div className="setting" key={key}><div><b>{title}</b><small>{copy}</small></div><button className={`switch ${settings[key as keyof typeof settings] ? "on" : ""}`} onClick={() => toggle(key as keyof typeof settings)}><i/></button></div>)}<button className="primary-btn save">Save changes</button></div></section></>;
}

function toneFor(value: string) {
  if (["Approved", "Delivered", "Active", "Completed"].includes(value)) return "green";
  if (["Pending", "Preparing", "Low stock", "Processing"].includes(value)) return "gold";
  if (["Placed", "New"].includes(value)) return "blue";
  if (["Rejected", "Out of stock", "Refunded"].includes(value)) return "red";
  return "purple";
}
function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
