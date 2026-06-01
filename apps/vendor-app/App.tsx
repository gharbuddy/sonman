import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserProfile } from "@sonman/auth-service";
import { NotificationHistoryScreen, NotificationSettingsScreen, usePushNotifications } from "@sonman/notifications-service";
import { authService } from "./auth";
import { createVendorOrdersService, ORDER_STATUS_LABELS, type VendorOrder as Order } from "./orders";
import { createVendorProductsService, type Category, type DeliverySize, type VendorProduct as Product } from "./products";
import {
  Image,
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

type Screen = "login" | "dashboard" | "products" | "add" | "edit" | "orders" | "inventory" | "earnings" | "profile" | "notifications" | "notification-settings";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productError, setProductError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderError, setOrderError] = useState("");
  const [selected, setSelected] = useState<Product>();
  const [profile, setProfile] = useState<UserProfile>();
  const [storeName, setStoreName] = useState("");
  const productsService = useMemo(() => createVendorProductsService(authService.supabase), []);
  const ordersService = useMemo(() => createVendorOrdersService(authService.supabase), []);
  usePushNotifications(authService.supabase, authenticated, "vendor");
  const loadProfile = async () => {
    const [nextProfile, vendor] = await Promise.all([
      authService.getCurrentProfile(),
      authService.supabase.from("vendors").select("business_name").single(),
    ]);
    if (vendor.error) throw vendor.error;
    setProfile(nextProfile);
    setStoreName(vendor.data.business_name);
  };

  const edit = (product: Product) => { setSelected(product); setScreen("edit"); };
  const loadProducts = async () => {
    try {
      setProductError("");
      const [nextProducts, nextCategories] = await Promise.all([productsService.list(), productsService.listCategories()]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch (cause) {
      setProductError(cause instanceof Error ? cause.message : "Products could not be loaded.");
    }
  };
  const loadOrders = async () => {
    try {
      setOrderError("");
      setOrders(await ordersService.list());
    } catch (cause) {
      setOrderError(cause instanceof Error ? cause.message : "Orders could not be loaded.");
    }
  };

  useEffect(() => {
    authService.restoreSession("vendor")
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
    if (authenticated) void Promise.all([loadProducts(), loadOrders(), loadProfile()]);
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    const channel = authService.supabase.channel("vendor-order-lifecycle")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void loadOrders())
      .subscribe();
    return () => { void authService.supabase.removeChannel(channel); };
  }, [authenticated]);

  if (checkingSession) return <SafeLayout><View style={styles.login}><Brand /><Text style={styles.body}>Restoring your session...</Text></View></SafeLayout>;
  if (!authenticated || screen === "login") return <SafeLayout><Login onAuthenticated={() => { setAuthenticated(true); setScreen("dashboard"); }} /></SafeLayout>;
  return (
    <SafeLayout>
      {screen === "dashboard" && <Dashboard profile={profile} storeName={storeName} products={products} orders={orders} onNavigate={setScreen} />}
      {screen === "products" && <Products products={products} error={productError} onAdd={() => setScreen("add")} onEdit={edit} />}
      {screen === "add" && <ProductForm categories={categories} onBack={() => setScreen("products")} onSaved={async () => { await loadProducts(); setScreen("products"); }} />}
      {screen === "edit" && selected && <ProductForm categories={categories} product={selected} onBack={() => setScreen("products")} onSaved={async () => { await loadProducts(); setScreen("products"); }} />}
      {screen === "orders" && <Orders orders={orders} error={orderError} onAdvance={async (order) => { await ordersService.advance(order.id, order.status); await loadOrders(); }} />}
      {screen === "inventory" && <Inventory products={products} />}
      {screen === "earnings" && <Earnings />}
      {screen === "profile" && <Profile profile={profile} storeName={storeName} onNotifications={() => setScreen("notifications")} onNotificationSettings={() => setScreen("notification-settings")} onLogout={async () => { await authService.logout(); setScreen("login"); }} />}
      {screen === "notifications" && <NotificationHistoryScreen supabase={authService.supabase} onBack={() => setScreen("profile")} />}
      {screen === "notification-settings" && <NotificationSettingsScreen supabase={authService.supabase} app="vendor" onBack={() => setScreen("profile")} />}
      <BottomNav screen={screen} onNavigate={setScreen} />
    </SafeLayout>
  );
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
        const result = await authService.register({ email, password, fullName, role: "vendor" });
        if (!result.session) {
          setError("Check your email to confirm your account, then sign in.");
          return;
        }
        await authService.restoreSession("vendor");
      } else {
        await authService.login(email, password, "vendor");
      }
      onAuthenticated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };
  return <View style={styles.login}>
    <View><Brand /><Text style={styles.loginTitle}>Manage your store,{"\n"}beautifully.</Text><Text style={styles.body}>Products, orders, inventory, and earnings in one focused workspace.</Text></View>
    <View style={styles.loginCard}>
      <Text style={styles.cardTitle}>{registering ? "Register your store" : "Vendor sign in"}</Text><Text style={styles.smallMuted}>{registering ? "Create your vendor account to get started." : "Welcome back to your Sonman store."}</Text>
      {registering && <Field label="Full name" placeholder="Your name" value={fullName} onChange={setFullName} />}
      <Field label="Email address" placeholder="vendor@sonman.in" value={email} onChange={setEmail} />
      <Field label="Password" placeholder="Enter password" secure value={password} onChange={setPassword} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label={busy ? "Please wait..." : registering ? "Create vendor account" : "Sign in to dashboard"} onPress={submit} />
      <Text style={styles.linkRight} onPress={() => { setRegistering(!registering); setError(""); }}>{registering ? "Already registered? Sign in" : "New vendor? Register"}</Text>
      <Text style={styles.help}>Need help?  <Text style={styles.goldText}>Contact vendor support</Text></Text>
    </View>
  </View>;
}

function Dashboard({ profile, storeName, products, orders, onNavigate }: { profile?: UserProfile; storeName: string; products: Product[]; orders: Order[]; onNavigate: (screen: Screen) => void }) {
  return <ScreenScroll>
    <Header title={`Welcome, ${profile?.full_name || "Vendor"}`} subtitle={`Here is what is happening at ${storeName || "your store"}.`} />
    <View style={styles.hero}>
      <Text style={styles.heroEyebrow}>MAY EARNINGS</Text><Text style={styles.heroValue}>Rs 1,24,860</Text>
      <Text style={styles.heroBody}>+18.4% from last month</Text><Pressable onPress={() => onNavigate("earnings")}><Text style={styles.heroLink}>View earnings  &gt;</Text></Pressable>
    </View>
    <View style={styles.statGrid}>
      <StatCard value={String(orders.filter((order) => order.status === "pending").length)} label="New orders" note={`${orders.length} total`} color={palette.goldPale} onPress={() => onNavigate("orders")} />
      <StatCard value={String(products.length)} label="Products" note="4 live" color={palette.greenPale} onPress={() => onNavigate("products")} />
      <StatCard value="3" label="Low stock" note="Needs action" color={palette.redPale} onPress={() => onNavigate("inventory")} />
      <StatCard value="4.8" label="Store rating" note="126 reviews" color={palette.bluePale} />
    </View>
    <SectionHeader title="Quick actions" />
    <View style={styles.quickRow}>
      <QuickAction icon="+" label="Add product" onPress={() => onNavigate("add")} />
      <QuickAction icon="BX" label="Orders" onPress={() => onNavigate("orders")} />
      <QuickAction icon="ST" label="Inventory" onPress={() => onNavigate("inventory")} />
    </View>
    <SectionHeader title="Recent orders" action="View all" onPress={() => onNavigate("orders")} />
    {orders.slice(0, 3).map((order) => <OrderCard key={order.id} order={order} />)}
  </ScreenScroll>;
}

function Products({ products, error, onAdd, onEdit }: { products: Product[]; error: string; onAdd: () => void; onEdit: (product: Product) => void }) {
  const [query, setQuery] = useState("");
  const visible = products.filter((product) => product.name.toLowerCase().indexOf(query.toLowerCase()) >= 0);
  return <ScreenScroll>
    <Header title="Products" subtitle={`${products.length} products in your catalogue.`} action="+" onAction={onAdd} />
    <Search value={query} onChange={setQuery} placeholder="Search products" />
    <View style={styles.chips}>{["All products", "Active", "Low stock", "Draft"].map((item, index) => <View key={item} style={[styles.chip, index === 0 && styles.chipActive]}><Text style={[styles.chipText, index === 0 && styles.chipTextActive]}>{item}</Text></View>)}</View>
    {!!error && <Text style={styles.error}>{error}</Text>}
    {!visible.length && !error && <Text style={styles.body}>No products yet. Add your first product to start your catalogue.</Text>}
    {visible.map((product) => <ProductCard key={product.id} product={product} onPress={() => onEdit(product)} />)}
  </ScreenScroll>;
}

function ProductForm({ product, categories, onBack, onSaved }: { product?: Product; categories: Category[]; onBack: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "");
  const [category, setCategory] = useState(product?.category ?? categories[0]?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [deliverySize, setDeliverySize] = useState<DeliverySize>(product?.deliverySize ?? "small");
  const [variants, setVariants] = useState(product?.variants.join(", ") ?? "");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.9 });
    if (!result.canceled) setImage(result.assets[0]);
  };
  const save = async () => {
    const selectedCategory = categories.find((item) => item.name.toLowerCase() === category.trim().toLowerCase());
    if (!name.trim() || !selectedCategory || !Number.isFinite(Number(price)) || Number(price) < 0) {
      setError("Enter a product name, a valid category, and a valid price.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createVendorProductsService(authService.supabase).save({ product, categoryId: selectedCategory.id, name, description, price: Number(price), stock: Math.max(0, Number(stock) || 0), deliverySize, variants: variants.split(",").map((value) => value.trim()).filter(Boolean), image });
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Product could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  return <ScreenScroll>
    <PageHeader title={product ? "Edit product" : "Add product"} onBack={onBack} />
    <Text style={styles.sectionLabel}>PRODUCT IMAGES</Text>
    <Pressable style={styles.upload} onPress={pickImage}><Text style={styles.uploadIcon}>+</Text><Text style={styles.rowTitle}>{image ? "Product image selected" : "Upload product images"}</Text><Text style={styles.smallMuted}>{image?.fileName ?? "Add a JPG or PNG image"}</Text></Pressable>
    <Text style={styles.sectionLabel}>PRODUCT DETAILS</Text>
    <Field label="Product name" placeholder="Enter product name" value={name} onChange={setName} />
    <Field label="Category" placeholder="Enter an active category" value={category} onChange={setCategory} />
    <View style={styles.formRow}><View style={styles.flex}><Field label="Price" placeholder="Rs 0" value={price} onChange={setPrice} /></View><View style={styles.flex}><Field label="Stock quantity" placeholder="0" value={stock} onChange={setStock} /></View></View>
    <Text style={styles.fieldLabel}>Delivery size</Text>
    <View style={styles.chips}>{(["small", "medium", "large", "heavy"] as DeliverySize[]).map((size) => <Pressable key={size} style={[styles.chip, deliverySize === size && styles.chipActive]} onPress={() => setDeliverySize(size)}><Text style={[styles.chipText, deliverySize === size && styles.chipTextActive]}>{size}</Text></Pressable>)}</View>
    <Field label="Variants (optional)" placeholder="Example: S, M, L or Red, Blue" value={variants} onChange={setVariants} />
    <Field label="Description" placeholder="Describe your product" value={description} onChange={setDescription} multiline />
    <Pressable style={[styles.aiCard, enhanced && styles.aiDone]} onPress={() => setEnhanced(true)}>
      <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View><View style={styles.flex}><Text style={styles.rowTitle}>{enhanced ? "Description enhanced" : "Enhance with Sonman AI"}</Text><Text style={styles.smallMuted}>{enhanced ? "Your copy is polished and ready to review." : "Improve title, description, and search keywords."}</Text></View><Text style={styles.goldText}>{enhanced ? "Done" : "Try"}</Text>
    </Pressable>
    {!!error && <Text style={styles.error}>{error}</Text>}
    <PrimaryButton label={busy ? "Saving..." : product ? "Save changes" : "Publish product"} onPress={save} />
  </ScreenScroll>;
}

function Orders({ orders, error, onAdvance }: { orders: Order[]; error: string; onAdvance: (order: Order) => Promise<void> }) {
  return <ScreenScroll><Header title="Orders" subtitle="Track and fulfil customer orders." /><View style={styles.chips}>{["All", "Pending", "Accepted", "Packed", "Ready for Pickup"].map((item, index) => <View key={item} style={[styles.chip, index === 0 && styles.chipActive]}><Text style={[styles.chipText, index === 0 && styles.chipTextActive]}>{item}</Text></View>)}</View>{!!error && <Text style={styles.error}>{error}</Text>}{orders.map((order) => <OrderCard key={order.id} order={order} detailed onAdvance={() => onAdvance(order)} />)}{!orders.length && <Text style={styles.body}>No incoming orders yet.</Text>}</ScreenScroll>;
}

function Inventory({ products }: { products: Product[] }) {
  return <ScreenScroll><Header title="Inventory" subtitle="Keep your catalogue ready to sell." />
    <View style={styles.inventoryHero}><View><Text style={styles.sectionLabel}>STOCK HEALTH</Text><Text style={styles.heroValueDark}>82%</Text><Text style={styles.smallMuted}>Most products are in good shape.</Text></View><Text style={styles.inventoryMark}>ST</Text></View>
    <SectionHeader title="Needs attention" action="3 items" />
    {!products.filter((product) => product.stock < 8).length && <Text style={styles.body}>No low-stock products.</Text>}
    {products.filter((product) => product.stock < 8).map((product) => <ProductCard key={product.id} product={product} inventory />)}
  </ScreenScroll>;
}

function Earnings() {
  return <ScreenScroll><Header title="Earnings" subtitle="Your store performance at a glance." />
    <View style={styles.earningsCard}><Text style={styles.sectionLabel}>TOTAL EARNINGS</Text><Text style={styles.earningsValue}>Rs 1,24,860</Text><Text style={styles.greenText}>+18.4% compared with last month</Text><View style={styles.chart}>{[34, 52, 44, 68, 58, 82, 96].map((height, index) => <View key={index} style={[styles.bar, { height }]} />)}</View><View style={styles.chartLabels}>{["M", "T", "W", "T", "F", "S", "S"].map((label, index) => <Text key={index} style={styles.smallMuted}>{label}</Text>)}</View></View>
    <SectionHeader title="Payout summary" />
    <InfoRow label="Available for payout" value="Rs 42,680" /><InfoRow label="Processing" value="Rs 18,240" /><InfoRow label="Last payout" value="Rs 36,520" />
  </ScreenScroll>;
}

function Profile({ profile, storeName, onNotifications, onNotificationSettings, onLogout }: { profile?: UserProfile; storeName: string; onNotifications: () => void; onNotificationSettings: () => void; onLogout: () => void }) {
  return <ScreenScroll><Header title="Profile" subtitle="Store details and settings." />
    <View style={styles.profileCard}><View style={styles.avatar}><Text style={styles.avatarText}>{(storeName || profile?.full_name || "V").slice(0, 2).toUpperCase()}</Text></View><View><Text style={styles.profileName}>{storeName || profile?.full_name || "Vendor"}</Text><Text style={styles.smallMuted}>{profile?.full_name}</Text><Text style={styles.smallMuted}>{profile?.email}</Text></View></View>
    <SectionHeader title="Store settings" />
    <InfoRow label="Store information" value=">" /><InfoRow label="Payments and payouts" value=">" /><InfoRow label="Shipping preferences" value=">" />
    <InfoRow label="Notifications" value=">" onPress={onNotifications} /><InfoRow label="Notification settings" value=">" onPress={onNotificationSettings} /><InfoRow label="Help and support" value=">" />
    <Pressable onPress={onLogout}><Text style={styles.logout}>Sign out</Text></Pressable>
  </ScreenScroll>;
}

function Header({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return <View style={styles.header}><View style={styles.flex}><Brand /><Text style={styles.pageTitle}>{title}</Text><Text style={styles.body}>{subtitle}</Text></View>{action && <Pressable style={styles.headerAction} onPress={onAction}><Text style={styles.headerActionText}>{action}</Text></Pressable>}</View>;
}
function Brand() { return <View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View><Text style={styles.logo}>sonman <Text style={styles.vendor}>vendor</Text></Text></View>; }
function PageHeader({ title, onBack }: { title: string; onBack: () => void }) { return <View style={styles.pageHeader}><Pressable style={styles.back} onPress={onBack}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.pageTitle}>{title}</Text><View style={styles.back} /></View>; }
function Field({ label, placeholder, secure, value, onChange, multiline }: { label: string; placeholder: string; secure?: boolean; value?: string; onChange?: (text: string) => void; multiline?: boolean }) { return <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>{label}</Text><TextInput style={[styles.field, multiline && styles.textarea]} placeholder={placeholder} placeholderTextColor={palette.muted} secureTextEntry={secure} value={value} onChangeText={onChange} multiline={multiline} /></View>; }
function Search({ value, onChange, placeholder }: { value: string; onChange: (text: string) => void; placeholder: string }) { return <View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><TextInput style={styles.searchInput} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={palette.muted} /></View>; }
function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable style={styles.primary} onPress={onPress}><Text style={styles.primaryText}>{label}</Text></Pressable>; }
function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) { return <View style={styles.sectionHeader}><Text style={styles.cardTitle}>{title}</Text>{action && <Text style={styles.goldText} onPress={onPress}>{action}</Text>}</View>; }
function StatCard({ value, label, note, color, onPress }: { value: string; label: string; note: string; color: string; onPress?: () => void }) { return <Pressable style={[styles.statCard, { backgroundColor: color }]} onPress={onPress}><Text style={styles.statValue}>{value}</Text><Text style={styles.rowTitle}>{label}</Text><Text style={styles.smallMuted}>{note}</Text></Pressable>; }
function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) { return <Pressable style={styles.quickAction} onPress={onPress}><View style={styles.quickIcon}><Text style={styles.goldText}>{icon}</Text></View><Text style={styles.quickLabel}>{label}</Text></Pressable>; }
function ProductCard({ product, onPress, inventory }: { product: Product; onPress?: () => void; inventory?: boolean }) { return <Pressable style={styles.productCard} onPress={onPress}><Image source={{ uri: product.image }} style={styles.productImage} /><View style={styles.flex}><View style={styles.between}><Text style={styles.productCategory}>{product.category}  ·  {product.sku}</Text><StatusBadge status={product.status} /></View><Text style={styles.rowTitle}>{product.name}</Text><View style={styles.between}><Text style={styles.productPrice}>{money(product.price)}</Text><Text style={[styles.stock, product.stock < 8 && styles.stockLow]}>{product.stock} in stock</Text></View>{inventory && <View style={styles.stockBar}><View style={[styles.stockFill, { width: `${Math.min(product.stock * 5, 100)}%` }]} /></View>}</View></Pressable>; }
function OrderCard({ order, detailed, onAdvance }: { order: Order; detailed?: boolean; onAdvance?: () => void }) { return <View style={styles.orderCard}><View style={styles.between}><Text style={styles.orderId}>{order.orderNumber}</Text><StatusBadge status={order.status} /></View><Text style={styles.rowTitle}>{order.item}</Text><Text style={styles.smallMuted}>{order.customer}  ·  {order.time}</Text><View style={styles.between}><Text style={styles.productPrice}>{money(order.amount)}</Text>{detailed && order.status !== "delivered" && <Text style={styles.goldText} onPress={onAdvance}>Advance status  &gt;</Text>}</View></View>; }
function StatusBadge({ status }: { status: string }) { const label = ORDER_STATUS_LABELS[status] ?? status; const warning = status === "Low stock" || status === "pending"; const calm = status === "Active" || status === "delivered"; return <Text style={[styles.status, warning && styles.statusWarning, calm && styles.statusCalm]}>{label}</Text>; }
function InfoRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) { return <Pressable style={styles.infoRow} onPress={onPress}><Text style={styles.rowTitle}>{label}</Text><Text style={styles.infoValue}>{value}</Text></Pressable>; }

function BottomNav({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  const items = [["HM", "Home", "dashboard"], ["PD", "Products", "products"], ["BX", "Orders", "orders"], ["ST", "Inventory", "inventory"], ["ME", "Profile", "profile"]] as const;
  return <View style={styles.bottomNav}>{items.map(([icon, label, target]) => <Pressable key={target} style={styles.navItem} onPress={() => onNavigate(target)}><Text style={[styles.navIcon, screen === target && styles.navActive]}>{icon}</Text><Text style={[styles.navLabel, screen === target && styles.navActive]}>{label}</Text>{screen === target && <View style={styles.navDot} />}</Pressable>)}</View>;
}
function SafeLayout({ children }: { children: ReactNode }) { return <SafeAreaView style={styles.safe}><ExpoStatusBar style="dark" />{children}</SafeAreaView>; }
function ScreenScroll({ children }: { children: ReactNode }) { const { width } = useWindowDimensions(); return <ScrollView style={styles.shell} contentContainerStyle={[styles.screen, width > 720 && styles.screenWide]} showsVerticalScrollIndicator={false}>{children}</ScrollView>; }

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: SAFE_TOP, backgroundColor: palette.cream }, shell: { flex: 1, backgroundColor: palette.cream }, screen: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 18, paddingBottom: NAV_HEIGHT + 36 }, screenWide: { width: 720, alignSelf: "center" },
  flex: { flex: 1 }, between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, body: { color: palette.muted, fontSize: 14, lineHeight: 21 }, smallMuted: { color: palette.muted, fontSize: 12, lineHeight: 18 }, goldText: { color: palette.gold, fontSize: 12, fontWeight: "700" }, greenText: { color: palette.green, fontSize: 12, fontWeight: "700", marginTop: 7 },
  login: { flex: 1, justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 26, paddingBottom: 32, backgroundColor: palette.cream }, loginTitle: { color: palette.black, fontSize: 32, lineHeight: 38, fontWeight: "700", marginTop: 50, marginBottom: 10 }, loginCard: { gap: 10, padding: 18, borderWidth: 1, borderColor: palette.line, borderRadius: 24, backgroundColor: palette.white }, error: { color: palette.red, fontSize: 12, lineHeight: 18 }, help: { color: palette.muted, textAlign: "center", fontSize: 12, marginTop: 4 }, linkRight: { color: palette.gold, textAlign: "right", fontSize: 12, fontWeight: "600" },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 26 }, brandMark: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: palette.black }, brandMarkText: { color: palette.goldPale, fontSize: 18, fontWeight: "700" }, logo: { color: palette.black, fontSize: 21, fontWeight: "700" }, vendor: { color: palette.gold, fontSize: 12, fontWeight: "700" },
  header: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 18 }, pageTitle: { color: palette.black, fontSize: 25, lineHeight: 31, fontWeight: "700" }, headerAction: { width: 45, height: 45, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: palette.black }, headerActionText: { color: palette.white, fontSize: 25, lineHeight: 28 }, pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }, back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, backText: { color: palette.black, fontSize: 37, lineHeight: 38 },
  hero: { padding: 18, borderRadius: 22, backgroundColor: palette.black }, heroEyebrow: { color: palette.goldPale, fontSize: 12, fontWeight: "700" }, heroValue: { color: palette.white, fontSize: 31, fontWeight: "700", marginTop: 9 }, heroBody: { color: palette.greenPale, fontSize: 12, marginTop: 4 }, heroLink: { color: palette.goldPale, fontSize: 12, fontWeight: "700", marginTop: 17 }, heroValueDark: { color: palette.black, fontSize: 31, fontWeight: "700", marginVertical: 5 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10, marginTop: 12 }, statCard: { width: "48.5%", gap: 3, padding: 14, borderRadius: 18 }, statValue: { color: palette.black, fontSize: 24, fontWeight: "700" }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 23, marginBottom: 11 }, sectionLabel: { color: palette.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8 }, cardTitle: { color: palette.black, fontSize: 18, fontWeight: "700" }, rowTitle: { color: palette.black, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  quickRow: { flexDirection: "row", gap: 9 }, quickAction: { flex: 1, alignItems: "center", gap: 7, paddingVertical: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white }, quickIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: palette.goldPale }, quickLabel: { color: palette.black, fontSize: 12, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 }, chip: { paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white }, chipActive: { borderColor: palette.black, backgroundColor: palette.black }, chipText: { color: palette.muted, fontSize: 12, fontWeight: "600" }, chipTextActive: { color: palette.white },
  search: { height: 51, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white, marginBottom: 12 }, searchIcon: { color: palette.black, fontSize: 25 }, searchInput: { flex: 1, color: palette.black, fontSize: 14 },
  productCard: { flexDirection: "row", gap: 11, padding: 10, borderWidth: 1, borderColor: palette.line, borderRadius: 17, backgroundColor: palette.white, marginBottom: 9 }, productImage: { width: 76, height: 82, borderRadius: 12, backgroundColor: palette.sand }, productCategory: { flexShrink: 1, color: palette.muted, fontSize: 11, marginBottom: 4 }, productPrice: { color: palette.black, fontSize: 14, fontWeight: "700", marginTop: 8 }, stock: { color: palette.green, fontSize: 11, fontWeight: "700", marginTop: 8 }, stockLow: { color: palette.red }, stockBar: { height: 4, overflow: "hidden", borderRadius: 2, backgroundColor: palette.line, marginTop: 7 }, stockFill: { height: 4, borderRadius: 2, backgroundColor: palette.gold },
  status: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3, color: palette.blue, fontSize: 10, fontWeight: "700", borderRadius: 8, backgroundColor: palette.bluePale }, statusWarning: { color: palette.red, backgroundColor: palette.redPale }, statusCalm: { color: palette.green, backgroundColor: palette.greenPale },
  orderCard: { gap: 5, padding: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 17, backgroundColor: palette.white, marginBottom: 9 }, orderId: { color: palette.gold, fontSize: 12, fontWeight: "700" },
  fieldGroup: { gap: 7, marginBottom: 8 }, fieldLabel: { color: palette.black, fontSize: 12, fontWeight: "600" }, field: { minHeight: 51, paddingHorizontal: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 14, color: palette.black, backgroundColor: palette.white }, textarea: { height: 96, paddingTop: 13, textAlignVertical: "top" }, formRow: { flexDirection: "row", gap: 10 },
  upload: { height: 142, alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderStyle: "dashed", borderColor: palette.gold, borderRadius: 18, backgroundColor: palette.goldPale, marginBottom: 21 }, uploadIcon: { color: palette.gold, fontSize: 29, lineHeight: 29 }, aiCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 16, backgroundColor: palette.goldPale, marginTop: 5, marginBottom: 6 }, aiDone: { backgroundColor: palette.greenPale }, aiBadge: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: palette.white }, aiBadgeText: { color: palette.gold, fontSize: 12, fontWeight: "700" }, primary: { minHeight: 54, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: palette.black, marginTop: 7 }, primaryText: { color: palette.white, fontSize: 14, fontWeight: "700" },
  inventoryHero: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 17, borderRadius: 20, backgroundColor: palette.greenPale }, inventoryMark: { color: palette.green, fontSize: 31, fontWeight: "700" },
  earningsCard: { padding: 17, borderWidth: 1, borderColor: palette.line, borderRadius: 20, backgroundColor: palette.white }, earningsValue: { color: palette.black, fontSize: 30, fontWeight: "700" }, chart: { height: 112, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", marginTop: 18 }, bar: { width: 18, borderRadius: 6, backgroundColor: palette.gold }, chartLabels: { flexDirection: "row", justifyContent: "space-around", marginTop: 8 },
  infoRow: { minHeight: 57, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 15, backgroundColor: palette.white, marginBottom: 8 }, infoValue: { color: palette.gold, fontSize: 14, fontWeight: "700" },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 13, padding: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white }, avatar: { width: 57, height: 57, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: palette.black }, avatarText: { color: palette.goldPale, fontSize: 17, fontWeight: "700" }, profileName: { color: palette.black, fontSize: 20, fontWeight: "700", marginBottom: 5 }, logout: { color: palette.red, fontSize: 14, fontWeight: "700", marginTop: 18 },
  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, height: NAV_HEIGHT, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: palette.white }, navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 }, navIcon: { color: palette.muted, fontSize: 11, fontWeight: "700" }, navLabel: { color: palette.muted, fontSize: 11, fontWeight: "600" }, navActive: { color: palette.black }, navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.gold },
});
