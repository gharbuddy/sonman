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

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      <button className="quiet-btn" onClick={() => authService.logout()}>Sign out</button>
    </main>
  );
}
