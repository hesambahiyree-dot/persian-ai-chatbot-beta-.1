import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FREE_DAILY_MESSAGES } from "@/lib/inference/config";
import { loadEntitlement, payment } from "@/lib/payment";
import type { Entitlement, ProductId } from "@/lib/payment";
import { todayKey } from "@/lib/utils";

type PremiumState = {
  entitlement: Entitlement;
  usedToday: number;
  usedOn: string;
  ready: boolean;
  refresh: () => Promise<void>;
  registerSend: () => { allowed: boolean; remaining: number };
  remainingToday: () => number;
  markPurchased: (productId: ProductId) => void;
};

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      entitlement: { premium: false, source: "none", updatedAt: 0 },
      usedToday: 0,
      usedOn: todayKey(),
      ready: false,

      remainingToday: () => {
        const s = get();
        if (s.entitlement.premium) return Number.POSITIVE_INFINITY;
        const used = s.usedOn === todayKey() ? s.usedToday : 0;
        return Math.max(0, FREE_DAILY_MESSAGES - used);
      },

      registerSend: () => {
        const s = get();
        if (s.entitlement.premium) return { allowed: true, remaining: Number.POSITIVE_INFINITY };
        const day = todayKey();
        const used = s.usedOn === day ? s.usedToday : 0;
        if (used >= FREE_DAILY_MESSAGES) {
          return { allowed: false, remaining: 0 };
        }
        set({ usedToday: used + 1, usedOn: day });
        return { allowed: true, remaining: FREE_DAILY_MESSAGES - used - 1 };
      },

      markPurchased: (productId) => {
        set({
          entitlement: {
            premium: true,
            productId,
            source: "local",
            updatedAt: Date.now(),
          },
        });
      },

      refresh: async () => {
        try {
          const entitlement = await loadEntitlement();
          const premium = await payment().isPremium();
          set({
            entitlement: { ...entitlement, premium },
            ready: true,
          });
        } catch {
          set({ ready: true });
        }
      },
    }),
    {
      name: "nova.premium.v1",
      partialize: (s) => ({
        entitlement: s.entitlement,
        usedToday: s.usedToday,
        usedOn: s.usedOn,
      }),
    },
  ),
);
