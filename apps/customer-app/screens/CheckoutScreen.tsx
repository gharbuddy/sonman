import { useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import type { CustomerProduct as Product } from "../products";
import { addressText, type CustomerAddress } from "../profile";
import { formatDeliveryDate, quoteDelivery } from "../delivery";
import { CheckoutSection, money, palette, PrimaryButton, ScreenScroll, styles } from "../shared";
import { PageHeader } from "../components/Header";
import { OrderTotal } from "../components/PriceBreakdown";

export function CheckoutScreen({ address, items, quantities, subtotal, quote, busy, error, onBack, onAddresses, onPlaceOrder }: { address?: CustomerAddress; items: Product[]; quantities: Record<string, number>; subtotal: number; quote: ReturnType<typeof quoteDelivery>; busy: boolean; error: string; onBack: () => void; onAddresses: () => void; onPlaceOrder: () => void }) {
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [deliverySlot, setDeliverySlot] = useState("Standard");
  const [coupon, setCoupon] = useState("");
  const [notes, setNotes] = useState("");
  const payableAmount = subtotal + (quote.fee ?? 0);
  return (
    <ScreenScroll>
      <PageHeader title="Checkout" onBack={onBack} />
      <CheckoutSection icon="PIN" title="Delivery address" action={address ? "Change" : "Add"} onAction={onAddresses}><Text style={styles.rowTitle}>{address?.recipientName ?? "No default address selected"}</Text><Text style={styles.smallMuted}>{address ? addressText(address) : "Add a saved address before placing your order."}</Text></CheckoutSection>
      <View style={styles.checkoutCard}><Text style={styles.rowTitle}>Product summary</Text>{items.map((product) => <View key={product.id} style={styles.checkoutProduct}><Image source={{ uri: product.image }} style={styles.checkoutProductImage} /><View style={styles.flex}><Text style={styles.rowTitle} numberOfLines={2}>{product.name}</Text><Text style={styles.smallMuted}>Qty {quantities[product.id]} · Local seller</Text><Text style={styles.productPrice}>{money(product.price * quantities[product.id])}</Text></View></View>)}</View>
      <CheckoutSection icon="BOX" title="Delivery slot" action={`Zone ${quote.zone}`}><View style={styles.optionRow}>{["Standard", "Evening"].map((slot) => <Text key={slot} style={[styles.optionPill, deliverySlot === slot && styles.optionPillActive]} onPress={() => setDeliverySlot(slot)}>{slot}</Text>)}</View><Text style={styles.smallMuted}>Expected by {formatDeliveryDate(quote.expectedDate)}</Text><Text style={styles.smallMuted}>{quote.fee === null ? "Delivery charge will be confirmed by Sonman before dispatch." : `Delivery charge: ${money(quote.fee)}`}</Text></CheckoutSection>
      <CheckoutSection icon="OFF" title="Coupon" action="Apply"><TextInput style={styles.inlineInput} value={coupon} onChangeText={setCoupon} placeholder="Enter coupon code" placeholderTextColor={palette.muted} /></CheckoutSection>
      <CheckoutSection icon="PAY" title="Payment method" action="UPI"><View style={styles.upiPanel}><View style={styles.upiBrand}><View style={styles.upiMark}><Text style={styles.upiMarkText}>UPI</Text></View><View style={styles.flex}><Text style={styles.rowTitle}>UPI Payment</Text><Text style={styles.smallMuted}>Pay through any installed UPI app</Text></View></View><Text style={styles.paymentAmount}>{money(payableAmount)}</Text><View style={styles.paymentOptions}>{["Google Pay", "PhonePe", "BHIM", "Other UPI"].map((method) => <Text key={method} style={styles.paymentOption}>{method}</Text>)}</View><Text style={styles.paymentAssurance}>You will pay inside your installed UPI app. Sonman will verify the payment before processing the order.</Text></View></CheckoutSection>
      <CheckoutSection icon="NOTE" title="Order notes" action="Optional"><TextInput style={[styles.inlineInput, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Delivery instructions or landmark" placeholderTextColor={palette.muted} multiline /></CheckoutSection>
      <OrderTotal subtotal={subtotal} deliveryFee={quote.fee} />
      <View style={styles.trustRow}><Text style={styles.trustBadge}>SECURE{"\n"}Payment</Text><Text style={styles.trustBadge}>EASY{"\n"}Replacement</Text><Text style={styles.trustBadge}>VERIFIED{"\n"}Local seller</Text></View>
      <Pressable style={styles.policyRow} onPress={() => setPolicyAccepted((accepted) => !accepted)}>
        <View style={[styles.checkbox, policyAccepted && styles.checkboxChecked]}><Text style={styles.checkboxMark}>{policyAccepted ? "✓" : ""}</Text></View>
        <Text style={styles.policyText}>I understand this order is prepaid. Cancellation is not allowed after order confirmation. Replacement is allowed only for damaged, defective, or incorrect products reported at delivery.</Text>
      </Pressable>
      {!!error && <Text style={styles.authError}>{error}</Text>}
      <PrimaryButton label={busy ? "Opening UPI..." : `Place order  ·  ${money(payableAmount)}`} onPress={onPlaceOrder} disabled={busy || !subtotal || !policyAccepted || !address} />
    </ScreenScroll>
  );
}

export function PaymentConfirmationScreen({ total, busy, error, onPaid, onFailed }: { total: number; busy: boolean; error: string; onPaid: (paymentReference?: string) => void; onFailed: () => void }) {
  const [paymentReference, setPaymentReference] = useState("");
  return (
    <ScreenScroll>
      <Text style={styles.pageTitle}>Did you complete payment?</Text>
      <Text style={styles.body}>Confirm the UPI payment result for this order.</Text>
      <View style={styles.checkoutCard}>
        <Text style={styles.rowTitle}>UPI Payment</Text>
        <Text style={styles.paymentAmount}>{money(total)}</Text>
        <Text style={styles.smallMuted}>Use the buttons below after returning from your UPI app.</Text>
        <Text style={styles.paymentAssurance}>Your order will be marked pending verification until Sonman confirms the UPI payment.</Text>
      </View>
      <TextInput style={styles.inlineInput} value={paymentReference} onChangeText={setPaymentReference} placeholder="Payment reference (optional)" placeholderTextColor={palette.muted} />
      {!!error && <Text style={styles.authError}>{error}</Text>}
      <PrimaryButton label={busy ? "Creating order..." : "I have paid"} onPress={() => onPaid(paymentReference)} disabled={busy} />
      <Pressable style={styles.secondaryButton} onPress={onFailed} disabled={busy}>
        <Text style={styles.secondaryButtonText}>Payment failed</Text>
      </Pressable>
    </ScreenScroll>
  );
}
