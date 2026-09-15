import { PRODUCTS } from "./catalog";
import type { Entitlement, PaymentService, ProductId, PurchaseResult } from "./types";

const STORAGE_KEY = "nova.entitlement.v1";

function empty(): Entitlement {
  return { premium: false, source: "none", updatedAt: Date.now() };
}

function read(): Entitlement {
  if (typeof localStorage === "undefined") return empty();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Entitlement;
    return {
      premium: Boolean(parsed.premium),
      productId: parsed.productId,
      source: parsed.premium ? parsed.source || "local" : "none",
      updatedAt: parsed.updatedAt || Date.now(),
    };
  } catch {
    return empty();
  }
}

function write(next: Entitlement): Entitlement {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

/**
 * Development / web adapter. Does not charge money and stores no secrets.
 * Swap this for CafeBazaarPaymentService or PlayBillingPaymentService
 * without touching the UI.
 */
export const localPaymentService: PaymentService = {
  providerId: "local-debug",

  async getProducts() {
    return PRODUCTS;
  },

  async getEntitlement() {
    return read();
  },

  async isPremium() {
    return read().premium;
  },

  async purchase(productId: ProductId): Promise<PurchaseResult> {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      return { ok: false, error: "محصول ناشناخته است." };
    }
    const entitlement = write({
      premium: true,
      productId,
      source: "local",
      updatedAt: Date.now(),
    });
    return { ok: true, entitlement };
  },

  async restore() {
    return read();
  },
};

export function clearLocalEntitlement(): Entitlement {
  return write(empty());
}
