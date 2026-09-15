import { Check, X } from "lucide-react";
import { useState } from "react";
import { NovaLogo } from "@/components/brand/nova-logo";
import { Button } from "@/components/ui/button";
import { PRODUCTS, buyPremium, restorePurchases } from "@/lib/payment";
import type { ProductId } from "@/lib/payment";
import { useChatStore } from "@/stores/chat-store";
import { usePremiumStore } from "@/stores/premium-store";

const PERKS = [
  "پیام روزانه نامحدود",
  "سقف توکن خروجی بالاتر",
  "اولویت پشتیبانی مدل آفلاین",
];

export function PremiumSheet() {
  const open = useChatStore((s) => s.panel === "premium");
  const setPanel = useChatStore((s) => s.setPanel);
  const entitlement = usePremiumStore((s) => s.entitlement);
  const refresh = usePremiumStore((s) => s.refresh);
  const markPurchased = usePremiumStore((s) => s.markPurchased);
  const [busy, setBusy] = useState<ProductId | "restore" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (id: ProductId) => {
    setBusy(id);
    setError(null);
    try {
      const result = await buyPremium(id);
      if (!result.ok) {
        setError(result.cancelled ? "خرید لغو شد." : result.error);
        return;
      }
      markPurchased(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خرید انجام نشد.");
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    setBusy("restore");
    setError(null);
    try {
      await restorePurchases();
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-fg/25"
        onClick={() => setPanel("none")}
      />
      <section
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-2xl bg-surface p-5 shadow-[var(--shadow-float)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NovaLogo className="size-7" />
            <h2 className="text-base font-semibold">نوا ویژه</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setPanel("none")} aria-label="بستن">
            <X className="size-4" />
          </Button>
        </div>

        {entitlement.premium ? (
          <p className="rounded-lg bg-primary/12 px-3 py-2 text-sm text-primary-dark">
            اشتراک ویژه فعال است
            {entitlement.productId ? ` (${entitlement.productId})` : ""}.
          </p>
        ) : (
          <p className="text-sm leading-6 text-muted">
            پرداخت از طریق فروشگاه اندروید انجام می‌شود. هیچ کلید خصوصی یا اطلاعات درگاه داخل
            برنامه ذخیره نشده است.
          </p>
        )}

        <ul className="mt-4 space-y-2">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-primary" />
              {p}
            </li>
          ))}
        </ul>

        <div className="mt-5 grid gap-2">
          {PRODUCTS.map((product) => (
            <Button
              key={product.id}
              variant={product.period === "lifetime" ? "default" : "outline"}
              className="h-auto flex-col items-start rounded-xl px-4 py-3"
              disabled={Boolean(busy) || entitlement.premium}
              onClick={() => buy(product.id)}
            >
              <span className="text-sm font-semibold">{product.title}</span>
              <span className="text-xs opacity-80">{product.storePriceLabel}</span>
            </Button>
          ))}
        </div>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-muted"
          disabled={Boolean(busy)}
          onClick={restore}
        >
          بازیابی خریدهای قبلی
        </button>
      </section>
    </>
  );
}
