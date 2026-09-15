import { FolderOpen, RefreshCw } from "lucide-react";
import { NovaLogo } from "@/components/brand/nova-logo";
import { Button } from "@/components/ui/button";
import { MODEL, MODEL_SEARCH_HINTS } from "@/lib/inference/config";
import { useChatStore } from "@/stores/chat-store";

export function ModelMissing() {
  const status = useChatStore((s) => s.status);
  const hydrateStatus = useChatStore((s) => s.hydrateStatus);

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="grid size-24 place-items-center rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
        <NovaLogo className="size-16 opacity-70" />
      </span>
      <h2 className="mt-5 text-xl font-semibold">مدل نصب نشده</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
        فایل {MODEL.fileName} پیدا نشد. برنامه بدون مدل هم اجرا می‌شود؛ برای گفتگوی
        آفلاین، مدل Gemma را در یکی از مسیرهای زیر قرار دهید.
      </p>
      <ul className="mt-5 w-full space-y-2 text-right">
        {MODEL_SEARCH_HINTS.map((path) => (
          <li
            key={path}
            className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2.5 text-xs leading-5 text-muted"
          >
            <FolderOpen className="mt-0.5 size-4 shrink-0 text-primary" />
            <code className="break-all font-sans">{path}</code>
          </li>
        ))}
      </ul>
      {status.message ? (
        <p className="mt-3 text-xs text-subtle">{status.message}</p>
      ) : null}
      <Button className="mt-6 rounded-lg" onClick={() => hydrateStatus()}>
        <RefreshCw className="size-4" />
        بررسی دوباره
      </Button>
    </div>
  );
}
