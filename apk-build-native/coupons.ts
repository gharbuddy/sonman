import type { SupabaseClient } from "@sonman/auth-service";

export type CouponDiscountType = "fixed" | "percentage";

export type CouponRow = {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number | string;
  minimum_order_amount: number | string;
  expires_at: string | null;
  discount_amount: number | string;
};

export type AppliedCoupon = {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  expiresAt: string | null;
  discountAmount: number;
};

export function calculateCouponDiscount(
  coupon: Pick<AppliedCoupon, "discountType" | "discountValue">,
  subtotal: number,
) {
  const safeSubtotal = Math.max(0, subtotal);
  const discountValue = Math.max(0, Number(coupon.discountValue || 0));

  if (coupon.discountType === "percentage") {
    return Math.min(safeSubtotal, Math.round((safeSubtotal * discountValue) / 100));
  }

  return Math.min(safeSubtotal, Math.round(discountValue));
}

export const createCouponsService = (supabase: SupabaseClient) => ({
  async validateCoupon(code: string, subtotal: number): Promise<AppliedCoupon> {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) throw new Error("Enter a coupon code.");

    const { data, error } = await supabase.rpc("validate_coupon", {
      input_code: normalizedCode,
      order_subtotal: subtotal,
    });

    if (error) throw error;
    const coupon = Array.isArray(data) ? data[0] as CouponRow | undefined : data as CouponRow | undefined;
    if (!coupon) throw new Error("Coupon code was not found.");

    const minimumOrderAmount = Number(coupon.minimum_order_amount || 0);

    const applied: AppliedCoupon = {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: Number(coupon.discount_value),
      minimumOrderAmount,
      expiresAt: coupon.expires_at,
      discountAmount: Number(coupon.discount_amount),
    };

    if (!applied.discountAmount) throw new Error("This coupon does not change the current order total.");
    return applied;
  },
});
