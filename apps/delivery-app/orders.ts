import type { SupabaseClient } from "@sonman/auth-service";

export type DeliveryOrderStatus = "Available" | "Assigned" | "Picked up" | "Delivered";
export type DeliveryOrder = {
  id: string;
  customer: string;
  vendor: string;
  pickup: string;
  delivery: string;
  distance: string;
  expected: string;
  value: number;
  earnings: number;
  status: DeliveryOrderStatus;
  items: string;
};

type DeliveryOrderRow = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number | string;
  delivery_address: Record<string, unknown>;
  vendors: { business_name: string; business_address: Record<string, unknown> } | null;
  order_items: { product_name: string; quantity: number }[];
};

const addressLabel = (address: Record<string, unknown> | null | undefined, fallback: string) => {
  if (!address) return fallback;
  return String(address.label ?? address.address ?? fallback);
};

const displayStatus = (order: DeliveryOrderRow, assignment?: { status: string }): DeliveryOrderStatus => {
  if (!assignment) return "Available";
  if (order.status === "delivered" || assignment.status === "delivered") return "Delivered";
  if (order.status === "picked_up" || order.status === "out_for_delivery" || assignment.status === "picked_up") return "Picked up";
  return "Assigned";
};

export const createDeliveryOrdersService = (supabase: SupabaseClient) => ({
  async list(): Promise<DeliveryOrder[]> {
    const { data, error } = await supabase.from("orders")
      .select("id, order_number, status, total_amount, delivery_address, vendors(business_name, business_address), order_items(product_name, quantity)")
      .in("status", ["ready_for_pickup", "picked_up", "out_for_delivery", "delivered"])
      .order("created_at", { ascending: false });
    if (error) throw error;
    const { data: assignments, error: assignmentsError } = await supabase.from("delivery_assignments")
      .select("order_id, status")
      .order("created_at", { ascending: false });
    if (assignmentsError) throw assignmentsError;
    const assignmentsByOrder = new Map(assignments.map((assignment) => [assignment.order_id, assignment]));
    return (data as unknown as DeliveryOrderRow[]).map((order) => ({
      id: order.id,
      customer: "Customer",
      vendor: order.vendors?.business_name ?? "Vendor",
      pickup: addressLabel(order.vendors?.business_address, "Vendor pickup address"),
      delivery: addressLabel(order.delivery_address, "Customer delivery address"),
      distance: "Route pending",
      expected: "ETA pending",
      value: Number(order.total_amount),
      earnings: 0,
      status: displayStatus(order, assignmentsByOrder.get(order.id)),
      items: order.order_items.map((item) => `${item.quantity} x ${item.product_name}`).join(", "),
    }));
  },
  async accept(orderId: string) {
    const { error } = await supabase.rpc("accept_delivery_order", { target_order_id: orderId });
    if (error) throw error;
  },
  async markPickedUp(orderId: string) {
    const { error: pickupError } = await supabase.rpc("advance_delivery_order", { target_order_id: orderId, next_status: "picked_up" });
    if (pickupError) throw pickupError;
    const { error: routeError } = await supabase.rpc("advance_delivery_order", { target_order_id: orderId, next_status: "out_for_delivery" });
    if (routeError) throw routeError;
  },
  async markDelivered(orderId: string, otp: string) {
    const { error } = await supabase.rpc("advance_delivery_order", {
      target_order_id: orderId,
      next_status: "delivered",
      delivery_otp_input: otp,
      proof_path_input: "placeholder/delivery-proof-image.jpg",
    });
    if (error) throw error;
  },
  subscribe(onChange: () => void) {
    return supabase.channel("delivery-order-lifecycle")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_assignments" }, onChange)
      .subscribe();
  },
});
