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

const NEXT_STATUS: Record<string, string> = {
  pending: "accepted",
  accepted: "packed",
  packed: "ready_for_pickup",
};

export type VendorOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  item: string;
  amount: number;
  status: string;
  time: string;
};
type VendorOrderRow = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number | string;
  created_at: string;
  customers: { users: { full_name: string } | null } | null;
  order_items: { product_name: string; quantity: number }[];
};

export const createVendorOrdersService = (supabase: SupabaseClient) => ({
  async list(): Promise<VendorOrder[]> {
    const { data, error } = await supabase.from("orders")
      .select("id, order_number, status, total_amount, created_at, customers(users(full_name)), order_items(product_name, quantity)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as VendorOrderRow[]).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customer: order.customers?.users?.full_name || "Customer",
      item: order.order_items.map((item) => `${item.quantity} x ${item.product_name}`).join(", "),
      amount: Number(order.total_amount),
      status: order.status,
      time: new Date(order.created_at).toLocaleString(),
    }));
  },
  nextStatus(status: string) {
    return NEXT_STATUS[status];
  },
  async advance(orderId: string, status: string) {
    const next = NEXT_STATUS[status];
    if (!next) return;
    const { error } = await supabase.rpc("update_order_status", { order_id: orderId, next_status: next });
    if (error) throw error;
  },
});
