import { useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { usePremiumStore } from "@/stores/premium-store";
import { ChatHeader } from "./header";
import { Composer } from "./composer";
import { MessageList } from "./message-list";
import { ModelMissing } from "./model-missing";
import { PremiumSheet } from "./premium-sheet";
import { SettingsPanel } from "./settings-panel";
import { Sidebar } from "./sidebar";

export function AppShell() {
  const hydrateStatus = useChatStore((s) => s.hydrateStatus);
  const refreshPremium = usePremiumStore((s) => s.refresh);
  const status = useChatStore((s) => s.status);
  const active = useChatStore((s) => s.conversations.find((c) => c.id === s.activeId));

  useEffect(() => {
    void hydrateStatus();
    void refreshPremium();
  }, [hydrateStatus, refreshPremium]);

  const showMissing = status.code === "missing" && status.backend !== "web-preview";

  return (
    <div className="nova-shell flex h-dvh min-h-0 flex-col">
      <ChatHeader />
      <main className="min-h-0 flex-1 overflow-y-auto">
        {showMissing ? <ModelMissing /> : <MessageList messages={active?.messages ?? []} />}
      </main>
      {showMissing ? null : <Composer />}
      <Sidebar />
      <SettingsPanel />
      <PremiumSheet />
    </div>
  );
}
