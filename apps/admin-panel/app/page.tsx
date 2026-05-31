"use client";

const resources = [
  "Users and roles",
  "Customers",
  "Vendors",
  "Delivery partners",
  "Categories",
  "Products and inventory",
  "Orders and payments",
  "Delivery assignments",
  "Reviews",
  "Notifications",
];

export default function AdminPanel() {
  return (
    <main className="content">
      <section className="hero">
        <div>
          <span className="badge cream">SUPABASE READY</span>
          <h1>Sonman admin console</h1>
          <p>Connect the admin session to load live operational data.</p>
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Live data integration</h2>
            <p>The mock dashboard has been removed. These resources are ready for real API-backed screens.</p>
          </div>
        </div>
        <div className="mini-stats">
          {resources.map((resource) => <div key={resource}><b>0</b><span>{resource}</span></div>)}
        </div>
      </section>
    </main>
  );
}
