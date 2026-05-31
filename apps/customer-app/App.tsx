import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState, type ReactNode } from "react";
import {
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  StatusBar,
  useWindowDimensions,
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
  oldPrice: number;
  rating: number;
  reviews: number;
  delivery: string;
  image: string;
  badge?: string;
  description: string;
};

const palette = {
  cream: "#F8F6F1",
  white: "#FFFFFF",
  sand: "#F0ECE4",
  line: "#E7E1D8",
  black: "#171717",
  muted: "#76716A",
  gold: "#A97B2C",
  goldPale: "#F6E8C6",
  green: "#267250",
  greenPale: "#E5F3EB",
  red: "#D85743",
};

const products: Product[] = [
  {
    id: 1,
    name: "Heritage Steel Chronograph",
    category: "Watches",
    price: 18999,
    oldPrice: 24999,
    rating: 4.8,
    reviews: 128,
    delivery: "Tomorrow",
    badge: "PREMIUM",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=85",
    description: "A refined steel chronograph with a midnight dial, precise movement, and a comfortable link bracelet for everyday wear.",
  },
  {
    id: 2,
    name: "Noir Leather Weekender",
    category: "Bags",
    price: 12499,
    oldPrice: 15999,
    rating: 4.9,
    reviews: 84,
    delivery: "In 2 days",
    badge: "BESTSELLER",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=85",
    description: "Full-grain leather, clean lines, and considered storage for short escapes and work trips.",
  },
  {
    id: 3,
    name: "Velvet Oud Eau de Parfum",
    category: "Beauty",
    price: 6499,
    oldPrice: 7499,
    rating: 4.7,
    reviews: 212,
    delivery: "Tomorrow",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=85",
    description: "A warm composition of oud, cedar, and amber with a quietly lasting finish.",
  },
  {
    id: 4,
    name: "Classic Suede Loafers",
    category: "Footwear",
    price: 8999,
    oldPrice: 10999,
    rating: 4.6,
    reviews: 67,
    delivery: "In 3 days",
    badge: "NEW",
    image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=85",
    description: "Soft suede loafers with a tailored profile and a flexible leather-lined sole.",
  },
  {
    id: 5,
    name: "Aurelia Gold-Tone Cuff",
    category: "Jewellery",
    price: 4599,
    oldPrice: 5999,
    rating: 4.8,
    reviews: 156,
    delivery: "Tomorrow",
    badge: "PREMIUM",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=85",
    description: "A minimal gold-tone cuff shaped for effortless layering and understated polish.",
  },
  {
    id: 6,
    name: "Relaxed Linen Resort Shirt",
    category: "Fashion",
    price: 3299,
    oldPrice: 4299,
    rating: 4.5,
    reviews: 94,
    delivery: "In 2 days",
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=85",
    description: "Breathable premium linen with a relaxed silhouette for warm, unhurried days.",
  },
];

const categories = [
  ["Fashion", "TS", "Everyday style", "#F9E5D7"],
  ["Mobiles", "MB", "Devices and accessories", "#E2EDF8"],
  ["Beauty", "BT", "Daily care", "#F8E1EA"],
  ["Home", "HM", "For every room", "#E8EEE1"],
  ["Footwear", "SN", "New-season steps", "#ECE5F7"],
  ["Watches", "WT", "Smart classics", "#F7EACF"],
  ["Bags", "BG", "Carry better", "#DCEFEA"],
  ["Jewellery", "JW", "Fine details", "#F5E5C8"],
  ["Grocery", "GR", "Pantry essentials", "#E4F0D7"],
  ["More", "++", "Explore all", "#E6E8ED"],
] as const;

const offers = [
  ["DAYLIGHT DEALS", "Everyday essentials,\nbetter prices.", "Up to 40% off", "#E0F1E8"],
  ["FAST DELIVERY", "Your favourites,\nat your door.", "Free delivery", "#E3EBF8"],
  ["SONMAN PICKS", "Useful finds for\nyour routine.", "Shop smart", "#F7E7C9"],
] as const;

const vendors = [
  ["Urban Edit", "UE", "4.8", "#E2EDF8"],
  ["Home Story", "HS", "4.7", "#E8EEE1"],
  ["Daily Drop", "DD", "4.6", "#F9E5D7"],
  ["Glow Room", "GR", "4.9", "#F8E1EA"],
] as const;

const money = (value: number) => `Rs ${value.toLocaleString("en-IN")}`;
const discount = ({ price, oldPrice }: Product) =>
  Math.round(((oldPrice - price) / oldPrice) * 100);

const SAFE_TOP = Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 0;
const BOTTOM_NAV_HEIGHT = 68;
const BOTTOM_SAFE_SPACE = Platform.OS === "android" ? 36 : 18;

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [selected, setSelected] = useState(products[0]);
  const [category, setCategory] = useState("Trending");
  const [cart, setCart] = useState<number[]>([1, 3]);

  useEffect(() => {
    const timer = setTimeout(() => setScreen("onboarding"), 900);
    return () => clearTimeout(timer);
  }, []);

  const openListing = (nextCategory = "Trending") => {
    setCategory(nextCategory);
    setScreen("listing");
  };
  const openProduct = (product: Product) => {
    setSelected(product);
    setScreen("details");
  };
  const toggleCart = (id: number) =>
    setCart((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  const cartProducts = products.filter((product) => cart.includes(product.id));
  const subtotal = cartProducts.reduce((sum, product) => sum + product.price, 0);

  if (screen === "splash") return <SafeLayout><Splash /></SafeLayout>;
  if (screen === "onboarding") return <SafeLayout><Onboarding onContinue={() => setScreen("login")} /></SafeLayout>;
  if (screen === "login" || screen === "signup") {
    return (
      <SafeLayout>
        <Auth
          mode={screen}
          onSubmit={() => setScreen("home")}
          onSwitch={() => setScreen(screen === "login" ? "signup" : "login")}
        />
      </SafeLayout>
    );
  }

  return (
    <SafeLayout>
      {screen === "home" && <Home onCategories={() => setScreen("categories")} onListing={openListing} onProduct={openProduct} />}
      {screen === "categories" && <Categories onBack={() => setScreen("home")} onCategory={openListing} />}
      {screen === "listing" && <Listing category={category} onBack={() => setScreen("home")} onProduct={openProduct} />}
      {screen === "details" && (
        <Details
          product={selected}
          inCart={cart.includes(selected.id)}
          onBack={() => setScreen("listing")}
          onCart={() => toggleCart(selected.id)}
          onBuy={() => {
            if (!cart.includes(selected.id)) toggleCart(selected.id);
            setScreen("cart");
          }}
        />
      )}
      {screen === "cart" && <Cart items={cartProducts} subtotal={subtotal} onRemove={toggleCart} onCheckout={() => setScreen("checkout")} />}
      {screen === "checkout" && <Checkout subtotal={subtotal} onBack={() => setScreen("cart")} onPlaceOrder={() => setScreen("orders")} />}
      {screen === "orders" && <Orders />}
      {screen === "profile" && <Profile />}
      <BottomNav screen={screen} count={cart.length} onNavigate={setScreen} />
    </SafeLayout>
  );
}

function Splash() {
  return (
    <ScreenShell contentContainerStyle={styles.splash}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
      <Text style={styles.logo}>sonman</Text>
      <Text style={styles.splashTag}>find something worth keeping</Text>
    </ScreenShell>
  );
}

function Onboarding({ onContinue }: { onContinue: () => void }) {
  return (
    <ScreenShell contentContainerStyle={styles.onboarding}>
        <View style={styles.between}><Text style={styles.logo}>sonman</Text><Text style={styles.link} onPress={onContinue}>Skip</Text></View>
        <View style={styles.onboardingVisual}>
          <Image source={{ uri: products[1].image }} style={styles.fillImage} />
          <View style={styles.floatingNote}><Text style={styles.gold}>AI</Text><Text style={styles.noteText}>Picks tailored to your taste</Text></View>
        </View>
        <View>
          <Text style={styles.onboardingTitle}>Better finds.{"\n"}Less searching.</Text>
          <Text style={styles.body}>Discover standout products, useful deals, and personal picks in one clean marketplace.</Text>
        </View>
        <PrimaryButton label="Start shopping" onPress={onContinue} />
        <Text style={styles.dots}>●  ○  ○</Text>
    </ScreenShell>
  );
}

function Auth({ mode, onSubmit, onSwitch }: { mode: "login" | "signup"; onSubmit: () => void; onSwitch: () => void }) {
  const signup = mode === "signup";
  return (
    <ScreenShell contentContainerStyle={styles.auth}>
        <Text style={styles.logo}>sonman</Text>
        <View style={styles.authIntro}>
          <Text style={styles.authTitle}>{signup ? "Create your account" : "Welcome back"}</Text>
          <Text style={styles.body}>{signup ? "Save picks, track orders, and checkout faster." : "Sign in to continue your shopping journey."}</Text>
        </View>
        {signup && <Field label="Full name" placeholder="Your name" />}
        <Field label="Email address" placeholder="name@example.com" />
        <Field label="Password" placeholder="Enter password" secure />
        {!signup && <Text style={[styles.link, styles.alignRight]}>Forgot password?</Text>}
        <PrimaryButton label={signup ? "Create account" : "Sign in"} onPress={onSubmit} />
        <Pressable style={styles.google}><Text style={styles.googleText}>G   Continue with Google</Text></Pressable>
        <Pressable onPress={onSwitch}><Text style={styles.switchText}>{signup ? "Already have an account? " : "New to Sonman? "}<Text style={styles.link}>{signup ? "Sign in" : "Create account"}</Text></Text></Pressable>
    </ScreenShell>
  );
}

function Home({ onCategories, onListing, onProduct }: { onCategories: () => void; onListing: (category?: string) => void; onProduct: (product: Product) => void }) {
  const { width } = useWindowDimensions();
  const contentWidth = width - (width < 360 ? 24 : 28);
  const cardWidth = Math.floor((contentWidth - 10) / 2);

  return (
    <ScreenShell contentContainerStyle={width < 360 ? styles.screenCompact : undefined}>
      <View style={styles.searchDock}>
        <View style={styles.marketHeader}><Text style={styles.logo}>sonman</Text><Pressable style={styles.avatarSmall}><Text style={styles.avatarSmallText}>AM</Text></Pressable></View>
        <SearchBar />
      </View>
      <Pressable style={styles.location}><Text style={styles.locationIcon}>PIN</Text><View style={styles.flex}><Text style={styles.locationLabel}>Deliver to Arjun</Text><Text style={styles.locationText}>Park View Road, Bengaluru 560001</Text></View><Text style={styles.chevron}>v</Text></Pressable>
      <Pressable style={styles.aiPill}>
        <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>
        <View style={styles.flex}><Text style={styles.aiTitle}>Ask Sonman AI</Text><Text style={styles.tinyMuted}>Tell us what you need. We will narrow it down.</Text></View>
        <Text style={styles.chevron}>+</Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
        {categories.map(([name, icon, , color]) => <Pressable key={name} style={styles.categoryBubble} onPress={() => name === "More" ? onCategories() : onListing(name)}><View style={[styles.categoryCircle, { backgroundColor: color }]}><Text style={styles.categoryCircleText}>{icon}</Text></View><Text style={styles.categoryBubbleText}>{name}</Text></Pressable>)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={contentWidth + 10} decelerationRate="fast" contentContainerStyle={styles.offerRail}>
        {offers.map(([kicker, title, action, color], index) => <Pressable key={kicker} style={[styles.offer, { width: contentWidth, backgroundColor: color }]} onPress={() => onListing()}><View style={styles.flex}><Text style={styles.offerKicker}>{kicker}</Text><Text style={styles.offerTitle}>{title}</Text><Text style={styles.offerAction}>{action}  &gt;</Text></View><Image source={{ uri: products[index + 1].image }} style={styles.offerImage} /></Pressable>)}
      </ScrollView>
      <MarketplaceSection title="Trending now" action="See all" onPress={() => onListing("Trending")}><View style={styles.productGrid}>{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} width={cardWidth} onPress={() => onProduct(product)} />)}</View></MarketplaceSection>
      <MarketplaceSection title="Recommended for you" action="See all" onPress={() => onListing("Recommended")}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRail}>{[...products].reverse().slice(0, 4).map((product) => <ProductCard key={product.id} product={product} width={cardWidth} onPress={() => onProduct(product)} />)}</ScrollView></MarketplaceSection>
      <MarketplaceSection title="Continue shopping" action="View history" onPress={() => onListing("Continue shopping")}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactRail}>{products.slice(1, 5).map((product) => <CompactProduct key={product.id} product={product} onPress={() => onProduct(product)} />)}</ScrollView></MarketplaceSection>
      <MarketplaceSection title="Popular vendors" action="See all" onPress={() => onListing("Vendors")}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vendorRail}>{vendors.map(([name, icon, rating, color]) => <VendorCard key={name} name={name} icon={icon} rating={rating} color={color} />)}</ScrollView></MarketplaceSection>
      <MarketplaceSection title="Recently viewed" action="See all" onPress={() => onListing("Recently viewed")}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactRail}>{products.slice(2, 6).map((product) => <CompactProduct key={product.id} product={product} onPress={() => onProduct(product)} />)}</ScrollView></MarketplaceSection>
    </ScreenShell>
  );
}

function Categories({ onBack, onCategory }: { onBack: () => void; onCategory: (category: string) => void }) {
  return (
    <ScreenScroll sticky>
      <PageHeader title="Categories" onBack={onBack} />
      <SearchBar placeholder="Search categories" />
      <Text style={styles.body}>Explore every corner of Sonman.</Text>
      <View style={styles.categoryList}>
        {categories.map(([name, icon, subtitle], index) => (
          <Pressable key={name} style={styles.categoryRow} onPress={() => onCategory(name)}>
            <View style={[styles.categoryLargeIcon, index === 0 && styles.categoryLargeIconGold]}><Text style={styles.categoryLargeText}>{icon}</Text></View>
            <View style={styles.flex}><Text style={styles.rowTitle}>{name}</Text><Text style={styles.smallMuted}>{subtitle}</Text></View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </View>
    </ScreenScroll>
  );
}

function Listing({ category, onBack, onProduct }: { category: string; onBack: () => void; onProduct: (product: Product) => void }) {
  const { width } = useWindowDimensions();
  const contentWidth = width - (width < 360 ? 24 : 28);
  const cardWidth = Math.floor((contentWidth - 10) / 2);
  const visible = categories.some(([name]) => name === category) ? products.filter((product) => product.category === category) : products;
  return (
    <ScreenScroll sticky>
      <PageHeader title={category} onBack={onBack} />
      <SearchBar placeholder={`Search ${category.toLowerCase()}`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}>
        {["Filters", "Popular", "Fast delivery", "Top rated"].map((item) => <Pressable key={item} style={styles.filter}><Text style={styles.filterText}>{item}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.between}><Text style={styles.smallMuted}>{visible.length} curated products</Text><Text style={styles.smallMuted}>Grid view</Text></View>
      <View style={[styles.productGrid, styles.gridTop]}>{visible.map((product) => <ProductCard key={product.id} product={product} width={cardWidth} onPress={() => onProduct(product)} />)}</View>
    </ScreenScroll>
  );
}

function Details({ product, inCart, onBack, onCart, onBuy }: { product: Product; inCart: boolean; onBack: () => void; onCart: () => void; onBuy: () => void }) {
  return (
    <ScreenScroll>
      <PageHeader title="Product details" onBack={onBack} action="♡" />
      <Image source={{ uri: product.image }} style={styles.detailImage} />
      <Text style={styles.dots}>●  ○  ○</Text>
      <Text style={styles.eyebrow}>{product.category.toUpperCase()}</Text>
      <Text style={styles.detailTitle}>{product.name}</Text>
      <View style={styles.ratingLine}><Text style={styles.rating}>★ {product.rating}</Text><Text style={styles.smallMuted}>{product.reviews} verified reviews</Text></View>
      <View style={styles.priceLine}><Text style={styles.detailPrice}>{money(product.price)}</Text><Text style={styles.oldPrice}>{money(product.oldPrice)}</Text><Text style={styles.discount}>{discount(product)}% off</Text></View>
      <View style={styles.deliveryCard}><Text style={styles.deliveryIcon}>FAST</Text><View><Text style={styles.deliveryTitle}>Free delivery by {product.delivery}</Text><Text style={styles.smallMuted}>Order within the next 4 hours</Text></View></View>
      <Text style={styles.sectionTitle}>About this product</Text>
      <Text style={styles.body}>{product.description}</Text>
      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Select size</Text>
      <View style={styles.sizeRow}>{["S", "M", "L", "XL"].map((size, index) => <Pressable key={size} style={[styles.size, index === 1 && styles.sizeActive]}><Text style={[styles.sizeText, index === 1 && styles.sizeTextActive]}>{size}</Text></Pressable>)}</View>
      <View style={styles.actionRow}><Pressable style={styles.outlineButton} onPress={onCart}><Text style={styles.outlineText}>{inCart ? "Remove" : "Add to cart"}</Text></Pressable><Pressable style={styles.darkButton} onPress={onBuy}><Text style={styles.darkButtonText}>Buy now</Text></Pressable></View>
    </ScreenScroll>
  );
}

function Cart({ items, subtotal, onRemove, onCheckout }: { items: Product[]; subtotal: number; onRemove: (id: number) => void; onCheckout: () => void }) {
  return (
    <ScreenScroll>
      <Text style={styles.pageTitle}>Your cart</Text>
      <Text style={styles.body}>{items.length} items ready for checkout</Text>
      <View style={styles.deliveryBanner}><Text style={styles.deliveryIcon}>FAST</Text><Text style={styles.deliveryTitle}>You unlocked free delivery</Text></View>
      {items.map((product) => <CartItem key={product.id} product={product} onRemove={() => onRemove(product.id)} />)}
      {!items.length && <Empty title="Your cart is empty" subtitle="Add a few favourites and they will appear here." />}
      <OrderTotal subtotal={subtotal} />
      <PrimaryButton label={`Checkout  ·  ${money(subtotal)}`} onPress={onCheckout} disabled={!items.length} />
    </ScreenScroll>
  );
}

function Checkout({ subtotal, onBack, onPlaceOrder }: { subtotal: number; onBack: () => void; onPlaceOrder: () => void }) {
  return (
    <ScreenScroll>
      <PageHeader title="Checkout" onBack={onBack} />
      <CheckoutSection icon="PIN" title="Delivery address" action="Change"><Text style={styles.rowTitle}>Arjun Mehta</Text><Text style={styles.smallMuted}>24 Park View Road, Bengaluru 560001</Text></CheckoutSection>
      <CheckoutSection icon="PAY" title="Payment method" action="Change"><Text style={styles.rowTitle}>Visa ending 4242</Text><Text style={styles.smallMuted}>Your payment is secured and encrypted</Text></CheckoutSection>
      <CheckoutSection icon="BOX" title="Delivery option" action="Edit"><Text style={styles.rowTitle}>Standard delivery</Text><Text style={styles.smallMuted}>Arrives tomorrow · Free</Text></CheckoutSection>
      <OrderTotal subtotal={subtotal} />
      <PrimaryButton label={`Place order  ·  ${money(subtotal)}`} onPress={onPlaceOrder} />
    </ScreenScroll>
  );
}

function Orders() {
  return (
    <ScreenScroll>
      <Text style={styles.pageTitle}>Your orders</Text>
      <Text style={styles.body}>Track deliveries and revisit past purchases.</Text>
      <View style={styles.tabs}><Text style={styles.tabActive}>Active</Text><Text style={styles.tab}>Past orders</Text></View>
      <OrderCard title="Arriving tomorrow" code="#SMN2048" products={[products[0], products[2]]} active />
      <OrderCard title="Delivered on 24 May" code="#SMN1976" products={[products[5]]} />
    </ScreenScroll>
  );
}

function Profile() {
  return (
    <ScreenScroll>
      <Text style={styles.pageTitle}>Your profile</Text>
      <View style={styles.profileCard}><View style={styles.avatar}><Text style={styles.avatarText}>AM</Text></View><View style={styles.flex}><Text style={styles.profileName}>Arjun Mehta</Text><Text style={styles.smallMuted}>arjun@example.com</Text><Text style={styles.member}>GOLD MEMBER</Text></View><Text style={styles.arrow}>›</Text></View>
      <Text style={styles.profileLabel}>ACCOUNT</Text>
      <ProfileRow icon="PIN" title="Saved addresses" subtitle="Home, work, and more" />
      <ProfileRow icon="PAY" title="Payments" subtitle="Cards, UPI, and wallets" />
      <ProfileRow icon="♡" title="Wishlist" subtitle="12 saved products" />
      <Text style={styles.profileLabel}>SUPPORT</Text>
      <ProfileRow icon="?" title="Help centre" subtitle="Orders, refunds, and support" />
      <ProfileRow icon="SET" title="Settings" subtitle="Notifications and privacy" />
      <Text style={styles.signOut}>Sign out</Text>
    </ScreenScroll>
  );
}

function SearchBar({ placeholder = "Search products, brands, and more" }: { placeholder?: string }) {
  return <View style={styles.searchShell}><View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><TextInput style={styles.searchInput} placeholder={placeholder} placeholderTextColor={palette.muted} /><Text style={styles.mic}>MIC</Text></View></View>;
}

function CategoryChip({ name, icon, onPress }: { name: string; icon: string; onPress: () => void }) {
  return <Pressable style={styles.chip} onPress={onPress}><Text style={styles.chipIcon}>{icon}</Text><Text style={styles.chipText}>{name}</Text></Pressable>;
}

function MarketplaceSection({ title, action, onPress, children }: { title: string; action: string; onPress: () => void; children: ReactNode }) {
  return <View><SectionHeader title={title} action={action} onPress={onPress} />{children}</View>;
}

function CompactProduct({ product, onPress }: { product: Product; onPress: () => void }) {
  return <Pressable style={styles.compactProduct} onPress={onPress}><Image source={{ uri: product.image }} style={styles.compactImage} /><Text style={styles.compactName} numberOfLines={2}>{product.name}</Text><Text style={styles.compactPrice}>{money(product.price)}</Text></Pressable>;
}

function VendorCard({ name, icon, rating, color }: { name: string; icon: string; rating: string; color: string }) {
  return <Pressable style={styles.vendorCard}><View style={[styles.vendorLogo, { backgroundColor: color }]}><Text style={styles.vendorLogoText}>{icon}</Text></View><Text style={styles.vendorName}>{name}</Text><Text style={styles.vendorRating}>STAR {rating}</Text></Pressable>;
}

function ProductCard({ product, onPress, width }: { product: Product; onPress: () => void; width?: number }) {
  return (
    <Pressable style={[styles.productCard, width ? { width } : undefined]} onPress={onPress}>
      <View><Image source={{ uri: product.image }} style={styles.productImage} /><Text style={styles.heart}>♡</Text>{product.badge && <Text style={styles.badge}>{product.badge}</Text>}</View>
      <View style={styles.productCopy}><Text style={styles.productCategory}>{product.category}</Text><Text style={styles.productName} numberOfLines={2}>{product.name}</Text><View style={styles.ratingLine}><Text style={styles.ratingSmall}>★ {product.rating}</Text><Text style={styles.reviewCount}>({product.reviews})</Text></View><View style={styles.priceLine}><Text style={styles.productPrice}>{money(product.price)}</Text><Text style={styles.oldPriceSmall}>{money(product.oldPrice)}</Text></View><Text style={styles.discount}>{discount(product)}% off</Text><Text style={styles.delivery}>Free delivery · {product.delivery}</Text></View>
    </Pressable>
  );
}

function CartItem({ product, onRemove }: { product: Product; onRemove: () => void }) {
  return <View style={styles.cartItem}><Image source={{ uri: product.image }} style={styles.cartImage} /><View style={styles.flex}><Text style={styles.productCategory}>{product.category}</Text><Text style={styles.rowTitle} numberOfLines={2}>{product.name}</Text><Text style={styles.productPrice}>{money(product.price)}</Text><View style={styles.cartFooter}><Text style={styles.quantity}>−   1   +</Text><Text style={styles.remove} onPress={onRemove}>Remove</Text></View></View></View>;
}

function OrderTotal({ subtotal }: { subtotal: number }) {
  return <View style={styles.total}><View style={styles.between}><Text style={styles.smallMuted}>Subtotal</Text><Text style={styles.rowTitle}>{money(subtotal)}</Text></View><View style={styles.between}><Text style={styles.smallMuted}>Delivery</Text><Text style={styles.green}>Free</Text></View><View style={styles.divider} /><View style={styles.between}><Text style={styles.rowTitle}>Total</Text><Text style={styles.totalPrice}>{money(subtotal)}</Text></View></View>;
}

function OrderCard({ title, code, products: items, active }: { title: string; code: string; products: Product[]; active?: boolean }) {
  return <View style={styles.orderCard}><View style={styles.between}><Text style={styles.eyebrow}>{code}</Text><Text style={active ? styles.statusActive : styles.statusDelivered}>{active ? "IN TRANSIT" : "DELIVERED"}</Text></View><Text style={[styles.rowTitle, styles.orderTitle]}>{title}</Text><View style={styles.orderImages}>{items.map((item) => <Image key={item.id} source={{ uri: item.image }} style={styles.orderImage} />)}</View>{active && <View style={styles.progress}><View style={styles.progressDone} /></View>}<Pressable style={styles.track}><Text style={styles.trackText}>{active ? "Track order" : "View order details"}</Text></Pressable></View>;
}

function CheckoutSection({ icon, title, action, children }: { icon: string; title: string; action: string; children: ReactNode }) {
  return <View style={styles.checkoutCard}><View style={styles.checkoutHeader}><View style={styles.checkoutIcon}><Text style={styles.checkoutIconText}>{icon}</Text></View><Text style={styles.rowTitle}>{title}</Text><Text style={[styles.link, styles.flexEnd]}>{action}</Text></View><View style={styles.checkoutBody}>{children}</View></View>;
}

function ProfileRow({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return <Pressable style={styles.profileRow}><View style={styles.profileIcon}><Text style={styles.profileIconText}>{icon}</Text></View><View style={styles.flex}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.smallMuted}>{subtitle}</Text></View><Text style={styles.arrow}>›</Text></Pressable>;
}

function PageHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: string }) {
  return <View style={styles.pageHeader}><Pressable style={styles.roundButton} onPress={onBack}><Text style={styles.roundButtonText}>‹</Text></Pressable><Text style={styles.headerTitle}>{title}</Text>{action ? <Text style={styles.headerAction}>{action}</Text> : <View style={styles.headerSpacer} />}</View>;
}

function SectionHeader({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.link} onPress={onPress}>{action}</Text></View>;
}

function Field({ label, placeholder, secure }: { label: string; placeholder: string; secure?: boolean }) {
  return <View><Text style={styles.fieldLabel}>{label}</Text><TextInput style={styles.field} placeholder={placeholder} placeholderTextColor={palette.muted} secureTextEntry={secure} /></View>;
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable style={[styles.primaryButton, disabled && styles.disabled]} onPress={onPress} disabled={disabled}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.empty}><Text style={styles.emptyIcon}>BAG</Text><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.body}>{subtitle}</Text></View>;
}

function SafeLayout({ children }: { children: ReactNode }) {
  return <SafeAreaView style={styles.safe}>{children}</SafeAreaView>;
}

function ScreenScroll({ children }: { children: ReactNode; sticky?: boolean }) {
  return <ScreenShell>{children}</ScreenShell>;
}

function ScreenShell({ children, contentContainerStyle }: { children: ReactNode; contentContainerStyle?: object }) {
  return (
    <View style={styles.screenShell}>
      <ExpoStatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.screen, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function BottomNav({ screen, count, onNavigate }: { screen: Screen; count: number; onNavigate: (screen: Screen) => void }) {
  const nav = [["HM", "Home", "home"], ["SH", "Shop", "categories"], ["BG", "Cart", "cart"], ["BX", "Orders", "orders"], ["ME", "Profile", "profile"]] as const;
  return <View style={styles.bottomNav}>{nav.map(([icon, label, target]) => <Pressable key={target} hitSlop={10} style={styles.navItem} onPress={() => onNavigate(target)}><View><Text style={[styles.navIcon, screen === target && styles.navActive]}>{icon}</Text>{target === "cart" && count > 0 && <Text style={styles.cartCount}>{count}</Text>}</View><Text style={[styles.navLabel, screen === target && styles.navActive]}>{label}</Text>{screen === target && <View style={styles.navIndicator} />}</Pressable>)}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: Platform.OS === "android" ? SAFE_TOP : 0, backgroundColor: palette.cream }, screenShell: { flex: 1, backgroundColor: palette.cream },
  flex: { flex: 1 }, flexEnd: { marginLeft: "auto" }, between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, alignRight: { textAlign: "right" },
  splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.cream }, brandMark: { width: 72, height: 72, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: palette.black, marginBottom: 16 }, brandMarkText: { color: palette.goldPale, fontSize: 38, fontWeight: "700" }, logo: { color: palette.black, fontSize: 24, fontWeight: "700" }, splashTag: { color: palette.muted, fontSize: 12, marginTop: 8 },
  onboarding: { flex: 1, justifyContent: "space-between", paddingHorizontal: 22 }, onboardingVisual: { height: "43%", overflow: "hidden", borderRadius: 30, backgroundColor: palette.sand }, fillImage: { width: "100%", height: "100%" }, floatingNote: { position: "absolute", left: 14, bottom: 14, flexDirection: "row", gap: 8, alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.94)" }, noteText: { color: palette.black, fontSize: 12, fontWeight: "600" }, onboardingTitle: { color: palette.black, fontSize: 24, lineHeight: 30, fontWeight: "700" }, dots: { color: palette.gold, textAlign: "center", marginVertical: 12, letterSpacing: 4 },
  auth: { gap: 14, paddingHorizontal: 24 }, authIntro: { gap: 7, marginTop: 58, marginBottom: 8 }, authTitle: { color: palette.black, fontSize: 24, lineHeight: 30, fontWeight: "700" }, fieldLabel: { color: palette.black, fontSize: 12, fontWeight: "600", marginBottom: 7 }, field: { height: 54, paddingHorizontal: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 16, color: palette.black, backgroundColor: palette.white }, google: { height: 54, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: palette.white }, googleText: { color: palette.black, fontSize: 14, fontWeight: "600" }, switchText: { color: palette.muted, textAlign: "center", fontSize: 12 },
  screen: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 16, paddingBottom: BOTTOM_NAV_HEIGHT + BOTTOM_SAFE_SPACE + 24, backgroundColor: palette.cream }, screenCompact: { paddingHorizontal: 12 }, body: { color: palette.muted, fontSize: 14, lineHeight: 21 }, smallMuted: { color: palette.muted, fontSize: 12, lineHeight: 18 }, tinyMuted: { color: palette.muted, fontSize: 12, lineHeight: 16 }, link: { color: palette.gold, fontSize: 14, fontWeight: "600" }, gold: { color: palette.gold, fontSize: 12, fontWeight: "700" }, green: { color: palette.green, fontSize: 14, fontWeight: "600" }, eyebrow: { color: palette.muted, fontSize: 12, fontWeight: "600" }, pageTitle: { color: palette.black, fontSize: 24, lineHeight: 30, fontWeight: "700" }, homeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }, marketHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 9 }, avatarSmall: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: palette.black }, avatarSmallText: { color: palette.goldPale, fontSize: 12, fontWeight: "700" },
  searchShell: { paddingBottom: 12, backgroundColor: palette.cream }, search: { height: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white }, searchIcon: { color: palette.black, fontSize: 26, lineHeight: 28 }, searchInput: { flex: 1, color: palette.black, fontSize: 14 }, mic: { color: palette.gold, fontSize: 12, fontWeight: "600" },
  searchDock: { marginHorizontal: -14, paddingHorizontal: 14, backgroundColor: palette.cream }, location: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, marginBottom: 8 }, locationIcon: { color: palette.gold, fontSize: 12, fontWeight: "600" }, locationLabel: { color: palette.black, fontSize: 12, fontWeight: "600" }, locationText: { color: palette.muted, fontSize: 12, marginTop: 1 }, chevron: { color: palette.muted, fontSize: 15, fontWeight: "600" }, aiPill: { flexDirection: "row", alignItems: "center", gap: 10, padding: 9, borderRadius: 15, backgroundColor: palette.goldPale, marginBottom: 11 }, aiBadge: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: palette.white }, aiBadgeText: { color: palette.gold, fontSize: 12, fontWeight: "700" }, aiTitle: { color: palette.black, fontSize: 14, fontWeight: "600" }, arrow: { color: palette.muted, fontSize: 29, lineHeight: 30 }, horizontal: { marginBottom: 13 }, chip: { height: 39, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 10, marginRight: 8, borderWidth: 1, borderColor: palette.line, borderRadius: 20, backgroundColor: palette.white }, chipIcon: { color: palette.gold, fontSize: 12, fontWeight: "600" }, chipText: { color: palette.black, fontSize: 12, fontWeight: "600" },
  categoryRail: { gap: 7, paddingBottom: 12 }, categoryBubble: { width: 59, alignItems: "center", gap: 5 }, categoryCircle: { width: 50, height: 50, alignItems: "center", justifyContent: "center", borderRadius: 25 }, categoryCircleText: { color: palette.black, fontSize: 12, fontWeight: "700" }, categoryBubbleText: { color: palette.black, fontSize: 12, fontWeight: "600" }, offerRail: { gap: 10 }, offer: { height: 142, flexDirection: "row", overflow: "hidden", borderRadius: 17, padding: 15 }, offerKicker: { color: palette.gold, fontSize: 12, fontWeight: "600" }, offerTitle: { color: palette.black, fontSize: 20, lineHeight: 24, fontWeight: "700", marginTop: 7 }, offerAction: { color: palette.black, fontSize: 12, fontWeight: "600", marginTop: 10 }, offerImage: { width: 112, height: 142, marginVertical: -15, marginRight: -15 },
  hero: { height: 215, overflow: "hidden", borderRadius: 25, backgroundColor: palette.black }, heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.46)" }, heroCopy: { position: "absolute", left: 18, top: 18 }, heroKicker: { color: palette.goldPale, fontSize: 12, fontWeight: "600" }, heroTitle: { color: palette.white, fontSize: 24, lineHeight: 30, fontWeight: "700", marginTop: 8 }, heroBody: { color: palette.white, fontSize: 14, marginTop: 7 }, heroButton: { alignSelf: "flex-start", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, backgroundColor: palette.white, marginTop: 15 }, heroButtonText: { color: palette.black, fontSize: 12, fontWeight: "600" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 12 }, sectionTitle: { color: palette.black, fontSize: 20, fontWeight: "700" }, sectionSpacing: { marginTop: 20 }, categoryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 9 }, categoryMini: { width: "48.5%", minHeight: 72, flexDirection: "row", alignItems: "center", gap: 9, padding: 9, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white }, categoryIcon: { width: 39, height: 39, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: palette.sand }, categoryIconText: { color: palette.gold, fontSize: 12, fontWeight: "700" }, categoryTitle: { color: palette.black, fontSize: 14, fontWeight: "600" },
  pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }, roundButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 19, backgroundColor: palette.white }, roundButtonText: { color: palette.black, fontSize: 30, lineHeight: 31, marginTop: -4 }, headerTitle: { maxWidth: "70%", flexShrink: 1, color: palette.black, fontSize: 24, fontWeight: "700" }, headerAction: { width: 38, color: palette.black, textAlign: "center", fontSize: 26 }, headerSpacer: { width: 38 }, categoryList: { gap: 10, marginTop: 18 }, categoryRow: { minHeight: 80, flexDirection: "row", alignItems: "center", gap: 13, padding: 10, borderWidth: 1, borderColor: palette.line, borderRadius: 19, backgroundColor: palette.white }, categoryLargeIcon: { width: 57, height: 57, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: palette.sand }, categoryLargeIconGold: { backgroundColor: palette.goldPale }, categoryLargeText: { color: palette.gold, fontSize: 12, fontWeight: "700" }, rowTitle: { color: palette.black, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  filter: { height: 35, justifyContent: "center", paddingHorizontal: 12, marginRight: 7, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white }, filterText: { color: palette.black, fontSize: 12, fontWeight: "600" }, gridTop: { marginTop: 12 }, productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 }, productRail: { gap: 10 }, productCard: { width: "48.5%", overflow: "hidden", borderWidth: 1, borderColor: palette.line, borderRadius: 13, backgroundColor: palette.white }, productImage: { width: "100%", height: 126, backgroundColor: palette.sand }, productCopy: { padding: 8 }, heart: { position: "absolute", right: 6, top: 6, width: 25, height: 25, overflow: "hidden", color: palette.black, textAlign: "center", lineHeight: 23, fontSize: 17, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.92)" }, badge: { position: "absolute", left: 6, bottom: 6, overflow: "hidden", paddingHorizontal: 5, paddingVertical: 3, color: palette.gold, fontSize: 12, fontWeight: "700", borderRadius: 7, backgroundColor: palette.goldPale }, productCategory: { color: palette.muted, fontSize: 12, marginBottom: 2 }, productName: { minHeight: 34, color: palette.black, fontSize: 14, lineHeight: 17, fontWeight: "600" }, ratingLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }, rating: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, color: palette.white, fontSize: 12, fontWeight: "700", borderRadius: 8, backgroundColor: palette.green }, ratingSmall: { overflow: "hidden", paddingHorizontal: 5, paddingVertical: 2, color: palette.white, fontSize: 12, fontWeight: "700", borderRadius: 7, backgroundColor: palette.green }, reviewCount: { color: palette.muted, fontSize: 12 }, priceLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 }, productPrice: { color: palette.black, fontSize: 14, fontWeight: "700" }, oldPrice: { color: palette.muted, fontSize: 14, textDecorationLine: "line-through" }, oldPriceSmall: { color: palette.muted, fontSize: 12, textDecorationLine: "line-through" }, discount: { color: palette.green, fontSize: 12, fontWeight: "700", marginTop: 2 }, delivery: { color: palette.muted, fontSize: 12, marginTop: 4 },
  compactRail: { gap: 9 }, compactProduct: { width: 104, padding: 6, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.white }, compactImage: { width: "100%", height: 78, borderRadius: 8, backgroundColor: palette.sand }, compactName: { minHeight: 30, color: palette.black, fontSize: 12, lineHeight: 15, fontWeight: "600", marginTop: 5 }, compactPrice: { color: palette.black, fontSize: 14, fontWeight: "700", marginTop: 3 }, vendorRail: { gap: 9 }, vendorCard: { width: 112, alignItems: "center", padding: 10, borderWidth: 1, borderColor: palette.line, borderRadius: 13, backgroundColor: palette.white }, vendorLogo: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24 }, vendorLogoText: { color: palette.black, fontSize: 12, fontWeight: "700" }, vendorName: { color: palette.black, fontSize: 12, fontWeight: "600", marginTop: 7 }, vendorRating: { color: palette.green, fontSize: 12, fontWeight: "600", marginTop: 3 },
  detailImage: { width: "100%", height: 342, borderRadius: 24, backgroundColor: palette.sand }, detailTitle: { color: palette.black, fontSize: 24, lineHeight: 30, fontWeight: "700", marginTop: 5 }, detailPrice: { color: palette.black, fontSize: 24, fontWeight: "700" }, deliveryCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 12, borderRadius: 16, backgroundColor: palette.greenPale, marginVertical: 16 }, deliveryIcon: { color: palette.green, fontSize: 12, fontWeight: "700" }, deliveryTitle: { color: palette.green, fontSize: 14, fontWeight: "600" }, sizeRow: { flexDirection: "row", gap: 9, marginTop: 11 }, size: { width: 45, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 13, backgroundColor: palette.white }, sizeActive: { borderColor: palette.black, backgroundColor: palette.black }, sizeText: { color: palette.black, fontSize: 14, fontWeight: "600" }, sizeTextActive: { color: palette.white }, actionRow: { flexDirection: "row", gap: 9, marginTop: 20 }, outlineButton: { flex: 1, height: 52, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.black, borderRadius: 16 }, outlineText: { color: palette.black, fontSize: 14, fontWeight: "600" }, darkButton: { flex: 1, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: palette.black }, darkButtonText: { color: palette.white, fontSize: 14, fontWeight: "600" },
  deliveryBanner: { flexDirection: "row", alignItems: "center", gap: 9, padding: 11, borderRadius: 15, backgroundColor: palette.greenPale, marginVertical: 14 }, cartItem: { flexDirection: "row", gap: 12, padding: 11, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white, marginBottom: 10 }, cartImage: { width: 92, height: 110, borderRadius: 13, backgroundColor: palette.sand }, cartFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }, quantity: { overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, color: palette.black, fontSize: 12, fontWeight: "600", borderRadius: 10, backgroundColor: palette.sand }, remove: { color: palette.red, fontSize: 12, fontWeight: "600" }, total: { gap: 11, padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white, marginTop: 13, marginBottom: 6 }, divider: { height: 1, backgroundColor: palette.line }, totalPrice: { color: palette.black, fontSize: 20, fontWeight: "700" },
  primaryButton: { minHeight: 55, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderRadius: 17, backgroundColor: palette.black, marginVertical: 6 }, primaryButtonText: { color: palette.white, fontSize: 14, fontWeight: "600" }, disabled: { opacity: 0.35 }, checkoutCard: { padding: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white, marginBottom: 10 }, checkoutHeader: { flexDirection: "row", alignItems: "center", gap: 9 }, checkoutIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: palette.sand }, checkoutIconText: { color: palette.gold, fontSize: 12, fontWeight: "600" }, checkoutBody: { gap: 3, paddingLeft: 43, paddingTop: 8 },
  tabs: { flexDirection: "row", gap: 22, marginTop: 19, borderBottomWidth: 1, borderBottomColor: palette.line }, tab: { color: palette.muted, fontSize: 14, fontWeight: "600", paddingBottom: 10 }, tabActive: { color: palette.black, fontSize: 14, fontWeight: "700", paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: palette.gold }, orderCard: { padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 18, backgroundColor: palette.white, marginTop: 13 }, orderTitle: { marginTop: 9 }, statusActive: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, color: palette.gold, fontSize: 12, fontWeight: "700", borderRadius: 9, backgroundColor: palette.goldPale }, statusDelivered: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, color: palette.green, fontSize: 12, fontWeight: "700", borderRadius: 9, backgroundColor: palette.greenPale }, orderImages: { flexDirection: "row", gap: 7, marginTop: 10 }, orderImage: { width: 52, height: 56, borderRadius: 10 }, progress: { height: 5, overflow: "hidden", borderRadius: 3, backgroundColor: palette.line, marginTop: 14 }, progressDone: { width: "68%", height: 5, borderRadius: 3, backgroundColor: palette.gold }, track: { minHeight: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 13, marginTop: 13 }, trackText: { color: palette.black, fontSize: 12, fontWeight: "600" },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 13, padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 19, backgroundColor: palette.white, marginTop: 15 }, avatar: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 29, backgroundColor: palette.black }, avatarText: { color: palette.goldPale, fontSize: 16, fontWeight: "700" }, profileName: { color: palette.black, fontSize: 20, fontWeight: "700" }, member: { color: palette.gold, fontSize: 12, fontWeight: "600", marginTop: 5 }, profileLabel: { color: palette.muted, fontSize: 12, fontWeight: "600", marginTop: 22, marginBottom: 6 }, profileRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.line }, profileIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: palette.white }, profileIconText: { color: palette.gold, fontSize: 12, fontWeight: "600" }, signOut: { color: palette.red, fontSize: 14, fontWeight: "600", marginTop: 24 },
  empty: { minHeight: 190, alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 20 }, emptyIcon: { color: palette.gold, fontSize: 12, fontWeight: "700" }, bottomNav: { position: "absolute", left: 0, right: 0, bottom: BOTTOM_SAFE_SPACE, height: BOTTOM_NAV_HEIGHT, zIndex: 100, flexDirection: "row", alignItems: "center", paddingTop: 8, paddingBottom: 8, borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: palette.white }, navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 }, navIcon: { color: palette.muted, textAlign: "center", fontSize: 12, lineHeight: 14, fontWeight: "600" }, navLabel: { color: palette.muted, fontSize: 12, fontWeight: "600" }, navActive: { color: palette.black }, navIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.gold }, cartCount: { position: "absolute", top: -7, right: -12, width: 15, height: 15, overflow: "hidden", color: palette.white, textAlign: "center", lineHeight: 15, fontSize: 9, fontWeight: "700", borderRadius: 8, backgroundColor: palette.red },
});
