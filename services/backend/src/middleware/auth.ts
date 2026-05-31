import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import type { UserRole } from "../types/express.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired bearer token" });
    return;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users").select("role, is_active").eq("id", data.user.id).single();
  if (profileError || !profile?.is_active) {
    res.status(403).json({ error: "User profile is inactive or unavailable" });
    return;
  }

  req.authUser = data.user;
  req.userRole = profile.role as UserRole;
  next();
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
