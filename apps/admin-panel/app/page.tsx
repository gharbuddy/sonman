"use client";

import { useEffect, useState, type FormEvent } from "react";
import { authService } from "../lib/auth";

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

type Product = {
  id: string;
  name: string;
  price: number | string;
  is_active: boolean;
  vendors: { business_name: string } | null;
  categories: { name: string } | null;
  inventory: { quantity_available: number }[] | null;
};
type Order = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number | string;
  created_at: string;
  customers: { users: { full_name: string } | null } | null;
  vendors: { business_name: string } | null;
  order_items: { product_name: string; quantity: number }[];
};
type DeliveryPartner = {
  id: string;
  approval_status: string;
  availability_status: string;
  users: { full_name: string } | null;
};
type DeliveryAssignment = {
  order_id: string;
  delivery_partner_id: string;
  status: string;
};
const statusLabels: Record<string, string> = { pending: "Pending", accepted: "Accepted", packed: "Packed", ready_for_pickup: "Ready for Pickup", picked_up: "Picked Up", out_for_delivery: "Out for Delivery", delivered: "Delivered" };
const nextStatus: Record<string, string> = { pending: "accepted", accepted: "packed", packed: "ready_for_pickup" };

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState("");
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [deliveryAssignments, setDeliveryAssignments] = useState<DeliveryAssignment[]>([]);

  const loadProducts = async () => {
    const { data, error: loadError } = await authService.supabase.from("products")
      .select("id, name, price, is_active, vendors(business_name), categories(name), inventory(quantity_available)")
      .is("deleted_at", null).order("created_at", { ascending: false });
    if (loadError) {
      setProductsError(loadError.message);
      return;
    }
    setProducts(data as unknown as Product[]);
    setProductsError("");
  };
  const loadOrders = async () => {
    const { data, error: loadError } = await authService.supabase.from("orders")
      .select("id, order_number, status, total_amount, created_at, customers(users(full_name)), vendors(business_name), order_items(product_name, quantity)")
      .order("created_at", { ascending: false });
    if (loadError) {
      setOrdersError(loadError.message);
      return;
    }
    setOrders(data as unknown as Order[]);
    setOrdersError("");
  };
  const loadDelivery = async () => {
    const [{ data: partners, error: partnersError }, { data: assignments, error: assignmentsError }] = await Promise.all([
      authService.supabase.from("delivery_partners").select("id, approval_status, availability_status, users(full_name)").eq("approval_status", "approved").order("created_at"),
      authService.supabase.from("delivery_assignments").select("order_id, delivery_partner_id, status").in("status", ["assigned", "accepted", "picked_up"]),
    ]);
    const loadError = partnersError ?? assignmentsError;
    if (loadError) {
      setOrdersError(loadError.message);
      return;
    }
    setDeliveryPartners(partners as unknown as DeliveryPartner[]);
    setDeliveryAssignments(assignments as DeliveryAssignment[]);
  };

  useEffect(() => {
    authService.restoreSession("admin")
      .then((auth) => setAuthenticated(!!auth))
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingSession(false));
    const subscription = authService.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setAuthenticated(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authenticated) void Promise.all([loadProducts(), loadOrders(), loadDelivery()]);
  }, [authenticated]);

  const setProductActive = async (product: Product, isActive: boolean) => {
    const { error: updateError } = await authService.supabase.from("products").update({ is_active: isActive }).eq("id", product.id);
    if (updateError) {
      setProductsError(updateError.message);
      return;
    }
    await loadProducts();
  };
  const advanceOrder = async (order: Order) => {
    const status = nextStatus[order.status];
    if (!status) return;
    const { error: updateError } = await authService.supabase.rpc("update_order_status", { order_id: order.id, next_status: status });
    if (updateError) {
      setOrdersError(updateError.message);
      return;
    }
    await loadOrders();
  };
  const assignDeliveryPartner = async (orderId: string, deliveryPartnerId: string) => {
    if (!deliveryPartnerId) return;
    const { error: updateError } = await authService.supabase.rpc("admin_assign_delivery_partner", {
      target_order_id: orderId,
      target_delivery_partner_id: deliveryPartnerId,
    });
    if (updateError) {
      setOrdersError(updateError.message);
      return;
    }
    await Promise.all([loadOrders(), loadDelivery()]);
  };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authService.login(email, password, "admin");
      setAuthenticated(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  if (checkingSession) return <main className="auth-page"><p>Restoring your session...</p></main>;
  if (!authenticated) {
    return (
      <main className="auth-page">
        <form className="auth-card" onSubmit={login}>
          <span className="badge cream">ADMIN ACCESS</span>
          <h1>Sonman admin login</h1>
          <p>Sign in with an active Supabase admin account.</p>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <strong className="auth-error">{error}</strong>}
          <button className="primary-btn" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
      </main>
    );
  }

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
            <h2>Replacement requests</h2>
            <p>Requests for damaged, defective, or incorrect products reported at delivery will appear here.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Issue</th><th>Reported at</th><th>Status</th></tr></thead>
            <tbody><tr><td colSpan={5}>No replacement requests yet.</td></tr></tbody>
          </table>
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Incoming orders</h2>
            <p>Live customer orders and their fulfilment status.</p>
          </div>
        </div>
        {ordersError && <p className="auth-error">{ordersError}</p>}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Vendor</th><th>Items</th><th>Total</th><th>Status</th><th>Delivery partner</th><th>Action</th></tr></thead>
            <tbody>
              {orders.map((order) => <tr key={order.id}>
                <td><b>{order.order_number}</b></td>
                <td>{order.customers?.users?.full_name || "Customer"}</td>
                <td>{order.vendors?.business_name ?? "-"}</td>
                <td>{order.order_items.map((item) => `${item.quantity} x ${item.product_name}`).join(", ")}</td>
                <td>Rs {Number(order.total_amount).toLocaleString("en-IN")}</td>
                <td><span className="badge">{statusLabels[order.status] ?? order.status}</span></td>
                <td>{deliveryAssignments.find((assignment) => assignment.order_id === order.id)
                  ? deliveryPartners.find((partner) => partner.id === deliveryAssignments.find((assignment) => assignment.order_id === order.id)?.delivery_partner_id)?.users?.full_name ?? "Assigned partner"
                  : order.status === "ready_for_pickup"
                    ? <select className="unassigned" defaultValue="" onChange={(event) => void assignDeliveryPartner(order.id, event.target.value)}>
                      <option value="" disabled>Assign partner</option>
                      {deliveryPartners.map((partner) => <option key={partner.id} value={partner.id}>{partner.users?.full_name || "Delivery partner"} ({partner.availability_status})</option>)}
                    </select>
                    : "-"}</td>
                <td>{nextStatus[order.status] ? <button className="approve" onClick={() => advanceOrder(order)}>Advance status</button> : "-"}</td>
              </tr>)}
              {!orders.length && <tr><td colSpan={8}>No incoming orders yet.</td></tr>}
            </tbody>
          </table>
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
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Products</h2>
            <p>Approve new vendor products or deactivate products that should leave the customer catalogue.</p>
          </div>
        </div>
        {productsError && <p className="auth-error">{productsError}</p>}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Vendor</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {products.map((product) => <tr key={product.id}>
                <td><b>{product.name}</b></td>
                <td>{product.vendors?.business_name ?? "-"}</td>
                <td>{product.categories?.name ?? "-"}</td>
                <td>Rs {Number(product.price).toLocaleString("en-IN")}</td>
                <td>{product.inventory?.[0]?.quantity_available ?? 0}</td>
                <td><span className={`badge ${product.is_active ? "" : "gold"}`}>{product.is_active ? "Active" : "Pending"}</span></td>
                <td><button className={product.is_active ? "reject" : "approve"} onClick={() => setProductActive(product, !product.is_active)}>{product.is_active ? "Deactivate" : "Approve"}</button></td>
              </tr>)}
              {!products.length && <tr><td colSpan={7}>No products yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <button className="quiet-btn" onClick={() => authService.logout()}>Sign out</button>
    </main>
  );
}
