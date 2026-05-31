import { z } from "zod";

const optionalString = z.preprocess((value) => value === "" ? undefined : value, z.string().optional());
const optionalEmail = z.preprocess((value) => value === "" ? undefined : value, z.string().email().optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  FCM_PROJECT_ID: optionalString,
  FCM_CLIENT_EMAIL: optionalEmail,
  FCM_PRIVATE_KEY: optionalString,
  NOTIFICATION_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
});

export const env = schema.parse(process.env);
export const corsOrigins = env.CORS_ORIGINS.split(",").map((origin) => origin.trim());
