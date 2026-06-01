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
  approval_status: "draft" | "pending_review" | "approved" | "rejected";
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  vendors: { business_name: string } | null;
  categories: { name: string } | null;
  inventory: { quantity_available: number }[] | null;
};
type Vendor = {
  id: string;
  business_name: string;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  users: { full_name: string } | null;
};
type Order = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number | string;
  delivery_fee_amount: number | string;
  delivery_quote_required: boolean;
  delivery_fee_overridden: boolean;
  expected_delivery_date: string;
  created_at: string;
  customers: { users: { full_name: string } | null } | null;
  vendors: { business_name: string } | null;
  order_items: { product_name: string; quantity: number }[];
};
type DeliveryPartner = {
  id: string;
  approval_status: "pending" | "approved" | "rejected";
  availability_status: string;
  created_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  users: { full_name: string } | null;
};
type DeliveryAssignment = {
  order_id: string;
  delivery_partner_id: string;
  status: string;
};
const statusLabels: Record<string, string> = { pending: "Pending", accepted: "Accepted", packed: "Packed", ready_for_pickup: "Ready for Pickup", picked_up: "Picked Up", out_for_delivery: "Out for Delivery", delivered: "Delivered" };
const nextStatus: Record<string, string> = { pending: "accepted", accepted: "packed", packed: "ready_for_pickup" };
const approvalLabels: Record<string, string> = { pending: "Pending", pending_review: "Pending Review", approved: "Approved", rejected: "Rejected", draft: "Draft" };
const auditTime = (value: string | null) => value ? new Date(value).toLocaleString("en-IN") : "-";
const badgeTone = (status: string) => status === "approved" ? "" : status === "rejected" ? "red" : "gold";

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [approvalsError, setApprovalsError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState("");
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [deliveryAssignments, setDeliveryAssignments] = useState<DeliveryAssignment[]>([]);
  const [deliveryFeeOverrides, setDeliveryFeeOverrides] = useState<Record<string, string>>({});

  const loadProducts = async () => {
    const { data, error: loadError } = await authService.supabase.from("products")
      .select("id, name, price, is_active, approval_status, reviewed_at, approved_at, rejected_at, vendors(business_name), categories(name), inventory(quantity_available)")
      .is("deleted_at", null).order("created_at", { ascending: false });
    if (loadError) {
      setProductsError(loadError.message);
      return;
    }
    setProducts(data as unknown as Product[]);
    setProductsError("");
  };
  const loadVendors = async () => {
    const { data, error: loadError } = await authService.supabase.from("vendors")
      .select("id, business_name, approval_status, created_at, reviewed_at, approved_at, rejected_at, users(full_name)")
      .order("created_at", { ascending: false });
    if (loadError) {
      setApprovalsError(loadError.message);
      return;
    }
    setVendors(data as unknown as Vendor[]);
    setApprovalsError("");
  };
  const loadOrders = async () => {
    const { data, error: loadError } = await authService.supabase.from("orders")
      .select("id, order_number, status, total_amount, delivery_fee_amount, delivery_quote_required, delivery_fee_overridden, expected_delivery_date, created_at, customers(users(full_name)), vendors(business_name), order_items(product_name, quantity)")
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
      authService.supabase.from("delivery_partners").select("id, approval_status, availability_status, created_at, reviewed_at, approved_at, rejected_at, users(full_name)").order("created_at", { ascending: false }),
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
    if (authenticated) void Promise.all([loadProducts(), loadVendors(), loadOrders(), loadDelivery()]);
  }, [authenticated]);

  const reviewVendor = async (id: string, status: "approved" | "rejected") => {
    const { error: updateError } = await authService.supabase.rpc("admin_review_vendor", { target_id: id, next_status: status });
    if (updateError) {
      setApprovalsError(updateError.message);
      return;
    }
    await loadVendors();
  };
  const reviewDeliveryPartner = async (id: string, status: "approved" | "rejected") => {
    const { error: updateError } = await authService.supabase.rpc("admin_review_delivery_partner", { target_id: id, next_status: status });
    if (updateError) {
      setApprovalsError(updateError.message);
      return;
    }
    await loadDelivery();
  };
  const reviewProduct = async (product: Product, status: "approved" | "rejected") => {
    const { error: updateError } = await authService.supabase.rpc("admin_review_product", { target_id: product.id, next_status: status });
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
  const overrideDeliveryFee = async (orderId: string) => {
    const input = deliveryFeeOverrides[orderId] ?? "";
    const fee = Number(input);
    if (!input.trim() || !Number.isFinite(fee) || fee < 0) {
      setOrdersError("Enter a valid delivery charge.");
      return;
    }
    const { error: updateError } = await authService.supabase.rpc("admin_override_delivery_fee", {
      target_order_id: orderId,
      delivery_fee: fee,
    });
    if (updateError) {
      setOrdersError(updateError.message);
      return;
    }
    setDeliveryFeeOverrides((current) => ({ ...current, [orderId]: "" }));
    await loadOrders();
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
            <thead><tr><th>Order</th><th>Customer</th><th>Vendor</th><th>Items</th><th>Delivery</th><th>Expected</th><th>Total</th><th>Status</th><th>Delivery partner</th><th>Action</th></tr></thead>
            <tbody>
              {orders.map((order) => <tr key={order.id}>
                <td><b>{order.order_number}</b></td>
                <td>{order.customers?.users?.full_name || "Customer"}</td>
                <td>{order.vendors?.business_name ?? "-"}</td>
                <td>{order.order_items.map((item) => `${item.quantity} x ${item.product_name}`).join(", ")}</td>
                <td><div className="delivery-override"><span>{order.delivery_quote_required ? "Manual quote required" : `Rs ${Number(order.delivery_fee_amount).toLocaleString("en-IN")}${order.delivery_fee_overridden ? " (override)" : ""}`}</span><input type="number" min="0" placeholder="Override" value={deliveryFeeOverrides[order.id] ?? ""} onChange={(event) => setDeliveryFeeOverrides((current) => ({ ...current, [order.id]: event.target.value }))} /><button className="approve" onClick={() => void overrideDeliveryFee(order.id)}>Save</button></div></td>
                <td>{order.expected_delivery_date}</td>
                <td>Rs {Number(order.total_amount).toLocaleString("en-IN")}</td>
                <td><span className="badge">{statusLabels[order.status] ?? order.status}</span></td>
                <td>{deliveryAssignments.find((assignment) => assignment.order_id === order.id)
                  ? deliveryPartners.find((partner) => partner.id === deliveryAssignments.find((assignment) => assignment.order_id === order.id)?.delivery_partner_id)?.users?.full_name ?? "Assigned partner"
                  : order.status === "ready_for_pickup"
                    ? <select className="unassigned" defaultValue="" onChange={(event) => void assignDeliveryPartner(order.id, event.target.value)}>
                      <option value="" disabled>Assign partner</option>
                      {deliveryPartners.filter((partner) => partner.approval_status === "approved").map((partner) => <option key={partner.id} value={partner.id}>{partner.users?.full_name || "Delivery partner"} ({partner.availability_status})</option>)}
                    </select>
                    : "-"}</td>
                <td>{nextStatus[order.status] ? <button className="approve" onClick={() => advanceOrder(order)}>Advance status</button> : "-"}</td>
              </tr>)}
              {!orders.length && <tr><td colSpan={10}>No incoming orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card">
        <div className="card-head"><div><h2>Vendor approvals</h2><p>Review vendor accounts before their approved products can reach customers.</p></div></div>
        {approvalsError && <p className="auth-error">{approvalsError}</p>}
        <div className="table-wrap"><table>
          <thead><tr><th>Vendor</th><th>Owner</th><th>Submitted</th><th>Status</th><th>Reviewed</th><th>Action</th></tr></thead>
          <tbody>{vendors.map((vendor) => <tr key={vendor.id}>
            <td><b>{vendor.business_name}</b></td><td>{vendor.users?.full_name || "-"}</td><td>{auditTime(vendor.created_at)}</td>
            <td><span className={`badge ${badgeTone(vendor.approval_status)}`}>{approvalLabels[vendor.approval_status]}</span></td>
            <td>{auditTime(vendor.reviewed_at)}</td>
            <td><div className="actions"><button className="approve" onClick={() => void reviewVendor(vendor.id, "approved")}>Approve</button><button className="reject" onClick={() => void reviewVendor(vendor.id, "rejected")}>Reject</button></div></td>
          </tr>)}{!vendors.length && <tr><td colSpan={6}>No vendors yet.</td></tr>}</tbody>
        </table></div>
      </section>
      <section className="card">
        <div className="card-head"><div><h2>Delivery partner approvals</h2><p>Only approved delivery partners can accept or receive assignments.</p></div></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Partner</th><th>Availability</th><th>Submitted</th><th>Status</th><th>Reviewed</th><th>Action</th></tr></thead>
          <tbody>{deliveryPartners.map((partner) => <tr key={partner.id}>
            <td><b>{partner.users?.full_name || "Delivery partner"}</b></td><td>{partner.availability_status}</td><td>{auditTime(partner.created_at)}</td>
            <td><span className={`badge ${badgeTone(partner.approval_status)}`}>{approvalLabels[partner.approval_status]}</span></td>
            <td>{auditTime(partner.reviewed_at)}</td>
            <td><div className="actions"><button className="approve" onClick={() => void reviewDeliveryPartner(partner.id, "approved")}>Approve</button><button className="reject" onClick={() => void reviewDeliveryPartner(partner.id, "rejected")}>Reject</button></div></td>
          </tr>)}{!deliveryPartners.length && <tr><td colSpan={6}>No delivery partners yet.</td></tr>}</tbody>
        </table></div>
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
            <p>Review vendor products before they enter the customer catalogue.</p>
          </div>
        </div>
        {productsError && <p className="auth-error">{productsError}</p>}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Vendor</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Reviewed</th><th>Action</th></tr></thead>
            <tbody>
              {products.map((product) => <tr key={product.id}>
                <td><b>{product.name}</b></td>
                <td>{product.vendors?.business_name ?? "-"}</td>
                <td>{product.categories?.name ?? "-"}</td>
                <td>Rs {Number(product.price).toLocaleString("en-IN")}</td>
                <td>{product.inventory?.[0]?.quantity_available ?? 0}</td>
                <td><span className={`badge ${badgeTone(product.approval_status)}`}>{approvalLabels[product.approval_status]}</span></td>
                <td>{auditTime(product.reviewed_at)}</td>
                <td><div className="actions"><button className="approve" onClick={() => void reviewProduct(product, "approved")}>Approve</button><button className="reject" onClick={() => void reviewProduct(product, "rejected")}>Reject</button></div></td>
              </tr>)}
              {!products.length && <tr><td colSpan={8}>No products yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <button className="quiet-btn" onClick={() => authService.logout()}>Sign out</button>
    </main>
  );
}
