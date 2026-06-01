import { createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = Router();
const createOrderSchema = z.object({
  deliveryAddress: z.record(z.string(), z.unknown()),
  deliveryDistanceKm: z.number().nonnegative().default(0),
});
const verifyPaymentSchema = createOrderSchema.extend({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  notes?: Record<string, string>;
};

async function razorpayRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = await response.json() as T & { error?: { description?: string } };
  if (!response.ok) throw new Error(body.error?.description ?? "Razorpay request failed");
  return body;
}

async function customerIdFor(userId: string) {
  const { data, error } = await supabaseAdmin.from("customers").select("id").eq("user_id", userId).single();
  if (error || !data) throw new Error("Customer account is unavailable");
  return data.id;
}

router.post("/orders", requireAuth, requireRoles("customer"), async (req, res, next) => {
  try {
    const input = createOrderSchema.parse(req.body);
    const customerId = await customerIdFor(req.authUser!.id);
    const { data: quote, error } = await supabaseAdmin.rpc("razorpay_cart_quote", {
      target_customer: customerId,
      delivery_distance_km: input.deliveryDistanceKm,
    });
    if (error) throw error;
    const amount = Math.round(Number(quote.total_amount) * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Cart total is invalid");
    const order = await razorpayRequest<RazorpayOrder>("/orders", {
      method: "POST",
      body: JSON.stringify({ amount, currency: "INR", receipt: `sonman_${Date.now()}`, notes: { customer_id: customerId } }),
    });
    res.status(201).json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Razorpay order could not be created" });
  }
});

router.post("/verify", requireAuth, requireRoles("customer"), async (req, res, next) => {
  try {
    const input = verifyPaymentSchema.parse(req.body);
    const expected = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest();
    const provided = Buffer.from(input.razorpaySignature, "hex");
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      res.status(400).json({ error: "Payment verification failed. Your order was not created." });
      return;
    }

    const customerId = await customerIdFor(req.authUser!.id);
    const razorpayOrder = await razorpayRequest<RazorpayOrder>(`/orders/${encodeURIComponent(input.razorpayOrderId)}`);
    if (razorpayOrder.notes?.customer_id !== customerId) throw new Error("Razorpay order does not belong to this customer");
    let payment = await razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(input.razorpayPaymentId)}`);
    if (payment.order_id !== input.razorpayOrderId) throw new Error("Razorpay order does not match the payment");
    if (payment.amount !== razorpayOrder.amount || payment.currency !== razorpayOrder.currency) throw new Error("Razorpay payment amount does not match the order");
    if (payment.status === "authorized") {
      payment = await razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(payment.id)}/capture`, {
        method: "POST",
        body: JSON.stringify({ amount: payment.amount, currency: payment.currency }),
      });
    }
    if (payment.status !== "captured") throw new Error("Payment has not been captured");

    const { data, error } = await supabaseAdmin.rpc("place_paid_cart_order", {
      target_customer: customerId,
      delivery_address: input.deliveryAddress,
      delivery_distance_km: input.deliveryDistanceKm,
      paid_amount_paise: payment.amount,
      razorpay_order_id: payment.order_id,
      razorpay_payment_id: payment.id,
      razorpay_payment_method: payment.method ?? null,
    });
    if (error) throw error;
    res.json({ orders: data });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Payment verification failed. Your order was not created." });
  }
});

export default router;
