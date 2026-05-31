import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import type { SupabaseClient } from "@sonman/auth-service";

export type NotificationApp = "customer" | "vendor" | "delivery";
export type NotificationPreference = {
  push_enabled: boolean;
  order_updates_enabled: boolean;
  new_orders_enabled: boolean;
  delivery_assignments_enabled: boolean;
};
export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

const defaults: NotificationPreference = {
  push_enabled: true,
  order_updates_enabled: true,
  new_orders_enabled: true,
  delivery_assignments_enabled: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const registerToken = async (supabase: SupabaseClient, app: NotificationApp, token: Notifications.DevicePushToken) => {
  const { error } = await supabase.rpc("register_push_token", {
    device_token: String(token.data),
    token_platform: token.type === "apns" ? "ios" : "android",
    token_app: app,
  });
  if (error) throw error;
};

export function usePushNotifications(supabase: SupabaseClient, authenticated: boolean, app: NotificationApp) {
  useEffect(() => {
    if (!authenticated || Platform.OS !== "android") return;
    let active = true;
    let subscription: Notifications.EventSubscription | undefined;
    const configure = async () => {
      await Notifications.setNotificationChannelAsync("orders", {
        name: "Order updates",
        importance: Notifications.AndroidImportance.HIGH,
      });
      const current = await Notifications.getPermissionsAsync();
      const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
      if (!permission.granted || !active) return;
      await registerToken(supabase, app, await Notifications.getDevicePushTokenAsync());
      subscription = Notifications.addPushTokenListener((token) => void registerToken(supabase, app, token));
    };
    void configure().catch((error) => console.warn("Push notification registration failed", error));
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [app, authenticated, supabase]);
}

const loadPreferences = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase.from("notification_preferences").select("*").maybeSingle();
  if (error) throw error;
  if (data) return data as NotificationPreference;
  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user.user) throw new Error("Sign in to manage notifications.");
  const { data: inserted, error: insertError } = await supabase.from("notification_preferences")
    .insert({ user_id: user.user.id }).select().single();
  if (insertError) throw insertError;
  return inserted as NotificationPreference;
};

export function NotificationSettingsScreen({ supabase, app, onBack }: { supabase: SupabaseClient; app: NotificationApp; onBack: () => void }) {
  const [preferences, setPreferences] = useState(defaults);
  const [error, setError] = useState("");
  useEffect(() => { void loadPreferences(supabase).then(setPreferences).catch((cause) => setError(String(cause))); }, [supabase]);
  const update = async (key: keyof NotificationPreference, value: boolean) => {
    const previous = preferences;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    const { error: updateError } = await supabase.from("notification_preferences").update({ [key]: value });
    if (updateError) {
      setPreferences(previous);
      setError(updateError.message);
    }
  };
  const category = app === "customer"
    ? ["order_updates_enabled", "Order updates"] as const
    : app === "vendor"
      ? ["new_orders_enabled", "New orders"] as const
      : ["delivery_assignments_enabled", "Delivery assignments"] as const;
  return <ScrollView contentContainerStyle={styles.screen}>
    <Header title="Notification settings" onBack={onBack} />
    <Text style={styles.subtitle}>Choose which Android push alerts you receive. Notification history remains available in the app.</Text>
    <Setting title="Push notifications" subtitle="Allow Sonman to send alerts to this device." value={preferences.push_enabled} onChange={(value) => void update("push_enabled", value)} />
    <Setting title={category[1]} subtitle="Receive alerts for activity that needs your attention." value={preferences[category[0]]} onChange={(value) => void update(category[0], value)} />
    {!!error && <Text style={styles.error}>{error}</Text>}
  </ScrollView>;
}

export function NotificationHistoryScreen({ supabase, onBack }: { supabase: SupabaseClient; onBack: () => void }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase.from("notifications")
      .select("id, type, title, body, read_at, created_at").order("created_at", { ascending: false });
    if (loadError) throw loadError;
    setItems(data as NotificationItem[]);
  }, [supabase]);
  useEffect(() => {
    void load().catch((cause) => setError(String(cause)));
    const channel = supabase.channel("notification-history")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load, supabase]);
  const markRead = async (id: string) => {
    const { error: updateError } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (updateError) setError(updateError.message);
    else await load();
  };
  return <ScrollView contentContainerStyle={styles.screen}>
    <Header title="Notifications" onBack={onBack} />
    {!!error && <Text style={styles.error}>{error}</Text>}
    {!items.length && <Text style={styles.subtitle}>No notifications yet.</Text>}
    {items.map((item) => <Pressable key={item.id} style={[styles.card, !item.read_at && styles.unread]} onPress={() => void markRead(item.id)}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
    </Pressable>)}
  </ScrollView>;
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return <View style={styles.header}><Pressable style={styles.back} onPress={onBack}><Text style={styles.backText}>{"<"}</Text></Pressable><Text style={styles.title}>{title}</Text><View style={styles.back} /></View>;
}
function Setting({ title, subtitle, value, onChange }: { title: string; subtitle: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={styles.setting}><View style={styles.copy}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.body}>{subtitle}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ true: "#A97B2C" }} /></View>;
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 100, backgroundColor: "#F8F6F1" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backText: { color: "#171717", fontSize: 22, fontWeight: "700" },
  title: { color: "#171717", fontSize: 25, fontWeight: "700" },
  subtitle: { color: "#76716A", fontSize: 14, lineHeight: 21, marginBottom: 12 },
  card: { padding: 14, borderWidth: 1, borderColor: "#E7E1D8", borderRadius: 16, backgroundColor: "#FFFFFF", marginBottom: 9 },
  unread: { borderColor: "#A97B2C", backgroundColor: "#F6E8C6" },
  cardTitle: { color: "#171717", fontSize: 14, fontWeight: "700" },
  body: { color: "#76716A", fontSize: 13, lineHeight: 19, marginTop: 4 },
  date: { color: "#A97B2C", fontSize: 11, fontWeight: "600", marginTop: 8 },
  setting: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1, borderColor: "#E7E1D8", borderRadius: 16, backgroundColor: "#FFFFFF", marginTop: 10 },
  copy: { flex: 1 },
  error: { color: "#D85743", fontSize: 12, lineHeight: 18, marginTop: 10 },
});
