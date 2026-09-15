import type { Product } from "./types";

/**
 * Public product identifiers. Prices are resolved by the store SDK at runtime.
 * No merchant keys, RSA secrets, or billing tokens live here.
 */
export const PRODUCTS: Product[] = [
  {
    id: "nova_premium_monthly",
    title: "نوا ویژه — ماهانه",
    description: "پیام نامحدود و سقف توکن بالاتر، تمدید ماهانه از فروشگاه.",
    period: "monthly",
    storePriceLabel: "قیمت در فروشگاه",
  },
  {
    id: "nova_premium_lifetime",
    title: "نوا ویژه — یک‌بار پرداخت",
    description: "خرید دائمی روی همین حساب فروشگاه.",
    period: "lifetime",
    storePriceLabel: "قیمت در فروشگاه",
  },
];

export const PRODUCT_IDS = PRODUCTS.map((p) => p.id);
