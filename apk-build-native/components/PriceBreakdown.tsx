import { Text, View } from "react-native";
import { money, styles } from "../shared";

export function PriceBreakdown({ subtotal, deliveryFee }: { subtotal: number; deliveryFee?: number | null }) {
  return <View style={styles.total}><View style={styles.between}><Text style={styles.smallMuted}>Subtotal</Text><Text style={styles.rowTitle}>{money(subtotal)}</Text></View><View style={styles.between}><Text style={styles.smallMuted}>Delivery</Text><Text style={styles.green}>{deliveryFee === undefined ? "Calculated at checkout" : deliveryFee === null ? "Manual quote" : money(deliveryFee)}</Text></View><View style={styles.divider} /><View style={styles.between}><Text style={styles.rowTitle}>Total</Text><Text style={styles.totalPrice}>{money(subtotal + (deliveryFee ?? 0))}</Text></View></View>;
}

export const OrderTotal = PriceBreakdown;
