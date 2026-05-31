import type { User } from "@supabase/supabase-js";

export type UserRole = "customer" | "vendor" | "delivery_partner" | "admin";

declare global {
  namespace Express {
    interface Request {
      authUser?: User;
      userRole?: UserRole;
    }
  }
}

export {};
