import { ScrollView, Text, View } from "react-native";
import type { CustomerProduct as Product } from "../products";
import { CartItem, CompactProduct, Empty, money, PrimaryButton, ScreenScroll, SectionHeader, styles } from "../shared";
import { OrderTotal } from "../components/PriceBreakdown";

export function CartScreen({ items, savedItems, products, quantities, subtotal, error, onQuantity, onSaveLater, onProduct, onCheckout }: { items: Product[]; savedItems: Product[]; products: Product[]; quantities: Record<string, number>; subtotal: number; error: string; onQuantity: (id: string, quantity: number) => void; onSaveLater: (id: string) => void; onProduct: (product: Product) => void; onCheckout: () => void }) {
  const freeDeliveryTarget = 499;
  const progress = Math.min(100, Math.round(subtotal / freeDeliveryTarget * 100));
  const recommended = products.filter((product) => !quantities[product.id]).slice(0, 8);
  return (
    <ScreenScroll>
      <Text style={styles.pageTitle}>Your cart</Text>
      <Text style={styles.body}>{items.length} items ready for checkout</Text>
      <View style={styles.deliveryBanner}><Text style={styles.deliveryIcon}>DEL</Text><View style={styles.flex}><Text style={styles.deliveryTitle}>{subtotal >= freeDeliveryTarget ? "You unlocked free delivery offers" : `Add ${money(freeDeliveryTarget - subtotal)} more for free delivery offers`}</Text><View style={styles.deliveryProgress}><View style={[styles.deliveryProgressDone, { width: `${progress}%` }]} /></View></View></View>
      {items.map((product) => <CartItem key={product.id} product={product} quantity={quantities[product.id]} onQuantity={(quantity) => onQuantity(product.id, quantity)} onSaveLater={() => onSaveLater(product.id)} />)}
      {!items.length && <Empty title="Your cart is empty" subtitle="Add a few favourites and they will appear here." />}
      <View style={styles.couponCard}><Text style={styles.rowTitle}>Apply coupon</Text><Text style={styles.smallMuted}>Check available Sonman offers at checkout.</Text><Text style={styles.link}>View coupons ›</Text></View>
      {!!error && <Text style={styles.authError}>{error}</Text>}
      <OrderTotal subtotal={subtotal} />
      {!!savedItems.length && <><SectionHeader title="Saved for later" action={`${savedItems.length} items`} onPress={() => undefined} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactRail}>{savedItems.map((product) => <CompactProduct key={`saved-${product.id}`} product={product} onPress={() => onProduct(product)} />)}</ScrollView></>}
      {!!recommended.length && <><SectionHeader title="Recommended products" action="Explore" onPress={() => undefined} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactRail}>{recommended.map((product) => <CompactProduct key={`recommended-${product.id}`} product={product} onPress={() => onProduct(product)} />)}</ScrollView></>}
      <PrimaryButton label={`Checkout  ·  ${money(subtotal)}`} onPress={onCheckout} disabled={!items.length} />
    </ScreenScroll>
  );
}
