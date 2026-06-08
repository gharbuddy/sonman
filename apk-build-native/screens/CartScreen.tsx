import { ScrollView, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";
import type { CustomerProduct as Product } from "../products";
import { SearchBar } from "../components/SearchBar";
import {
  CompactProduct,
  Empty,
  money,
  ScreenScroll,
  SectionHeader,
  styles,
} from "../shared";

export function CartScreen({
  items,
  savedItems,
  products,
  quantities,
  subtotal,
  error,
  onQuantity,
  onSaveLater,
  onProduct,
  onCheckout,
}: {
  items: Product[];
  savedItems: Product[];
  products: Product[];
  quantities: Record<string, number>;
  subtotal: number;
  error: string;
  onQuantity: (id: string, quantity: number) => void;
  onSaveLater: (id: string) => void;
  onProduct: (product: Product) => void;
  onCheckout: () => void;
}) {
  const [search, setSearch] = useState("");

  const freeDeliveryTarget = 499;
  const remaining = Math.max(0, freeDeliveryTarget - subtotal);
  const progress = Math.min(100, Math.round((subtotal / freeDeliveryTarget) * 100));

  const gstAmount = Math.round(subtotal * 0.18);
  const platformFee = 0;
  const payable = subtotal + gstAmount + platformFee;

  const recommended = products.filter((product) => !quantities[product.id]).slice(0, 8);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <ScreenScroll>
      <View style={s.topArea}>
        <Text style={s.pageTitle}>Cart</Text>

        <SearchBar
          placeholder="Search in cart"
          value={search}
          onChange={setSearch}
          suggestions={items.map((product) => product.name)}
        />
      </View>

      <View style={s.summaryBox}>
        <Text style={s.subtotalText}>
          Subtotal <Text style={s.subtotalPrice}>{money(subtotal)}</Text>
        </Text>

        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={s.deliveryLine}>
          <View style={s.checkCircle}>
            <Text style={s.checkText}>✓</Text>
          </View>
          <Text style={s.deliveryText}>
            {remaining > 0
              ? `Add ${money(remaining)} more for FREE delivery.`
              : "Your order is eligible for FREE delivery."}
          </Text>
        </View>

        <Pressable
          style={[s.buyButton, !items.length && s.buyButtonDisabled]}
          onPress={onCheckout}
          disabled={!items.length}
        >
          <Text style={s.buyButtonText}>
            Proceed to Buy ({items.length} {items.length === 1 ? "item" : "items"})
          </Text>
        </Pressable>
      </View>

      {!items.length && (
        <Empty title="Your cart is empty" subtitle="Add products and they will appear here." />
      )}

      {!!items.length && <Text style={s.deselectText}>Deselect all items</Text>}

      {visibleItems.map((product) => (
        <View key={product.id} style={s.cartItem}>
          <View style={s.selectedBox}>
            <Text style={s.selectedTick}>✓</Text>
          </View>

          <Pressable onPress={() => onProduct(product)}>
            <Image source={{ uri: product.image }} style={s.productImage} />
          </Pressable>

          <View style={s.info}>
            <Text style={s.productName} numberOfLines={2}>
              {product.name}
            </Text>

            <Text style={s.boughtText}>50+ bought in past month</Text>

            <View style={s.priceRow}>
              <Text style={s.discount}>-10%</Text>
              <Text style={s.price}>{money(product.price * quantities[product.id])}</Text>
            </View>

            <Text style={s.mrpText}>
              M.R.P.: <Text style={s.strike}>{money(product.price + 40)}</Text>
            </Text>

            <Text style={s.deliveryInfo}>Delivery charge calculated at checkout</Text>
            <Text style={s.stockText}>In stock</Text>
            <Text style={s.replaceText}>7 days Service Centre Replacement</Text>

            <View style={s.actions}>
              <View style={s.qtyControl}>
                <Pressable
                  style={s.qtyBtn}
                  onPress={() => onQuantity(product.id, Math.max(0, quantities[product.id] - 1))}
                >
                  <Text style={s.qtyBtnText}>−</Text>
                </Pressable>

                <Text style={s.qtyNumber}>{quantities[product.id]}</Text>

                <Pressable
                  style={s.qtyBtn}
                  onPress={() => onQuantity(product.id, quantities[product.id] + 1)}
                >
                  <Text style={s.qtyBtnText}>+</Text>
                </Pressable>
              </View>

              <Pressable style={s.smallAction} onPress={() => onQuantity(product.id, 0)}>
                <Text style={s.smallActionText}>Delete</Text>
              </Pressable>

              <Pressable style={s.smallAction} onPress={() => onSaveLater(product.id)}>
                <Text style={s.smallActionText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}

      <View style={s.offerSection}>
        <View style={s.offerHeader}>
          <Text style={s.offerTitle}>Offers for you</Text>
          <View style={s.activePill}>
            <Text style={s.activePillText}>Active</Text>
          </View>
        </View>

        <View style={s.offerCard}>
          <View style={s.saveBadge}>
            <Text style={s.saveBadgeText}>SAVE</Text>
          </View>

          <View style={s.offerTextBlock}>
            <Text style={s.offerMain}>Sonman offers available</Text>
            <Text style={s.offerSub}>Coupons, bank offers and delivery offers will appear during checkout.</Text>
          </View>

          <Text style={s.viewCoupon}>View ›</Text>
        </View>
      </View>

      {!!error && <Text style={styles.authError}>{error}</Text>}

      <View style={s.priceDetailsCard}>
        <Text style={s.priceDetailsTitle}>Price details</Text>

        <View style={s.billRow}>
          <Text style={s.billLabel}>Subtotal</Text>
          <Text style={s.billValue}>{money(subtotal)}</Text>
        </View>

        <View style={s.billRow}>
          <Text style={s.billLabel}>GST 18%</Text>
          <Text style={s.billValue}>{money(gstAmount)}</Text>
        </View>

        <View style={s.billRow}>
          <Text style={s.billLabel}>Delivery</Text>
          <Text style={s.greenValue}>Calculated at checkout</Text>
        </View>

        <View style={s.billRow}>
          <Text style={s.billLabel}>Platform fee</Text>
          <Text style={s.billValue}>{money(platformFee)}</Text>
        </View>

        <View style={s.billDivider} />

        <View style={s.billRow}>
          <Text style={s.totalLabel}>Total payable</Text>
          <Text style={s.totalValue}>{money(payable)}</Text>
        </View>

        <Text style={s.taxNote}>GST is shown for transparency. Final delivery charge will be confirmed at checkout.</Text>
      </View>

      {!!savedItems.length && (
        <>
          <SectionHeader title="Saved for later" action={`${savedItems.length} items`} onPress={() => undefined} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactRail}>
            {savedItems.map((product) => (
              <CompactProduct key={`saved-${product.id}`} product={product} onPress={() => onProduct(product)} />
            ))}
          </ScrollView>
        </>
      )}

      {!!recommended.length && (
        <>
          <SectionHeader title="Recommended products" action="Explore" onPress={() => undefined} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactRail}>
            {recommended.map((product) => (
              <CompactProduct key={`recommended-${product.id}`} product={product} onPress={() => onProduct(product)} />
            ))}
          </ScrollView>
        </>
      )}

      <View style={s.bottomGap} />
    </ScreenScroll>
  );
}

const s = StyleSheet.create({
  topArea: {
    backgroundColor: "#F3F6FB",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
  },
  pageTitle: {
    color: "#111827",
    fontSize: 32,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 18,
  },
  summaryBox: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  subtotalText: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "500",
  },
  subtotalPrice: {
    fontSize: 30,
    fontWeight: "900",
  },
  progressTrack: {
    marginTop: 12,
    height: 10,
    borderRadius: 99,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 99,
    backgroundColor: "#16833A",
  },
  deliveryLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 10,
  },
  checkCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#16833A",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },
  deliveryText: {
    flex: 1,
    color: "#16833A",
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "900",
  },
  buyButton: {
    marginTop: 20,
    height: 60,
    borderRadius: 999,
    backgroundColor: "#FFD814",
    alignItems: "center",
    justifyContent: "center",
  },
  buyButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  buyButtonText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },
  deselectText: {
    color: "#2563EB",
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  cartItem: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    gap: 12,
  },
  selectedBox: {
    width: 28,
    height: 28,
    borderRadius: 5,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  selectedTick: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 18,
  },
  productImage: {
    width: 118,
    height: 118,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  info: {
    flex: 1,
  },
  productName: {
    color: "#111827",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  boughtText: {
    color: "#374151",
    fontSize: 15,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  discount: {
    color: "#BE123C",
    fontSize: 20,
    fontWeight: "500",
  },
  price: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "900",
  },
  mrpText: {
    color: "#6B7280",
    fontSize: 15,
    marginTop: 3,
  },
  strike: {
    textDecorationLine: "line-through",
    color: "#6B7280",
  },
  deliveryInfo: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },
  stockText: {
    color: "#16833A",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 6,
  },
  replaceText: {
    color: "#2563EB",
    fontSize: 16,
    marginTop: 6,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD814",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  qtyBtn: {
    width: 42,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
  },
  qtyNumber: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    paddingHorizontal: 12,
  },
  smallAction: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  smallActionText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  offerSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  offerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offerTitle: {
    color: "#111827",
    fontSize: 26,
    fontWeight: "900",
  },
  activePill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activePillText: {
    color: "#16833A",
    fontSize: 14,
    fontWeight: "900",
  },
  offerCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saveBadge: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBadgeText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "900",
  },
  offerTextBlock: {
    flex: 1,
  },
  offerMain: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },
  offerSub: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  viewCoupon: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
  },
  priceDetailsCard: {
    margin: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  priceDetailsTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 14,
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    gap: 14,
  },
  billLabel: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "600",
  },
  billValue: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  greenValue: {
    color: "#16833A",
    fontSize: 16,
    fontWeight: "900",
    flexShrink: 1,
    textAlign: "right",
  },
  billDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },
  totalLabel: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "900",
  },
  totalValue: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
  },
  taxNote: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  bottomGap: {
    height: 36,
  },
});
