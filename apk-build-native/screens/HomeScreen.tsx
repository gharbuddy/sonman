import { useState } from "react";
import type { UserProfile } from "@sonman/auth-service";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { CustomerProduct as Product } from "../products";
import { initials, type CustomerAddress } from "../profile";
import {
  categories,
  CompactProduct,
  Empty,
  filterProducts,
  ScreenScroll,
  ScreenShell,
  SectionHeader,
  styles,
  vendors,
  VendorCard,
} from "../shared";
import { SearchBar } from "../components/SearchBar";
import { ProductCard } from "../components/ProductCard";
import { PageHeader } from "../components/Header";
import { categoryIcons, iconColors, iconSizes, SonmanIcon, type SonmanIconName } from "../src/theme/icons";

const INK = "#101014";
const SOFT_INK = "#50535B";
const MUTED = "#8B909B";
const BLUE = "#1378FF";
const BLUE_DARK = "#075BDD";
const LIME = "#D9FF19";
const WHITE = "#FFFFFF";
const BG = "#F7F8FB";
const CARD = "#FFFFFF";
const LINE = "#E3E7EF";
const PALE_BLUE = "#EAF3FF";
const PALE_GREEN = "#ECFFF7";
const PALE_YELLOW = "#FFF8D9";
const PALE_PINK = "#FFF0F4";

const quickTiles = [
  ["Deals", "Flash prices", "offer", PALE_YELLOW],
  ["Essentials", "Daily needs", "grocery", PALE_GREEN],
  ["New", "Fresh arrivals", "sparkle", PALE_BLUE],
  ["Premium", "Top picks", "secureCheckout", PALE_PINK],
] as const;

export function HomeScreen({
  profile,
  address,
  products,
  productsError,
  wishlist,
  onWishlist,
  onProfile,
  onAddresses,
  onCategories,
  onListing,
  onProduct,
}: {
  profile?: UserProfile;
  address?: CustomerAddress;
  products: Product[];
  productsError: string;
  wishlist: string[];
  onWishlist: (id: string) => void;
  onProfile: () => void;
  onAddresses: () => void;
  onCategories: () => void;
  onListing: (category?: string) => void;
  onProduct: (product: Product) => void;
}) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const contentWidth = width - 32;
  const cardWidth = Math.floor((contentWidth - 12) / 2);
  const visible = filterProducts(products, query);
  const heroProduct = visible[0] ?? products[0];
  const pincode = address?.postalCode || "192232";
  const avatarText = initials(profile?.full_name ?? "") || "C";

  return (
    <ScreenShell contentContainerStyle={[styles.homeScreen, homeStyles.screen]}>
      <View style={homeStyles.topHeader}>
        <View>
          <Text style={homeStyles.logo}>Sonman</Text>
          <Text style={homeStyles.tagline}>Shop smart. Save more.</Text>
        </View>
        <Pressable style={homeStyles.avatarOuter} onPress={onProfile}>
          <View style={homeStyles.avatarMiddle}>
            <View style={homeStyles.avatarInner}>
              <Text style={homeStyles.avatarText}>{avatarText}</Text>
            </View>
          </View>
        </Pressable>
      </View>

      <Pressable style={homeStyles.deliveryCard} onPress={onAddresses}>
        <View style={homeStyles.pinCircle}>
          <SonmanIcon name="location" size={iconSizes.action} color={BLUE_DARK} weight="fill" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={homeStyles.deliveryLabel}>Delivering to</Text>
          <Text style={homeStyles.deliveryPincode}>{pincode}</Text>
        </View>
        <View style={homeStyles.dropCircle}>
          <SonmanIcon name="chevronDown" size={16} color={INK} weight="regular" />
        </View>
      </Pressable>

      <SearchBar
        placeholder="Search products"
        value={query}
        onChange={setQuery}
        suggestions={products.map((product) => product.name)}
        onSubmit={(searchValue) => onListing(searchValue.trim() || undefined)}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.quickRail}>
        {quickTiles.map(([title, subtitle, icon, color]) => (
          <Pressable key={title} style={[homeStyles.quickTile, { backgroundColor: color }]} onPress={() => onListing(title)}>
            <SonmanIcon name={icon as SonmanIconName} size={30} color={iconColors.action} weight="duotone" />
            <Text style={homeStyles.quickTitle}>{title}</Text>
            <Text style={homeStyles.quickSub}>{subtitle}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.heroRail}>
        <Pressable style={homeStyles.heroCard} onPress={() => (heroProduct ? onProduct(heroProduct) : onListing())}>
          <View style={homeStyles.heroTextBox}>
            <Text style={homeStyles.heroKicker}>Sonman 2026</Text>
            <Text style={homeStyles.heroTitle}>Big deals are live</Text>
            <Text style={homeStyles.heroBody} numberOfLines={2}>Daily essentials, gadgets, fashion, and home needs.</Text>
            <View style={homeStyles.heroButton}>
              <Text style={homeStyles.heroButtonText}>Shop now</Text>
            </View>
          </View>
          {!!heroProduct?.image && <Image source={{ uri: heroProduct.image }} style={homeStyles.heroImage} />}
        </Pressable>

        <Pressable style={[homeStyles.heroCard, homeStyles.heroCardBlue]} onPress={() => onListing("New")}> 
          <View style={homeStyles.heroTextBox}>
            <Text style={homeStyles.heroKicker}>Fresh view</Text>
            <Text style={homeStyles.heroTitle}>New picks for you</Text>
            <Text style={homeStyles.heroBody} numberOfLines={2}>Browse selected products made for your daily shopping.</Text>
            <View style={homeStyles.darkButton}>
              <Text style={homeStyles.darkButtonText}>Explore</Text>
            </View>
          </View>
          {!!heroProduct?.image && <Image source={{ uri: heroProduct.image }} style={homeStyles.heroImage} />}
        </Pressable>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.categoryLine}>
        {categories.map(([name, , subtitle]) => (
          <Pressable key={name} style={homeStyles.categoryPill} onPress={() => (name === "More" ? onCategories() : onListing(name))}>
            <View style={homeStyles.categoryIconWrap}>
              <SonmanIcon name={categoryIcons[name] ?? "categories"} size={iconSizes.category} color={iconColors.action} weight="duotone" />
            </View>
            <Text style={homeStyles.categoryName} numberOfLines={1}>{name}</Text>
            <Text style={homeStyles.categoryMini} numberOfLines={1}>{subtitle}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <SectionHeader title="Trending now" action="View all" onPress={() => onListing("Trending")} />
      <View style={homeStyles.productGrid}>
        {visible.slice(0, 6).map((product) => (
          <ProductCard key={product.id} product={product} width={cardWidth} saved={wishlist.includes(product.id)} onWishlist={() => onWishlist(product.id)} onPress={() => onProduct(product)} />
        ))}
      </View>

      {!visible.length && (
        <Empty
          title={productsError ? "Products unavailable" : query ? "No products found" : "Products loading"}
          subtitle={productsError || (query ? "Try another search or browse categories." : "Products will appear here shortly.")}
        />
      )}

      <SectionHeader title="Recommended for you" action="Explore" onPress={() => onListing("Recommended")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.compactRail}>
        {visible.slice(0, 8).map((product) => (
          <CompactProduct key={`recommended-${product.id}`} product={product} onPress={() => onProduct(product)} />
        ))}
      </ScrollView>

      <SectionHeader title="Top sellers" action="View all" onPress={() => onListing("Top sellers")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.compactRail}>
        {[...visible].sort((a, b) => b.reviews - a.reviews).slice(0, 8).map((product) => (
          <CompactProduct key={`top-${product.id}`} product={product} onPress={() => onProduct(product)} />
        ))}
      </ScrollView>

      {!!vendors.length && (
        <>
          <SectionHeader title="Featured sellers" action="Discover" onPress={() => onListing("Local stores")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.compactRail}>
            {vendors.map(([name, icon, rating, color]) => (
              <VendorCard key={name} name={name} icon={icon} rating={rating} color={color} />
            ))}
          </ScrollView>
        </>
      )}

      <View style={[homeStyles.productGrid, homeStyles.finalGrid]}>
        {[...visible].reverse().slice(0, 6).map((product) => (
          <ProductCard key={`more-${product.id}`} product={product} width={cardWidth} saved={wishlist.includes(product.id)} onWishlist={() => onWishlist(product.id)} onPress={() => onProduct(product)} />
        ))}
      </View>
    </ScreenShell>
  );
}

export function CategoriesScreen({ onBack, onCategory }: { onBack: () => void; onCategory: (category: string) => void }) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const visibleCategories = term
    ? categories.filter(([name, , subtitle]) => `${name} ${subtitle}`.toLowerCase().includes(term))
    : categories;

  return (
    <ScreenScroll sticky contentContainerStyle={{ backgroundColor: BG, paddingHorizontal: 16 }}>
      <PageHeader title="Categories" onBack={onBack} />
      <SearchBar
        placeholder="Search categories"
        value={query}
        onChange={setQuery}
        suggestions={categories.map(([name]) => name)}
      />
      <Text style={homeStyles.archiveIntro}>Browse every Sonman department.</Text>
      <View style={homeStyles.categoryList}>
        {visibleCategories.map(([name, , subtitle]) => (
          <Pressable key={name} style={homeStyles.categoryRow} onPress={() => onCategory(name)}>
            <View style={homeStyles.categoryRowMark}>
              <SonmanIcon name={categoryIcons[name] ?? "categories"} size={iconSizes.category} color={iconColors.action} weight="duotone" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={homeStyles.categoryRowTitle}>{name}</Text>
              <Text style={homeStyles.categoryRowSubtitle}>{subtitle}</Text>
            </View>
            <Text style={homeStyles.rowArrow}>Open</Text>
          </Pressable>
        ))}
      </View>
      {!visibleCategories.length && <Empty title="No categories found" subtitle="Try a different search." />}
    </ScreenScroll>
  );
}

export function ListingScreen({
  products,
  category,
  wishlist,
  onWishlist,
  onBack,
  onProduct,
}: {
  products: Product[];
  category: string;
  wishlist: string[];
  onWishlist: (id: string) => void;
  onBack: () => void;
  onProduct: (product: Product) => void;
}) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [popular, setPopular] = useState(false);
  const [fastDelivery, setFastDelivery] = useState(false);
  const [topRated, setTopRated] = useState(false);

  const contentWidth = width - 32;
  const cardWidth = Math.floor((contentWidth - 12) / 2);
  const inCategory = categories.some(([name]) => name === category) ? products.filter((product) => product.category === category) : products;
  const visible = filterProducts(inCategory, query)
    .filter((product) => !fastDelivery || product.deliverySize === "small")
    .sort((a, b) => topRated ? b.rating - a.rating : popular ? b.reviews - a.reviews || b.rating - a.rating : 0);

  const chips = [
    ["Filters", showFilters, () => setShowFilters((current) => !current)],
    ["Popular", popular, () => setPopular((current) => !current)],
    ["Fast delivery", fastDelivery, () => setFastDelivery((current) => !current)],
    ["Top rated", topRated, () => setTopRated((current) => !current)],
  ] as const;

  return (
    <ScreenScroll sticky contentContainerStyle={{ backgroundColor: BG, paddingHorizontal: 16 }}>
      <PageHeader title={category} onBack={onBack} />
      <SearchBar placeholder={`Search ${category.toLowerCase()}`} value={query} onChange={setQuery} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.filterRail}>
        {chips.map(([item, active, onPress]) => (
          <Pressable
            key={item}
            style={[homeStyles.filterChip, active && homeStyles.filterChipActive]}
            onPress={onPress}
          >
            <Text style={[homeStyles.filterText, active && homeStyles.filterTextActive]}>{item}</Text>
            {active && <View style={homeStyles.activeDot} />}
          </Pressable>
        ))}
      </ScrollView>
      {showFilters && (
        <View style={homeStyles.filterPanel}>
          <Text style={homeStyles.filterTitle}>Refine products</Text>
          <Text style={homeStyles.filterBody}>Use delivery, popularity, and rating filters.</Text>
          <View style={homeStyles.filterActions}>
            <Text style={homeStyles.resetText} onPress={() => { setPopular(false); setFastDelivery(false); setTopRated(false); }}>Reset</Text>
            <Text style={homeStyles.applyText} onPress={() => setShowFilters(false)}>Apply</Text>
          </View>
        </View>
      )}
      <View style={homeStyles.listingCount}>
        <Text style={homeStyles.listingCountText}>{visible.length} products</Text>
        <Text style={homeStyles.listingCountText}>Grid view</Text>
      </View>
      <View style={[homeStyles.productGrid, homeStyles.finalGrid]}>
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} width={cardWidth} saved={wishlist.includes(product.id)} onWishlist={() => onWishlist(product.id)} onPress={() => onProduct(product)} />
        ))}
      </View>
      {!visible.length && <Empty title="No products found" subtitle="Try a different search or filter." />}
    </ScreenScroll>
  );
}

const homeStyles = StyleSheet.create({
  screen: { backgroundColor: BG, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },
  topHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  logo: { color: INK, fontSize: 30, lineHeight: 34, fontWeight: "900", letterSpacing: -1.3 },
  tagline: { color: SOFT_INK, fontSize: 12, fontWeight: "700", marginTop: 2 },
  avatarOuter: { width: 58, height: 58, borderRadius: 29, backgroundColor: "rgba(19,120,255,0.14)", alignItems: "center", justifyContent: "center", shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  avatarMiddle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(19,120,255,0.2)", alignItems: "center", justifyContent: "center" },
  avatarInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: BLUE, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: WHITE },
  avatarText: { color: WHITE, fontSize: 13, fontWeight: "900" },
  deliveryCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: WHITE, borderWidth: 1, borderColor: LINE, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  pinCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: PALE_BLUE, alignItems: "center", justifyContent: "center" },
  pinText: { color: BLUE_DARK, fontSize: 18, fontWeight: "900" },
  deliveryLabel: { color: MUTED, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  deliveryPincode: { color: INK, fontSize: 17, fontWeight: "900", marginTop: 1 },
  dropCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: BG, alignItems: "center", justifyContent: "center" },
  dropText: { color: INK, fontSize: 16, fontWeight: "900", marginTop: -3 },
  quickRail: { gap: 10, paddingBottom: 10 },
  quickTile: { width: 124, minHeight: 90, borderRadius: 18, borderWidth: 1, borderColor: LINE, padding: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  quickIcon: { fontSize: 24, marginBottom: 8 },
  quickTitle: { color: INK, fontSize: 14, fontWeight: "900" },
  quickSub: { color: SOFT_INK, fontSize: 11, fontWeight: "700", marginTop: 3 },
  heroRail: { gap: 12, paddingBottom: 12 },
  heroCard: { width: 310, height: 375, overflow: "hidden", borderRadius: 24, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  heroCardBlue: { backgroundColor: "#F0F7FF" },
  heroTextBox: { paddingHorizontal: 22, paddingTop: 24, zIndex: 2 },
  heroKicker: { color: BLUE, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  heroTitle: { color: INK, fontSize: 34, lineHeight: 36, fontWeight: "900", letterSpacing: -1.1, marginTop: 12 },
  heroBody: { color: SOFT_INK, fontSize: 15, lineHeight: 20, fontWeight: "700", marginTop: 12, maxWidth: 260 },
  heroButton: { alignSelf: "flex-start", marginTop: 14, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 24, backgroundColor: LIME },
  heroButtonText: { color: INK, fontSize: 13, fontWeight: "900" },
  darkButton: { alignSelf: "flex-start", marginTop: 14, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 24, backgroundColor: INK },
  darkButtonText: { color: WHITE, fontSize: 13, fontWeight: "900" },
  heroImage: { position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 190, resizeMode: "cover" },
  categoryLine: { gap: 8, paddingBottom: 14 },
  categoryPill: { width: 92, minHeight: 86, borderRadius: 17, backgroundColor: WHITE, borderWidth: 1, borderColor: LINE, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  categoryIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: BG, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  categoryIcon: { fontSize: 20 },
  categoryName: { color: INK, fontSize: 11, fontWeight: "900", textAlign: "center" },
  categoryMini: { color: MUTED, fontSize: 9, fontWeight: "700", marginTop: 2, textAlign: "center" },
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  compactRail: { gap: 12, paddingBottom: 8 },
  finalGrid: { marginBottom: 24 },
  archiveIntro: { color: SOFT_INK, fontSize: 13, lineHeight: 20, textAlign: "center", marginVertical: 16, fontWeight: "600" },
  categoryList: { gap: 10, marginBottom: 24 },
  categoryRow: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderWidth: 1, borderColor: LINE, borderRadius: 18, backgroundColor: WHITE },
  categoryRowMark: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: BG },
  categoryRowTitle: { color: INK, fontSize: 15, fontWeight: "900" },
  categoryRowSubtitle: { color: MUTED, fontSize: 12, marginTop: 3, fontWeight: "600" },
  rowArrow: { color: BLUE, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  filterRail: {
  gap: 10,
  paddingTop: 12,
  paddingBottom: 12,
},

filterChip: {
  height: 42,
  paddingHorizontal: 18,
  borderRadius: 24,
  backgroundColor: WHITE,
  borderWidth: 1,
  borderColor: "#DDE3EC",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
},

filterChipActive: {
  backgroundColor: BLUE,
  borderColor: BLUE,
},

filterText: {
  color: INK,
  fontSize: 13,
  fontWeight: "900",
},

filterTextActive: {
  color: WHITE,
},
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: WHITE, opacity: 0.95 },
  filterPanel: { padding: 16, borderWidth: 1, borderColor: LINE, borderRadius: 18, backgroundColor: WHITE, marginBottom: 12 },
  filterTitle: { color: INK, fontSize: 14, fontWeight: "900" },
  filterBody: { color: SOFT_INK, fontSize: 12, lineHeight: 18, marginTop: 5, fontWeight: "600" },
  filterActions: { flexDirection: "row", justifyContent: "flex-end", gap: 22, marginTop: 14 },
  resetText: { color: MUTED, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  applyText: { color: BLUE, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  listingCount: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 10, marginBottom: 10, borderBottomWidth: 1, borderColor: LINE },
  listingCountText: { color: SOFT_INK, fontSize: 12, fontWeight: "700" },
});
