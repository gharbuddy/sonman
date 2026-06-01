import type { SupabaseClient } from "@sonman/auth-service";
import type { DeliverySize } from "./delivery";

export type CustomerProduct = {
  id: string;
  vendorId: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviews: number;
  delivery: string;
  image: string;
  badge?: string;
  description: string;
  deliverySize: DeliverySize;
};

type ProductRow = {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: string | number;
  delivery_size: DeliverySize;
  categories: { name: string } | null;
  vendors: { approval_status: string } | null;
  product_images:
    | { storage_path: string; is_primary: boolean; sort_order: number }[]
    | null;
};

export async function loadActiveProducts(
  supabase: SupabaseClient,
): Promise<CustomerProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, vendor_id, name, description, price, delivery_size, categories(name), vendors!inner(approval_status), product_images(storage_path, is_primary, sort_order)",
    )
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .eq("vendors.approval_status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as unknown as ProductRow[]).map((row) => {
    const image = [...(row.product_images ?? [])].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        a.sort_order - b.sort_order,
    )[0];

    const price = Number(row.price);

    return {
      id: row.id,
      vendorId: row.vendor_id,
      name: row.name,
      category: row.categories?.name ?? "",
      price,
      oldPrice: price,
      rating: 0,
      reviews: 0,
      delivery: "standard",
      image: image
        ? supabase.storage.from("product-images").getPublicUrl(image.storage_path)
            .data.publicUrl
        : "",
      description: row.description ?? "",
      deliverySize: row.delivery_size,
    };
  });
}
