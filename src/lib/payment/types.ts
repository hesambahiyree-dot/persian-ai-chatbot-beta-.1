export type ProductId = "nova_premium_monthly" | "nova_premium_lifetime";

export type Product = {
  id: ProductId;
  title: string;
  description: string;
  period: "monthly" | "lifetime";
  storePriceLabel: string;
};

export type Entitlement = {
  premium: boolean;
  productId?: ProductId;
  source: "store" | "local" | "none";
  updatedAt: number;
};

export type PurchaseResult =
  | { ok: true; entitlement: Entitlement }
  | { ok: false; error: string; cancelled?: boolean };

export interface PaymentService {
  readonly providerId: string;
  getProducts(): Promise<Product[]>;
  getEntitlement(): Promise<Entitlement>;
  isPremium(): Promise<boolean>;
  purchase(productId: ProductId): Promise<PurchaseResult>;
  restore(): Promise<Entitlement>;
}
