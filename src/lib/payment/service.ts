import { resolvePaymentService } from "./native-provider";
import type { Entitlement, PaymentService, ProductId, PurchaseResult } from "./types";

/** UI talks only to this module. Store SDK swaps happen behind PaymentService. */
export function payment(): PaymentService {
  return resolvePaymentService();
}

export async function checkPremium(): Promise<boolean> {
  return payment().isPremium();
}

export async function loadEntitlement(): Promise<Entitlement> {
  return payment().getEntitlement();
}

export async function buyPremium(productId: ProductId): Promise<PurchaseResult> {
  return payment().purchase(productId);
}

export async function restorePurchases(): Promise<Entitlement> {
  return payment().restore();
}
