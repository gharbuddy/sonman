import { useState } from "react";
import { Text, View } from "react-native";
import { ORDER_STATUS_LABELS, type CustomerOrder } from "../orders";
import { Empty, money, ScreenScroll, styles } from "../shared";

export function OrdersScreen({ orders, error }: { orders: CustomerOrder[]; error: string }) {
  const [tab, setTab] = useState<"active" | "past">("active");
  const visible = orders.filter((order) => tab === "past" ? order.status === "delivered" : order.status !== "delivered");
  return (
    <ScreenScroll>
      <Text style={styles.pageTitle}>Your orders</Text>
      <Text style={styles.body}>Track deliveries and revisit past purchases.</Text>
      <View style={styles.tabs}><Text style={tab === "active" ? styles.tabActive : styles.tab} onPress={() => setTab("active")}>Active</Text><Text style={tab === "past" ? styles.tabActive : styles.tab} onPress={() => setTab("past")}>Past orders</Text></View>
      {!!error && <Text style={styles.authError}>{error}</Text>}
      {visible.map((order) => <View key={order.id} style={styles.orderCard}><View style={styles.between}><Text style={styles.eyebrow}>{order.orderNumber}</Text><Text style={order.status === "delivered" ? styles.statusDelivered : styles.statusActive}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Text></View><Text style={[styles.rowTitle, styles.orderTitle]}>{order.items.map((item) => `${item.quantity} x ${item.name}`).join(", ")}</Text><Text style={styles.totalPrice}>{money(order.total)}</Text><Text style={styles.smallMuted}>Expected by {order.expectedDeliveryDate}</Text><Text style={styles.smallMuted}>{order.deliveryQuoteRequired ? "Delivery charge will be confirmed by Sonman before dispatch." : `Delivery charge: ${money(order.deliveryFee)}`}</Text><Text style={styles.policyLabel}>Prepaid order</Text><Text style={styles.smallMuted}>Replacement only if issue reported at delivery</Text></View>)}
      {!visible.length && <Empty title={tab === "past" ? "No past orders" : "No active orders"} subtitle={tab === "past" ? "Delivered orders will appear here." : "New orders will appear here after checkout."} />}
    </ScreenScroll>
  );
}
