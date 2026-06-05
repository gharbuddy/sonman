import type { SupabaseClient } from "@sonman/auth-service";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://underpass-dig-vessel.ngrok-free.dev";

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
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;
    if (!session) throw new Error("Sign in to place your order.");

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await response.json() as T & { error?: string };

    if (!response.ok) {
      throw new Error(result.error ?? "Payment request failed.");
    }

    return result;
  },

  async loadCart(): Promise<Record<string, number>> {
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .maybeSingle();

    if (cartError) throw cartError;
    if (!cart) return {};

    const { data, error } = await supabase
      .from("cart_items")
      .select("product_id, quantity")
      .eq("cart_id", cart.id);

    if (error) throw error;

    return Object.fromEntries(data.map((item) => [item.product_id, item.quantity]));
  },

  async setCartItem(productId: string, quantity: number) {
    const { error } = await supabase.rpc("set_cart_item", {
      product: productId,
      item_quantity: quantity,
    });

    if (error) throw error;
  },

  async placeOrder(deliveryAddress: Record<string, unknown>, deliveryDistanceKm = 0, paymentReference?: string) {
    await this.apiRequest("/api/v1/payments/upi/manual-confirm", {
      deliveryAddress,
      deliveryDistanceKm,
      paymentReference: paymentReference?.trim() || undefined,
    });
  },

  async listOrders(): Promise<CustomerOrder[]> {
    const { data, error } = await supabase
      .from("orders")
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
      items: order.order_items.map((item) => ({
        id: item.id,
        name: item.product_name,
        quantity: item.quantity,
      })),
    }));
  },
});
