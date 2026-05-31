import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

router.get("/categories", async (_req, res) => {
  const { data, error } = await supabaseAdmin.from("categories").select("*").eq("is_active", true).order("sort_order");
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

router.get("/products", async (req, res) => {
  let query = supabaseAdmin.from("products")
    .select("*, product_images(*), inventory(quantity_available), vendors!inner(business_name, approval_status)")
    .eq("is_active", true).is("deleted_at", null).eq("vendors.approval_status", "approved");
  if (typeof req.query.categoryId === "string") query = query.eq("category_id", req.query.categoryId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

export default router;
