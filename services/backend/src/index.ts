import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { startNotificationDispatcher } from "./lib/notification-dispatcher.js";

app.listen(env.PORT, () => {
  console.log(`Sonman API listening on port ${env.PORT}`);
  startNotificationDispatcher(env.NOTIFICATION_POLL_INTERVAL_MS);
});
