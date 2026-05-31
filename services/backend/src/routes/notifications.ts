import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("notifications").select("*")
    .eq("user_id", req.authUser!.id).order("created_at", { ascending: false });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("notifications").update({ read_at: new Date().toISOString() })
    .eq("id", req.params.id).eq("user_id", req.authUser!.id).select().single();
  if (error) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(data);
});

export default router;
