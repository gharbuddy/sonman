import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useState, type ReactNode } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import type { CustomerProduct as Product } from "./products";
import { iconColors, iconSizes, SonmanIcon, type SonmanIconName } from "./src/theme/icons";

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
  cream: "#FFFFFF",
  white: "#FFFFFF",          // Pure light elements
  sand: "#F5F0E8",
  line: "#E8DED2",
  black: "#1A1A1A",
  muted: "#8A8078",
  gold: "#C9962E",
  goldPale: "#FBF4E4",
  green: "#2D5A3D",
  greenPale: "#EDF4EE",
  red: "#9F3A32",
  blue: "#0A84FF",           // Electric high-contrast action blue
  bluePale: "#111B29",       // Deep velvet ocean accent frame
};

export const categories: ReadonlyArray<readonly [string, string, string, string]> = [
  ["Electronics", "EL", "Mobiles, gadgets and accessories", "#F5F0E8"],
  ["Fashion", "FA", "Clothing and daily style", "#EDF4EE"],
  ["Dry Fruits", "DF", "Kashmir pantry favourites", "#FBF4E4"],
  ["Home", "HM", "Home and kitchen essentials", "#F5F0E8"],
  ["Beauty", "BE", "Beauty and personal care", "#EDF4EE"],
  ["Handicrafts", "HC", "Local artisan products", "#FBF4E4"],
  ["Books", "BK", "Books and stationery", "#F5F0E8"],
  ["More", "ALL", "Explore every category", "#EDF4EE"],
];

export const offers: ReadonlyArray<readonly [string, string, string, string]> = [
  ["SONMAN ATELIER", "Fresh curations from local sellers", "Shop Collection", "#111B29"],
  ["EXCLUSIVE RUNS", "Daily essentials curated for you", "Explore Prints", "#221A0F"],
];

export const vendors: ReadonlyArray<readonly [string, string, string, string]> = [];
export const SERVICE_STATES = ["Jammu and Kashmir"];
export const SERVICE_DISTRICTS = ["Kulgam"];
export const premiumFont = "Cinzel-Regular";
export const bodyFont = "Inter_300Light";
export const mediumFont = "Inter_500Medium";
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
};

export const dateOfBirthParts = (value?: string | null) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return { day: match?.[3] ?? "", month: match?.[2] ?? "", year: match?.[1] ?? "" };
};

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
};

export function CategoryChip({ name, icon, onPress }: { name: string; icon: SonmanIconName; onPress: () => void }) {
  return (
    <Pressable style={styles.chip} onPress={onPress}>
      <SonmanIcon name={icon} size={iconSizes.category} color={iconColors.action} weight="duotone" />
      <Text style={styles.chipText}>{name}</Text>
    </Pressable>
  );
}

export function MarketplaceSection({ title, action, onPress, children }: { title: string; action: string; onPress: () => void; children: ReactNode }) {
  return <View><SectionHeader title={title} action={action} onPress={onPress} />{children}</View>;
}

export function CompactProduct({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <Pressable style={styles.compactProduct} onPress={onPress}>
      <Image source={{ uri: product.image }} style={styles.compactImage} />
      <Text style={styles.compactName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.compactPrice}>{money(product.price)}</Text>
    </Pressable>
  );
}

export function VendorCard({ name, icon, rating, color }: { name: string; icon: string; rating: string; color: string }) {
  return (
    <Pressable style={styles.vendorCard}>
      <View style={[styles.vendorLogo, { backgroundColor: color }]}><Text style={styles.vendorLogoText}>{icon}</Text></View>
      <Text style={styles.vendorName}>{name}</Text>
      <Text style={styles.vendorRating}>✦ {rating}</Text>
    </Pressable>
  );
}

export function CartItem({ product, quantity, onQuantity, onSaveLater }: { product: Product; quantity: number; onQuantity: (quantity: number) => void; onSaveLater: () => void }) {
  return (
    <View style={styles.cartItem}>
      <Image source={{ uri: product.image }} style={styles.cartImage} />
      <View style={styles.flex}>
        <Text style={styles.productCategory}>{product.category.toUpperCase()}</Text>
        <Text style={styles.rowTitle} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productPrice}>{money(product.price)}</Text>
        <Text style={styles.cartDelivery}>{product.deliverySize === "small" ? "Complimentary Priority Handover" : "Delivery estimate at checkout"}</Text>
        <View style={styles.cartFooter}>
          <View style={styles.quantityRow}>
            <Pressable style={styles.quantity} onPress={() => onQuantity(quantity - 1)}>
              <SonmanIcon name="minus" size={14} color={iconColors.action} weight="bold" />
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable style={styles.quantity} onPress={() => onQuantity(quantity + 1)}>
              <SonmanIcon name="plus" size={14} color={iconColors.action} weight="bold" />
            </Pressable>
          </View>
          <Text style={styles.remove} onPress={() => onQuantity(0)}>Remove</Text>
        </View>
        <Text style={styles.saveLater} onPress={onSaveLater}>Move to Archive</Text>
      </View>
    </View>
  );
}

export function CheckoutSection({ icon, title, action, onAction, children }: { icon: SonmanIconName; title: string; action: string; onAction?: () => void; children: ReactNode }) {
  return (
    <View style={styles.checkoutCard}>
      <View style={styles.checkoutHeader}>
        <View style={styles.checkoutIcon}><SonmanIcon name={icon} size={iconSizes.action} color={iconColors.action} weight="duotone" /></View>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={[styles.link, styles.flexEnd]} onPress={onAction}>{action}</Text>
      </View>
      <View style={styles.checkoutBody}>{children}</View>
    </View>
  );
}

export function ProfileDetail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.profileDetail, last && styles.profileDetailLast]}><Text style={styles.profileDetailLabel}>{label}</Text><Text style={styles.profileDetailValue}>{value}</Text></View>;
}

export function ProfileRow({ icon, title, subtitle, onPress, last }: { icon: SonmanIconName; title: string; subtitle: string; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable style={[styles.profileRow, last && styles.profileRowLast]} onPress={onPress}>
      <View style={styles.profileIcon}><SonmanIcon name={icon} size={iconSizes.action} color={iconColors.action} weight="regular" /></View>
      <View style={styles.flex}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.smallMuted}>{subtitle}</Text></View>
      <SonmanIcon name="chevronRight" size={18} color={iconColors.inactive} weight="regular" />
    </Pressable>
  );
}

export function SectionHeader({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.link} onPress={onPress}>{action.toUpperCase()}</Text>
    </View>
  );
}

export function Dropdown({ label, value, placeholder, options, onChange }: { label: string; value: string; placeholder: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.select} onPress={() => setOpen((current) => !current)}>
        <Text style={value ? styles.selectText : styles.selectPlaceholder}>{value || placeholder}</Text>
        <SonmanIcon name={open ? "chevronDown" : "chevronRight"} size={16} color={iconColors.inactive} weight="regular" />
      </Pressable>
      {open && <View style={styles.selectMenu}>{options.map((option) => <Pressable key={option} style={styles.selectOption} onPress={() => { onChange(option); setOpen(false); }}><Text style={styles.selectText}>{option}</Text></Pressable>)}</View>}
    </View>
  );
}

export function Field({ label, placeholder, secure, value, onChange }: { label: string; placeholder: string; secure?: boolean; value?: string; onChange?: (text: string) => void }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.field} placeholder={placeholder} placeholderTextColor="#444446" secureTextEntry={secure} value={value} onChangeText={onChange} autoCapitalize="none" />
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable style={[styles.primaryButton, disabled && styles.disabled]} onPress={onPress} disabled={disabled}><Text style={styles.primaryButtonText}>{label.toUpperCase()}</Text></Pressable>;
}

export function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.empty}><SonmanIcon name="sparkle" size={32} color={iconColors.action} weight="duotone" /><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.body}>{subtitle}</Text></View>;
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
  return <View style={[styles.safe, { paddingTop: insets.top }]}>{children}</View>;
}

export function ScreenScroll({ children, contentContainerStyle }: { children: ReactNode; sticky?: boolean; contentContainerStyle?: object }) {
  return <ScreenShell contentContainerStyle={contentContainerStyle}>{children}</ScreenShell>;
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
  safe: { flex: 1, backgroundColor: "#FFFFFF" }, 
  screenShell: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 }, 
  flexEnd: { marginLeft: "auto" }, 
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, 
  alignRight: { textAlign: "right" },
  
  // EDITORIAL CLEAN SPLASH STYLE
  splashFade: { flex: 1 }, 
  splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.cream }, 
  splashSky: { position: "absolute", left: 0, right: 0, bottom: 0, height: "48%", overflow: "hidden", backgroundColor: "#121212" }, 
  splashSun: { position: "absolute", right: 42, top: 30, width: 62, height: 62, borderRadius: 31, backgroundColor: palette.gold }, 
  splashLake: { position: "absolute", left: 0, right: 0, bottom: 0, height: 66, backgroundColor: "#1C1C1E" }, 
  mountain: { position: "absolute", width: 300, height: 300, borderRadius: 0, transform: [{ rotate: "45deg" }] }, 
  mountainFar: { left: 92, bottom: -118, backgroundColor: "#1C1C1E" }, 
  mountainBack: { left: -65, bottom: -112, backgroundColor: "#2C2C2E" }, 
  mountainFront: { right: -70, bottom: -145, backgroundColor: "#121212" }, 
  splashEyebrow: { color: palette.gold, fontSize: 11, fontWeight: "700", letterSpacing: 3, marginBottom: 18, textTransform: "uppercase" }, 
  brandMark: { width: 76, height: 76, borderRadius: 0, alignItems: "center", justifyContent: "center", backgroundColor: palette.white, marginBottom: 16, borderWidth: 1, borderColor: palette.gold }, 
  brandMarkText: { color: palette.black, fontSize: 40, fontWeight: "300" }, 
  logo: { color: palette.white, fontSize: 28, fontWeight: "300", letterSpacing: 1 }, 
  splashLogo: { color: palette.white, fontSize: 40, fontWeight: "300", letterSpacing: 2 }, 
  splashSlogan: { color: palette.gold, fontSize: 15, fontWeight: "400", marginTop: 11, letterSpacing: 1 }, 
  splashTag: { color: palette.muted, fontSize: 13, marginTop: 5, letterSpacing: 0.5 }, 
  splashMarketCard: { position: "absolute", left: 24, right: 24, bottom: 34, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 0, backgroundColor: "rgba(18,18,18,0.95)", borderWidth: 1, borderColor: palette.line }, 
  splashMarketIcon: { color: palette.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 }, 
  splashMarketText: { color: palette.white, fontSize: 12, fontWeight: "400" },
  
  // INTENTIONAL HIGH-END ONBOARDING
  onboarding: { flex: 1, justifyContent: "space-between", paddingHorizontal: 22 }, 
  onboardingVisual: { height: "43%", overflow: "hidden", borderRadius: 0, backgroundColor: palette.sand, borderWidth: 1, borderColor: palette.line }, 
  fillImage: { width: "100%", height: "100%", opacity: 0.85 }, 
  floatingNote: { position: "absolute", left: 14, bottom: 14, flexDirection: "row", gap: 8, alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 0, backgroundColor: "rgba(10,10,10,0.96)", borderWidth: 1, borderColor: palette.gold }, 
  noteText: { color: palette.gold, fontSize: 11, fontWeight: "600", letterSpacing: 0.5 }, 
  onboardingTitle: { color: palette.white, fontSize: 24, lineHeight: 32, fontWeight: "300", letterSpacing: 0.5 }, 
  dots: { color: palette.gold, textAlign: "center", marginVertical: 12, letterSpacing: 6 },
  
  // ATELIER INPUTS & AUTHENTICATION
  auth: { gap: 14, paddingHorizontal: 24 }, 
  authIntro: { gap: 7, marginTop: 58, marginBottom: 8 }, 
  authTitle: { color: palette.white, fontSize: 24, lineHeight: 30, fontWeight: "400", letterSpacing: 0.5 }, 
  authError: { color: palette.red, fontSize: 12, lineHeight: 18 }, 
  authDivider: { color: palette.muted, textAlign: "center", fontSize: 11, fontWeight: "600", letterSpacing: 2 }, 
  fieldLabel: { color: palette.muted, fontSize: 11, fontWeight: "600", marginBottom: 7, letterSpacing: 1, textTransform: "uppercase" }, 
  field: { height: 52, paddingHorizontal: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 0, color: palette.white, backgroundColor: palette.sand }, 
  select: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand }, 
  selectText: { color: palette.white, fontSize: 14 }, 
  selectPlaceholder: { color: "#444446", fontSize: 14 }, 
  selectMenu: { overflow: "hidden", borderWidth: 1, borderColor: palette.gold, borderRadius: 0, backgroundColor: palette.sand, marginTop: -1, marginBottom: 12 }, 
  selectOption: { paddingHorizontal: 15, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: palette.line }, 
  google: { height: 52, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: "transparent" }, 
  googleText: { color: palette.white, fontSize: 13, fontWeight: "500", letterSpacing: 1 }, 
  switchText: { color: palette.muted, textAlign: "center", fontSize: 12, letterSpacing: 0.5 },
  
  // CORE LAYOUT INTERFACES
  screen: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, backgroundColor: "#FFFFFF" }, 
  screenCompact: { paddingHorizontal: 16 }, 
  body: { color: palette.muted, fontSize: 14, lineHeight: 22, fontWeight: "300" }, 
  smallMuted: { color: palette.muted, fontSize: 12, lineHeight: 18, fontWeight: "300" }, 
  tinyMuted: { color: palette.muted, fontSize: 11, lineHeight: 16 }, 
  formIntro: { color: palette.muted, fontSize: 14, lineHeight: 22, marginBottom: 16 }, 
  helpCard: { gap: 5, padding: 18, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand }, 
  link: { color: palette.gold, fontSize: 12, fontWeight: "600", letterSpacing: 1 }, 
  gold: { color: palette.gold, fontSize: 12, fontWeight: "600" }, 
  green: { color: palette.green, fontSize: 13, fontWeight: "500" }, 
  eyebrow: { color: palette.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase" }, 
  pageTitle: { color: palette.white, fontSize: 24, fontWeight: "300", letterSpacing: 0.5, marginBottom: 8 }, 
  homeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }, 
  marketHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 9 }, 
  avatarSmall: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: palette.white }, 
  avatarSmallText: { color: palette.black, fontSize: 12, fontWeight: "600" },
  
  // EDITORIAL CONTEMPORARY SEARCH
  searchShell: { paddingBottom: 14, backgroundColor: palette.cream }, 
  search: { height: 54, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: palette.line, borderRadius: 27, backgroundColor: palette.white }, 
  searchIcon: { color: palette.muted, fontSize: 12, fontWeight: "500" }, 
  searchInput: { flex: 1, color: palette.black, fontSize: 14, fontWeight: "300" }, 
  searchAction: { color: palette.green, fontSize: 11, fontWeight: "600", letterSpacing: 0.6 }, 
  searchSuggestions: { overflow: "hidden", borderWidth: 1, borderTopWidth: 0, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white, marginTop: -3 }, 
  suggestionLabel: { color: palette.gold, fontSize: 9, fontWeight: "600", letterSpacing: 1.5, paddingHorizontal: 16, paddingTop: 13, textTransform: "uppercase" }, 
  suggestion: { color: palette.black, fontSize: 13, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.line },
  
  // HERO & DECORATIVE RAILS
  searchDock: { marginHorizontal: -24, paddingHorizontal: 24, backgroundColor: palette.cream }, 
  location: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, marginBottom: 8 }, 
  locationIcon: { color: palette.gold, fontSize: 14 }, 
  locationLabel: { color: palette.white, fontSize: 12, fontWeight: "500" }, 
  locationText: { color: palette.muted, fontSize: 12, marginTop: 1 }, 
  chevron: { color: palette.muted, fontSize: 12 }, 
  aiPill: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 0, backgroundColor: palette.goldPale, borderWidth: 1, borderColor: "rgba(212,175,55,0.2)" }, 
  aiBadge: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: palette.gold }, 
  aiBadgeText: { color: palette.black, fontSize: 11, fontWeight: "700" }, 
  aiTitle: { color: palette.white, fontSize: 13, fontWeight: "400", letterSpacing: 0.5 }, 
  arrow: { color: palette.gold, fontSize: 20 }, 
  horizontal: { marginBottom: 13 }, 
  chip: { height: 36, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, marginRight: 8, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand }, 
  chipIcon: { fontSize: 12 }, 
  chipText: { color: palette.white, fontSize: 11, fontWeight: "500", letterSpacing: 0.5 },
  
  categoryRail: { gap: 12, paddingBottom: 12 }, 
  categoryBubble: { width: 64, alignItems: "center", gap: 6 }, 
  categoryCircle: { width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 27 }, 
  categoryCircleText: { fontSize: 20 }, 
  categoryBubbleText: { color: palette.white, fontSize: 11, fontWeight: "400", letterSpacing: 0.3 }, 
  offerRail: { gap: 12 }, 
  offer: { height: 142, flexDirection: "row", overflow: "hidden", borderRadius: 0, padding: 18, borderWidth: 1, borderColor: palette.line }, 
  offerKicker: { color: palette.gold, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase" }, 
  offerTitle: { color: palette.white, fontSize: 18, lineHeight: 24, fontWeight: "300", marginTop: 7 }, 
  offerAction: { color: palette.white, fontSize: 12, fontWeight: "500", marginTop: 10, textDecorationLine: "underline" }, 
  offerImage: { width: 112, height: 142, marginVertical: -18, marginRight: -18, opacity: 0.9 },
  
  hero: { height: 215, overflow: "hidden", borderRadius: 0, backgroundColor: palette.sand, borderWidth: 1, borderColor: palette.line }, 
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" }, 
  heroCopy: { position: "absolute", left: 20, top: 20 }, 
  heroKicker: { color: palette.gold, fontSize: 10, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" }, 
  heroTitle: { color: palette.white, fontSize: 24, lineHeight: 32, fontWeight: "300", marginTop: 8 }, 
  heroBody: { color: palette.muted, fontSize: 13, marginTop: 6, fontWeight: "300" }, 
  heroButton: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 0, backgroundColor: palette.white, marginTop: 16 }, 
  heroButtonText: { color: palette.black, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  
  // FINE SECTION EXHIBITIONS
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 32, marginBottom: 14 }, 
  sectionTitle: { color: palette.black, fontSize: 20, fontWeight: "400", letterSpacing: 0.2 }, 
  sectionSpacing: { marginTop: 24 }, 
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }, 
  categoryMini: { width: "48.5%", minHeight: 72, flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand }, 
  categoryIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 0, backgroundColor: palette.cream }, 
  categoryIconText: { fontSize: 16 }, 
  categoryTitle: { color: palette.white, fontSize: 13, fontWeight: "400" },
  
  pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, 
  roundButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 21, backgroundColor: "#FFFFFF" }, 
  roundButtonText: { color: palette.black, fontSize: 24, marginTop: -2 }, 
  headerTitle: { maxWidth: "70%", flexShrink: 1, color: palette.black, fontSize: 20, fontWeight: "400", letterSpacing: 0.5 }, 
  headerAction: { minWidth: 38, color: palette.green, textAlign: "center", fontSize: 12, fontWeight: "600", letterSpacing: 1 }, 
  headerSpacer: { width: 38 }, 
  categoryList: { gap: 12, marginTop: 18 }, 
  categoryRow: { minHeight: 80, flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand }, 
  categoryLargeIcon: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 0, backgroundColor: palette.cream }, 
  categoryLargeIconGold: { borderColor: palette.gold, borderWidth: 1 }, 
  categoryLargeText: { fontSize: 20 }, 
  rowTitle: { color: palette.white, fontSize: 14, lineHeight: 20, fontWeight: "400" },
  
  // GALLERY CURATED DISPLAY CARDS
  filterRail: { paddingBottom: 8 }, 
  filter: { height: 36, justifyContent: "center", paddingHorizontal: 14, marginRight: 8, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand }, 
  filterActive: { borderColor: palette.gold, backgroundColor: palette.goldPale }, 
  filterText: { color: palette.muted, fontSize: 11, fontWeight: "500", letterSpacing: 0.5 }, 
  filterTextActive: { color: palette.gold }, 
  filterPanel: { gap: 6, padding: 16, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand, marginBottom: 12 }, 
  filterPanelActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 }, 
  gridTop: { marginTop: 8 }, 
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 14 }, 
  productRail: { gap: 12 }, 
  productCard: { width: "48.5%", overflow: "hidden", borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: palette.white, marginBottom: 16 }, 
  productImageFrame: { position: "relative", overflow: "hidden", backgroundColor: palette.sand, borderBottomWidth: 1, borderBottomColor: palette.line }, 
  productImage: { width: "100%", height: 188, backgroundColor: palette.sand }, 
  productCopy: { padding: 12 }, 
  heartButton: { position: "absolute", right: 10, top: 10, width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: "rgba(255,255,255,0.96)", borderWidth: 1, borderColor: "#E5E7EB" }, 
  heart: { color: palette.black, textAlign: "center", fontSize: 10, fontWeight: "600" }, 
  heartSaved: { color: palette.gold }, 
  badge: { position: "absolute", left: 10, bottom: 10, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, color: palette.green, fontSize: 9, fontWeight: "600", letterSpacing: 0.7, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.92)", borderWidth: 1, borderColor: palette.line }, 
  productCategory: { color: palette.gold, fontSize: 10, fontWeight: "500", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }, 
  productName: { minHeight: 38, color: palette.black, fontSize: 13, lineHeight: 19, fontWeight: "400" }, 
  ratingLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }, 
  rating: { overflow: "hidden", paddingHorizontal: 6, paddingVertical: 2, color: palette.black, fontSize: 10, fontWeight: "600", borderRadius: 0, backgroundColor: palette.gold }, 
  ratingSmall: { color: palette.green, fontSize: 11, fontWeight: "500" }, 
  reviewCount: { color: palette.muted, fontSize: 11 }, 
  priceLine: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }, 
  productPrice: { color: palette.black, fontSize: 15, fontWeight: "600" }, 
  oldPrice: { color: palette.muted, fontSize: 13, textDecorationLine: "line-through" }, 
  oldPriceSmall: { color: palette.muted, fontSize: 11, textDecorationLine: "line-through" }, 
  discount: { color: palette.green, fontSize: 11, fontWeight: "500" }, 
  delivery: { color: palette.muted, fontSize: 11, marginTop: 4 },
  
  compactRail: { gap: 10 }, 
  compactProduct: { width: 124, padding: 8, borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: palette.white }, 
  compactImage: { width: "100%", height: 92, borderRadius: 6, backgroundColor: palette.sand }, 
  compactName: { minHeight: 32, color: palette.black, fontSize: 11, lineHeight: 16, fontWeight: "400", marginTop: 7 }, 
  compactPrice: { color: palette.gold, fontSize: 12, fontWeight: "500", marginTop: 3 }, 
  vendorRail: { gap: 10 }, 
  vendorCard: { width: 116, alignItems: "center", padding: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand }, 
  vendorLogo: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 }, 
  vendorLogoText: { fontSize: 16 }, 
  vendorName: { color: palette.white, fontSize: 11, fontWeight: "400", marginTop: 8, textAlign: "center" }, 
  vendorRating: { color: palette.gold, fontSize: 10, fontWeight: "500", marginTop: 4 },
  
  // IMMERSIVE SALON DETAILS SCREEN
  detailImage: { height: 380, borderRadius: 0, backgroundColor: palette.sand }, 
  imageCounter: { color: palette.muted, textAlign: "center", fontSize: 11, fontWeight: "500", letterSpacing: 1, marginVertical: 12 }, 
  detailTitle: { color: palette.white, fontSize: 24, lineHeight: 32, fontWeight: "300", letterSpacing: 0.5, marginTop: 6 }, 
  detailPrice: { color: palette.white, fontSize: 22, fontWeight: "300", marginVertical: 4 }, 
  deliveryCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14, borderRadius: 0, backgroundColor: palette.goldPale, borderLeftWidth: 2, borderLeftColor: palette.gold, marginVertical: 16 }, 
  deliveryIcon: { color: palette.gold, fontSize: 12 }, 
  deliveryTitle: { color: palette.gold, fontSize: 13, fontWeight: "500", letterSpacing: 0.5 }, 
  sizeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }, 
  size: { minWidth: 48, height: 40, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand }, 
  sizeActive: { borderColor: palette.gold, backgroundColor: palette.goldPale }, 
  sizeText: { color: palette.white, fontSize: 13, fontWeight: "400" }, 
  sizeTextActive: { color: palette.gold }, 
  actionRow: { flexDirection: "row", gap: 10, marginTop: 24 }, 
  outlineButton: { flex: 1, height: 50, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.white, borderRadius: 0 }, 
  outlineText: { color: palette.white, fontSize: 13, fontWeight: "500", letterSpacing: 1 }, 
  darkButton: { flex: 1, height: 50, alignItems: "center", justifyContent: "center", borderRadius: 0, backgroundColor: palette.white }, 
  darkButtonText: { color: palette.black, fontSize: 13, fontWeight: "600", letterSpacing: 1 }, 
  saveDetail: { color: palette.blue, textAlign: "center", fontSize: 13, fontWeight: "600", paddingVertical: 14, letterSpacing: 0.5 }, 
  infoCard: { gap: 6, padding: 16, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand, marginTop: 12 }, 
  pincodeRow: { flexDirection: "row", alignItems: "center", gap: 12 }, 
  pincodeInput: { flex: 1, height: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 0, color: palette.white, backgroundColor: palette.cream }, 
  viewer: { flex: 1, justifyContent: "center", backgroundColor: "#000" }, 
  viewerHeader: { position: "absolute", top: 48, left: 20, right: 20, zIndex: 2, flexDirection: "row", justifyContent: "space-between" }, 
  viewerCounter: { color: palette.white, fontSize: 13, fontWeight: "500" }, 
  viewerClose: { color: palette.gold, fontSize: 13, fontWeight: "600", letterSpacing: 1 }, 
  viewerSlide: { alignItems: "center", justifyContent: "center" }, 
  viewerImage: { width: "100%", height: "78%" }, 
  viewerHint: { position: "absolute", bottom: 42, alignSelf: "center", color: palette.muted, fontSize: 11, letterSpacing: 0.5 },
  
  // ATELIER CHECKOUT & BAG PLACEMENT
  deliveryBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 0, backgroundColor: palette.greenPale, marginVertical: 14, borderWidth: 1, borderColor: "rgba(163,230,53,0.15)" }, 
  deliveryProgress: { height: 3, overflow: "hidden", borderRadius: 0, backgroundColor: "#1C1C1E", marginTop: 7 }, 
  deliveryProgressDone: { height: 3, borderRadius: 0, backgroundColor: palette.green }, 
  couponCard: { gap: 4, padding: 14, borderWidth: 1, borderColor: palette.gold, borderRadius: 0, backgroundColor: palette.goldPale, marginTop: 4 }, 
  cartItem: { flexDirection: "row", gap: 14, padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand, marginBottom: 12 }, 
  cartImage: { width: 88, height: 114, borderRadius: 0, backgroundColor: palette.cream }, 
  cartDelivery: { color: palette.green, fontSize: 11, fontWeight: "500", marginTop: 5 }, 
  cartFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }, 
  quantityRow: { flexDirection: "row", gap: 4 }, 
  quantity: { overflow: "hidden", paddingHorizontal: 10, paddingVertical: 4, color: palette.white, fontSize: 12, fontWeight: "500", borderRadius: 0, backgroundColor: palette.cream, borderWidth: 1, borderColor: palette.line }, 
  remove: { color: palette.red, fontSize: 12, fontWeight: "500", letterSpacing: 0.5 }, 
  saveLater: { color: palette.blue, fontSize: 12, fontWeight: "500", marginTop: 8 }, 
  total: { gap: 12, padding: 16, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand, marginTop: 14, marginBottom: 6 }, 
  divider: { height: 1, backgroundColor: palette.line }, 
  totalPrice: { color: palette.white, fontSize: 18, fontWeight: "400" },
  
  primaryButton: { minHeight: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderRadius: 0, backgroundColor: palette.white, marginVertical: 8 }, 
  primaryButtonText: { color: palette.black, fontSize: 13, fontWeight: "600", letterSpacing: 1.5 }, 
  secondaryButton: { minHeight: 50, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: "transparent", marginVertical: 8 }, 
  secondaryButtonText: { color: palette.red, fontSize: 13, fontWeight: "500", letterSpacing: 1 }, 
  disabled: { opacity: 0.2 }, 
  checkoutCard: { padding: 16, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand, marginBottom: 12 }, 
  checkoutHeader: { flexDirection: "row", alignItems: "center", gap: 10 }, 
  checkoutIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: "#F3F4F6" }, 
  checkoutIconText: { color: palette.gold, fontSize: 12 }, 
  checkoutBody: { gap: 4, paddingLeft: 44, paddingTop: 8 }, 
  checkoutProduct: { flexDirection: "row", gap: 12, paddingTop: 12, marginTop: 10, borderTopWidth: 1, borderTopColor: palette.line }, 
  checkoutProductImage: { width: 64, height: 72, borderRadius: 0, backgroundColor: palette.cream }, 
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 }, 
  optionPill: { overflow: "hidden", color: palette.muted, fontSize: 12, fontWeight: "500", paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.cream }, 
  optionPillActive: { color: palette.gold, borderColor: palette.gold, backgroundColor: palette.goldPale }, 
  inlineInput: { minHeight: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 0, color: palette.white, backgroundColor: palette.cream }, 
  notesInput: { minHeight: 66, paddingTop: 10, textAlignVertical: "top" }, 
  upiPanel: { gap: 10, padding: 14, borderWidth: 1, borderColor: "rgba(163,230,53,0.15)", borderRadius: 0, backgroundColor: palette.greenPale }, 
  upiBrand: { flexDirection: "row", alignItems: "center", gap: 10 }, 
  upiMark: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 0, backgroundColor: palette.green }, 
  upiMarkText: { color: palette.black, fontSize: 13, fontWeight: "700" }, 
  paymentAmount: { color: palette.white, fontSize: 20, fontWeight: "400" }, 
  paymentOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 2 }, 
  paymentOption: { overflow: "hidden", color: palette.muted, fontSize: 11, fontWeight: "600", paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand }, 
  paymentOptionActive: { color: palette.white, borderColor: palette.gold, backgroundColor: palette.goldPale }, 
  paymentAssurance: { color: palette.green, fontSize: 11, lineHeight: 17, fontWeight: "400" }, 
  trustRow: { flexDirection: "row", gap: 8, marginVertical: 8 }, 
  trustBadge: { flex: 1, color: palette.green, textAlign: "center", fontSize: 11, lineHeight: 16, fontWeight: "500", padding: 10, borderRadius: 0, backgroundColor: palette.greenPale, borderWidth: 1, borderColor: "rgba(163,230,53,0.1)" }, 
  policyRow: { flexDirection: "row", gap: 12, padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand, marginVertical: 8 }, 
  checkbox: { width: 18, height: 18, flexShrink: 0, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.gold, borderRadius: 0 }, 
  checkboxChecked: { backgroundColor: palette.gold }, 
  checkboxMark: { color: palette.black, fontSize: 12, fontWeight: "700" }, 
  policyText: { flex: 1, color: palette.muted, fontSize: 12, lineHeight: 18, fontWeight: "300" }, 
  policyLabel: { color: palette.gold, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginTop: 10 },
  
  // ACCOUNT ARCHIVE & STATUS ORDERS
  tabs: { flexDirection: "row", gap: 24, marginTop: 19, borderBottomWidth: 1, borderBottomColor: palette.line }, 
  tab: { color: palette.muted, fontSize: 13, fontWeight: "500", paddingBottom: 10, letterSpacing: 0.5 }, 
  tabActive: { color: palette.gold, fontSize: 13, fontWeight: "600", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: palette.gold, letterSpacing: 0.5 }, 
  orderCard: { padding: 16, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand, marginTop: 13 }, 
  orderTitle: { marginTop: 9 }, 
  statusActive: { overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, color: palette.gold, fontSize: 11, fontWeight: "600", borderRadius: 0, backgroundColor: palette.goldPale, borderWidth: 0.5, borderColor: palette.gold }, 
  statusDelivered: { overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, color: palette.green, fontSize: 11, fontWeight: "600", borderRadius: 0, backgroundColor: palette.greenPale, borderWidth: 0.5, borderColor: palette.green }, 
  orderImages: { flexDirection: "row", gap: 8, marginTop: 12 }, 
  orderImage: { width: 52, height: 56, borderRadius: 0 }, 
  progress: { height: 2, overflow: "hidden", borderRadius: 0, backgroundColor: palette.line, marginTop: 14 }, 
  progressDone: { width: "68%", height: 2, borderRadius: 0, backgroundColor: palette.gold }, 
  track: { minHeight: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 0, marginTop: 14 }, 
  trackText: { color: palette.white, fontSize: 12, fontWeight: "500", letterSpacing: 0.5 },
  
  // COMPACT CONCIERGE PROFILE SETTINGS
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand, marginTop: 15 }, 
  changeAvatar: { color: palette.blue, textAlign: "center", fontSize: 12, fontWeight: "600", marginTop: 10, letterSpacing: 0.5 }, 
  profileDetailsCard: { overflow: "hidden", borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand, marginTop: 12 }, 
  profileDetail: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.line }, 
  profileDetailLast: { borderBottomWidth: 0 }, 
  profileDetailLabel: { color: palette.muted, fontSize: 12, fontWeight: "500" }, 
  profileDetailValue: { flexShrink: 1, color: palette.white, textAlign: "right", fontSize: 13, fontWeight: "400" }, 
  profileMenuCard: { overflow: "hidden", paddingHorizontal: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand }, 
  editProfileCard: { padding: 16, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand, marginBottom: 10 }, 
  dobRow: { flexDirection: "row", gap: 10, marginBottom: 12 }, 
  dobField: { flex: 1, height: 52, paddingHorizontal: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 0, color: palette.white, backgroundColor: palette.cream }, 
  dobYear: { flex: 1.45 }, 
  avatar: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 29, backgroundColor: palette.white }, 
  avatarText: { color: palette.black, fontSize: 18, fontWeight: "600" }, 
  profileName: { color: palette.white, fontSize: 18, fontWeight: "400", letterSpacing: 0.5 }, 
  member: { color: palette.gold, fontSize: 11, fontWeight: "500", marginTop: 4, letterSpacing: 1, textTransform: "uppercase" }, 
  profileLabel: { color: palette.muted, fontSize: 10, fontWeight: "600", letterSpacing: 1.5, marginTop: 24, marginBottom: 8, textTransform: "uppercase" }, 
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.line }, 
  profileRowLast: { borderBottomWidth: 0 }, 
  profileIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: "#F3F4F6" }, 
  profileIconText: { color: palette.gold, fontSize: 11 }, 
  signOut: { color: palette.red, fontSize: 13, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginTop: 24 }, 
  addressCard: { gap: 4, padding: 16, borderWidth: 1, borderColor: palette.line, borderRadius: 0, backgroundColor: palette.sand, marginTop: 10 }, 
  addressActions: { flexDirection: "row", gap: 20, marginTop: 10 },
  
  // SYSTEM BAR & CORE FOOTER NAIVGATION
  empty: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24 }, 
  emptyIcon: { color: palette.gold, fontSize: 24, marginBottom: 4 }, 
  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 100, flexDirection: "row", alignItems: "flex-start", paddingTop: 10, borderTopWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#FFFFFF", elevation: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } }, 
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 }, 
  navIconPill: { minWidth: 48, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 18 }, 
  navIconPillActive: { backgroundColor: "#F3F4F6" }, 
  navIcon: { color: palette.muted, textAlign: "center", fontSize: 20, lineHeight: 22, fontWeight: "400" }, 
  navLabel: { color: "#9CA3AF", fontSize: 10, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" }, 
  navActive: { color: "#111827" }, 
  navIndicator: { display: "none" }, 
  cartCount: { position: "absolute", top: -6, right: -10, width: 14, height: 14, overflow: "hidden", color: palette.black, textAlign: "center", lineHeight: 14, fontSize: 8, fontWeight: "700", borderRadius: 7, backgroundColor: palette.gold },

  // COMPLEMENTARY LUXURY ELEMENTS
  splashClean: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.cream, overflow: "hidden" },
  splashGlowOne: { position: "absolute", width: 520, height: 520, borderRadius: 260, borderWidth: 1, borderColor: "rgba(214,175,55,0.04)", top: -140, right: -160 },
  splashGlowTwo: { position: "absolute", width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: "rgba(163,230,53,0.03)", bottom: 60, left: -100 },
  splashLogoBox: { width: 52, height: 52, alignItems: "center", justifyContent: "center", backgroundColor: palette.white },
  splashLogoS: { color: palette.black, fontSize: 28, fontWeight: "300", letterSpacing: -0.5 },
  splashWord: { color: palette.white, fontSize: 58, fontWeight: "300", letterSpacing: -2, lineHeight: 62 },
  splashLine: { color: palette.gold, fontSize: 10.5, letterSpacing: 3.5, textTransform: "uppercase", textAlign: "center", marginTop: 24 },
  splashSubLine: { color: palette.muted, fontSize: 13, letterSpacing: 0.5, textAlign: "center", fontWeight: "300", marginTop: 10 },
  homeScreen: { paddingHorizontal: 0, paddingTop: 10 },
  appTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  locationMini: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  pinIcon: { color: palette.gold, fontSize: 18 },
  deliverSmall: { color: palette.muted, fontSize: 10, fontWeight: "600", letterSpacing: 1 },
  deliverText: { color: palette.white, fontSize: 13, maxWidth: 250 },
  profileIconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: palette.sand, borderWidth: 1, borderColor: palette.line },
  profileMiniText: { color: palette.gold, fontSize: 12, fontWeight: "600" },
  quickCategoryRail: { gap: 14, paddingVertical: 10 },
  quickCategory: { width: 70, alignItems: "center" },
  quickCategoryIcon: { width: 58, height: 58, borderRadius: 0, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line },
  quickCategoryEmoji: { fontSize: 22 },
  quickCategoryText: { color: palette.white, fontSize: 11, textAlign: "center", marginTop: 6, fontWeight: "400", letterSpacing: 0.3 },
  bannerRail: { gap: 12, paddingVertical: 8 },
  bigBanner: { height: 150, borderRadius: 0, overflow: "hidden", flexDirection: "row", padding: 18, borderWidth: 1, borderColor: palette.line },
  bannerContent: { flex: 1, justifyContent: "center" },
  bannerKicker: { color: palette.gold, fontSize: 11, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase" },
  bannerTitle: { color: palette.white, fontSize: 22, lineHeight: 28, fontWeight: "300", marginTop: 8, maxWidth: 230 },
  bannerAction: { color: palette.white, fontSize: 13, fontWeight: "500", marginTop: 12, textDecorationLine: "underline" },
  bannerProductImage: { width: 105, height: 120, borderRadius: 0, alignSelf: "center", opacity: 0.9 },
  serviceStrip: { flexDirection: "row", gap: 8, paddingVertical: 8, marginBottom: 4 },
  serviceItem: { flex: 1, color: palette.muted, fontSize: 11, fontWeight: "400", backgroundColor: palette.sand, borderWidth: 1, borderColor: palette.line, borderRadius: 0, padding: 8, textAlign: "center", letterSpacing: 0.3 },
  
  splashUltra: { flex: 1, backgroundColor: palette.cream, alignItems: "center", justifyContent: "center", overflow: "hidden", paddingHorizontal: 40 },
  splashOrbOne: { position: "absolute", width: 520, height: 520, borderRadius: 260, borderWidth: 1, borderColor: "rgba(214,175,55,0.05)", top: -140, right: -160 },
  splashOrbTwo: { position: "absolute", width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: "rgba(163,230,53,0.04)", bottom: 60, left: -100 },
  splashHero: { alignItems: "center" },
  splashLogoRing: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  splashLogoInner: { width: 52, height: 52, backgroundColor: palette.white, alignItems: "center", justifyContent: "center" },
  splashLogoText: { fontSize: 28, fontWeight: "300", color: palette.black, letterSpacing: -0.5 },
  splashBrand: { fontSize: 58, fontWeight: "300", color: palette.white, letterSpacing: -2, lineHeight: 62 },
  splashAccent: { width: 2, height: 44, backgroundColor: palette.gold, marginLeft: 2, marginBottom: 6, alignSelf: "flex-end" },
  splashTagline: { fontSize: 10.5, color: palette.gold, letterSpacing: 3.5, textAlign: "center", textTransform: "uppercase", marginTop: 24 },
  splashSubTagline: { fontSize: 13, color: palette.muted, letterSpacing: 0.5, textAlign: "center", fontWeight: "300", marginTop: 10 },
  splashFooter: { position: "absolute", bottom: 48, flexDirection: "row", alignItems: "center", gap: 8, fontSize: 11, color: palette.muted, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "400" },
});
