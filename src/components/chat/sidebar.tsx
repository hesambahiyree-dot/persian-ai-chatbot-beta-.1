import { MessageSquarePlus, Settings, Sparkles, Trash2, X } from "lucide-react";
import { NovaLogo } from "@/components/brand/nova-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";

export function Sidebar() {
  const open = useChatStore((s) => s.panel === "sidebar");
  const setPanel = useChatStore((s) => s.setPanel);
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const newChat = useChatStore((s) => s.newChat);
  const selectChat = useChatStore((s) => s.selectChat);
  const deleteChat = useChatStore((s) => s.deleteChat);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-fg/25"
        onClick={() => setPanel("none")}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-surface shadow-[var(--shadow-float)]"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <NovaLogo className="size-7" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">نوا</p>
            <p className="text-xs text-muted">گفتگوها</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setPanel("none")} aria-label="بستن">
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-3">
          <Button className="w-full rounded-lg" onClick={newChat}>
            <MessageSquarePlus className="size-4" />
            گفتگوی جدید
          </Button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">هنوز گفتگویی نیست.</p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => (
                <li key={c.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => selectChat(c.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2.5 text-right text-sm transition-colors duration-150",
                      c.id === activeId
                        ? "bg-primary/12 text-primary-dark"
                        : "text-fg hover:bg-surface-2",
                    )}
                  >
                    <span className="block truncate font-medium">{c.title}</span>
                    <span className="mt-0.5 block text-[11px] text-subtle">
                      {new Date(c.updatedAt).toLocaleDateString("fa-IR")}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="absolute left-2 top-2 grid size-8 place-items-center rounded-md text-subtle opacity-0 hover:bg-surface hover:text-danger group-hover:opacity-100"
                    onClick={() => deleteChat(c.id)}
                    aria-label="حذف گفتگو"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
          <Button variant="outline" className="rounded-lg" onClick={() => setPanel("settings")}>
            <Settings className="size-4" />
            تنظیمات
          </Button>
          <Button variant="secondary" className="rounded-lg" onClick={() => setPanel("premium")}>
            <Sparkles className="size-4" />
            ویژه
          </Button>
        </div>
      </aside>
    </>
  );
}
