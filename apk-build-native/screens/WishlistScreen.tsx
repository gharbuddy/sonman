import { Text, View, useWindowDimensions } from "react-native";
import type { CustomerProduct as Product } from "../products";
import { Empty, ScreenScroll, styles } from "../shared";
import { PageHeader } from "../components/Header";
import { ProductCard } from "../components/ProductCard";

export function WishlistScreen({ items, wishlist, onBack, onWishlist, onProduct }: { items: Product[]; wishlist: string[]; onBack: () => void; onWishlist: (id: string) => void; onProduct: (product: Product) => void }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - 38) / 2);
  return <ScreenScroll><PageHeader title="Wishlist" onBack={onBack} /><Text style={styles.body}>{items.length} saved {items.length === 1 ? "item" : "items"}</Text><View style={[styles.productGrid, styles.gridTop]}>{items.map((product) => <ProductCard key={product.id} product={product} width={cardWidth} saved={wishlist.includes(product.id)} onWishlist={() => onWishlist(product.id)} onPress={() => onProduct(product)} />)}</View>{!items.length && <Empty title="Your wishlist is empty" subtitle="Tap a heart to save products for later." />}</ScreenScroll>;
}
