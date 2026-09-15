import { NovaLogo } from "@/components/brand/nova-logo";
import { useChatStore } from "@/stores/chat-store";

const SUGGESTIONS = [
  "یک برنامهٔ روزانه منظم برای مطالعه پیشنهاد بده",
  "این جمله را ساده‌تر و محترمانه‌تر بازنویسی کن",
  "تفاوت یادگیری نظارت‌شده و بدون نظارت چیست؟",
];

export function EmptyState() {
  const send = useChatStore((s) => s.send);
  const sending = useChatStore((s) => s.sending);
  const ready = useChatStore((s) => s.status.ready);

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="grid size-24 place-items-center rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
        <NovaLogo className="size-16" />
      </span>
      <h2 className="mt-5 text-xl font-semibold">سلام، من نوا هستم</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
        دستیار فارسی شما. روی گوشی اندروید پاسخ‌ها با Gemma 3 به‌صورت آفلاین ساخته
        می‌شود.
      </p>
      <ul className="mt-6 grid w-full gap-2">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              disabled={sending || !ready}
              onClick={() => send(s)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-right text-sm leading-6 text-fg transition-colors duration-150 hover:border-primary/40 hover:bg-surface-2 disabled:opacity-50"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
