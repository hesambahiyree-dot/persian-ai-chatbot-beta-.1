import { Menu, Sparkles } from "lucide-react";
import { NovaLogo } from "@/components/brand/nova-logo";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chat-store";
import { usePremiumStore } from "@/stores/premium-store";
import { ModelStatusChip } from "./model-status";

export function ChatHeader() {
  const setPanel = useChatStore((s) => s.setPanel);
  const premium = usePremiumStore((s) => s.entitlement.premium);

  return (
    <header className="flex items-center gap-3 border-b border-border/80 bg-surface/80 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 rounded-lg"
        onClick={() => setPanel("sidebar")}
        aria-label="فهرست گفتگوها"
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="grid size-10 place-items-center overflow-hidden rounded-lg bg-bg">
          <NovaLogo className="size-9" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-semibold tracking-tight">NOVA AI</h1>
            {premium ? (
              <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-medium text-primary-dark">
                ویژه
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted">دستیار هوشمند فارسی</p>
        </div>
      </div>

      <ModelStatusChip />

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 rounded-lg"
        onClick={() => setPanel("premium")}
        aria-label="نوا ویژه"
      >
        <Sparkles className="size-5 text-primary-dark" />
      </Button>
    </header>
  );
}
