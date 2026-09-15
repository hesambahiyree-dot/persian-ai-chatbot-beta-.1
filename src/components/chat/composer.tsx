import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FREE_DAILY_MESSAGES } from "@/lib/inference/config";
import { useChatStore } from "@/stores/chat-store";
import { usePremiumStore } from "@/stores/premium-store";

export function Composer() {
  const [value, setValue] = useState("");
  const sending = useChatStore((s) => s.sending);
  const ready = useChatStore((s) => s.status.ready);
  const send = useChatStore((s) => s.send);
  const setPanel = useChatStore((s) => s.setPanel);
  const premium = usePremiumStore((s) => s.entitlement.premium);
  const remaining = usePremiumStore((s) => s.remainingToday());
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const disabled = sending || !ready || !value.trim();

  const submit = () => {
    if (disabled) return;
    const text = value;
    setValue("");
    void send(text);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border/80 bg-surface/90 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-xl border border-border bg-bg p-2 shadow-[var(--shadow-soft)]">
        <Textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          placeholder="پیام خود را بنویسید…"
          disabled={sending || !ready}
          className="min-h-11 border-0 bg-transparent px-2 py-2.5 shadow-none focus:ring-0"
        />
        <Button
          size="icon"
          className="shrink-0 rounded-lg"
          disabled={disabled}
          onClick={submit}
          aria-label="ارسال"
        >
          <ArrowUp className="size-5" />
        </Button>
      </div>
      <div className="mx-auto mt-2 flex max-w-2xl items-center justify-between px-1 text-[11px] text-subtle">
        <span>
          {premium
            ? "نسخه ویژه — پیام نامحدود"
            : `${Math.max(0, remaining === Number.POSITIVE_INFINITY ? FREE_DAILY_MESSAGES : remaining)} از ${FREE_DAILY_MESSAGES} پیام رایگان امروز`}
        </span>
        {!premium ? (
          <button
            type="button"
            className="text-primary-dark"
            onClick={() => setPanel("premium")}
          >
            ارتقا به ویژه
          </button>
        ) : null}
      </div>
    </div>
  );
}
