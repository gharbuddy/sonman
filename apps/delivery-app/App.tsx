import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserProfile } from "@sonman/auth-service";
import { NotificationHistoryScreen, NotificationSettingsScreen, usePushNotifications } from "@sonman/notifications-service";
import { authService } from "./auth";
import { createDeliveryOrdersService, type DeliveryOrder as Order, type DeliveryOrderStatus as OrderStatus } from "./orders";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

type Screen = "login" | "dashboard" | "available" | "assigned" | "details" | "pickup" | "route" | "delivery" | "earnings" | "profile" | "notifications" | "notification-settings";
const palette = {
  cream: "#F8F6F1", white: "#FFFFFF", sand: "#F0ECE4", line: "#E7E1D8",
  black: "#171717", muted: "#76716A", gold: "#A97B2C", goldPale: "#F6E8C6",
  green: "#267250", greenPale: "#E5F3EB", red: "#D85743", redPale: "#FBE9E5",
  blue: "#43617D", bluePale: "#E5EDF5",
};

const money = (value: number) => `Rs ${value.toLocaleString("en-IN")}`;
const SAFE_TOP = Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 0;
const NAV_HEIGHT = 68;

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderError, setOrderError] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [profile, setProfile] = useState<UserProfile>();
  const ordersService = useMemo(() => createDeliveryOrdersService(authService.supabase), []);
  usePushNotifications(authService.supabase, authenticated, "delivery");
  const selected = orders.filter((order) => order.id === selectedId)[0];

  const openOrder = (order: Order) => { setSelectedId(order.id); setScreen("details"); };
  const loadOrders = async () => {
    try {
      setOrders(await ordersService.list());
      setOrderError("");
    } catch (cause) {
      setOrderError(cause instanceof Error ? cause.message : "Delivery orders could not be loaded.");
    }
  };
  const runOrderAction = async (action: () => Promise<void>, nextScreen: Screen) => {
    try {
      setOrderError("");
      await action();
      await loadOrders();
      setScreen(nextScreen);
    } catch (cause) {
      setOrderError(cause instanceof Error ? cause.message : "The delivery order could not be updated.");
    }
  };
  const accept = async () => { if (selected) await runOrderAction(() => ordersService.accept(selected.id), "assigned"); };
  const reject = () => { if (selected) setOrders((current) => current.filter((order) => order.id !== selected.id)); setScreen("available"); };
  const pickedUp = async () => { if (selected) await runOrderAction(() => ordersService.markPickedUp(selected.id), "route"); };
  const delivered = async (otp: string) => { if (selected) await runOrderAction(() => ordersService.markDelivered(selected.id, otp), "assigned"); };

  useEffect(() => {
    authService.restoreSession("delivery_partner")
      .then((auth) => {
        if (auth) {
          setAuthenticated(true);
          setScreen("dashboard");
        }
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingSession(false));
    const subscription = authService.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setAuthenticated(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void authService.getCurrentProfile().then(setProfile).catch((cause) => setOrderError(cause instanceof Error ? cause.message : "Profile could not be loaded."));
    void loadOrders();
    const channel = ordersService.subscribe(() => void loadOrders());
    return () => { void authService.supabase.removeChannel(channel); };
  }, [authenticated]);

  if (checkingSession) return <SafeLayout><View style={styles.login}><Brand /><Text style={styles.body}>Restoring your session...</Text></View></SafeLayout>;
  if (!authenticated || screen === "login") return <SafeLayout><Login onAuthenticated={() => { setAuthenticated(true); setScreen("dashboard"); }} /></SafeLayout>;
  return <SafeLayout>
    {screen === "dashboard" && <Dashboard profile={profile} orders={orders} error={orderError} onNavigate={setScreen} onOpen={openOrder} />}
    {screen === "available" && <AvailableOrders orders={orders.filter((order) => order.status === "Available")} onOpen={openOrder} />}
    {screen === "assigned" && <AssignedOrders orders={orders.filter((order) => order.status !== "Available")} onOpen={openOrder} />}
    {screen === "details" && selected && <OrderDetails order={selected} onBack={() => setScreen(selected.status === "Available" ? "available" : "assigned")} onAccept={accept} onReject={reject} onPickup={() => setScreen("pickup")} onRoute={() => setScreen("route")} />}
    {screen === "pickup" && selected && <PickupConfirmation order={selected} onBack={() => setScreen("details")} onConfirm={pickedUp} />}
    {screen === "route" && selected && <RouteScreen order={selected} onBack={() => setScreen("details")} onDeliver={() => setScreen("delivery")} />}
    {screen === "delivery" && selected && <DeliveryConfirmation order={selected} onBack={() => setScreen("route")} onConfirm={delivered} />}
    {screen === "earnings" && <Earnings />}
    {screen === "profile" && <Profile profile={profile} onNotifications={() => setScreen("notifications")} onNotificationSettings={() => setScreen("notification-settings")} onLogout={async () => { await authService.logout(); setScreen("login"); }} />}
    {screen === "notifications" && <NotificationHistoryScreen supabase={authService.supabase} onBack={() => setScreen("profile")} />}
    {screen === "notification-settings" && <NotificationSettingsScreen supabase={authService.supabase} app="delivery" onBack={() => setScreen("profile")} />}
    <BottomNav screen={screen} onNavigate={setScreen} />
  </SafeLayout>;
}

function Login({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [registering, setRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      if (registering) {
        const result = await authService.register({ email, password, fullName, role: "delivery_partner" });
        if (!result.session) {
          setError("Check your email to confirm your account, then sign in.");
          return;
        }
        await authService.restoreSession("delivery_partner");
      } else {
        await authService.login(email, password, "delivery_partner");
      }
      onAuthenticated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };
  return <View style={styles.login}>
    <View><Brand /><Text style={styles.loginTitle}>Deliver better.{"\n"}Earn smarter.</Text><Text style={styles.body}>Your daily Sonman delivery workspace, built to keep every stop clear.</Text></View>
    <View style={styles.loginCard}><Text style={styles.cardTitle}>{registering ? "Partner registration" : "Partner sign in"}</Text><Text style={styles.smallMuted}>{registering ? "Create your delivery partner account." : "Welcome back to Sonman Delivery."}</Text>{registering && <Field label="Full name" placeholder="Your name" value={fullName} onChange={setFullName} />}<Field label="Email address" placeholder="partner@sonman.in" value={email} onChange={setEmail} /><Field label="Password" placeholder="Enter password" secure value={password} onChange={setPassword} />{!!error && <Text style={styles.error}>{error}</Text>}<PrimaryButton label={busy ? "Please wait..." : registering ? "Create partner account" : "Sign in"} onPress={submit} disabled={busy} /><Text style={styles.linkRight} onPress={() => { setRegistering(!registering); setError(""); }}>{registering ? "Already registered? Sign in" : "New partner? Register"}</Text><Text style={styles.help}>Need help?  <Text style={styles.goldText}>Contact delivery support</Text></Text></View>
  </View>;
}

function Dashboard({ profile, orders, error, onNavigate, onOpen }: { profile?: UserProfile; orders: Order[]; error: string; onNavigate: (screen: Screen) => void; onOpen: (order: Order) => void }) {
  const available = orders.filter((order) => order.status === "Available");
  const active = orders.filter((order) => order.status === "Assigned" || order.status === "Picked up");
  return <ScreenScroll>
    <Header title={`Welcome, ${profile?.full_name || "Partner"}`} subtitle="Ready for your next delivery?" />
    <View style={styles.statusCard}><View><Text style={styles.statusKicker}>YOU ARE ONLINE</Text><Text style={styles.statusTitle}>Accepting new orders</Text><Text style={styles.smallMuted}>Your zone: Central Bengaluru</Text></View><View style={styles.onlineDot} /></View>
    {!!error && <Text style={styles.error}>{error}</Text>}
    <View style={styles.statGrid}><StatCard value={String(active.length)} label="Active orders" note="Keep moving" color={palette.goldPale} onPress={() => onNavigate("assigned")} /><StatCard value={String(available.length)} label="Available" note="Near your zone" color={palette.greenPale} onPress={() => onNavigate("available")} /><StatCard value="Rs 684" label="Today earned" note="8 deliveries" color={palette.bluePale} onPress={() => onNavigate("earnings")} /><StatCard value="4.9" label="Your rating" note="142 reviews" color={palette.sand} /></View>
    <SectionHeader title="Current delivery" action="Assigned orders" onPress={() => onNavigate("assigned")} />
    {active.length ? <OrderCard order={active[0]} onPress={() => onOpen(active[0])} /> : <Empty text="No active deliveries right now." />}
    <SectionHeader title="Nearby opportunities" action="View all" onPress={() => onNavigate("available")} />
    {available.slice(0, 2).map((order) => <OrderCard key={order.id} order={order} onPress={() => onOpen(order)} />)}
  </ScreenScroll>;
}

function AvailableOrders({ orders, onOpen }: { orders: Order[]; onOpen: (order: Order) => void }) {
  return <ScreenScroll><Header title="Available orders" subtitle={`${orders.length} delivery opportunities near you.`} /><View style={styles.filterRow}>{["Nearby", "Highest earning", "Shortest route"].map((item, index) => <View key={item} style={[styles.chip, index === 0 && styles.chipActive]}><Text style={[styles.chipText, index === 0 && styles.chipTextActive]}>{item}</Text></View>)}</View>{orders.length ? orders.map((order) => <OrderCard key={order.id} order={order} onPress={() => onOpen(order)} />) : <Empty text="No available orders. Check back shortly." />}</ScreenScroll>;
}

function AssignedOrders({ orders, onOpen }: { orders: Order[]; onOpen: (order: Order) => void }) {
  return <ScreenScroll><Header title="Assigned orders" subtitle="Track each accepted delivery through completion." /><View style={styles.filterRow}>{["Active", "Picked up", "Delivered"].map((item, index) => <View key={item} style={[styles.chip, index === 0 && styles.chipActive]}><Text style={[styles.chipText, index === 0 && styles.chipTextActive]}>{item}</Text></View>)}</View>{orders.map((order) => <OrderCard key={order.id} order={order} onPress={() => onOpen(order)} />)}</ScreenScroll>;
}

function OrderDetails({ order, onBack, onAccept, onReject, onPickup, onRoute }: { order: Order; onBack: () => void; onAccept: () => void; onReject: () => void; onPickup: () => void; onRoute: () => void }) {
  return <ScreenScroll><PageHeader title="Order details" onBack={onBack} /><View style={styles.orderHero}><View><Text style={styles.statusKicker}>{order.id}</Text><Text style={styles.heroTitle}>{order.distance}</Text><Text style={styles.heroSub}>Estimated delivery route</Text></View><StatusBadge status={order.status} /></View><OrderSummary order={order} /><SectionHeader title="Order item" /><View style={styles.infoCard}><Text style={styles.rowTitle}>{order.items}</Text><Text style={styles.smallMuted}>Order value: {money(order.value)}</Text></View><View style={styles.actionRow}>{order.status === "Available" && <><OutlineButton label="Reject order" onPress={onReject} /><View style={styles.flex}><PrimaryButton label="Accept order" onPress={onAccept} /></View></>}{order.status === "Assigned" && <View style={styles.flex}><PrimaryButton label="Confirm pickup" onPress={onPickup} /></View>}{order.status === "Picked up" && <View style={styles.flex}><PrimaryButton label="Open route" onPress={onRoute} /></View>}{order.status === "Delivered" && <View style={styles.delivered}><Text style={styles.greenText}>Delivery completed successfully.</Text></View>}</View></ScreenScroll>;
}

function PickupConfirmation({ order, onBack, onConfirm }: { order: Order; onBack: () => void; onConfirm: () => void }) {
  return <ScreenScroll><PageHeader title="Pickup confirmation" onBack={onBack} /><StepBadge label="STEP 1 OF 2" /><Text style={styles.confirmTitle}>Confirm the package{"\n"}before leaving.</Text><Text style={styles.body}>Verify the vendor and order details at pickup.</Text><OrderSummary order={order} compact /><View style={styles.checkCard}><Text style={styles.checkMark}>OK</Text><View style={styles.flex}><Text style={styles.rowTitle}>Package collected</Text><Text style={styles.smallMuted}>Item count and packaging verified</Text></View></View><PrimaryButton label="Mark picked up" onPress={onConfirm} /></ScreenScroll>;
}

function RouteScreen({ order, onBack, onDeliver }: { order: Order; onBack: () => void; onDeliver: () => void }) {
  return <ScreenScroll><PageHeader title="Delivery route" onBack={onBack} /><View style={styles.map}><View style={styles.mapRoadA} /><View style={styles.mapRoadB} /><View style={styles.mapRoadC} /><View style={[styles.pin, styles.pinStart]}><Text style={styles.pinText}>P</Text></View><View style={[styles.pin, styles.pinEnd]}><Text style={styles.pinText}>D</Text></View><View style={styles.mapEta}><Text style={styles.statusKicker}>ETA</Text><Text style={styles.mapEtaValue}>18 min</Text></View></View><View style={styles.routeCard}><Text style={styles.statusKicker}>DELIVER TO</Text><Text style={styles.cardTitle}>{order.customer}</Text><Text style={styles.body}>{order.delivery}</Text><View style={styles.routeStats}><Text style={styles.rowTitle}>{order.distance}</Text><Text style={styles.rowTitle}>{order.expected}</Text></View></View><PrimaryButton label="Arrived - confirm delivery" onPress={onDeliver} /></ScreenScroll>;
}

function DeliveryConfirmation({ order, onBack, onConfirm }: { order: Order; onBack: () => void; onConfirm: (otp: string) => void }) {
  const [otp, setOtp] = useState("");
  const [photo, setPhoto] = useState(false);
  return <ScreenScroll><PageHeader title="Delivery confirmation" onBack={onBack} /><StepBadge label="FINAL STEP" /><Text style={styles.confirmTitle}>Verify and complete{"\n"}the delivery.</Text><Text style={styles.body}>Ask {order.customer} for the 4-digit delivery OTP.</Text><Text style={styles.sectionLabel}>DELIVERY OTP</Text><TextInput style={styles.otp} placeholder="0  0  0  0" placeholderTextColor={palette.muted} keyboardType="numeric" maxLength={4} value={otp} onChangeText={setOtp} /><Text style={styles.sectionLabel}>DELIVERY PROOF</Text><Pressable style={[styles.upload, photo && styles.uploadDone]} onPress={() => setPhoto(true)}><Text style={styles.uploadIcon}>{photo ? "OK" : "+"}</Text><Text style={styles.rowTitle}>{photo ? "Proof photo added" : "Add delivery proof photo"}</Text><Text style={styles.smallMuted}>{photo ? "Photo placeholder attached" : "Capture the delivered package at the address"}</Text></Pressable><PrimaryButton label="Mark delivered" onPress={() => onConfirm(otp)} disabled={otp.length !== 4 || !photo} /></ScreenScroll>;
}

function Earnings() {
  return <ScreenScroll><Header title="Earnings" subtitle="A clear view of your delivery income." /><View style={styles.earningsHero}><Text style={styles.statusKicker}>TODAY'S EARNINGS</Text><Text style={styles.earningsValue}>Rs 684</Text><Text style={styles.heroSub}>8 completed deliveries</Text></View><View style={styles.statGrid}><StatCard value="142" label="Total deliveries" note="All time" color={palette.sand} /><StatCard value="Rs 684" label="Today's earnings" note="+12% vs yesterday" color={palette.greenPale} /><StatCard value="Rs 4,860" label="Weekly earnings" note="This week" color={palette.goldPale} /><StatCard value="Rs 18,740" label="Monthly earnings" note="May total" color={palette.bluePale} /></View><SectionHeader title="Recent payouts" /><InfoRow label="May 28 payout" value="Rs 3,920" /><InfoRow label="May 21 payout" value="Rs 4,180" /><InfoRow label="May 14 payout" value="Rs 3,760" /></ScreenScroll>;
}

function Profile({ profile, onNotifications, onNotificationSettings, onLogout }: { profile?: UserProfile; onNotifications: () => void; onNotificationSettings: () => void; onLogout: () => void }) {
  const label = profile?.full_name || "Delivery partner";
  return <ScreenScroll><Header title="Profile" subtitle="Partner details and preferences." /><View style={styles.profileCard}><View style={styles.avatar}><Text style={styles.avatarText}>{label.slice(0, 2).toUpperCase()}</Text></View><View><Text style={styles.profileName}>{label}</Text><Text style={styles.smallMuted}>{profile?.email}</Text></View></View><SectionHeader title="Account settings" /><InfoRow label="Personal information" value=">" /><InfoRow label="Vehicle details" value=">" /><InfoRow label="Service zone" value=">" /><InfoRow label="Bank and payouts" value=">" /><InfoRow label="Notifications" value=">" onPress={onNotifications} /><InfoRow label="Notification settings" value=">" onPress={onNotificationSettings} /><InfoRow label="Help and support" value=">" /><Pressable onPress={onLogout}><Text style={styles.logout}>Sign out</Text></Pressable></ScreenScroll>;
}

function OrderSummary({ order, compact }: { order: Order; compact?: boolean }) {
  return <View style={styles.summary}><Location label="PICKUP FROM" title={order.vendor} address={order.pickup} marker="P" /><View style={styles.locationLine} /><Location label="DELIVER TO" title={order.customer} address={order.delivery} marker="D" />{!compact && <View style={styles.summaryFooter}><InfoTag label="Distance" value={order.distance} /><InfoTag label="Expected" value={order.expected} /><InfoTag label="Earn" value={money(order.earnings)} /></View>}</View>;
}
function Location({ label, title, address, marker }: { label: string; title: string; address: string; marker: string }) { return <View style={styles.location}><View style={styles.locationMarker}><Text style={styles.locationMarkerText}>{marker}</Text></View><View style={styles.flex}><Text style={styles.statusKicker}>{label}</Text><Text style={styles.rowTitle}>{title}</Text><Text style={styles.smallMuted}>{address}</Text></View></View>; }
function InfoTag({ label, value }: { label: string; value: string }) { return <View style={styles.flex}><Text style={styles.smallMuted}>{label}</Text><Text style={styles.tagValue}>{value}</Text></View>; }
function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) { return <Pressable style={styles.orderCard} onPress={onPress}><View style={styles.between}><Text style={styles.orderId}>{order.id}</Text><StatusBadge status={order.status} /></View><Text style={styles.rowTitle}>{order.vendor} to {order.customer}</Text><Text style={styles.smallMuted}>{order.pickup}</Text><View style={styles.cardFooter}><Text style={styles.cardMeta}>{order.distance}</Text><Text style={styles.cardMeta}>{order.expected}</Text><Text style={styles.cardEarn}>Earn {money(order.earnings)}</Text></View></Pressable>; }
function StatusBadge({ status }: { status: OrderStatus }) { const tone = status === "Available" ? styles.badgeAvailable : status === "Delivered" ? styles.badgeDone : styles.badgeActive; return <Text style={[styles.badge, tone]}>{status}</Text>; }
function Header({ title, subtitle }: { title: string; subtitle: string }) { return <View style={styles.header}><Brand /><Text style={styles.pageTitle}>{title}</Text><Text style={styles.body}>{subtitle}</Text></View>; }
function Brand() { return <View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View><Text style={styles.logo}>sonman <Text style={styles.brandSuffix}>delivery</Text></Text></View>; }
function PageHeader({ title, onBack }: { title: string; onBack: () => void }) { return <View style={styles.pageHeader}><Pressable style={styles.back} onPress={onBack}><Text style={styles.backText}>{"<"}</Text></Pressable><Text style={styles.pageTitle}>{title}</Text><View style={styles.back} /></View>; }
function Field({ label, placeholder, secure, value, onChange }: { label: string; placeholder: string; secure?: boolean; value?: string; onChange?: (text: string) => void }) { return <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>{label}</Text><TextInput style={styles.field} placeholder={placeholder} placeholderTextColor={palette.muted} secureTextEntry={secure} value={value} onChangeText={onChange} autoCapitalize="none" /></View>; }
function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) { return <View style={styles.sectionHeader}><Text style={styles.cardTitle}>{title}</Text>{action && <Text style={styles.goldText} onPress={onPress}>{action}</Text>}</View>; }
function StatCard({ value, label, note, color, onPress }: { value: string; label: string; note: string; color: string; onPress?: () => void }) { return <Pressable style={[styles.statCard, { backgroundColor: color }]} onPress={onPress}><Text style={styles.statValue}>{value}</Text><Text style={styles.rowTitle}>{label}</Text><Text style={styles.smallMuted}>{note}</Text></Pressable>; }
function StepBadge({ label }: { label: string }) { return <Text style={styles.stepBadge}>{label}</Text>; }
function Empty({ text }: { text: string }) { return <View style={styles.empty}><Text style={styles.goldText}>SONMAN DELIVERY</Text><Text style={styles.body}>{text}</Text></View>; }
function InfoRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) { return <Pressable style={styles.infoRow} onPress={onPress}><Text style={styles.rowTitle}>{label}</Text><Text style={styles.infoValue}>{value}</Text></Pressable>; }
function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable style={[styles.primary, disabled && styles.disabled]} onPress={onPress} disabled={disabled}><Text style={styles.primaryText}>{label}</Text></Pressable>; }
function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable style={styles.outline} onPress={onPress}><Text style={styles.outlineText}>{label}</Text></Pressable>; }

function BottomNav({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  const nav = [["HM", "Home", "dashboard"], ["AV", "Available", "available"], ["BX", "Assigned", "assigned"], ["IN", "Earnings", "earnings"], ["ME", "Profile", "profile"]] as const;
  return <View style={styles.bottomNav}>{nav.map(([icon, label, target]) => <Pressable key={target} style={styles.navItem} onPress={() => onNavigate(target)}><Text style={[styles.navIcon, screen === target && styles.navActive]}>{icon}</Text><Text style={[styles.navLabel, screen === target && styles.navActive]}>{label}</Text>{screen === target && <View style={styles.navDot} />}</Pressable>)}</View>;
}
function SafeLayout({ children }: { children: ReactNode }) { return <SafeAreaView style={styles.safe}><ExpoStatusBar style="dark" />{children}</SafeAreaView>; }
function ScreenScroll({ children }: { children: ReactNode }) { const { width } = useWindowDimensions(); return <ScrollView style={styles.shell} contentContainerStyle={[styles.screen, width > 720 && styles.screenWide]} showsVerticalScrollIndicator={false}>{children}</ScrollView>; }

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: SAFE_TOP, backgroundColor: palette.cream }, shell: { flex: 1, backgroundColor: palette.cream }, screen: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 18, paddingBottom: NAV_HEIGHT + 34 }, screenWide: { width: 720, alignSelf: "center" },
  flex: { flex: 1 }, between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, body: { color: palette.muted, fontSize: 14, lineHeight: 21 }, smallMuted: { color: palette.muted, fontSize: 12, lineHeight: 18 }, goldText: { color: palette.gold, fontSize: 12, fontWeight: "700" }, greenText: { color: palette.green, fontSize: 14, fontWeight: "700" },
  login: { flex: 1, justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 26, paddingBottom: 32, backgroundColor: palette.cream }, loginTitle: { color: palette.black, fontSize: 32, lineHeight: 38, fontWeight: "700", marginTop: 50, marginBottom: 10 }, loginCard: { gap: 10, padding: 18, borderWidth: 1, borderColor: palette.line, borderRadius: 24, backgroundColor: palette.white }, error: { color: palette.red, fontSize: 12, lineHeight: 18 }, help: { color: palette.muted, textAlign: "center", fontSize: 12, marginTop: 4 }, linkRight: { color: palette.gold, textAlign: "right", fontSize: 12, fontWeight: "600" },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 26 }, brandMark: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: palette.black }, brandMarkText: { color: palette.goldPale, fontSize: 18, fontWeight: "700" }, logo: { color: palette.black, fontSize: 21, fontWeight: "700" }, brandSuffix: { color: palette.gold, fontSize: 12, fontWeight: "700" },
  header: { marginBottom: 18 }, pageTitle: { color: palette.black, fontSize: 25, lineHeight: 31, fontWeight: "700" }, pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, backText: { color: palette.black, fontSize: 22, fontWeight: "700" },
  fieldGroup: { gap: 7, marginBottom: 8 }, fieldLabel: { color: palette.black, fontSize: 12, fontWeight: "600" }, field: { minHeight: 51, paddingHorizontal: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 14, color: palette.black, backgroundColor: palette.white },
  primary: { minHeight: 54, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: palette.black, marginTop: 7 }, primaryText: { color: palette.white, fontSize: 14, fontWeight: "700" }, outline: { flex: 1, minHeight: 54, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.red, borderRadius: 16 }, outlineText: { color: palette.red, fontSize: 14, fontWeight: "700" }, disabled: { opacity: 0.35 },
  statusCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 15, borderRadius: 18, backgroundColor: palette.greenPale }, statusKicker: { color: palette.gold, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 4 }, statusTitle: { color: palette.green, fontSize: 16, fontWeight: "700", marginBottom: 3 }, onlineDot: { width: 15, height: 15, borderRadius: 8, backgroundColor: palette.green },
  statGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10, marginTop: 12 }, statCard: { width: "48.5%", gap: 3, padding: 14, borderRadius: 18 }, statValue: { color: palette.black, fontSize: 23, fontWeight: "700" }, rowTitle: { color: palette.black, fontSize: 14, lineHeight: 19, fontWeight: "600" }, cardTitle: { color: palette.black, fontSize: 18, fontWeight: "700" }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 23, marginBottom: 11 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 }, chip: { paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white }, chipActive: { borderColor: palette.black, backgroundColor: palette.black }, chipText: { color: palette.muted, fontSize: 12, fontWeight: "600" }, chipTextActive: { color: palette.white },
  orderCard: { gap: 6, padding: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 17, backgroundColor: palette.white, marginBottom: 9 }, orderId: { color: palette.gold, fontSize: 12, fontWeight: "700" }, badge: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, fontSize: 10, fontWeight: "700", borderRadius: 8 }, badgeAvailable: { color: palette.green, backgroundColor: palette.greenPale }, badgeActive: { color: palette.gold, backgroundColor: palette.goldPale }, badgeDone: { color: palette.blue, backgroundColor: palette.bluePale }, cardFooter: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 9, marginTop: 5 }, cardMeta: { color: palette.muted, fontSize: 11 }, cardEarn: { color: palette.green, fontSize: 11, fontWeight: "700", marginLeft: "auto" },
  orderHero: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 17, borderRadius: 19, backgroundColor: palette.black, marginBottom: 11 }, heroTitle: { color: palette.white, fontSize: 29, fontWeight: "700", marginTop: 7 }, heroSub: { color: palette.goldPale, fontSize: 12, marginTop: 4 }, summary: { padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white }, location: { flexDirection: "row", gap: 10 }, locationMarker: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: palette.goldPale }, locationMarkerText: { color: palette.gold, fontSize: 11, fontWeight: "700" }, locationLine: { width: 1, height: 22, backgroundColor: palette.line, marginLeft: 14, marginVertical: 4 }, summaryFooter: { flexDirection: "row", gap: 8, paddingTop: 13, marginTop: 13, borderTopWidth: 1, borderTopColor: palette.line }, tagValue: { color: palette.black, fontSize: 12, fontWeight: "700", marginTop: 3 }, infoCard: { padding: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 15, backgroundColor: palette.white }, actionRow: { flexDirection: "row", gap: 9, marginTop: 16 }, delivered: { flex: 1, padding: 14, borderRadius: 15, backgroundColor: palette.greenPale },
  stepBadge: { alignSelf: "flex-start", overflow: "hidden", paddingHorizontal: 8, paddingVertical: 5, color: palette.gold, fontSize: 10, fontWeight: "700", borderRadius: 8, backgroundColor: palette.goldPale }, confirmTitle: { color: palette.black, fontSize: 26, lineHeight: 32, fontWeight: "700", marginTop: 15, marginBottom: 7 }, checkCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderRadius: 15, backgroundColor: palette.greenPale, marginTop: 13 }, checkMark: { color: palette.green, fontSize: 12, fontWeight: "700" },
  map: { height: 292, overflow: "hidden", borderRadius: 22, backgroundColor: palette.bluePale }, mapRoadA: { position: "absolute", top: 125, left: -40, width: 430, height: 24, borderRadius: 12, backgroundColor: palette.white, transform: [{ rotate: "-18deg" }] }, mapRoadB: { position: "absolute", top: 45, left: 110, width: 25, height: 320, borderRadius: 12, backgroundColor: palette.white, transform: [{ rotate: "20deg" }] }, mapRoadC: { position: "absolute", top: 65, left: -10, width: 390, height: 18, borderRadius: 9, backgroundColor: palette.white, transform: [{ rotate: "15deg" }] }, pin: { position: "absolute", width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: palette.black }, pinStart: { left: 76, top: 182 }, pinEnd: { right: 63, top: 52 }, pinText: { color: palette.goldPale, fontSize: 13, fontWeight: "700" }, mapEta: { position: "absolute", right: 12, bottom: 12, padding: 10, borderRadius: 13, backgroundColor: palette.white }, mapEtaValue: { color: palette.black, fontSize: 17, fontWeight: "700" }, routeCard: { padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 17, backgroundColor: palette.white, marginTop: 11 }, routeStats: { flexDirection: "row", justifyContent: "space-between", paddingTop: 11, marginTop: 11, borderTopWidth: 1, borderTopColor: palette.line },
  sectionLabel: { color: palette.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 20, marginBottom: 8 }, otp: { height: 63, paddingHorizontal: 17, color: palette.black, fontSize: 25, letterSpacing: 10, borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white }, upload: { height: 135, alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderStyle: "dashed", borderColor: palette.gold, borderRadius: 18, backgroundColor: palette.goldPale, marginBottom: 8 }, uploadDone: { borderColor: palette.green, backgroundColor: palette.greenPale }, uploadIcon: { color: palette.gold, fontSize: 22, fontWeight: "700" },
  earningsHero: { padding: 17, borderRadius: 20, backgroundColor: palette.black }, earningsValue: { color: palette.white, fontSize: 31, fontWeight: "700", marginVertical: 7 }, infoRow: { minHeight: 57, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 15, backgroundColor: palette.white, marginBottom: 8 }, infoValue: { color: palette.gold, fontSize: 14, fontWeight: "700" },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 13, padding: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white }, avatar: { width: 57, height: 57, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: palette.black }, avatarText: { color: palette.goldPale, fontSize: 17, fontWeight: "700" }, profileName: { color: palette.black, fontSize: 20, fontWeight: "700", marginBottom: 5 }, logout: { color: palette.red, fontSize: 14, fontWeight: "700", marginTop: 18 }, empty: { alignItems: "center", gap: 5, padding: 26 },
  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, height: NAV_HEIGHT, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: palette.white }, navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 }, navIcon: { color: palette.muted, fontSize: 11, fontWeight: "700" }, navLabel: { color: palette.muted, fontSize: 11, fontWeight: "600" }, navActive: { color: palette.black }, navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.gold },
});
