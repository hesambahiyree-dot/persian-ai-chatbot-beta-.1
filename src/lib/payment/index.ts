export { PRODUCTS, PRODUCT_IDS } from "./catalog";
export {
  buyPremium,
  checkPremium,
  loadEntitlement,
  payment,
  restorePurchases,
} from "./service";
export { clearLocalEntitlement } from "./local-provider";
export type {
  Entitlement,
  PaymentService,
  Product,
  ProductId,
  PurchaseResult,
} from "./types";
