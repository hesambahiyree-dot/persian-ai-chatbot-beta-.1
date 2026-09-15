import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";

export function ModelStatusChip() {
  const status = useChatStore((s) => s.status);

  const label =
    status.code === "ready"
      ? "آفلاین"
      : status.code === "web-preview"
        ? "پیش‌نمایش"
        : status.code === "loading"
          ? "بارگذاری"
          : status.code === "missing"
            ? "بدون مدل"
            : "نامشخص";

  const tone =
    status.code === "ready"
      ? "bg-primary/15 text-primary-dark"
      : status.code === "web-preview"
        ? "bg-surface-2 text-muted"
        : status.code === "loading"
          ? "bg-surface-2 text-muted"
          : "bg-danger/10 text-danger";

  return (
    <span
      className={cn(
        "hidden max-w-28 truncate rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline",
        tone,
      )}
      title={status.message}
    >
      {label}
    </span>
  );
}
