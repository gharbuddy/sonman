import { firebaseMessaging, isFirebaseConfigured } from "./firebase.js";
import { supabaseAdmin } from "./supabase.js";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
};

const preferenceColumn = (type: string) => {
  if (type === "vendor.new_order") return "new_orders_enabled";
  if (type === "delivery.new_assignment") return "delivery_assignments_enabled";
  return "order_updates_enabled";
};

const stringifyData = (data: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)]));

export async function dispatchPendingNotifications() {
  if (!isFirebaseConfigured()) return;
  const { data: notifications, error } = await supabaseAdmin.from("notifications")
    .select("id, user_id, type, title, body, data")
    .eq("delivery_status", "pending")
    .in("channel", ["push", "both"])
    .order("created_at")
    .limit(50);
  if (error) throw error;

  for (const notification of (notifications ?? []) as NotificationRow[]) {
    const { data: preference } = await supabaseAdmin.from("notification_preferences")
      .select("push_enabled, order_updates_enabled, new_orders_enabled, delivery_assignments_enabled")
      .eq("user_id", notification.user_id)
      .maybeSingle();
    const enabled = preference?.push_enabled !== false && preference?.[preferenceColumn(notification.type)] !== false;
    const { data: rows } = await supabaseAdmin.from("push_tokens").select("id, token")
      .eq("user_id", notification.user_id).eq("is_active", true);
    const tokens = rows ?? [];

    if (!enabled || !tokens.length) {
      await supabaseAdmin.from("notifications").update({
        delivery_status: "sent",
        sent_at: new Date().toISOString(),
      }).eq("id", notification.id);
      continue;
    }

    const response = await firebaseMessaging().sendEachForMulticast({
      tokens: tokens.map(({ token }) => token),
      notification: { title: notification.title, body: notification.body },
      data: { ...stringifyData(notification.data), notification_id: notification.id, type: notification.type },
      android: { priority: "high", notification: { channelId: "orders" } },
    });
    const invalidTokenIds = response.responses.flatMap((result, index) =>
      !result.success && ["messaging/invalid-registration-token", "messaging/registration-token-not-registered"].includes(result.error?.code ?? "")
        ? [tokens[index].id]
        : [],
    );
    if (invalidTokenIds.length) {
      await supabaseAdmin.from("push_tokens").update({ is_active: false }).in("id", invalidTokenIds);
    }
    await supabaseAdmin.from("notifications").update({
      delivery_status: response.successCount ? "sent" : "failed",
      sent_at: response.successCount ? new Date().toISOString() : null,
    }).eq("id", notification.id);
  }
}

export function startNotificationDispatcher(intervalMs: number) {
  if (!isFirebaseConfigured()) {
    console.warn("FCM credentials are not configured; push delivery worker is disabled.");
    return;
  }
  const run = () => void dispatchPendingNotifications().catch((error) => console.error("FCM dispatch failed", error));
  run();
  setInterval(run, intervalMs).unref();
}
