import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/vendor", requireRoles("vendor"), async (req, res) => {
  const input = z.object({
    businessName: z.string().trim().min(1),
    description: z.string().trim().optional(),
    businessAddress: z.record(z.unknown()),
  }).parse(req.body);
  const { data, error } = await supabaseAdmin.from("vendors").upsert({
    user_id: req.authUser!.id,
    business_name: input.businessName,
    description: input.description,
    business_address: input.businessAddress,
  }, { onConflict: "user_id" }).select().single();
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
});

router.post("/delivery-partner", requireRoles("delivery_partner"), async (req, res) => {
  const input = z.object({
    vehicleType: z.string().trim().min(1),
    vehicleNumber: z.string().trim().min(1),
  }).parse(req.body);
  const { data, error } = await supabaseAdmin.from("delivery_partners").upsert({
    user_id: req.authUser!.id,
    vehicle_type: input.vehicleType,
    vehicle_number: input.vehicleNumber,
  }, { onConflict: "user_id" }).select().single();
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
});

export default router;
