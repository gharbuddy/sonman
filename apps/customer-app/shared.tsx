import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useState, type ReactNode } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import type { CustomerProduct as Product } from "./products";

export type Screen =
  | "splash"
  | "onboarding"
  | "login"
  | "signup"
  | "home"
  | "categories"
  | "listing"
  | "details"
  | "cart"
  | "checkout"
  | "payment-confirmation"
  | "orders"
  | "wishlist"
  | "profile"
  | "edit-profile"
  | "addresses"
  | "address-form"
  | "help"
  | "notifications"
  | "notification-settings";

export const palette = {
  cream: "#F5F7FB",
  white: "#FFFFFF",
  sand: "#EEF2F7",
  line: "#E2E8F0",
  black: "#0F172A",
  muted: "#64748B",
  gold: "#F59E0B",
  goldPale: "#FEF3C7",
  green: "#0F766E",
  greenPale: "#DCFCE7",
  red: "#EF4444",
  blue: "#2563EB",
  bluePale: "#DBEAFE",
};

export const categories: ReadonlyArray<readonly [string, string, string, string]> = [
  ["Electronics", "📱", "Mobiles, gadgets and accessories", "#DBEAFE"],
  ["Fashion", "👕", "Clothing and daily style", "#FCE7F3"],
  ["Dry Fruits", "🥜", "Kashmir pantry favourites", "#DCFCE7"],
  ["Home", "🏠", "Home and kitchen essentials", "#FEF3C7"],
  ["Beauty", "✨", "Beauty and personal care", "#F3E8FF"],
  ["Handicrafts", "🧺", "Local artisan products", "#FFE4E6"],
  ["Books", "📚", "Books and stationery", "#E0F2FE"],
  ["More", "▦", "Explore every category", "#F1F5F9"],
];
export const offers: ReadonlyArray<readonly [string, string, string, string]> = [
  ["SONMAN LOCAL", "Fresh picks from Kulgam sellers", "Shop now", "#DBEAFE"],
  ["DEALS NEAR YOU", "Daily essentials at better prices", "Explore", "#FEF3C7"],
];
export const vendors: ReadonlyArray<readonly [string, string, string, string]> = [];
export const SERVICE_STATES = ["Jammu and Kashmir"];
export const SERVICE_DISTRICTS = ["Kulgam"];
export const premiumFont = "Poppins_700Bold";
export const bodyFont = "Inter_400Regular";
export const mediumFont = "Inter_600SemiBold";
export const BOTTOM_NAV_HEIGHT = 74;
export const MIN_ANDROID_BOTTOM_INSET = Platform.OS === "android" ? 36 : 0;

export const money = (value: number) => `Rs ${value.toLocaleString("en-IN")}`;
export const discount = ({ price, oldPrice }: Product) =>
  oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
export const filterProducts = (products: Product[], query: string) => {
  const term = query.trim().toLowerCase();
  return term ? products.filter((product) => [product.name, product.category, product.description].some((value) => value.toLowerCase().includes(term))) : products;
};

export const formatDateOfBirth = (value?: string | null) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
};;
export const dateOfBirthParts = (value?: string | null) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return { day: match?.[3] ?? "", month: match?.[2] ?? "", year: match?.[1] ?? "" };
};;
export const normalizeDateOfBirth = (day: string, month: string, year: string) => {
  if (!day && !month && !year) return "";
  if (!/^\d{2}$/.test(day) || !/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) {
    throw new Error("Enter date of birth as DD, MM, and YYYY.");
  }
  const candidate = new Date(`${year}-${month}-${day}T00:00:00`);
  if (
    Number.isNaN(candidate.getTime())
    || candidate.getFullYear() !== Number(year)
    || candidate.getMonth() + 1 !== Number(month)
    || candidate.getDate() !== Number(day)
  ) {
    throw new Error("Enter a valid date of birth.");
  }
  return `${year}-${month}-${day}`;
};;

export function CategoryChip({ name, icon, onPress }: { name: string; icon: string; onPress: () => void }) {
  return <Pressable style={styles.chip} onPress={onPress}><Text style={styles.chipIcon}>{icon}</Text><Text style={styles.chipText}>{name}</Text></Pressable>;
}

export function MarketplaceSection({ title, action, onPress, children }: { title: string; action: string; onPress: () => void; children: ReactNode }) {
  return <View><SectionHeader title={title} action={action} onPress={onPress} />{children}</View>;
}

export function CompactProduct({ product, onPress }: { product: Product; onPress: () => void }) {
  return <Pressable style={styles.compactProduct} onPress={onPress}><Image source={{ uri: product.image }} style={styles.compactImage} /><Text style={styles.compactName} numberOfLines={2}>{product.name}</Text><Text style={styles.compactPrice}>{money(product.price)}</Text></Pressable>;
}

export function VendorCard({ name, icon, rating, color }: { name: string; icon: string; rating: string; color: string }) {
  return <Pressable style={styles.vendorCard}><View style={[styles.vendorLogo, { backgroundColor: color }]}><Text style={styles.vendorLogoText}>{icon}</Text></View><Text style={styles.vendorName}>{name}</Text><Text style={styles.vendorRating}>STAR {rating}</Text></Pressable>;
}

export function CartItem({ product, quantity, onQuantity, onSaveLater }: { product: Product; quantity: number; onQuantity: (quantity: number) => void; onSaveLater: () => void }) {
  return <View style={styles.cartItem}><Image source={{ uri: product.image }} style={styles.cartImage} /><View style={styles.flex}><Text style={styles.productCategory}>{product.category}</Text><Text style={styles.rowTitle} numberOfLines={2}>{product.name}</Text><Text style={styles.productPrice}>{money(product.price)}</Text><Text style={styles.cartDelivery}>{product.deliverySize === "small" ? "Standard local delivery" : "Delivery estimate at checkout"}</Text><View style={styles.cartFooter}><View style={styles.quantityRow}><Text style={styles.quantity} onPress={() => onQuantity(quantity - 1)}>−</Text><Text style={styles.quantity}>{quantity}</Text><Text style={styles.quantity} onPress={() => onQuantity(quantity + 1)}>+</Text></View><Text style={styles.remove} onPress={() => onQuantity(0)}>Delete</Text></View><Text style={styles.saveLater} onPress={onSaveLater}>Save for later</Text></View></View>;
}

export function CheckoutSection({ icon, title, action, onAction, children }: { icon: string; title: string; action: string; onAction?: () => void; children: ReactNode }) {
  return <View style={styles.checkoutCard}><View style={styles.checkoutHeader}><View style={styles.checkoutIcon}><Text style={styles.checkoutIconText}>{icon}</Text></View><Text style={styles.rowTitle}>{title}</Text><Text style={[styles.link, styles.flexEnd]} onPress={onAction}>{action}</Text></View><View style={styles.checkoutBody}>{children}</View></View>;
}

export function ProfileDetail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.profileDetail, last && styles.profileDetailLast]}><Text style={styles.profileDetailLabel}>{label}</Text><Text style={styles.profileDetailValue}>{value}</Text></View>;
}

export function ProfileRow({ icon, title, subtitle, onPress, last }: { icon: string; title: string; subtitle: string; onPress?: () => void; last?: boolean }) {
  return <Pressable style={[styles.profileRow, last && styles.profileRowLast]} onPress={onPress}><View style={styles.profileIcon}><Text style={styles.profileIconText}>{icon}</Text></View><View style={styles.flex}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.smallMuted}>{subtitle}</Text></View><Text style={styles.arrow}>›</Text></Pressable>;
}

export function SectionHeader({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.link} onPress={onPress}>{action}</Text></View>;
}

export function Dropdown({ label, value, placeholder, options, onChange }: { label: string; value: string; placeholder: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return <View><Text style={styles.fieldLabel}>{label}</Text><Pressable style={styles.select} onPress={() => setOpen((current) => !current)}><Text style={value ? styles.selectText : styles.selectPlaceholder}>{value || placeholder}</Text><Text style={styles.chevron}>{open ? "^" : "v"}</Text></Pressable>{open && <View style={styles.selectMenu}>{options.map((option) => <Pressable key={option} style={styles.selectOption} onPress={() => { onChange(option); setOpen(false); }}><Text style={styles.selectText}>{option}</Text></Pressable>)}</View>}</View>;
}

export function Field({ label, placeholder, secure, value, onChange }: { label: string; placeholder: string; secure?: boolean; value?: string; onChange?: (text: string) => void }) {
  return <View><Text style={styles.fieldLabel}>{label}</Text><TextInput style={styles.field} placeholder={placeholder} placeholderTextColor={palette.muted} secureTextEntry={secure} value={value} onChangeText={onChange} autoCapitalize="none" /></View>;
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable style={[styles.primaryButton, disabled && styles.disabled]} onPress={onPress} disabled={disabled}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

export function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.empty}><Text style={styles.emptyIcon}>BAG</Text><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.body}>{subtitle}</Text></View>;
}

export function SafeLayout({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <SafeAreaFrame>{children}</SafeAreaFrame>
    </SafeAreaProvider>
  );
}

export function SafeAreaFrame({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {children}
    </View>
  );
}

export function ScreenScroll({ children }: { children: ReactNode; sticky?: boolean }) {
  return <ScreenShell>{children}</ScreenShell>;
}

export function ScreenShell({ children, contentContainerStyle }: { children: ReactNode; contentContainerStyle?: object }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, MIN_ANDROID_BOTTOM_INSET);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screenShell}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <ExpoStatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.screen,
          { paddingBottom: BOTTOM_NAV_HEIGHT + bottomInset + 28 },
          contentContainerStyle,
        ]}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream }, screenShell: { flex: 1, backgroundColor: palette.cream },
  flex: { flex: 1 }, flexEnd: { marginLeft: "auto" }, between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, alignRight: { textAlign: "right" },
  splashFade: { flex: 1 }, splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F1E5" }, splashSky: { position: "absolute", left: 0, right: 0, bottom: 0, height: "48%", overflow: "hidden", backgroundColor: "#E4EEE6" }, splashSun: { position: "absolute", right: 42, top: 30, width: 62, height: 62, borderRadius: 31, backgroundColor: "#E9C984" }, splashLake: { position: "absolute", left: 0, right: 0, bottom: 0, height: 66, backgroundColor: "#B7D3CC" }, mountain: { position: "absolute", width: 300, height: 300, borderRadius: 42, transform: [{ rotate: "45deg" }] }, mountainFar: { left: 92, bottom: -118, backgroundColor: "#CBD9CD" }, mountainBack: { left: -65, bottom: -112, backgroundColor: "#9DBBAA" }, mountainFront: { right: -70, bottom: -145, backgroundColor: "#386F59" }, splashEyebrow: { color: palette.gold, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 18 }, brandMark: { width: 76, height: 76, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: palette.black, marginBottom: 16, elevation: 4, shadowColor: palette.black, shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } }, brandMarkText: { color: palette.goldPale, fontFamily: premiumFont, fontSize: 40, fontWeight: "700" }, logo: { color: palette.black, fontFamily: premiumFont, fontSize: 28, fontWeight: "800", letterSpacing: -1 }, splashLogo: { color: palette.black, fontFamily: premiumFont, fontSize: 40, fontWeight: "700", letterSpacing: 1 }, splashSlogan: { color: palette.green, fontSize: 17, fontWeight: "700", marginTop: 11 }, splashTag: { color: palette.muted, fontSize: 13, marginTop: 5 }, splashMarketCard: { position: "absolute", left: 24, right: 24, bottom: 34, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.90)" }, splashMarketIcon: { color: palette.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1 }, splashMarketText: { color: palette.black, fontSize: 12, fontWeight: "600" },
  onboarding: { flex: 1, justifyContent: "space-between", paddingHorizontal: 22 }, onboardingVisual: { height: "43%", overflow: "hidden", borderRadius: 30, backgroundColor: palette.sand }, fillImage: { width: "100%", height: "100%" }, floatingNote: { position: "absolute", left: 14, bottom: 14, flexDirection: "row", gap: 8, alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.94)" }, noteText: { color: palette.black, fontSize: 12, fontWeight: "600" }, onboardingTitle: { color: palette.black, fontSize: 24, lineHeight: 30, fontWeight: "700" }, dots: { color: palette.gold, textAlign: "center", marginVertical: 12, letterSpacing: 4 },
  auth: { gap: 14, paddingHorizontal: 24 }, authIntro: { gap: 7, marginTop: 58, marginBottom: 8 }, authTitle: { color: palette.black, fontFamily: premiumFont, fontSize: 24, lineHeight: 30, fontWeight: "700" }, authError: { color: palette.red, fontSize: 12, lineHeight: 18 }, authDivider: { color: palette.muted, textAlign: "center", fontSize: 11, fontWeight: "700", letterSpacing: 1 }, fieldLabel: { color: palette.black, fontSize: 12, fontWeight: "600", marginBottom: 7 }, field: { height: 54, paddingHorizontal: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 16, color: palette.black, backgroundColor: palette.white, marginBottom: 12 }, select: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white, marginBottom: 12 }, selectText: { color: palette.black, fontSize: 14 }, selectPlaceholder: { color: palette.muted, fontSize: 14 }, selectMenu: { overflow: "hidden", borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white, marginTop: -7, marginBottom: 12 }, selectOption: { paddingHorizontal: 15, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: palette.line }, google: { height: 54, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white }, googleText: { color: palette.black, fontSize: 14, fontWeight: "600" }, switchText: { color: palette.muted, textAlign: "center", fontSize: 12 },
  screen: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 16, backgroundColor: palette.cream }, screenCompact: { paddingHorizontal: 12 }, body: { color: palette.muted, fontSize: 14, lineHeight: 21 }, smallMuted: { color: palette.muted, fontSize: 12, lineHeight: 18 }, tinyMuted: { color: palette.muted, fontSize: 12, lineHeight: 16 }, formIntro: { color: palette.muted, fontSize: 14, lineHeight: 21, marginBottom: 16 }, helpCard: { gap: 5, padding: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 17, backgroundColor: palette.white, marginBottom: 10 }, link: { color: palette.gold, fontSize: 14, fontWeight: "600" }, gold: { color: palette.gold, fontSize: 12, fontWeight: "700" }, green: { color: palette.green, fontSize: 14, fontWeight: "600" }, eyebrow: { color: palette.muted, fontSize: 12, fontWeight: "600" }, pageTitle: { color: palette.black, fontFamily: premiumFont, fontSize: 22, lineHeight: 28, fontWeight: "700", marginBottom: 8 }, homeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }, marketHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 9 }, avatarSmall: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: palette.black }, avatarSmallText: { color: palette.goldPale, fontSize: 12, fontWeight: "700" },
  searchShell: { paddingBottom: 12, backgroundColor: palette.cream }, search: { height: 50, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: palette.white }, searchIcon: { color: palette.black, fontSize: 26, lineHeight: 28 }, searchInput: { flex: 1, color: palette.black, fontSize: 14 }, searchAction: { color: palette.gold, fontSize: 10, fontWeight: "700" }, searchSuggestions: { overflow: "hidden", borderWidth: 1, borderTopWidth: 0, borderColor: palette.line, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: palette.white }, suggestionLabel: { color: palette.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1, paddingHorizontal: 13, paddingTop: 10 }, suggestion: { color: palette.black, fontSize: 13, paddingHorizontal: 13, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.line },
  searchDock: { marginHorizontal: -14, paddingHorizontal: 14, backgroundColor: palette.cream }, location: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, marginBottom: 8 }, locationIcon: { color: palette.gold, fontSize: 12, fontWeight: "600" }, locationLabel: { color: palette.black, fontSize: 12, fontWeight: "600" }, locationText: { color: palette.muted, fontSize: 12, marginTop: 1 }, chevron: { color: palette.muted, fontSize: 15, fontWeight: "600" }, aiPill: { flexDirection: "row", alignItems: "center", gap: 10, padding: 9, borderRadius: 15, backgroundColor: palette.goldPale, marginBottom: 11 }, aiBadge: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: palette.white }, aiBadgeText: { color: palette.gold, fontSize: 12, fontWeight: "700" }, aiTitle: { color: palette.black, fontSize: 14, fontWeight: "600" }, arrow: { color: palette.muted, fontSize: 29, lineHeight: 30 }, horizontal: { marginBottom: 13 }, chip: { height: 39, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 10, marginRight: 8, borderWidth: 1, borderColor: palette.line, borderRadius: 20, backgroundColor: palette.white }, chipIcon: { color: palette.gold, fontSize: 12, fontWeight: "600" }, chipText: { color: palette.black, fontSize: 12, fontWeight: "600" },
  categoryRail: { gap: 7, paddingBottom: 12 }, categoryBubble: { width: 59, alignItems: "center", gap: 5 }, categoryCircle: { width: 50, height: 50, alignItems: "center", justifyContent: "center", borderRadius: 25 }, categoryCircleText: { color: palette.black, fontSize: 12, fontWeight: "700" }, categoryBubbleText: { color: palette.black, fontSize: 12, fontWeight: "600" }, offerRail: { gap: 10 }, offer: { height: 142, flexDirection: "row", overflow: "hidden", borderRadius: 17, padding: 15 }, offerKicker: { color: palette.gold, fontSize: 12, fontWeight: "600" }, offerTitle: { color: palette.black, fontSize: 20, lineHeight: 24, fontWeight: "700", marginTop: 7 }, offerAction: { color: palette.black, fontSize: 12, fontWeight: "600", marginTop: 10 }, offerImage: { width: 112, height: 142, marginVertical: -15, marginRight: -15 },
  hero: { height: 215, overflow: "hidden", borderRadius: 25, backgroundColor: palette.black }, heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.46)" }, heroCopy: { position: "absolute", left: 18, top: 18 }, heroKicker: { color: palette.goldPale, fontSize: 12, fontWeight: "600" }, heroTitle: { color: palette.white, fontSize: 24, lineHeight: 30, fontWeight: "700", marginTop: 8 }, heroBody: { color: palette.white, fontSize: 14, marginTop: 7 }, heroButton: { alignSelf: "flex-start", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, backgroundColor: palette.white, marginTop: 15 }, heroButtonText: { color: palette.black, fontSize: 12, fontWeight: "600" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 12 }, sectionTitle: { color: palette.black, fontSize: 20, fontWeight: "700" }, sectionSpacing: { marginTop: 20 }, categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 9 }, categoryMini: { width: "48.5%", minHeight: 72, flexDirection: "row", alignItems: "center", gap: 9, padding: 9, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white }, categoryIcon: { width: 39, height: 39, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: palette.sand }, categoryIconText: { color: palette.gold, fontSize: 12, fontWeight: "700" }, categoryTitle: { color: palette.black, fontSize: 14, fontWeight: "600" },
  pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }, roundButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 19, backgroundColor: palette.white }, roundButtonText: { color: palette.black, fontSize: 30, lineHeight: 31, marginTop: -4 }, headerTitle: { maxWidth: "70%", flexShrink: 1, color: palette.black, fontSize: 24, fontWeight: "700" }, headerAction: { width: 38, color: palette.black, textAlign: "center", fontSize: 26 }, headerSpacer: { width: 38 }, categoryList: { gap: 10, marginTop: 18 }, categoryRow: { minHeight: 80, flexDirection: "row", alignItems: "center", gap: 13, padding: 10, borderWidth: 1, borderColor: palette.line, borderRadius: 19, backgroundColor: palette.white }, categoryLargeIcon: { width: 57, height: 57, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: palette.sand }, categoryLargeIconGold: { backgroundColor: palette.goldPale }, categoryLargeText: { color: palette.gold, fontSize: 12, fontWeight: "700" }, rowTitle: { color: palette.black, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  filterRail: { paddingBottom: 8 }, filter: { height: 35, justifyContent: "center", paddingHorizontal: 12, marginRight: 7, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white }, filterActive: { borderColor: palette.blue, backgroundColor: palette.bluePale }, filterText: { color: palette.black, fontSize: 12, fontWeight: "600" }, filterTextActive: { color: palette.blue }, filterPanel: { gap: 5, padding: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 15, backgroundColor: palette.white, marginBottom: 9 }, filterPanelActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 }, gridTop: { marginTop: 8 }, productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 }, productRail: { gap: 10 }, productCard: { width: "48.5%", overflow: "hidden", borderWidth: 1, borderColor: palette.line, borderRadius: 13, backgroundColor: palette.white }, productImage: { width: "100%", height: 126, backgroundColor: palette.sand }, productCopy: { padding: 8 }, heartButton: { position: "absolute", right: 6, top: 6, width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "rgba(255,255,255,0.94)" }, heart: { color: palette.black, textAlign: "center", fontSize: 18 }, heartSaved: { color: palette.red }, badge: { position: "absolute", left: 6, bottom: 6, overflow: "hidden", paddingHorizontal: 5, paddingVertical: 3, color: palette.gold, fontSize: 12, fontWeight: "700", borderRadius: 7, backgroundColor: palette.goldPale }, productCategory: { color: palette.muted, fontSize: 12, marginBottom: 2 }, productName: { minHeight: 34, color: palette.black, fontSize: 14, lineHeight: 17, fontWeight: "600" }, ratingLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }, rating: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, color: palette.white, fontSize: 12, fontWeight: "700", borderRadius: 8, backgroundColor: palette.green }, ratingSmall: { overflow: "hidden", paddingHorizontal: 5, paddingVertical: 2, color: palette.white, fontSize: 12, fontWeight: "700", borderRadius: 7, backgroundColor: palette.green }, reviewCount: { color: palette.muted, fontSize: 12 }, priceLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 }, productPrice: { color: palette.black, fontSize: 14, fontWeight: "700" }, oldPrice: { color: palette.muted, fontSize: 14, textDecorationLine: "line-through" }, oldPriceSmall: { color: palette.muted, fontSize: 12, textDecorationLine: "line-through" }, discount: { color: palette.green, fontSize: 12, fontWeight: "700", marginTop: 2 }, delivery: { color: palette.muted, fontSize: 12, marginTop: 4 },
  compactRail: { gap: 9 }, compactProduct: { width: 104, padding: 6, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.white }, compactImage: { width: "100%", height: 78, borderRadius: 8, backgroundColor: palette.sand }, compactName: { minHeight: 30, color: palette.black, fontSize: 12, lineHeight: 15, fontWeight: "600", marginTop: 5 }, compactPrice: { color: palette.black, fontSize: 14, fontWeight: "700", marginTop: 3 }, vendorRail: { gap: 9 }, vendorCard: { width: 112, alignItems: "center", padding: 10, borderWidth: 1, borderColor: palette.line, borderRadius: 13, backgroundColor: palette.white }, vendorLogo: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24 }, vendorLogoText: { color: palette.black, fontSize: 12, fontWeight: "700" }, vendorName: { color: palette.black, fontSize: 12, fontWeight: "600", marginTop: 7 }, vendorRating: { color: palette.green, fontSize: 12, fontWeight: "600", marginTop: 3 },
  detailImage: { height: 342, borderRadius: 24, backgroundColor: palette.sand }, imageCounter: { color: palette.muted, textAlign: "center", fontSize: 12, fontWeight: "600", marginVertical: 10 }, detailTitle: { color: palette.black, fontFamily: premiumFont, fontSize: 24, lineHeight: 30, fontWeight: "700", marginTop: 5 }, detailPrice: { color: palette.black, fontSize: 24, fontWeight: "700" }, deliveryCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 12, borderRadius: 16, backgroundColor: palette.greenPale, marginVertical: 16 }, deliveryIcon: { color: palette.green, fontSize: 12, fontWeight: "700" }, deliveryTitle: { color: palette.green, fontSize: 14, fontWeight: "600" }, sizeRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 11 }, size: { minWidth: 45, height: 42, alignItems: "center", justifyContent: "center", paddingHorizontal: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 13, backgroundColor: palette.white }, sizeActive: { borderColor: palette.black, backgroundColor: palette.black }, sizeText: { color: palette.black, fontSize: 14, fontWeight: "600" }, sizeTextActive: { color: palette.white }, actionRow: { flexDirection: "row", gap: 9, marginTop: 20 }, outlineButton: { flex: 1, height: 52, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.black, borderRadius: 16 }, outlineText: { color: palette.black, fontSize: 14, fontWeight: "600" }, darkButton: { flex: 1, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: palette.black }, darkButtonText: { color: palette.white, fontSize: 14, fontWeight: "600" }, saveDetail: { color: palette.blue, textAlign: "center", fontSize: 14, fontWeight: "700", paddingVertical: 14 }, infoCard: { gap: 5, padding: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white, marginTop: 12 }, pincodeRow: { flexDirection: "row", alignItems: "center", gap: 12 }, pincodeInput: { flex: 1, height: 42, paddingHorizontal: 11, borderWidth: 1, borderColor: palette.line, borderRadius: 11, color: palette.black }, viewer: { flex: 1, justifyContent: "center", backgroundColor: palette.black }, viewerHeader: { position: "absolute", top: 48, left: 20, right: 20, zIndex: 2, flexDirection: "row", justifyContent: "space-between" }, viewerCounter: { color: palette.white, fontSize: 14, fontWeight: "700" }, viewerClose: { color: palette.goldPale, fontSize: 14, fontWeight: "700" }, viewerSlide: { alignItems: "center", justifyContent: "center" }, viewerImage: { width: "100%", height: "78%" }, viewerHint: { position: "absolute", bottom: 42, alignSelf: "center", color: palette.white, fontSize: 12 },
  deliveryBanner: { flexDirection: "row", alignItems: "center", gap: 9, padding: 11, borderRadius: 15, backgroundColor: palette.greenPale, marginVertical: 14 }, deliveryProgress: { height: 5, overflow: "hidden", borderRadius: 3, backgroundColor: palette.white, marginTop: 7 }, deliveryProgressDone: { height: 5, borderRadius: 3, backgroundColor: palette.green }, couponCard: { gap: 4, padding: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white, marginTop: 4 }, cartItem: { flexDirection: "row", gap: 12, padding: 11, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white, marginBottom: 10 }, cartImage: { width: 92, height: 120, borderRadius: 13, backgroundColor: palette.sand }, cartDelivery: { color: palette.green, fontSize: 12, fontWeight: "600", marginTop: 5 }, cartFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }, quantityRow: { flexDirection: "row", gap: 5 }, quantity: { overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, color: palette.black, fontSize: 12, fontWeight: "600", borderRadius: 10, backgroundColor: palette.sand }, remove: { color: palette.red, fontSize: 12, fontWeight: "600" }, saveLater: { color: palette.blue, fontSize: 12, fontWeight: "600", marginTop: 8 }, total: { gap: 11, padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white, marginTop: 13, marginBottom: 6 }, divider: { height: 1, backgroundColor: palette.line }, totalPrice: { color: palette.black, fontSize: 20, fontWeight: "700" },
  primaryButton: { minHeight: 55, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderRadius: 17, backgroundColor: palette.black, marginVertical: 6 }, primaryButtonText: { color: palette.white, fontSize: 14, fontWeight: "600" }, secondaryButton: { minHeight: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderWidth: 1, borderColor: palette.line, borderRadius: 17, backgroundColor: palette.white, marginVertical: 6 }, secondaryButtonText: { color: palette.red, fontSize: 14, fontWeight: "600" }, disabled: { opacity: 0.35 }, checkoutCard: { padding: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white, marginBottom: 10 }, checkoutHeader: { flexDirection: "row", alignItems: "center", gap: 9 }, checkoutIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: palette.sand }, checkoutIconText: { color: palette.gold, fontSize: 12, fontWeight: "600" }, checkoutBody: { gap: 3, paddingLeft: 43, paddingTop: 8 }, checkoutProduct: { flexDirection: "row", gap: 11, paddingTop: 12, marginTop: 10, borderTopWidth: 1, borderTopColor: palette.line }, checkoutProductImage: { width: 64, height: 72, borderRadius: 11, backgroundColor: palette.sand }, optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 6 }, optionPill: { overflow: "hidden", color: palette.muted, fontSize: 12, fontWeight: "600", paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: palette.line, borderRadius: 12 }, optionPillActive: { color: palette.blue, borderColor: palette.blue, backgroundColor: palette.bluePale }, inlineInput: { minHeight: 42, paddingHorizontal: 11, borderWidth: 1, borderColor: palette.line, borderRadius: 11, color: palette.black }, notesInput: { minHeight: 66, paddingTop: 10, textAlignVertical: "top" }, upiPanel: { gap: 10, padding: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: palette.greenPale }, upiBrand: { flexDirection: "row", alignItems: "center", gap: 10 }, upiMark: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: palette.green }, upiMarkText: { color: palette.white, fontSize: 13, fontWeight: "800" }, paymentAmount: { color: palette.black, fontSize: 22, fontWeight: "800" }, paymentOptions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 2 }, paymentOption: { overflow: "hidden", color: palette.muted, fontSize: 12, fontWeight: "700", paddingHorizontal: 9, paddingVertical: 7, borderWidth: 1, borderColor: palette.line, borderRadius: 11, backgroundColor: palette.white }, paymentOptionActive: { color: "#002970", borderColor: "#00BAF2", backgroundColor: "#E6F7FF" }, paymentAssurance: { color: palette.green, fontSize: 12, lineHeight: 17, fontWeight: "600" }, trustRow: { flexDirection: "row", gap: 7, marginVertical: 8 }, trustBadge: { flex: 1, color: palette.green, textAlign: "center", fontSize: 11, lineHeight: 16, fontWeight: "700", padding: 9, borderRadius: 13, backgroundColor: palette.greenPale }, policyRow: { flexDirection: "row", gap: 10, padding: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white, marginVertical: 8 }, checkbox: { width: 20, height: 20, flexShrink: 0, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.gold, borderRadius: 5 }, checkboxChecked: { backgroundColor: palette.gold }, checkboxMark: { color: palette.white, fontSize: 14, fontWeight: "700" }, policyText: { flex: 1, color: palette.muted, fontSize: 12, lineHeight: 18 }, policyLabel: { color: palette.gold, fontSize: 12, fontWeight: "700", marginTop: 10 },
  tabs: { flexDirection: "row", gap: 22, marginTop: 19, borderBottomWidth: 1, borderBottomColor: palette.line }, tab: { color: palette.muted, fontSize: 14, fontWeight: "600", paddingBottom: 10 }, tabActive: { color: palette.black, fontSize: 14, fontWeight: "700", paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: palette.gold }, orderCard: { padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white, marginTop: 13 }, orderTitle: { marginTop: 9 }, statusActive: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, color: palette.gold, fontSize: 12, fontWeight: "700", borderRadius: 9, backgroundColor: palette.goldPale }, statusDelivered: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, color: palette.green, fontSize: 12, fontWeight: "700", borderRadius: 9, backgroundColor: palette.greenPale }, orderImages: { flexDirection: "row", gap: 7, marginTop: 10 }, orderImage: { width: 52, height: 56, borderRadius: 10 }, progress: { height: 5, overflow: "hidden", borderRadius: 3, backgroundColor: palette.line, marginTop: 14 }, progressDone: { width: "68%", height: 5, borderRadius: 3, backgroundColor: palette.gold }, track: { minHeight: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 13, marginTop: 13 }, trackText: { color: palette.black, fontSize: 12, fontWeight: "600" },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 13, padding: 16, borderWidth: 1, borderColor: palette.line, borderRadius: 20, backgroundColor: palette.white, marginTop: 15 }, changeAvatar: { color: palette.blue, textAlign: "center", fontSize: 12, fontWeight: "700", marginTop: 9 }, profileDetailsCard: { overflow: "hidden", borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white, marginTop: 12 }, profileDetail: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 15, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: palette.line }, profileDetailLast: { borderBottomWidth: 0 }, profileDetailLabel: { color: palette.muted, fontSize: 12, fontWeight: "600" }, profileDetailValue: { flexShrink: 1, color: palette.black, textAlign: "right", fontSize: 14, fontWeight: "600" }, profileMenuCard: { overflow: "hidden", paddingHorizontal: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white }, editProfileCard: { padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white, marginBottom: 10 }, dobRow: { flexDirection: "row", gap: 9, marginBottom: 12 }, dobField: { flex: 1, height: 54, paddingHorizontal: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 16, color: palette.black, backgroundColor: palette.cream }, dobYear: { flex: 1.45 }, avatar: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 29, backgroundColor: palette.black }, avatarText: { color: palette.goldPale, fontSize: 16, fontWeight: "700" }, profileName: { color: palette.black, fontFamily: premiumFont, fontSize: 20, fontWeight: "700" }, member: { color: palette.gold, fontSize: 12, fontWeight: "600", marginTop: 5 }, profileLabel: { color: palette.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 22, marginBottom: 8 }, profileRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: palette.line }, profileRowLast: { borderBottomWidth: 0 }, profileIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: palette.goldPale }, profileIconText: { color: palette.gold, fontSize: 11, fontWeight: "700" }, signOut: { color: palette.red, fontSize: 14, fontWeight: "600", marginTop: 24 }, addressCard: { gap: 4, padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white, marginTop: 10 }, addressActions: { flexDirection: "row", gap: 18, marginTop: 8 },
  empty: { minHeight: 190, alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 20 }, emptyIcon: { color: palette.gold, fontSize: 12, fontWeight: "700" }, bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 100, flexDirection: "row", alignItems: "flex-start", paddingTop: 10, borderTopWidth: 1, borderColor: palette.line, backgroundColor: palette.white, elevation: 8, shadowColor: palette.black, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } }, navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 }, navIcon: { color: palette.muted, textAlign: "center", fontSize: 22, lineHeight: 24, fontWeight: "600" }, navLabel: { color: palette.muted, fontSize: 11, fontWeight: "500" }, navActive: { color: palette.blue }, navIndicator: { display: "none" }, cartCount: { position: "absolute", top: -7, right: -12, width: 15, height: 15, overflow: "hidden", color: palette.white, textAlign: "center", lineHeight: 15, fontSize: 9, fontWeight: "700", borderRadius: 8, backgroundColor: palette.red },

  splashClean: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B1220", overflow: "hidden" },
  splashGlowOne: { position: "absolute", width: 330, height: 330, borderRadius: 165, backgroundColor: "rgba(245,158,11,0.16)", top: -80, right: -100 },
  splashGlowTwo: { position: "absolute", width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(15,118,110,0.22)", bottom: -70, left: -80 },
  splashLogoBox: { width: 96, height: 96, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: "#020617", borderWidth: 1, borderColor: "rgba(245,158,11,0.55)", shadowColor: palette.gold, shadowOpacity: 0.35, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  splashLogoS: { color: "#FEF3C7", fontSize: 56, fontWeight: "900", letterSpacing: -3 },
  splashWord: { color: palette.white, fontSize: 56, fontWeight: "900", letterSpacing: -3, marginTop: 22, textTransform: "lowercase" },
  splashLine: { color: palette.gold, fontSize: 15, fontWeight: "700", marginTop: 10 },
  splashSubLine: { color: "#CBD5E1", fontSize: 13, marginTop: 6 },
  homeScreen: { paddingHorizontal: 12, paddingTop: 10 },
  appTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  locationMini: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  pinIcon: { color: palette.black, fontSize: 20 },
  deliverSmall: { color: palette.black, fontSize: 14, fontWeight: "700" },
  deliverText: { color: palette.muted, fontSize: 12, maxWidth: 250 },
  profileIconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: palette.black },
  profileMiniText: { color: palette.white, fontSize: 12, fontWeight: "800" },
  quickCategoryRail: { gap: 12, paddingVertical: 10 },
  quickCategory: { width: 70, alignItems: "center" },
  quickCategoryIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line },
  quickCategoryEmoji: { fontSize: 24 },
  quickCategoryText: { color: palette.black, fontSize: 12, textAlign: "center", marginTop: 6, fontWeight: "600" },
  bannerRail: { gap: 10, paddingVertical: 8 },
  bigBanner: { height: 150, borderRadius: 20, overflow: "hidden", flexDirection: "row", padding: 18, borderWidth: 1, borderColor: palette.line },
  bannerContent: { flex: 1, justifyContent: "center" },
  bannerKicker: { color: palette.gold, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  bannerTitle: { color: palette.black, fontSize: 24, lineHeight: 29, fontWeight: "900", marginTop: 8, maxWidth: 230 },
  bannerAction: { color: palette.green, fontSize: 15, fontWeight: "800", marginTop: 12 },
  bannerProductImage: { width: 105, height: 120, borderRadius: 16, alignSelf: "center" },
  serviceStrip: { flexDirection: "row", gap: 8, paddingVertical: 8, marginBottom: 4 },
  serviceItem: { flex: 1, color: palette.black, fontSize: 11, fontWeight: "700", backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, borderRadius: 12, padding: 8, textAlign: "center" },

});
