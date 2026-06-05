import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = Router();

const manualConfirmSchema = z.object({
  deliveryAddress: z.record(z.string(), z.unknown()),
  deliveryDistanceKm: z.number().nonnegative().default(0),
  paymentReference: z.string().trim().min(1).optional(),
});

router.post("/manual-confirm", requireAuth, requireRoles("customer"), async (req, res) => {
  try {
    const input = manualConfirmSchema.parse(req.body);
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", req.authUser!.id)
      .single();

    if (customerError || !customer) {
      throw new Error("Customer account is required");
    }

    const { data, error } = await supabaseAdmin.rpc("place_upi_manual_cart_order", {
      target_customer: customer.id,
      delivery_address: input.deliveryAddress,
      delivery_distance_km: input.deliveryDistanceKm,
      p_payment_reference: input.paymentReference ?? null,
    });

    if (error) throw error;

    res.json({ orders: data });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error
        ? error.message
        : "UPI payment confirmation failed. Your order was not created.",
    });
  }
});

export default router;
