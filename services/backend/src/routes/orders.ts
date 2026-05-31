import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  let query = supabaseAdmin.from("orders").select("*, order_items(*), payments(*)").order("created_at", { ascending: false });

  if (req.userRole === "customer") {
    const { data } = await supabaseAdmin.from("customers").select("id").eq("user_id", req.authUser!.id).single();
    query = query.eq("customer_id", data?.id ?? "");
  } else if (req.userRole === "vendor") {
    const { data } = await supabaseAdmin.from("vendors").select("id").eq("user_id", req.authUser!.id).single();
    query = query.eq("vendor_id", data?.id ?? "");
  } else if (req.userRole === "delivery_partner") {
    const { data } = await supabaseAdmin.from("delivery_partners").select("id").eq("user_id", req.authUser!.id).single();
    const { data: assignments } = await supabaseAdmin.from("delivery_assignments").select("order_id").eq("delivery_partner_id", data?.id ?? "");
    query = query.in("id", assignments?.map(({ order_id }) => order_id) ?? []);
  }

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

export default router;
