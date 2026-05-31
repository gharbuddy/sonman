import type { SupabaseClient } from "@sonman/auth-service";

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
  createdAt: string;
  items: { id: string; name: string; quantity: number }[];
};

export const createCustomerOrdersService = (supabase: SupabaseClient) => ({
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
  async placeOrder() {
    const { error } = await supabase.rpc("place_cart_order", {
      delivery_address: { label: "Placeholder address", payment: "placeholder" },
      policy_acknowledged: true,
    });
    if (error) throw error;
  },
  async listOrders(): Promise<CustomerOrder[]> {
    const { data, error } = await supabase.from("orders")
      .select("id, order_number, status, total_amount, created_at, order_items(id, product_name, quantity)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      total: Number(order.total_amount),
      createdAt: order.created_at,
      items: order.order_items.map((item) => ({ id: item.id, name: item.product_name, quantity: item.quantity })),
    }));
  },
});
