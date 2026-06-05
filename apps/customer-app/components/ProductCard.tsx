import { Image, Pressable, Text, View } from "react-native";
import type { CustomerProduct as Product } from "../products";
import { discount, money, styles } from "../shared";

export function ProductCard({ product, onPress, onWishlist, saved, width }: { product: Product; onPress: () => void; onWishlist?: () => void; saved?: boolean; width?: number }) {
  return (
    <Pressable style={[styles.productCard, width ? { width } : undefined]} onPress={onPress}>
      <View><Image source={{ uri: product.image }} style={styles.productImage} /><Pressable style={styles.heartButton} hitSlop={8} onPress={(event) => { event.stopPropagation(); onWishlist?.(); }}><Text style={[styles.heart, saved && styles.heartSaved]}>{saved ? "♥" : "♡"}</Text></Pressable>{product.badge && <Text style={styles.badge}>{product.badge}</Text>}</View>
      <View style={styles.productCopy}><Text style={styles.productCategory}>{product.category}</Text><Text style={styles.productName} numberOfLines={2}>{product.name}</Text><View style={styles.ratingLine}><Text style={styles.ratingSmall}>★ {product.rating}</Text><Text style={styles.reviewCount}>({product.reviews})</Text></View><View style={styles.priceLine}><Text style={styles.productPrice}>{money(product.price)}</Text><Text style={styles.oldPriceSmall}>{money(product.oldPrice)}</Text></View><Text style={styles.discount}>{discount(product)}% off</Text><Text style={styles.delivery}>{product.deliverySize === "large" || product.deliverySize === "heavy" ? "Delivery quote required" : "Standard delivery"}</Text></View>
    </Pressable>
  );
}
