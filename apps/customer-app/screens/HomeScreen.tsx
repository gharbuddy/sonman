import { useState } from "react";
import type { UserProfile } from "@sonman/auth-service";
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import type { CustomerProduct as Product } from "../products";
import { addressText, initials, type CustomerAddress } from "../profile";
import { categories, CompactProduct, Empty, filterProducts, offers, ScreenScroll, ScreenShell, SectionHeader, styles, vendors, VendorCard } from "../shared";
import { SearchBar } from "../components/SearchBar";
import { ProductCard } from "../components/ProductCard";
import { PageHeader } from "../components/Header";

export function HomeScreen({ profile, address, products, productsError, wishlist, onWishlist, onProfile, onAddresses, onCategories, onListing, onProduct }: { profile?: UserProfile; address?: CustomerAddress; products: Product[]; productsError: string; wishlist: string[]; onWishlist: (id: string) => void; onProfile: () => void; onAddresses: () => void; onCategories: () => void; onListing: (category?: string) => void; onProduct: (product: Product) => void }) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const contentWidth = width - 24;
  const cardWidth = Math.floor((contentWidth - 10) / 2);
  const visible = filterProducts(products, query);
  return (
    <ScreenShell contentContainerStyle={styles.homeScreen}>
      <View style={styles.appTopBar}>
        <Pressable style={styles.locationMini} onPress={onAddresses}>
          <Text style={styles.pinIcon}>⌖</Text>
          <View>
            <Text style={styles.deliverSmall}>{address ? `Deliver to ${address.postalCode}` : "Add delivery location"}</Text>
            <Text style={styles.deliverText} numberOfLines={1}>{address ? addressText(address) : "Kulgam, Jammu and Kashmir"}</Text>
          </View>
        </Pressable>
        <Pressable style={styles.profileIconBtn} onPress={onProfile}><Text style={styles.profileMiniText}>{initials(profile?.full_name ?? "") || "You"}</Text></Pressable>
      </View>
      <SearchBar value={query} onChange={setQuery} suggestions={products.map((product) => product.name)} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickCategoryRail}>
        {categories.map(([name, icon, , color]) => (
          <Pressable key={name} style={styles.quickCategory} onPress={() => name === "More" ? onCategories() : onListing(name)}>
            <View style={[styles.quickCategoryIcon, { backgroundColor: color }]}><Text style={styles.quickCategoryEmoji}>{icon}</Text></View>
            <Text style={styles.quickCategoryText} numberOfLines={2}>{name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled contentContainerStyle={styles.bannerRail}>
        {offers.map(([kicker, title, action, color], index) => (
          <Pressable key={title} style={[styles.bigBanner, { width: contentWidth, backgroundColor: color }]} onPress={() => onListing()}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerKicker}>{kicker}</Text>
              <Text style={styles.bannerTitle}>{title}</Text>
              <Text style={styles.bannerAction}>{action} ›</Text>
            </View>
            {!!visible[index]?.image && <Image source={{ uri: visible[index].image }} style={styles.bannerProductImage} />}
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.serviceStrip}>
        <Text style={styles.serviceItem}>🚚 Free delivery offers</Text>
        <Text style={styles.serviceItem}>🔁 Easy replacement</Text>
        <Text style={styles.serviceItem}>🔒 Secure prepaid</Text>
      </View>
      <SectionHeader title="Trending near you" action="See all" onPress={() => onListing("Trending")} />
      <View style={styles.productGrid}>{visible.slice(0, 6).map((product) => <ProductCard key={product.id} product={product} width={cardWidth} saved={wishlist.includes(product.id)} onWishlist={() => onWishlist(product.id)} onPress={() => onProduct(product)} />)}</View>
      {!visible.length && <Empty title={productsError ? "Products unavailable" : query ? "No matching products" : "No products yet"} subtitle={productsError || (query ? "Try another search term." : "Approved products will appear here.")} />}
      <SectionHeader title="Flash deals" action="See all" onPress={() => onListing("Deals")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactRail}>{visible.slice(0, 8).map((product) => <CompactProduct key={`deal-${product.id}`} product={product} onPress={() => onProduct(product)} />)}</ScrollView>
      <SectionHeader title="Top sellers" action="See all" onPress={() => onListing("Top sellers")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactRail}>{[...visible].sort((a, b) => b.reviews - a.reviews).slice(0, 8).map((product) => <CompactProduct key={`top-${product.id}`} product={product} onPress={() => onProduct(product)} />)}</ScrollView>
      <SectionHeader title="New arrivals" action="See all" onPress={() => onListing("New arrivals")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactRail}>{visible.slice(0, 8).map((product) => <CompactProduct key={`new-${product.id}`} product={product} onPress={() => onProduct(product)} />)}</ScrollView>
      {!!vendors.length && <><SectionHeader title="Local stores" action="Explore" onPress={() => onListing("Local stores")} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vendorRail}>{vendors.map(([name, icon, rating, color]) => <VendorCard key={name} name={name} icon={icon} rating={rating} color={color} />)}</ScrollView></>}
      <SectionHeader title="Recommended for you" action="View all" onPress={() => onListing("Recommended")} />
      <View style={styles.productGrid}>{[...visible].reverse().slice(0, 6).map((product) => <ProductCard key={`more-${product.id}`} product={product} width={cardWidth} saved={wishlist.includes(product.id)} onWishlist={() => onWishlist(product.id)} onPress={() => onProduct(product)} />)}</View>
    </ScreenShell>
  );
}

export function CategoriesScreen({ onBack, onCategory }: { onBack: () => void; onCategory: (category: string) => void }) {
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

export function ListingScreen({ products, category, wishlist, onWishlist, onBack, onProduct }: { products: Product[]; category: string; wishlist: string[]; onWishlist: (id: string) => void; onBack: () => void; onProduct: (product: Product) => void }) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [popular, setPopular] = useState(false);
  const [fastDelivery, setFastDelivery] = useState(false);
  const [topRated, setTopRated] = useState(false);
  const contentWidth = width - (width < 360 ? 24 : 28);
  const cardWidth = Math.floor((contentWidth - 10) / 2);
  const inCategory = categories.some(([name]) => name === category) ? products.filter((product) => product.category === category) : products;
  const visible = filterProducts(inCategory, query)
    .filter((product) => !fastDelivery || product.deliverySize === "small")
    .sort((a, b) => topRated ? b.rating - a.rating : popular ? (b.reviews - a.reviews || b.rating - a.rating) : 0);
  const chips = [
    ["Filters", showFilters, () => setShowFilters((current) => !current)],
    ["Popular", popular, () => setPopular((current) => !current)],
    ["Fast delivery", fastDelivery, () => setFastDelivery((current) => !current)],
    ["Top rated", topRated, () => setTopRated((current) => !current)],
  ] as const;
  return (
    <ScreenScroll sticky>
      <PageHeader title={category} onBack={onBack} />
      <SearchBar placeholder={`Search ${category.toLowerCase()}`} value={query} onChange={setQuery} suggestions={products.map((product) => product.name)} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>
        {chips.map(([item, active, onPress]) => <Pressable key={item} style={[styles.filter, active && styles.filterActive]} onPress={onPress}><Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text></Pressable>)}
      </ScrollView>
      {showFilters && <View style={styles.filterPanel}><Text style={styles.rowTitle}>Delivery speed</Text><Text style={styles.smallMuted}>Fast delivery shows small products suitable for standard local delivery.</Text><View style={styles.filterPanelActions}><Text style={styles.link} onPress={() => { setPopular(false); setFastDelivery(false); setTopRated(false); }}>Reset</Text><Text style={styles.link} onPress={() => setShowFilters(false)}>Done</Text></View></View>}
      <View style={styles.between}><Text style={styles.smallMuted}>{visible.length} curated products</Text><Text style={styles.smallMuted}>Grid view</Text></View>
      <View style={[styles.productGrid, styles.gridTop]}>{visible.map((product) => <ProductCard key={product.id} product={product} width={cardWidth} saved={wishlist.includes(product.id)} onWishlist={() => onWishlist(product.id)} onPress={() => onProduct(product)} />)}</View>
      {!visible.length && <Empty title="No products found" subtitle="Active products in this collection will appear here." />}
    </ScreenScroll>
  );
}
