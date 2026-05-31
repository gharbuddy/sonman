import cors from "cors";
import express from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { corsOrigins } from "./config/env.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";
import catalogRouter from "./routes/catalog.js";
import meRouter from "./routes/me.js";
import notificationsRouter from "./routes/notifications.js";
import ordersRouter from "./routes/orders.js";
import profilesRouter from "./routes/profiles.js";

export const app = express();
app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/me", meRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/profiles", profilesRouter);
app.use("/api/v1/admin", adminRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Invalid request", details: error.flatten() });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});
