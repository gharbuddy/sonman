import type { CustomerProduct } from "./products";

export type DeliveryZone = "A" | "B" | "C";
export type DeliverySize = "small" | "medium" | "large" | "heavy";

const sizeRank: Record<DeliverySize, number> = { small: 1, medium: 2, large: 3, heavy: 4 };

export const zoneForDistance = (distanceKm: number): DeliveryZone =>
  distanceKm <= 10 ? "A" : distanceKm <= 30 ? "B" : "C";

export const expectedDeliveryDate = (now = new Date()) => {
  const localHour = Number(new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(now));
  const date = new Date(now);
  date.setDate(date.getDate() + (localHour < 18 ? 1 : 2));
  return date;
};

export const formatDeliveryDate = (date: Date) =>
  date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

const feeFor = (size: DeliverySize, zone: DeliveryZone) => {
  if (size === "small" && zone === "A") return 50;
  if (size === "small" && zone === "B") return 100;
  if (size === "medium" && zone === "A") return 100;
  if (size === "medium" && zone === "B") return 180;
  return null;
};

export const quoteDelivery = (products: CustomerProduct[], distanceKm: number) => {
  const zone = zoneForDistance(distanceKm);
  const vendorSizes = new Map<string, DeliverySize>();
  for (const product of products) {
    const current = vendorSizes.get(product.vendorId);
    if (!current || sizeRank[product.deliverySize] > sizeRank[current]) vendorSizes.set(product.vendorId, product.deliverySize);
  }
  const fees = [...vendorSizes.values()].map((size) => feeFor(size, zone));
  return {
    zone,
    expectedDate: expectedDeliveryDate(),
    fee: fees.some((fee) => fee === null) ? null : fees.reduce<number>((sum, fee) => sum + (fee ?? 0), 0),
  };
};
