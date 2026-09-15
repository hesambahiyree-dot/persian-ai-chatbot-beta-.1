import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INFERENCE_DEFAULTS, MODEL } from "@/lib/inference/config";
import { useChatStore } from "@/stores/chat-store";
import { useSettingsStore } from "@/stores/settings-store";

export function SettingsPanel() {
  const open = useChatStore((s) => s.panel === "settings");
  const setPanel = useChatStore((s) => s.setPanel);
  const status = useChatStore((s) => s.status);
  const temperature = useSettingsStore((s) => s.temperature);
  const maxTokens = useSettingsStore((s) => s.maxTokens);
  const contextSize = useSettingsStore((s) => s.contextSize);
  const setTemperature = useSettingsStore((s) => s.setTemperature);
  const setMaxTokens = useSettingsStore((s) => s.setMaxTokens);
  const setContextSize = useSettingsStore((s) => s.setContextSize);
  const reset = useSettingsStore((s) => s.reset);

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
          <h2 className="text-base font-semibold">تنظیمات مدل</h2>
          <Button variant="ghost" size="icon" onClick={() => setPanel("none")} aria-label="بستن">
            <X className="size-4" />
          </Button>
        </div>

        <p className="mb-4 text-sm leading-6 text-muted">
          {MODEL.displayName} — دما، سقف توکن خروجی و طول context در همین‌جا تنظیم می‌شود و به
          llama.cpp پاس داده می‌شود.
        </p>

        <dl className="mb-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-bg px-3 py-2">
            <dt className="text-subtle">وضعیت</dt>
            <dd className="mt-1 font-medium">{status.message}</dd>
          </div>
          <div className="rounded-lg bg-bg px-3 py-2">
            <dt className="text-subtle">موتور</dt>
            <dd className="mt-1 font-medium">
              {status.backend === "native-gemma" ? "llama.cpp / CPU" : status.backend}
            </dd>
          </div>
        </dl>

        <label className="block">
          <span className="flex items-center justify-between text-sm">
            دما
            <span className="tabular-nums text-muted">{temperature.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={1.4}
            step={0.05}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </label>

        <label className="mt-4 block">
          <span className="flex items-center justify-between text-sm">
            سقف توکن خروجی
            <span className="tabular-nums text-muted">{maxTokens}</span>
          </span>
          <input
            type="range"
            min={64}
            max={1024}
            step={64}
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </label>

        <label className="mt-4 block">
          <span className="flex items-center justify-between text-sm">
            طول context
            <span className="tabular-nums text-muted">{contextSize}</span>
          </span>
          <input
            type="range"
            min={2048}
            max={8192}
            step={1024}
            value={contextSize}
            onChange={(e) => setContextSize(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </label>

        <p className="mt-3 text-[11px] leading-5 text-subtle">
          پیش‌فرض: دما {INFERENCE_DEFAULTS.temperature}، توکن {INFERENCE_DEFAULTS.maxTokens}،
          context {INFERENCE_DEFAULTS.contextSize}. تغییر context فقط هنگام بارگذاری دوباره مدل
          اعمال می‌شود.
        </p>

        <Button variant="outline" className="mt-4 w-full rounded-lg" onClick={reset}>
          بازگشت به پیش‌فرض
        </Button>
      </section>
    </>
  );
}
