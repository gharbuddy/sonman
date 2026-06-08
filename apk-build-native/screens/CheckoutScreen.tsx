import { useEffect, useState, type ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { AppliedCoupon } from "../coupons";
import type { CustomerProduct as Product } from "../products";
import { addressText, type CustomerAddress } from "../profile";
import { formatDeliveryDate, quoteDelivery } from "../delivery";
import { money, palette, ScreenScroll } from "../shared";
import { PageHeader } from "../components/Header";
import { checkoutIcons, iconColors, SonmanIcon, type SonmanIconName } from "../src/theme/icons";

type CheckoutProps = {
  address?: CustomerAddress;
  items: Product[];
  quantities: Record<string, number>;
  subtotal: number;
  quote: ReturnType<typeof quoteDelivery>;
  busy: boolean;
  error: string;
  appliedCoupon?: AppliedCoupon;
  onCouponChange: (coupon?: AppliedCoupon) => void;
  validateCoupon: (code: string, subtotal: number) => Promise<AppliedCoupon>;
  onBack: () => void;
  onAddresses: () => void;
  onPlaceOrder: () => void;
};

function gstIncluded(value: number) {
  return Math.round((value * 18) / 118);
}

function PremiumSection({ icon, title, action, onAction, children }: { icon: SonmanIconName; title: string; action?: string; onAction?: () => void; children: ReactNode }) {
  return (
    <View style={checkoutStyles.card}>
      <View style={checkoutStyles.sectionHeader}>
        <View style={checkoutStyles.iconWrap}>
          <SonmanIcon name={icon} size={22} color={iconColors.action} weight="duotone" />
        </View>
        <Text style={checkoutStyles.sectionTitle}>{title}</Text>
        {!!action && <Text style={checkoutStyles.sectionAction} onPress={onAction}>{action}</Text>}
      </View>
      <View style={checkoutStyles.sectionBody}>{children}</View>
    </View>
  );
}

export function CheckoutScreen({
  address,
  items,
  quantities,
  subtotal,
  quote,
  busy,
  error,
  appliedCoupon,
  onCouponChange,
  validateCoupon,
  onBack,
  onAddresses,
  onPlaceOrder,
}: CheckoutProps) {
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [deliverySlot, setDeliverySlot] = useState("Standard");
  const [coupon, setCoupon] = useState("");
  const [couponStatus, setCouponStatus] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [notes, setNotes] = useState("");

  const deliveryFee = quote.fee ?? 0;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const payableAmount = discountedSubtotal + deliveryFee;
  const gst = gstIncluded(discountedSubtotal);

  useEffect(() => {
    let active = true;
    const normalized = coupon.trim().toUpperCase();
    setCouponStatus("");
    setCouponError("");

    if (!normalized) {
      onCouponChange(undefined);
      setCouponBusy(false);
      return () => { active = false; };
    }

    setCouponBusy(true);
    const handle = setTimeout(() => {
      validateCoupon(normalized, subtotal)
        .then((nextCoupon) => {
          if (!active) return;
          onCouponChange(nextCoupon);
          setCouponStatus(`${nextCoupon.code} applied. You saved ${money(nextCoupon.discountAmount)}.`);
          setCouponError("");
        })
        .catch((cause) => {
          if (!active) return;
          onCouponChange(undefined);
          setCouponStatus("");
          setCouponError(cause instanceof Error ? cause.message : "Coupon could not be applied.");
        })
        .finally(() => {
          if (active) setCouponBusy(false);
        });
    }, 350);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [coupon, onCouponChange, subtotal, validateCoupon]);

  return (
    <ScreenScroll contentContainerStyle={checkoutStyles.screen}>
      <PageHeader title="Checkout" onBack={onBack} />

      <PremiumSection icon={checkoutIcons.address} title="Delivery address" action={address ? "Change" : "Add"} onAction={onAddresses}>
        <Text style={checkoutStyles.primaryText}>{address?.recipientName ?? "No default address selected"}</Text>
        <Text style={checkoutStyles.secondaryText}>{address ? addressText(address) : "Add a saved address before placing your order."}</Text>
      </PremiumSection>

      <View style={checkoutStyles.card}>
        <View style={checkoutStyles.titleRow}>
          <Text style={checkoutStyles.sectionTitle}>Product summary</Text>
          <Text style={checkoutStyles.countPill}>{items.length} item{items.length === 1 ? "" : "s"}</Text>
        </View>
        {items.map((product) => (
          <View key={product.id} style={checkoutStyles.productRow}>
            <Image source={{ uri: product.image }} style={checkoutStyles.productImage} />
            <View style={checkoutStyles.flex}>
              <Text style={checkoutStyles.productName} numberOfLines={2}>{product.name}</Text>
              <Text style={checkoutStyles.secondaryText}>Qty {quantities[product.id]} · Local seller</Text>
              <Text style={checkoutStyles.productPrice}>{money(product.price * quantities[product.id])}</Text>
            </View>
          </View>
        ))}
      </View>

      <PremiumSection icon={checkoutIcons.delivery} title="Delivery slot" action={`Zone ${quote.zone}`}>
        <View style={checkoutStyles.optionRow}>
          {["Standard", "Evening"].map((slot) => (
            <Pressable key={slot} style={[checkoutStyles.optionPill, deliverySlot === slot && checkoutStyles.optionPillActive]} onPress={() => setDeliverySlot(slot)}>
              <Text style={[checkoutStyles.optionText, deliverySlot === slot && checkoutStyles.optionTextActive]}>{slot}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={checkoutStyles.secondaryText}>Expected by {formatDeliveryDate(quote.expectedDate)}</Text>
        <Text style={checkoutStyles.secondaryText}>{quote.fee === null ? "Delivery charge will be confirmed before dispatch." : `Delivery charge: ${money(quote.fee)}`}</Text>
      </PremiumSection>

      <PremiumSection icon={checkoutIcons.coupon} title="Coupon" action={couponBusy ? "Checking" : appliedCoupon ? "Applied" : "Apply"}>
        <TextInput
          style={checkoutStyles.input}
          value={coupon}
          onChangeText={(value) => setCoupon(value.toUpperCase())}
          placeholder="Enter coupon code"
          placeholderTextColor={checkoutStyles.placeholder.color}
          autoCapitalize="characters"
        />
        {!!couponStatus && <Text style={checkoutStyles.couponSuccess}>{couponStatus}</Text>}
        {!!couponError && <Text style={checkoutStyles.couponError}>{couponError}</Text>}
      </PremiumSection>

      <PremiumSection icon={checkoutIcons.payment} title="Payment method" action="UPI">
        <View style={checkoutStyles.upiPanel}>
          <View style={checkoutStyles.upiHeader}>
            <View style={checkoutStyles.upiMark}><Text style={checkoutStyles.upiMarkText}>UPI</Text></View>
            <View style={checkoutStyles.flex}>
              <Text style={checkoutStyles.primaryText}>UPI Payment</Text>
              <Text style={checkoutStyles.secondaryText}>Pay through any installed UPI app</Text>
            </View>
          </View>
          <Text style={checkoutStyles.paymentAmount}>{money(payableAmount)}</Text>
          <View style={checkoutStyles.paymentOptions}>
            {["Google Pay", "PhonePe", "BHIM", "Other UPI"].map((method) => (
              <Text key={method} style={checkoutStyles.paymentOption}>{method}</Text>
            ))}
          </View>
          <Text style={checkoutStyles.assurance}>You will pay inside your installed UPI app. Sonman will verify the payment before processing the order.</Text>
        </View>
      </PremiumSection>

      <PremiumSection icon={checkoutIcons.notes} title="Order notes" action="Optional">
        <TextInput style={[checkoutStyles.input, checkoutStyles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Delivery instructions or landmark" placeholderTextColor={checkoutStyles.placeholder.color} multiline />
      </PremiumSection>

      <View style={checkoutStyles.totalCard}>
        <Text style={checkoutStyles.totalTitle}>Payment summary</Text>
        <View style={checkoutStyles.totalRow}><Text style={checkoutStyles.totalLabel}>Subtotal</Text><Text style={checkoutStyles.totalValue}>{money(subtotal)}</Text></View>
        {!!discountAmount && <View style={checkoutStyles.totalRow}><Text style={checkoutStyles.discountLabel}>Coupon discount</Text><Text style={checkoutStyles.discountValue}>-{money(discountAmount)}</Text></View>}
        <View style={checkoutStyles.totalRow}><Text style={checkoutStyles.totalLabel}>GST included</Text><Text style={checkoutStyles.totalValue}>{money(gst)}</Text></View>
        <View style={checkoutStyles.totalRow}><Text style={checkoutStyles.totalLabel}>Delivery</Text><Text style={checkoutStyles.totalValue}>{quote.fee === null ? "To confirm" : money(deliveryFee)}</Text></View>
        <View style={checkoutStyles.totalDivider} />
        <View style={checkoutStyles.totalRow}><Text style={checkoutStyles.grandLabel}>Total</Text><Text style={checkoutStyles.grandValue}>{money(payableAmount)}</Text></View>
      </View>

      <View style={checkoutStyles.trustRow}>
        <Text style={checkoutStyles.trustBadge}>✓ Secure Payment</Text>
        <Text style={checkoutStyles.trustBadge}>✓ Easy Replacement</Text>
        <Text style={checkoutStyles.trustBadge}>✓ Trusted Seller</Text>
      </View>

      <Pressable style={checkoutStyles.policyRow} onPress={() => setPolicyAccepted((accepted) => !accepted)}>
        <View style={[checkoutStyles.checkbox, policyAccepted && checkoutStyles.checkboxChecked]}>
          {policyAccepted && <SonmanIcon name="check" size={14} color="#FFFFFF" weight="bold" />}
        </View>
        <Text style={checkoutStyles.policyText}>I understand this order is prepaid. Cancellation is not allowed after order confirmation. Replacement is allowed only for damaged, defective, or incorrect products reported at delivery.</Text>
      </Pressable>

      {!!error && <Text style={checkoutStyles.errorText}>{error}</Text>}

      <Pressable style={[checkoutStyles.placeOrderButton, (busy || !subtotal || !policyAccepted || !address) && checkoutStyles.disabled]} onPress={onPlaceOrder} disabled={busy || !subtotal || !policyAccepted || !address}>
        <Text style={checkoutStyles.placeOrderText}>{busy ? "Opening UPI..." : `Place order · ${money(payableAmount)}`}</Text>
      </Pressable>
    </ScreenScroll>
  );
}

export function PaymentConfirmationScreen({ total, busy, error, onPaid, onFailed }: { total: number; busy: boolean; error: string; onPaid: (paymentReference?: string) => void; onFailed: () => void }) {
  const [paymentReference, setPaymentReference] = useState("");

  return (
    <ScreenScroll contentContainerStyle={checkoutStyles.screen}>
      <Text style={checkoutStyles.confirmTitle}>Did you complete payment?</Text>
      <Text style={checkoutStyles.secondaryText}>Confirm the UPI payment result for this order.</Text>
      <View style={checkoutStyles.card}>
        <Text style={checkoutStyles.sectionTitle}>UPI Payment</Text>
        <Text style={checkoutStyles.paymentAmount}>{money(total)}</Text>
        <Text style={checkoutStyles.secondaryText}>Use the buttons below after returning from your UPI app.</Text>
        <Text style={checkoutStyles.assurance}>Your order will be marked pending verification until Sonman confirms the UPI payment.</Text>
      </View>
      <TextInput style={checkoutStyles.input} value={paymentReference} onChangeText={setPaymentReference} placeholder="Payment reference optional" placeholderTextColor={palette.muted} />
      {!!error && <Text style={checkoutStyles.errorText}>{error}</Text>}
      <Pressable style={[checkoutStyles.placeOrderButton, busy && checkoutStyles.disabled]} onPress={() => onPaid(paymentReference)} disabled={busy}>
        <Text style={checkoutStyles.placeOrderText}>{busy ? "Creating order..." : "I have paid"}</Text>
      </Pressable>
      <Pressable style={checkoutStyles.failedButton} onPress={onFailed} disabled={busy}>
        <Text style={checkoutStyles.failedButtonText}>Payment failed</Text>
      </Pressable>
    </ScreenScroll>
  );
}

const checkoutStyles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },
  flex: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  sectionTitle: {
    flex: 1,
    color: "#111827",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
  },
  sectionAction: {
    color: "#B7791F",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  sectionBody: {
    gap: 8,
    paddingLeft: 56,
    paddingTop: 10,
  },
  primaryText: {
    color: "#111827",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  secondaryText: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  countPill: {
    overflow: "hidden",
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productRow: {
    flexDirection: "row",
    gap: 14,
    paddingTop: 14,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  productImage: {
    width: 76,
    height: 84,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
  },
  productName: {
    color: "#111827",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  productPrice: {
    color: "#111827",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  optionPill: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionPillActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  optionText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "800",
  },
  optionTextActive: {
    color: "#FFFFFF",
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    color: "#111827",
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  placeholder: {
    color: "#94A3B8",
  },
  couponSuccess: {
    color: "#166534",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "800",
  },
  couponError: {
    color: "#DC2626",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "800",
  },
  notesInput: {
    minHeight: 96,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  upiPanel: {
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    backgroundColor: "#F7FDF9",
  },
  upiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  upiMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#14532D",
  },
  upiMarkText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  paymentAmount: {
    color: "#111827",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  paymentOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  paymentOption: {
    overflow: "hidden",
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  assurance: {
    color: "#166534",
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "600",
  },
  totalCard: {
    gap: 12,
    padding: 20,
    borderRadius: 26,
    backgroundColor: "#111827",
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 7,
  },
  totalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  totalLabel: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
  },
  totalValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  discountLabel: {
    color: "#86EFAC",
    fontSize: 14,
    fontWeight: "700",
  },
  discountValue: {
    color: "#86EFAC",
    fontSize: 14,
    fontWeight: "900",
  },
  totalDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginVertical: 4,
  },
  grandLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  grandValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  trustRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  trustBadge: {
    flex: 1,
    overflow: "hidden",
    color: "#14532D",
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  policyRow: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },
  checkbox: {
    width: 28,
    height: 28,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#111827",
  },
  policyText: {
    flex: 1,
    color: "#475569",
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "600",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  placeOrderButton: {
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#111827",
    marginTop: 2,
    marginBottom: 10,
  },
  placeOrderText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  disabled: {
    opacity: 0.35,
  },
  confirmTitle: {
    color: "#111827",
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "900",
    marginBottom: 8,
  },
  failedButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 18,
    backgroundColor: "#FEF2F2",
    marginVertical: 8,
  },
  failedButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
