import type { SupabaseClient, UserProfile } from "@sonman/auth-service";

export type CustomerAddress = {
  id: string;
  label: string;
  recipientName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

export type AddressInput = Omit<CustomerAddress, "id" | "isDefault">;

const mapAddress = (row: Record<string, unknown>): CustomerAddress => ({
  id: String(row.id),
  label: String(row.label),
  recipientName: String(row.recipient_name),
  line1: String(row.line1),
  line2: String(row.line2 ?? ""),
  city: String(row.city),
  state: String(row.state),
  postalCode: String(row.postal_code),
  isDefault: Boolean(row.is_default),
});

export const addressText = (address?: CustomerAddress) =>
  address ? [address.line1, address.line2, address.city, address.state, address.postalCode].filter(Boolean).join(", ") : "";

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "CU";

export const createCustomerProfileService = (supabase: SupabaseClient) => ({
  async getProfile(): Promise<UserProfile> {
    const { data, error } = await supabase.from("users").select("id, role, email, phone, full_name, is_active").single();
    if (error) throw error;
    return data as UserProfile;
  },
  async listAddresses(): Promise<CustomerAddress[]> {
    const { data, error } = await supabase.from("customer_addresses").select("*").order("is_default", { ascending: false }).order("created_at");
    if (error) throw error;
    return data.map(mapAddress);
  },
  async saveAddress(input: AddressInput, id?: string) {
    const values = { label: input.label.trim(), recipient_name: input.recipientName.trim(), line1: input.line1.trim(), line2: input.line2.trim() || null, city: input.city.trim(), state: input.state.trim(), postal_code: input.postalCode.trim() };
    if (id) {
      const { error } = await supabase.from("customer_addresses").update(values).eq("id", id);
      if (error) throw error;
      return;
    }
    const { data: customer, error: customerError } = await supabase.from("customers").select("id").single();
    if (customerError) throw customerError;
    const { error } = await supabase.from("customer_addresses").insert({ ...values, customer_id: customer.id });
    if (error) throw error;
  },
  async deleteAddress(id: string) {
    const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
    if (error) throw error;
  },
  async setDefaultAddress(id: string) {
    const { error } = await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id);
    if (error) throw error;
  },
});
