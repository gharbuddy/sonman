import { useState } from "react";
import { Text, View } from "react-native";
import { ORDER_STATUS_LABELS, type CustomerOrder } from "../orders";
import { Empty, money, ScreenScroll, styles } from "../shared";

export function OrdersScreen({
  orders,
  error,
}: {
  orders: CustomerOrder[];
  error: string;
}) {
  const [tab, setTab] = useState<"active" | "past">("active");

  const visible = orders.filter((order) =>
    tab === "past"
      ? order.status === "delivered"
      : order.status !== "delivered"
  );

  return (
    <ScreenScroll
      contentContainerStyle={{
        backgroundColor: "#ffffff",
        paddingBottom: 120,
      }}
    >
      <Text
        style={[
          styles.pageTitle,
          {
            color: "#111827",
          },
        ]}
      >
        Your orders
      </Text>

      <Text
        style={[
          styles.body,
          {
            color: "#6b7280",
          },
        ]}
      >
        Track deliveries and revisit past purchases.
      </Text>

      <View style={styles.tabs}>
        <Text
          style={tab === "active" ? styles.tabActive : styles.tab}
          onPress={() => setTab("active")}
        >
          Active
        </Text>

        <Text
          style={tab === "past" ? styles.tabActive : styles.tab}
          onPress={() => setTab("past")}
        >
          Past orders
        </Text>
      </View>

      {!!error && <Text style={styles.authError}>{error}</Text>}

      {visible.map((order) => (
        <View
          key={order.id}
          style={[
            styles.orderCard,
            {
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            },
          ]}
        >
          <View style={styles.between}>
            <Text
              style={[
                styles.eyebrow,
                {
                  color: "#374151",
                },
              ]}
            >
              {order.orderNumber}
            </Text>

            <Text
              style={
                order.status === "delivered"
                  ? styles.statusDelivered
                  : styles.statusActive
              }
            >
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </Text>
          </View>

          <Text
            style={[
              styles.rowTitle,
              styles.orderTitle,
              {
                color: "#111827",
              },
            ]}
          >
            {order.items
              .map((item) => `${item.quantity} x ${item.name}`)
              .join(", ")}
          </Text>

          <Text
            style={[
              styles.totalPrice,
              {
                color: "#111827",
              },
            ]}
          >
            {money(order.total)}
          </Text>

          <Text
            style={[
              styles.smallMuted,
              {
                color: "#6b7280",
              },
            ]}
          >
            Expected by {order.expectedDeliveryDate}
          </Text>

          <Text
            style={[
              styles.smallMuted,
              {
                color: "#6b7280",
              },
            ]}
          >
            {order.deliveryQuoteRequired
              ? "Delivery charge will be confirmed by Sonman before dispatch."
              : `Delivery charge: ${money(order.deliveryFee)}`}
          </Text>

          <Text
            style={[
              styles.policyLabel,
              {
                color: "#b8860b",
              },
            ]}
          >
            PREPAID ORDER
          </Text>

          <Text
            style={[
              styles.smallMuted,
              {
                color: "#6b7280",
              },
            ]}
          >
            Replacement only if issue reported at delivery
          </Text>
        </View>
      ))}

      {!visible.length && (
        <Empty
          title={tab === "past" ? "No past orders" : "No active orders"}
          subtitle={
            tab === "past"
              ? "Delivered orders will appear here."
              : "New orders will appear here after checkout."
          }
        />
      )}
    </ScreenScroll>
  );
}