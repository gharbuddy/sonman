import type { SupabaseClient } from "@sonman/auth-service";

export type CustomerProduct = {
  id: string;
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
};

type ProductRow = {
  id: string; name: string; description: string | null; price: string | number;
  categories: { name: string } | null;
  product_images: { storage_path: string; is_primary: boolean; sort_order: number }[] | null;
};

export async function loadActiveProducts(supabase: SupabaseClient): Promise<CustomerProduct[]> {
  const { data, error } = await supabase.from("products")
    .select("id, name, description, price, categories(name), product_images(storage_path, is_primary, sort_order)")
    .eq("is_active", true).is("deleted_at", null).order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as ProductRow[]).map((row) => {
    const image = [...(row.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];
    const price = Number(row.price);
    return { id: row.id, name: row.name, category: row.categories?.name ?? "", price, oldPrice: price, rating: 0, reviews: 0, delivery: "tomorrow", image: image ? supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl : "", description: row.description ?? "" };
  });
}
