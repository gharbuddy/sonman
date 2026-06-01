import type { SupabaseClient } from "@sonman/auth-service";

export type Category = { id: string; name: string };
export type DeliverySize = "small" | "medium" | "large" | "heavy";
export type VendorProduct = {
  id: string;
  categoryId: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "Active" | "Low stock" | "Draft" | "Pending Review" | "Rejected";
  image: string;
  sku: string;
  description: string;
  deliverySize: DeliverySize;
  variants: string[];
};

type ProductRow = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  is_active: boolean;
  approval_status: "draft" | "pending_review" | "approved" | "rejected";
  delivery_size: DeliverySize;
  variants: string[];
  categories: { name: string } | null;
  inventory: { quantity_available: number } | { quantity_available: number }[] | null;
  product_images: { storage_path: string; is_primary: boolean; sort_order: number }[] | null;
};

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const mapProduct = (supabase: SupabaseClient, row: ProductRow): VendorProduct => {
  const stock = Array.isArray(row.inventory)
  ? row.inventory[0]?.quantity_available ?? 0
  : row.inventory?.quantity_available ?? 0;
  const image = [...(row.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    category: row.categories?.name ?? "",
    price: Number(row.price),
    stock,
    status: row.approval_status === "pending_review"
      ? "Pending Review"
      : row.approval_status === "rejected"
        ? "Rejected"
        : row.approval_status === "draft"
          ? "Draft"
          : stock < 8 ? "Low stock" : "Active",
    image: image ? supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl : "",
    sku: row.slug,
    description: row.description ?? "",
    deliverySize: row.delivery_size,
    variants: row.variants ?? [],
  };
};

export const createVendorProductsService = (supabase: SupabaseClient) => ({
  async listCategories() {
    const { data, error } = await supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order");
    if (error) throw error;
    return data as Category[];
  },
  async list() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      category_id,
      name,
      slug,
      description,
      price,
      is_active,
      approval_status,
      delivery_size,
      variants,
      categories(name),
      inventory!inventory_product_id_fkey(quantity_available),
      product_images(storage_path, is_primary, sort_order)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as ProductRow[]).map((row) =>
    mapProduct(supabase, row),
  );
},
  async save(input: { product?: VendorProduct; categoryId: string; name: string; description: string; price: number; stock: number; deliverySize: DeliverySize; variants: string[]; image?: { uri: string; mimeType?: string | null; fileName?: string | null } }) {
    const { data: vendor, error: vendorError } = await supabase.from("vendors").select("id").single();
    if (vendorError || !vendor) throw vendorError ?? new Error("Vendor profile is unavailable.");
    const values = { vendor_id: vendor.id, category_id: input.categoryId, name: input.name.trim(), slug: slugify(input.name), description: input.description.trim(), price: input.price, currency: "INR", delivery_size: input.deliverySize, variants: input.variants };
    const query = input.product ? supabase.from("products").update(values).eq("id", input.product.id) : supabase.from("products").insert(values);
    const { data: product, error } = await query.select("id").single();
    if (error) throw error;
    const { error: inventoryError } = await supabase.from("inventory").upsert({ product_id: product.id, quantity_available: input.stock }, { onConflict: "product_id" });
    if (inventoryError) throw inventoryError;
    if (input.image) {
      const extension = input.image.fileName?.split(".").pop() || input.image.mimeType?.split("/").pop() || "jpg";
      const storagePath = `${vendor.id}/${product.id}/${Date.now()}.${extension}`;
      const file = await fetch(input.image.uri).then((response) => response.arrayBuffer());
      const { error: uploadError } = await supabase.storage.from("product-images").upload(storagePath, file, { contentType: input.image.mimeType ?? undefined });
      if (uploadError) throw uploadError;
      await supabase.from("product_images").update({ is_primary: false }).eq("product_id", product.id);
      const { error: imageError } = await supabase.from("product_images").insert({ product_id: product.id, storage_path: storagePath, alt_text: input.name.trim(), is_primary: true });
      if (imageError) throw imageError;
    }
  },
});
