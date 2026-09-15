import { PRODUCTS } from "./catalog";
import { localPaymentService } from "./local-provider";
import type { Entitlement, PaymentService, ProductId, PurchaseResult } from "./types";

type NativePaymentApi = {
  getEntitlement: () => string;
  isPremium: () => boolean | string;
  purchase: (productId: string) => string;
  restore: () => string;
  getProducts?: () => string;
  getProviderId?: () => string;
};

declare global {
  interface Window {
    NativePayment?: NativePaymentApi;
    NovaPayment?: NativePaymentApi;
  }
}

function getNativePayment(): NativePaymentApi | null {
  if (typeof window === "undefined") return null;
  return window.NativePayment ?? window.NovaPayment ?? null;
}

function parse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const none: Entitlement = { premium: false, source: "none", updatedAt: 0 };

export const nativePaymentService: PaymentService = {
  providerId: "android-store",

  async getProducts() {
    const api = getNativePayment();
    if (api?.getProducts) {
      const parsed = parse<typeof PRODUCTS>(api.getProducts(), PRODUCTS);
      return parsed.length ? parsed : PRODUCTS;
    }
    return PRODUCTS;
  },

  async getEntitlement() {
    const api = getNativePayment();
    if (!api) return localPaymentService.getEntitlement();
    return parse<Entitlement>(api.getEntitlement(), none);
  },

  async isPremium() {
    const api = getNativePayment();
    if (!api) return localPaymentService.isPremium();
    const raw = api.isPremium();
    if (typeof raw === "boolean") return raw;
    return parse<{ premium?: boolean }>(raw, {}).premium === true;
  },

  async purchase(productId: ProductId): Promise<PurchaseResult> {
    const api = getNativePayment();
    if (!api) return localPaymentService.purchase(productId);
    return parse<PurchaseResult>(api.purchase(productId), {
      ok: false,
      error: "فروشگاه پاسخی نداد.",
    });
  },

  async restore() {
    const api = getNativePayment();
    if (!api) return localPaymentService.restore();
    return parse<Entitlement>(api.restore(), none);
  },
};

export function resolvePaymentService(): PaymentService {
  return getNativePayment() ? nativePaymentService : localPaymentService;
}
