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

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState("");

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
    if (authenticated) void loadProducts();
  }, [authenticated]);

  const setProductActive = async (product: Product, isActive: boolean) => {
    const { error: updateError } = await authService.supabase.from("products").update({ is_active: isActive }).eq("id", product.id);
    if (updateError) {
      setProductsError(updateError.message);
      return;
    }
    await loadProducts();
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
