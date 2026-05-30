import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Screen =
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
  | "orders"
  | "profile";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  image: string;
  badge?: string;
  description: string;
};

const colors = {
  bg: "#070707",
  surface: "#111111",
  card: "#171717",
  gold: "#D6B36A",
  goldSoft: "#F3D891",
  text: "#FFFFFF",
  muted: "#9D9D9D",
  line: "#292929",
  danger: "#D46A6A",
};

const products: Product[] = [
  {
    id: 1,
    name: "Heritage Chronograph",
    category: "Watches",
    price: 18999,
    oldPrice: 24999,
    rating: 4.8,
    badge: "LIMITED",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85",
    description:
      "A refined steel chronograph with a midnight dial, crafted for everyday distinction.",
  },
  {
    id: 2,
    name: "Noir Leather Weekender",
    category: "Bags",
    price: 12499,
    rating: 4.9,
    badge: "SIGNATURE",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=85",
    description:
      "Full-grain leather, clean architecture, and considered storage for short escapes.",
  },
  {
    id: 3,
    name: "Velvet Oud Parfum",
    category: "Fragrance",
    price: 6499,
    oldPrice: 7499,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=85",
    description:
      "A warm composition of oud, cedar, and amber with a quietly lasting finish.",
  },
  {
    id: 4,
    name: "Classic Suede Loafers",
    category: "Footwear",
    price: 8999,
    rating: 4.6,
    badge: "NEW",
    image:
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=85",
    description:
      "Soft suede loafers with a tailored profile and a flexible leather-lined sole.",
  },
  {
    id: 5,
    name: "Aurelia Gold Cuff",
    category: "Jewellery",
    price: 4599,
    oldPrice: 5999,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=85",
    description:
      "A minimal gold-toned cuff shaped for effortless layering and understated polish.",
  },
  {
    id: 6,
    name: "Linen Resort Shirt",
    category: "Apparel",
    price: 3299,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=85",
    description:
      "Breathable premium linen with a relaxed silhouette for warm, unhurried days.",
  },
];

const categories = [
  ["Watches", "01", "Timeless precision"],
  ["Apparel", "02", "Quiet confidence"],
  ["Bags", "03", "Crafted companions"],
  ["Footwear", "04", "Steps in style"],
  ["Fragrance", "05", "Your signature"],
  ["Jewellery", "06", "Subtle statements"],
];

const money = (value: number) => `Rs. ${value.toLocaleString("en-IN")}`;

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [selected, setSelected] = useState(products[0]);
  const [category, setCategory] = useState("Curated");
  const [cart, setCart] = useState<number[]>([1, 3]);

  useEffect(() => {
    const timer = setTimeout(() => setScreen("onboarding"), 1600);
    return () => clearTimeout(timer);
  }, []);

  const openListing = (nextCategory = "Curated") => {
    setCategory(nextCategory);
    setScreen("listing");
  };

  const openProduct = (product: Product) => {
    setSelected(product);
    setScreen("details");
  };

  const toggleCart = (id: number) =>
    setCart((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const cartProducts = products.filter((product) => cart.includes(product.id));
  const subtotal = cartProducts.reduce((sum, product) => sum + product.price, 0);

  if (screen === "splash") return <Splash />;
  if (screen === "onboarding")
    return <Onboarding onContinue={() => setScreen("login")} />;
  if (screen === "login")
    return (
      <AuthScreen
        mode="login"
        onSubmit={() => setScreen("home")}
        onSwitch={() => setScreen("signup")}
      />
    );
  if (screen === "signup")
    return (
      <AuthScreen
        mode="signup"
        onSubmit={() => setScreen("home")}
        onSwitch={() => setScreen("login")}
      />
    );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      {screen === "home" && (
        <Home
          onCategories={() => setScreen("categories")}
          onListing={openListing}
          onProduct={openProduct}
        />
      )}
      {screen === "categories" && (
        <Categories onBack={() => setScreen("home")} onCategory={openListing} />
      )}
      {screen === "listing" && (
        <Listing
          category={category}
          onBack={() => setScreen("home")}
          onProduct={openProduct}
        />
      )}
      {screen === "details" && (
        <Details
          product={selected}
          inCart={cart.includes(selected.id)}
          onBack={() => setScreen("listing")}
          onCart={() => toggleCart(selected.id)}
        />
      )}
      {screen === "cart" && (
        <Cart
          items={cartProducts}
          subtotal={subtotal}
          onRemove={toggleCart}
          onCheckout={() => setScreen("checkout")}
        />
      )}
      {screen === "checkout" && (
        <Checkout
          subtotal={subtotal}
          onBack={() => setScreen("cart")}
          onPlaceOrder={() => setScreen("orders")}
        />
      )}
      {screen === "orders" && <Orders />}
      {screen === "profile" && <Profile />}
      <BottomNav screen={screen} count={cart.length} onNavigate={setScreen} />
    </SafeAreaView>
  );
}

function Splash() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashMark}>
        <Text style={styles.splashS}>S</Text>
      </View>
      <Text style={styles.logo}>SONMAN</Text>
      <Text style={styles.tracking}>CURATED FOR YOU</Text>
    </View>
  );
}

function Onboarding({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={styles.onboarding}>
      <StatusBar style="light" />
      <Image source={{ uri: products[0].image }} style={styles.onboardingImage} />
      <View style={styles.onboardingShade} />
      <View style={styles.onboardingContent}>
        <Text style={styles.eyebrow}>WELCOME TO SONMAN</Text>
        <Text style={styles.heroTitle}>Luxury is{"\n"}personal.</Text>
        <Text style={styles.heroBody}>
          Discover considered pieces, selected around your taste and your
          moment.
        </Text>
        <PrimaryButton label="BEGIN YOUR JOURNEY" onPress={onContinue} />
        <Text style={styles.onboardingCount}>01  /  03</Text>
      </View>
    </View>
  );
}

function AuthScreen({
  mode,
  onSubmit,
  onSwitch,
}: {
  mode: "login" | "signup";
  onSubmit: () => void;
  onSwitch: () => void;
}) {
  const signup = mode === "signup";
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.auth}>
        <Text style={styles.logo}>SONMAN</Text>
        <Text style={styles.eyebrow}>{signup ? "JOIN THE HOUSE" : "WELCOME BACK"}</Text>
        <Text style={styles.authTitle}>
          {signup ? "Create your account" : "Sign in to continue"}
        </Text>
        <Text style={styles.muted}>
          {signup
            ? "Set up your Sonman profile for a tailored shopping experience."
            : "Access your curated edits, saved pieces, and orders."}
        </Text>
        {signup && <Field label="FULL NAME" placeholder="Your name" />}
        <Field label="EMAIL" placeholder="name@example.com" />
        <Field label="PASSWORD" placeholder="Enter password" secure />
        {!signup && <Text style={styles.forgot}>FORGOT PASSWORD?</Text>}
        <PrimaryButton
          label={signup ? "CREATE ACCOUNT" : "SIGN IN"}
          onPress={onSubmit}
        />
        <Pressable onPress={onSwitch}>
          <Text style={styles.switchText}>
            {signup ? "Already a member? " : "New to Sonman? "}
            <Text style={styles.gold}>{signup ? "Sign in" : "Create account"}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Home({
  onCategories,
  onListing,
  onProduct,
}: {
  onCategories: () => void;
  onListing: (category?: string) => void;
  onProduct: (product: Product) => void;
}) {
  return (
    <ScreenScroll>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>GOOD EVENING</Text>
          <Text style={styles.pageTitle}>Discover Sonman</Text>
        </View>
        <RoundButton label="S" />
      </View>
      <Pressable style={styles.aiCard}>
        <View style={styles.aiOrb}><Text style={styles.aiOrbText}>AI</Text></View>
        <View style={styles.flex}>
          <Text style={styles.aiTitle}>Ask Sonman</Text>
          <Text style={styles.muted}>Your personal shopping concierge</Text>
        </View>
        <Text style={styles.arrow}>+</Text>
      </Pressable>
      <View style={styles.heroCard}>
        <Image source={{ uri: products[1].image }} style={styles.heroImage} />
        <View style={styles.heroShade} />
        <View style={styles.heroCardText}>
          <Text style={styles.eyebrow}>THE WEEKEND EDIT</Text>
          <Text style={styles.cardTitle}>Travel in{"\n"}quiet luxury</Text>
          <Text style={styles.link} onPress={() => onListing("Travel edit")}>
            EXPLORE EDIT  +
          </Text>
        </View>
      </View>
      <SectionHeader title="Shop by category" action="VIEW ALL" onPress={onCategories} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.slice(0, 4).map(([name, number]) => (
          <Pressable key={name} style={styles.categoryChip} onPress={() => onListing(name)}>
            <Text style={styles.categoryNumber}>{number}</Text>
            <Text style={styles.categoryName}>{name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <SectionHeader title="Selected for you" action="SEE MORE" onPress={() => onListing()} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} onPress={() => onProduct(product)} />
        ))}
      </ScrollView>
    </ScreenScroll>
  );
}

function Categories({
  onBack,
  onCategory,
}: {
  onBack: () => void;
  onCategory: (category: string) => void;
}) {
  return (
    <ScreenScroll>
      <PageHeader title="Categories" onBack={onBack} />
      <Text style={styles.muted}>Explore our considered collection.</Text>
      <View style={styles.categoryGrid}>
        {categories.map(([name, number, subtitle]) => (
          <Pressable key={name} style={styles.categoryTile} onPress={() => onCategory(name)}>
            <Text style={styles.categoryNumber}>{number}</Text>
            <Text style={styles.categoryTileTitle}>{name}</Text>
            <Text style={styles.mutedSmall}>{subtitle}</Text>
            <Text style={styles.gold}>EXPLORE +</Text>
          </Pressable>
        ))}
      </View>
    </ScreenScroll>
  );
}

function Listing({
  category,
  onBack,
  onProduct,
}: {
  category: string;
  onBack: () => void;
  onProduct: (product: Product) => void;
}) {
  const visible =
    categories.some(([name]) => name === category)
      ? products.filter((product) => product.category === category)
      : products;
  return (
    <ScreenScroll>
      <PageHeader title={category} onBack={onBack} />
      <View style={styles.listMeta}>
        <Text style={styles.muted}>{visible.length} considered pieces</Text>
        <Text style={styles.gold}>FILTER +</Text>
      </View>
      <View style={styles.productGrid}>
        {visible.map((product) => (
          <ProductCard
            key={product.id}
            wide
            product={product}
            onPress={() => onProduct(product)}
          />
        ))}
      </View>
    </ScreenScroll>
  );
}

function Details({
  product,
  inCart,
  onBack,
  onCart,
}: {
  product: Product;
  inCart: boolean;
  onBack: () => void;
  onCart: () => void;
}) {
  return (
    <ScreenScroll>
      <PageHeader title="Product details" onBack={onBack} />
      <Image source={{ uri: product.image }} style={styles.detailImage} />
      <View style={styles.detailDots}><Text style={styles.gold}>-  -  -</Text></View>
      <Text style={styles.eyebrow}>{product.category}</Text>
      <Text style={styles.detailTitle}>{product.name}</Text>
      <Text style={styles.rating}>STAR  {product.rating}  |  128 reviews</Text>
      <Text style={styles.detailPrice}>{money(product.price)}</Text>
      <Text style={styles.description}>{product.description}</Text>
      <View style={styles.divider} />
      <Text style={styles.eyebrow}>SELECT SIZE</Text>
      <View style={styles.sizeRow}>
        {["S", "M", "L", "XL"].map((size, index) => (
          <View key={size} style={[styles.size, index === 1 && styles.sizeActive]}>
            <Text style={index === 1 ? styles.sizeActiveText : styles.muted}>{size}</Text>
          </View>
        ))}
      </View>
      <PrimaryButton label={inCart ? "REMOVE FROM BAG" : "ADD TO BAG"} onPress={onCart} />
    </ScreenScroll>
  );
}

function Cart({
  items,
  subtotal,
  onRemove,
  onCheckout,
}: {
  items: Product[];
  subtotal: number;
  onRemove: (id: number) => void;
  onCheckout: () => void;
}) {
  return (
    <ScreenScroll>
      <Text style={styles.pageTitle}>Your bag</Text>
      <Text style={styles.muted}>{items.length} selected pieces</Text>
      {items.map((product) => (
        <View key={product.id} style={styles.cartItem}>
          <Image source={{ uri: product.image }} style={styles.cartImage} />
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>{product.name}</Text>
            <Text style={styles.mutedSmall}>{product.category}</Text>
            <Text style={styles.price}>{money(product.price)}</Text>
            <Pressable onPress={() => onRemove(product.id)}>
              <Text style={styles.remove}>REMOVE</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {items.length === 0 && <Empty title="Your bag is empty" />}
      <OrderTotal subtotal={subtotal} />
      <PrimaryButton label="PROCEED TO CHECKOUT" onPress={onCheckout} disabled={!items.length} />
    </ScreenScroll>
  );
}

function Checkout({
  subtotal,
  onBack,
  onPlaceOrder,
}: {
  subtotal: number;
  onBack: () => void;
  onPlaceOrder: () => void;
}) {
  return (
    <ScreenScroll>
      <PageHeader title="Checkout" onBack={onBack} />
      <CheckoutSection number="01" title="DELIVERY ADDRESS">
        <Text style={styles.itemTitle}>Arjun Mehta</Text>
        <Text style={styles.muted}>24 Park View Road, Indiranagar{"\n"}Bengaluru, Karnataka 560038</Text>
        <Text style={styles.link}>CHANGE ADDRESS</Text>
      </CheckoutSection>
      <CheckoutSection number="02" title="DELIVERY METHOD">
        <Text style={styles.itemTitle}>Premium delivery</Text>
        <Text style={styles.muted}>Arrives within 2-3 business days</Text>
      </CheckoutSection>
      <CheckoutSection number="03" title="PAYMENT METHOD">
        <Text style={styles.itemTitle}>Visa ending in 4826</Text>
        <Text style={styles.muted}>Secure payment</Text>
      </CheckoutSection>
      <OrderTotal subtotal={subtotal} />
      <PrimaryButton label={`PLACE ORDER  |  ${money(subtotal)}`} onPress={onPlaceOrder} />
    </ScreenScroll>
  );
}

function Orders() {
  return (
    <ScreenScroll>
      <Text style={styles.pageTitle}>Your orders</Text>
      <Text style={styles.muted}>Track and revisit your Sonman selections.</Text>
      <View style={styles.orderCard}>
        <View style={styles.listMeta}>
          <Text style={styles.eyebrow}>ORDER #SMN-2026-1842</Text>
          <Text style={styles.gold}>IN TRANSIT</Text>
        </View>
        <Text style={styles.itemTitle}>2 pieces arriving soon</Text>
        <Text style={styles.muted}>Expected delivery: 03 June</Text>
        <View style={styles.progress}><View style={styles.progressDone} /></View>
        <Text style={styles.link}>TRACK ORDER  +</Text>
      </View>
      <View style={styles.orderCard}>
        <View style={styles.listMeta}>
          <Text style={styles.eyebrow}>ORDER #SMN-2026-1651</Text>
          <Text style={styles.mutedSmall}>DELIVERED</Text>
        </View>
        <Text style={styles.itemTitle}>Heritage Chronograph</Text>
        <Text style={styles.muted}>Delivered on 12 May</Text>
        <Text style={styles.link}>VIEW DETAILS  +</Text>
      </View>
    </ScreenScroll>
  );
}

function Profile() {
  return (
    <ScreenScroll>
      <View style={styles.profileTop}>
        <View style={styles.avatar}><Text style={styles.avatarText}>AM</Text></View>
        <Text style={styles.pageTitle}>Arjun Mehta</Text>
        <Text style={styles.muted}>arjun.mehta@example.com</Text>
        <Text style={styles.membership}>SONMAN PRIVILEGE MEMBER</Text>
      </View>
      {[
        ["MY ORDERS", "Track and manage your purchases"],
        ["SAVED PIECES", "Your personal shortlist"],
        ["ADDRESSES", "Manage delivery locations"],
        ["PAYMENT METHODS", "Securely saved cards"],
        ["PREFERENCES", "Refine your Sonman experience"],
        ["HELP & CONCIERGE", "We are here to assist"],
      ].map(([title, subtitle]) => (
        <Pressable key={title} style={styles.profileRow}>
          <View>
            <Text style={styles.itemTitle}>{title}</Text>
            <Text style={styles.mutedSmall}>{subtitle}</Text>
          </View>
          <Text style={styles.gold}>+</Text>
        </Pressable>
      ))}
      <Text style={styles.signOut}>SIGN OUT</Text>
    </ScreenScroll>
  );
}

function ScreenScroll({ children }: { children: React.ReactNode }) {
  return <ScrollView contentContainerStyle={styles.screen}>{children}</ScrollView>;
}

function Field({ label, placeholder, secure }: { label: string; placeholder: string; secure?: boolean }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secure}
        style={styles.field}
      />
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.primary, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function RoundButton({ label }: { label: string }) {
  return <View style={styles.round}><Text style={styles.roundText}>{label}</Text></View>;
}

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.pageHeader}>
      <Pressable onPress={onBack}><Text style={styles.back}>{"<"}</Text></Pressable>
      <Text style={styles.pageTitle}>{title}</Text>
    </View>
  );
}

function SectionHeader({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onPress}><Text style={styles.link}>{action}</Text></Pressable>
    </View>
  );
}

function ProductCard({ product, onPress, wide }: { product: Product; onPress: () => void; wide?: boolean }) {
  return (
    <Pressable style={[styles.productCard, wide && styles.productCardWide]} onPress={onPress}>
      <View>
        <Image source={{ uri: product.image }} style={[styles.productImage, wide && styles.productImageWide]} />
        {product.badge && <Text style={styles.badge}>{product.badge}</Text>}
      </View>
      <Text style={styles.mutedSmall}>{product.category}</Text>
      <Text style={styles.itemTitle} numberOfLines={1}>{product.name}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{money(product.price)}</Text>
        {product.oldPrice && <Text style={styles.oldPrice}>{money(product.oldPrice)}</Text>}
      </View>
    </Pressable>
  );
}

function OrderTotal({ subtotal }: { subtotal: number }) {
  return (
    <View style={styles.total}>
      <View style={styles.listMeta}><Text style={styles.muted}>Subtotal</Text><Text style={styles.itemTitle}>{money(subtotal)}</Text></View>
      <View style={styles.listMeta}><Text style={styles.muted}>Delivery</Text><Text style={styles.gold}>COMPLIMENTARY</Text></View>
      <View style={styles.divider} />
      <View style={styles.listMeta}><Text style={styles.sectionTitle}>Total</Text><Text style={styles.detailPrice}>{money(subtotal)}</Text></View>
    </View>
  );
}

function CheckoutSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.checkoutSection}>
      <Text style={styles.categoryNumber}>{number}</Text>
      <Text style={styles.eyebrow}>{title}</Text>
      {children}
    </View>
  );
}

function Empty({ title }: { title: string }) {
  return <View style={styles.empty}><Text style={styles.sectionTitle}>{title}</Text></View>;
}

function BottomNav({ screen, count, onNavigate }: { screen: Screen; count: number; onNavigate: (screen: Screen) => void }) {
  return (
    <View style={styles.bottomNav}>
      {[
        ["HOME", "home"],
        ["SHOP", "categories"],
        ["BAG", "cart"],
        ["ORDERS", "orders"],
        ["PROFILE", "profile"],
      ].map(([label, target]) => (
        <Pressable key={target} style={styles.navItem} onPress={() => onNavigate(target as Screen)}>
          <Text style={[styles.navText, screen === target && styles.navActive]}>
            {label}{target === "cart" && count ? ` (${count})` : ""}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  splashMark: { width: 84, height: 84, borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  splashS: { color: colors.goldSoft, fontSize: 54, fontFamily: "serif" },
  logo: { color: colors.goldSoft, fontSize: 25, letterSpacing: 8, fontWeight: "600" },
  tracking: { color: colors.muted, fontSize: 9, letterSpacing: 4, marginTop: 14 },
  onboarding: { flex: 1, backgroundColor: colors.bg },
  onboardingImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  onboardingShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.54)" },
  onboardingContent: { flex: 1, justifyContent: "flex-end", padding: 28, paddingBottom: 46 },
  eyebrow: { color: colors.gold, fontSize: 10, letterSpacing: 2, fontWeight: "700", marginBottom: 12 },
  heroTitle: { color: colors.text, fontFamily: "serif", fontSize: 54, lineHeight: 58 },
  heroBody: { color: "#D0D0D0", fontSize: 15, lineHeight: 24, marginVertical: 18, maxWidth: 330 },
  onboardingCount: { color: colors.gold, fontSize: 10, letterSpacing: 3, marginTop: 22, textAlign: "center" },
  auth: { minHeight: "100%", backgroundColor: colors.bg, padding: 28, paddingTop: 72, gap: 14 },
  authTitle: { color: colors.text, fontSize: 34, fontFamily: "serif", marginTop: 30 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  mutedSmall: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  gold: { color: colors.gold, fontSize: 11, letterSpacing: 1, fontWeight: "700" },
  fieldWrap: { marginTop: 10 },
  fieldLabel: { color: colors.gold, fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  field: { height: 54, borderWidth: 1, borderColor: colors.line, color: colors.text, paddingHorizontal: 15, backgroundColor: colors.surface },
  forgot: { color: colors.gold, fontSize: 10, letterSpacing: 2, textAlign: "right" },
  switchText: { color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 2 },
  primary: { backgroundColor: colors.gold, minHeight: 54, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, marginVertical: 8 },
  primaryText: { color: "#111111", fontWeight: "800", letterSpacing: 1.5, fontSize: 11 },
  disabled: { opacity: 0.4 },
  screen: { padding: 20, paddingBottom: 96, backgroundColor: colors.bg },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  pageTitle: { color: colors.text, fontFamily: "serif", fontSize: 30 },
  round: { height: 42, width: 42, borderRadius: 21, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  roundText: { color: "#111", fontFamily: "serif", fontSize: 18 },
  aiCard: { borderWidth: 1, borderColor: colors.gold, backgroundColor: "#17140E", padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22 },
  aiOrb: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center" },
  aiOrbText: { color: colors.goldSoft, fontSize: 11, fontWeight: "800" },
  aiTitle: { color: colors.goldSoft, fontFamily: "serif", fontSize: 20 },
  arrow: { color: colors.gold, fontSize: 26 },
  heroCard: { height: 250, marginBottom: 8, overflow: "hidden", backgroundColor: colors.card },
  heroImage: { width: "100%", height: "100%" },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },
  heroCardText: { position: "absolute", left: 18, bottom: 18 },
  cardTitle: { color: colors.text, fontFamily: "serif", fontSize: 30, lineHeight: 33, marginBottom: 12 },
  link: { color: colors.gold, fontSize: 10, letterSpacing: 1.4, fontWeight: "800", marginTop: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 14 },
  sectionTitle: { color: colors.text, fontFamily: "serif", fontSize: 21 },
  categoryChip: { width: 125, height: 94, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, padding: 13, marginRight: 10, justifyContent: "space-between" },
  categoryNumber: { color: colors.gold, fontFamily: "serif", fontSize: 22 },
  categoryName: { color: colors.text, fontFamily: "serif", fontSize: 18 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 20 },
  categoryTile: { width: "48%", minHeight: 165, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 14, justifyContent: "space-between" },
  categoryTileTitle: { color: colors.text, fontFamily: "serif", fontSize: 22 },
  pageHeader: { flexDirection: "row", alignItems: "center", gap: 18, marginBottom: 18 },
  back: { color: colors.gold, fontSize: 28 },
  listMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 14 },
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  productCard: { width: 168, marginRight: 12, marginBottom: 18 },
  productCardWide: { width: "48%", marginRight: 0 },
  productImage: { width: 168, height: 205, backgroundColor: colors.card, marginBottom: 10 },
  productImageWide: { width: "100%", height: 205 },
  badge: { position: "absolute", top: 8, left: 8, color: "#111", backgroundColor: colors.gold, paddingHorizontal: 7, paddingVertical: 4, fontSize: 8, letterSpacing: 1, fontWeight: "800" },
  itemTitle: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  priceRow: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 5 },
  price: { color: colors.goldSoft, fontSize: 13, fontWeight: "700" },
  oldPrice: { color: colors.muted, fontSize: 11, textDecorationLine: "line-through" },
  detailImage: { width: "100%", height: 360, backgroundColor: colors.card },
  detailDots: { alignItems: "center", marginVertical: 12 },
  detailTitle: { color: colors.text, fontFamily: "serif", fontSize: 32, lineHeight: 38 },
  detailPrice: { color: colors.goldSoft, fontFamily: "serif", fontSize: 23, marginTop: 10 },
  rating: { color: colors.muted, fontSize: 11, letterSpacing: 1, marginTop: 8 },
  description: { color: "#C9C9C9", fontSize: 14, lineHeight: 23, marginTop: 16 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 18 },
  sizeRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  size: { width: 46, height: 42, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  sizeActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  sizeActiveText: { color: "#111", fontWeight: "800" },
  cartItem: { flexDirection: "row", gap: 14, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 18 },
  cartImage: { width: 96, height: 116, backgroundColor: colors.card },
  remove: { color: colors.danger, fontSize: 10, letterSpacing: 1.5, marginTop: 18 },
  total: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 15, marginTop: 20, marginBottom: 6 },
  checkoutSection: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 18, gap: 5 },
  orderCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 18 },
  progress: { height: 2, backgroundColor: colors.line, marginTop: 18 },
  progressDone: { width: "68%", height: 2, backgroundColor: colors.gold },
  profileTop: { alignItems: "center", marginVertical: 20 },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  avatarText: { color: colors.goldSoft, fontFamily: "serif", fontSize: 22 },
  membership: { color: colors.gold, borderWidth: 1, borderColor: colors.gold, paddingHorizontal: 12, paddingVertical: 6, fontSize: 9, letterSpacing: 1.5, marginTop: 16 },
  profileRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 17 },
  signOut: { color: colors.danger, fontSize: 11, letterSpacing: 2, marginTop: 30 },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 66, flexDirection: "row", backgroundColor: "#0D0D0D", borderTopWidth: 1, borderTopColor: colors.line, alignItems: "center" },
  navItem: { flex: 1, alignItems: "center" },
  navText: { color: colors.muted, fontSize: 9, letterSpacing: 0.5, fontWeight: "700" },
  navActive: { color: colors.gold },
  empty: { minHeight: 180, alignItems: "center", justifyContent: "center" },
});
