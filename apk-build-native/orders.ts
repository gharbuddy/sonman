import type { SupabaseClient } from "@sonman/auth-service";
import AllInOneSDKManager from "paytmpayments-allinone-react-native";

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";

const paymentErrorMessage = (cause: unknown) => {
  if (cause instanceof Error) return cause.message;
  if (cause && typeof cause === "object" && "description" in cause) return String(cause.description);
  if (typeof cause === "string" && cause.trim()) return cause;
  return "Payment failed. Your order was not created.";
};

const paytmResultValue = (result: unknown, key: string) => {
  if (!result || typeof result !== "object" || !(key in result)) return undefined;
  const value = (result as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
};

const ensurePaytmPaymentWasNotCancelled = (result: unknown) => {
  const responseCode = paytmResultValue(result, "RESPCODE") ?? paytmResultValue(result, "respCode");
  const responseMessage = paytmResultValue(result, "RESPMSG") ?? paytmResultValue(result, "respMsg");

  if (responseCode === "141" || responseMessage?.toLowerCase().includes("cancel")) {
    throw new Error("Payment cancelled. Your cart is unchanged.");
  }
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  packed: "Packed",
  ready_for_pickup: "Ready for Pickup",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryFee: number;
  expectedDeliveryDate: string;
  deliveryQuoteRequired: boolean;
  createdAt: string;
  items: { id: string; name: string; quantity: number }[];
};

export const createCustomerOrdersService = (supabase: SupabaseClient) => ({
  async apiRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
    if (!apiUrl) throw new Error("API setup error: add EXPO_PUBLIC_API_URL to the customer app environment.");
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) throw new Error("Sign in to place your order.");
    const response = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Payment request failed.");
    return result;
  },
  async loadCart(): Promise<Record<string, number>> {
    const { data: cart, error: cartError } = await supabase.from("carts").select("id").maybeSingle();
    if (cartError) throw cartError;
    if (!cart) return {};
    const { data, error } = await supabase.from("cart_items").select("product_id, quantity").eq("cart_id", cart.id);
    if (error) throw error;
    return Object.fromEntries(data.map((item) => [item.product_id, item.quantity]));
  },
  async setCartItem(productId: string, quantity: number) {
    const { error } = await supabase.rpc("set_cart_item", { product: productId, item_quantity: quantity });
    if (error) throw error;
  },
  async placeOrder(deliveryAddress: Record<string, unknown>, deliveryDistanceKm = 0) {
    const checkout = await this.apiRequest("/api/v1/payments/paytm/initiate", {
      deliveryAddress,
      deliveryDistanceKm,
    }) as {
      orderId: string;
      txnToken: string;
      amount: string;
      mid: string;
      callbackUrl: string;
      isStaging: boolean;
    };
    let paytmResult: unknown;
    try {
      paytmResult = await AllInOneSDKManager.startTransaction(
        checkout.orderId,
        checkout.mid,
        checkout.txnToken,
        checkout.amount,
        checkout.callbackUrl,
        checkout.isStaging,
        false,
        "sonman-customer"
      );
    } catch (cause) {
      throw new Error(paymentErrorMessage(cause));
    }
    ensurePaytmPaymentWasNotCancelled(paytmResult);
    await this.apiRequest("/api/v1/payments/paytm/verify", {
      deliveryAddress,
      deliveryDistanceKm,
      orderId: checkout.orderId,
    });
  },
  async listOrders(): Promise<CustomerOrder[]> {
    const { data, error } = await supabase.from("orders")
      .select("id, order_number, status, total_amount, delivery_fee_amount, expected_delivery_date, delivery_quote_required, created_at, order_items(id, product_name, quantity)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      total: Number(order.total_amount),
      deliveryFee: Number(order.delivery_fee_amount),
      expectedDeliveryDate: order.expected_delivery_date,
      deliveryQuoteRequired: order.delivery_quote_required,
      createdAt: order.created_at,
      items: order.order_items.map((item) => ({ id: item.id, name: item.product_name, quantity: item.quantity })),
    }));
  },
});
