import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRoles("admin"));

router.patch("/users/:id/role", async (req, res) => {
  const role = z.enum(["customer", "vendor", "delivery_partner", "admin"]).parse(req.body.role);
  const { data, error } = await supabaseAdmin.from("users").update({ role }).eq("id", req.params.id).select().single();
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json(data);
});

export default router;
