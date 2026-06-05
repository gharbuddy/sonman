import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { startNotificationDispatcher } from "./lib/notification-dispatcher.js";

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Sonman API listening on port ${env.PORT}`);
  console.log(`Local: http://localhost:${env.PORT}`);
  console.log(`Network: http://192.168.1.5:${env.PORT}`);

  startNotificationDispatcher(env.NOTIFICATION_POLL_INTERVAL_MS);
});