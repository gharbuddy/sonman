import { Router } from "express";
import { z } from "zod";
import { supabaseAuth } from "../lib/supabase.js";

const router = Router();

router.post("/register", async (req, res) => {
  const input = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().trim().min(1),
    role: z.enum(["customer", "vendor", "delivery_partner"]).default("customer"),
  }).parse(req.body);

  const { data, error } = await supabaseAuth.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.fullName, role: input.role } },
  });
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
});

router.post("/login", async (req, res) => {
  const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const { data, error } = await supabaseAuth.auth.signInWithPassword(input);
  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }
  res.json(data);
});

export default router;
