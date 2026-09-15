import { cn } from "@/lib/utils";
import type { UiMessage } from "@/stores/chat-store";

export function MessageBubble({ message }: { message: UiMessage }) {
  const mine = message.role === "user";

  return (
    <div
      className={cn(
        "nova-rise flex w-full",
        mine ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-7 shadow-[var(--shadow-soft)]",
          mine
            ? "rounded-bl-md bg-user text-user-fg"
            : "rounded-br-md border border-border/70 bg-surface text-fg",
        )}
      >
        {message.pending && !message.content ? (
          <span className="nova-dots inline-flex items-center gap-1 px-1" aria-label="در حال نوشتن">
            <span className="size-1.5 rounded-full bg-current" />
            <span className="size-1.5 rounded-full bg-current" />
            <span className="size-1.5 rounded-full bg-current" />
          </span>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        {message.error ? (
          <p className="mt-1 text-xs text-danger">{message.error}</p>
        ) : null}
      </div>
    </div>
  );
}
